"""Authorized intake, proposal validation, and transactional SQLite history."""
from __future__ import annotations

import hashlib
import json
import os
import re
import sqlite3
import uuid
from datetime import datetime, timezone
from contextlib import closing
from pathlib import Path
from typing import Any

from .contracts import ContractError as IntakeError, FORBIDDEN_KEYS, REPO_RE, parse_decision, parse_proposal, parse_snapshot


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def _json_file(path: str | Path) -> dict[str, Any]:
    try:
        value = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise IntakeError(f"No se pudo leer JSON válido: {exc}") from exc
    if not isinstance(value, dict):
        raise IntakeError("El documento JSON debe ser un objeto")
    return value


def _exact_keys(value: dict[str, Any], allowed: set[str], where: str) -> None:
    extra = set(value) - allowed
    missing = allowed - set(value)
    if extra:
        raise IntakeError(f"Campos no admitidos en {where}: {', '.join(sorted(extra))}")
    if missing:
        raise IntakeError(f"Faltan campos en {where}: {', '.join(sorted(missing))}")


def _text(value: Any, where: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise IntakeError(f"{where} debe ser texto no vacío")
    return value.strip()


def _repo(value: Any) -> str:
    repo = _text(value, "repo")
    if not REPO_RE.fullmatch(repo) or repo.startswith(".") or repo.endswith("."):
        raise IntakeError("repo debe tener formato propietario/repositorio canónico")
    return repo.lower()


def _number(value: Any, where: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise IntakeError(f"{where} debe ser un entero positivo")
    return value


def _contains_forbidden(value: Any) -> str | None:
    if isinstance(value, dict):
        for key, child in value.items():
            if key.lower() in FORBIDDEN_KEYS:
                return str(key)
            found = _contains_forbidden(child)
            if found:
                return found
    elif isinstance(value, list):
        for child in value:
            found = _contains_forbidden(child)
            if found:
                return found
    return None


def _validate_snapshot(value: Any) -> dict[str, Any]:
    return parse_snapshot(value)


def _database(state: str | Path) -> Path:
    directory = Path(state).expanduser().resolve()
    directory.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(directory, 0o700)
    path = directory / "isswf.sqlite3"
    connection = sqlite3.connect(path, timeout=10, isolation_level=None)
    try:
        connection.execute("PRAGMA journal_mode=WAL")
        connection.execute("PRAGMA foreign_keys=ON")
        connection.executescript("""
            CREATE TABLE IF NOT EXISTS grants (
                id TEXT PRIMARY KEY, repo TEXT NOT NULL, issue INTEGER NOT NULL,
                objective TEXT NOT NULL, scope TEXT NOT NULL, actor TEXT NOT NULL,
                decision TEXT NOT NULL, created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS work (
                id TEXT PRIMARY KEY, repo TEXT NOT NULL, issue INTEGER NOT NULL,
                revision INTEGER NOT NULL, snapshot TEXT NOT NULL, updated_at TEXT NOT NULL,
                UNIQUE(repo, issue)
            );
            CREATE TABLE IF NOT EXISTS history (
                work_id TEXT NOT NULL REFERENCES work(id), revision INTEGER NOT NULL,
                snapshot TEXT NOT NULL, PRIMARY KEY(work_id, revision)
            );
            CREATE INDEX IF NOT EXISTS history_work ON history(work_id, revision);
        """)
    finally:
        connection.close()
    os.chmod(path, 0o600)
    return path


def _connect(state: str | Path) -> sqlite3.Connection:
    path = _database(state)
    connection = sqlite3.connect(path, timeout=10, isolation_level=None)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys=ON")
    return connection


def authorize(state: str | Path, filename: str | Path) -> dict[str, str]:
    raw = _json_file(filename)
    _exact_keys(raw, {"repo", "issue", "objective", "scope", "actor", "decision"}, "autorización")
    repo = _repo(raw["repo"])
    issue = _number(raw["issue"], "issue")
    objective, scope = _text(raw["objective"], "objective"), _text(raw["scope"], "scope")
    actor, decision = _text(raw["actor"], "actor"), _text(raw["decision"], "decision")
    if _contains_forbidden(raw):
        raise IntakeError("La autorización no admite configuración ni secretos")
    grant = {"id": "auth-" + uuid.uuid4().hex, "repo": repo, "issue": issue,
             "objective": objective, "scope": scope, "actor": actor,
             "decision": decision, "created_at": utc_now()}
    with closing(_connect(state)) as db:
        db.execute("INSERT INTO grants VALUES (?, ?, ?, ?, ?, ?, ?, ?)", tuple(grant.values()))
    return {"id": grant["id"], "repo": repo, "issue": str(issue), "created_at": grant["created_at"]}


def _publish(db: sqlite3.Connection, snapshot: dict[str, Any], current_revision: int) -> dict[str, Any]:
    parse_snapshot(snapshot)
    encoded = json.dumps(snapshot, ensure_ascii=False, sort_keys=True)
    try:
        if current_revision == 0:
            db.execute("INSERT INTO work VALUES (?, ?, ?, ?, ?, ?)", (
                snapshot["id"], snapshot["repo"], snapshot["issue"], snapshot["revision"], encoded, snapshot["updated_at"]))
        else:
            result = db.execute(
                "UPDATE work SET revision=?, snapshot=?, updated_at=? WHERE id=? AND revision=?",
                (snapshot["revision"], encoded, snapshot["updated_at"], snapshot["id"], current_revision))
            if result.rowcount != 1:
                raise IntakeError("conflicto: la revisión cambió durante la publicación")
        db.execute("INSERT INTO history VALUES (?, ?, ?)", (snapshot["id"], snapshot["revision"], encoded))
        db.commit()
    except Exception:
        db.rollback()
        raise
    return snapshot


def prepare(state: str | Path, filename: str | Path) -> dict[str, Any]:
    raw = _json_file(filename)
    source, brief, questions, decision_refs, resolution = parse_proposal(raw)
    auth_id = _text(raw["authorization_id"], "authorization_id")
    with closing(_connect(state)) as db:
        db.execute("BEGIN IMMEDIATE")
        grant_row = db.execute("SELECT * FROM grants WHERE id=?", (auth_id,)).fetchone()
        if not grant_row:
            raise IntakeError("No existe la autorización registrada")
        grant = dict(grant_row)
        if source["repo"] != grant["repo"] or source["number"] != grant["issue"]:
            raise IntakeError("source no coincide con repo/issue autorizados")
        if brief["objective"] != grant["objective"] or brief["scope"] != grant["scope"]:
            raise IntakeError("objective y scope deben coincidir exactamente con la autorización")
        observed_body = source.pop("body")
        fingerprint = hashlib.sha256(json.dumps({**source, "body": observed_body}, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
        work_id = "work-" + hashlib.sha256(f'{grant["repo"]}#{grant["issue"]}'.encode()).hexdigest()[:24]
        material = {"id": work_id, "repo": grant["repo"], "issue": grant["issue"],
            "source": {**source, "fingerprint": fingerprint}, "authorization_id": grant["id"],
            "category": raw["category"], "preparation": raw["preparation"],
            "motive": _text(raw["motive"], "motive"), "next_step": _text(raw["next_step"], "next_step"),
            "brief": brief, "questions": questions, "decision_refs": decision_refs,
            "answers": [], "resolution": resolution, "execution": "no disponible en S01"}
        row = db.execute("SELECT * FROM work WHERE id=?", (work_id,)).fetchone()
        current_revision = 0
        if row:
            current = parse_snapshot(json.loads(row["snapshot"]))
            current_revision = current["revision"]
            if current["answers"] and current["authorization_id"] != grant["id"]:
                raise IntakeError("No se puede cambiar la autorización de un trabajo con respuestas registradas")
            material["answers"] = current["answers"]
            answers = {answer["id"]: answer for answer in current["answers"]}
            if current["source"]["fingerprint"] != fingerprint and current["answers"]:
                raise IntakeError("Una fuente alterada con respuestas requiere reconciliación fuera de U2")
            for question in questions:
                previous = next((answer["question"] for answer in current["answers"] if answer["question"]["id"] == question["id"]), None)
                if previous is not None and previous != question:
                    raise IntakeError("No se puede cambiar una pregunta respondida bajo el mismo id")
            for old_question in current["questions"]:
                if old_question not in questions:
                    matched = any(
                        answer_id in decision_refs and answers[answer_id]["question"] == old_question
                        and answers[answer_id]["source_fingerprint"] == current["source"]["fingerprint"]
                        for answer_id in answers
                    )
                    if not matched:
                        raise IntakeError("No se puede quitar una pregunta pendiente sin una respuesta registrada")
            expected_refs = {
                answer["id"] for answer in current["answers"]
                if answer["authorization_id"] == grant["id"] and answer["source_fingerprint"] == fingerprint
            }
            if set(decision_refs) != expected_refs:
                raise IntakeError("decision_refs debe conservar todas las respuestas de esta autorización y fuente")
            for answer_id in decision_refs:
                answer = answers.get(answer_id)
                if not answer or answer["authorization_id"] != grant["id"] or answer["source_fingerprint"] != fingerprint:
                    raise IntakeError("decision_refs no pertenece a esta autorización y fuente")
            if current["source"]["fingerprint"] == fingerprint and {k: current[k] for k in material if k != "id"} == {k: material[k] for k in material if k != "id"}:
                if raw["expected_revision"] not in (current_revision, current_revision - 1):
                    raise IntakeError("expected_revision obsoleto")
                db.commit()
                return current
            if raw["expected_revision"] != current_revision:
                raise IntakeError(f"conflicto: revisión actual {current_revision}")
            revision = current_revision + 1
        else:
            if decision_refs:
                raise IntakeError("decision_refs requiere respuestas registradas en este trabajo")
            if raw["expected_revision"] != 0:
                raise IntakeError("trabajo nuevo requiere expected_revision=0")
            revision = 1
        now = utc_now()
        snapshot = {**material, "revision": revision, "observed_at": source["observed_at"], "updated_at": now}
        return _publish(db, snapshot, current_revision)


def decide(state: str | Path, filename: str | Path) -> dict[str, Any]:
    decision = parse_decision(_json_file(filename))
    with closing(_connect(state)) as db:
        db.execute("BEGIN IMMEDIATE")
        row = db.execute("SELECT * FROM work WHERE id=?", (decision["work_id"],)).fetchone()
        if not row:
            raise IntakeError("No existe ese trabajo")
        current = parse_snapshot(json.loads(row["snapshot"]))
        if decision["expected_revision"] != current["revision"]:
            raise IntakeError(f"conflicto: revisión actual {current['revision']}")
        grant_row = db.execute("SELECT * FROM grants WHERE id=?", (current["authorization_id"],)).fetchone()
        if not grant_row or (grant_row["repo"], grant_row["issue"]) != (current["repo"], current["issue"]):
            raise IntakeError("La autorización del trabajo no coincide con su origen")
        question = next((item for item in current["questions"] if item["id"] == decision["question_id"]), None)
        if question is None:
            raise IntakeError("No existe esa pregunta pendiente en la revisión actual")
        if any(answer["question"]["id"] == question["id"] and answer["source_fingerprint"] == current["source"]["fingerprint"] for answer in current["answers"]):
            raise IntakeError("La pregunta ya tiene una respuesta registrada")
        answer_id = "answer-" + uuid.uuid4().hex
        answer = {
            "id": answer_id,
            "question": question,
            "work_id": current["id"],
            "authorization_id": current["authorization_id"],
            "source_fingerprint": current["source"]["fingerprint"],
            "source_revision": current["revision"],
            "actor": decision["actor"],
            "text": decision["answer"],
            "recorded_at": utc_now(),
        }
        remaining_questions = [item for item in current["questions"] if item["id"] != question["id"]]
        preparation = current["preparation"] if current["preparation"] in {"needs-info", "ready-for-human"} else "needs-info"
        motive = (
            "La respuesta está registrada; quedan preguntas del operador pendientes."
            if remaining_questions else "La respuesta del operador está registrada y requiere reconciliar el brief."
        )
        next_step = (
            "Esperar las respuestas pendientes antes de reconciliar el brief."
            if remaining_questions else "Reconciliar el brief con la respuesta y preparar una nueva propuesta."
        )
        snapshot = {
            **current,
            "preparation": preparation if remaining_questions else "needs-triage",
            "motive": motive,
            "next_step": next_step,
            "questions": remaining_questions,
            "decision_refs": [*current["decision_refs"], answer_id],
            "answers": [*current["answers"], answer],
            "revision": current["revision"] + 1,
            "updated_at": utc_now(),
        }
        return _publish(db, snapshot, current["revision"])


def _read_connect(state: str | Path) -> sqlite3.Connection:
    path = Path(state).expanduser().resolve() / "isswf.sqlite3"
    if not path.is_file():
        raise IntakeError(f"Estado no disponible: no existe la base de datos {path}")
    try:
        connection = sqlite3.connect(f"{path.as_uri()}?mode=ro", uri=True, timeout=10)
    except sqlite3.Error as exc:
        raise IntakeError(f"No se pudo abrir el estado en solo lectura: {exc}") from exc
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys=ON")
    return connection


def show(state: str | Path, work_id: str | None = None) -> list[dict[str, Any]] | dict[str, Any]:
    try:
        with closing(_read_connect(state)) as db:
            if work_id is None:
                rows = db.execute("SELECT snapshot FROM work ORDER BY repo, issue").fetchall()
                return [_validate_snapshot(json.loads(row[0])) for row in rows]
            row = db.execute("SELECT snapshot FROM work WHERE id=?", (work_id,)).fetchone()
            if not row:
                raise IntakeError("No existe ese trabajo")
            return _validate_snapshot(json.loads(row[0]))
    except (sqlite3.Error, json.JSONDecodeError) as exc:
        raise IntakeError(f"No se pudo leer el estado: {exc}") from exc
