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

from .contracts import ContractError as IntakeError, FORBIDDEN_KEYS, REPO_RE, parse_proposal, parse_snapshot


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


def _strings(value: Any, where: str, *, nonempty: bool = False) -> list[str]:
    if not isinstance(value, list) or (nonempty and not value):
        raise IntakeError(f"{where} debe ser una lista" + (" no vacía" if nonempty else ""))
    return [_text(item, where) for item in value]


def _repo(value: Any) -> str:
    repo = _text(value, "repo")
    if not REPO_RE.fullmatch(repo) or repo.startswith(".") or repo.endswith("."):
        raise IntakeError("repo debe tener formato propietario/repositorio canónico")
    return repo.lower()


def _number(value: Any, where: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise IntakeError(f"{where} debe ser un entero positivo")
    return value


def _timestamp(value: Any, where: str) -> str:
    text = _text(value, where)
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            raise ValueError
    except ValueError as exc:
        raise IntakeError(f"{where} debe incluir una fecha ISO con zona horaria") from exc
    return text


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


def _validate_proposal(raw: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any], list[dict[str, str]], list[str], dict[str, Any] | None]:
    return parse_proposal(raw)


def prepare(state: str | Path, filename: str | Path) -> dict[str, Any]:
    raw = _json_file(filename)
    source, brief, questions, decision_refs, resolution = _validate_proposal(raw)
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
        if row:
            current = json.loads(row["snapshot"])
            if current["source"]["fingerprint"] == fingerprint and {k: current[k] for k in material if k not in {"id"}} == {k: material[k] for k in material if k != "id"}:
                if raw["expected_revision"] not in (current["revision"], current["revision"] - 1):
                    raise IntakeError("expected_revision obsoleto")
                db.commit()
                return current
            if raw["expected_revision"] != row["revision"]:
                raise IntakeError(f"conflicto: revisión actual {row['revision']}")
            revision = row["revision"] + 1
        else:
            if raw["expected_revision"] != 0:
                raise IntakeError("trabajo nuevo requiere expected_revision=0")
            revision = 1
        now = utc_now()
        snapshot = {**material, "revision": revision, "observed_at": source["observed_at"], "updated_at": now}
        encoded = json.dumps(snapshot, ensure_ascii=False, sort_keys=True)
        db.execute("INSERT INTO work VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision, snapshot=excluded.snapshot, updated_at=excluded.updated_at", (work_id, grant["repo"], grant["issue"], revision, encoded, now))
        db.execute("INSERT INTO history VALUES (?, ?, ?)", (work_id, revision, encoded))
        db.commit()
        return snapshot


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
