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

CATEGORIES = {"feature", "bug", "maintenance", "research"}
REPO_RE = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")
PROPOSAL_KEYS = {"authorization_id", "expected_revision", "source", "category", "preparation", "motive", "next_step", "brief"}
SOURCE_KEYS = {"repo", "number", "title", "body", "labels", "observed_at"}
BRIEF_KEYS = {"objective", "scope", "exclusions", "acceptance", "risks", "dependencies", "context", "checks", "reviews", "base", "configuration", "limits", "checkpoints"}
SNAPSHOT_KEYS = {"id", "repo", "issue", "source", "authorization_id", "category", "preparation", "motive", "next_step", "brief", "execution", "revision", "observed_at", "updated_at"}
SNAPSHOT_SOURCE_KEYS = {"repo", "number", "title", "labels", "observed_at", "fingerprint"}
FORBIDDEN_KEYS = {"command", "commands", "shell", "script", "executable", "execution", "permissions", "authorization", "auth", "token", "secret", "model", "provider", "config", "environment", "env"}

class IntakeError(ValueError):
    """Invalid or unauthorized intake data."""


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
    if not isinstance(value, dict):
        raise IntakeError("snapshot inválido: debe ser un objeto")
    _exact_keys(value, SNAPSHOT_KEYS, "snapshot")
    source, brief = value["source"], value["brief"]
    if not isinstance(source, dict) or not isinstance(brief, dict):
        raise IntakeError("snapshot inválido: source y brief deben ser objetos")
    _exact_keys(source, SNAPSHOT_SOURCE_KEYS, "snapshot.source")
    _exact_keys(brief, BRIEF_KEYS, "snapshot.brief")
    repo = _repo(value["repo"])
    issue = _number(value["issue"], "snapshot.issue")
    if _repo(source["repo"]) != repo or _number(source["number"], "snapshot.source.number") != issue:
        raise IntakeError("snapshot inválido: source no coincide con repo/issue")
    _text(value["id"], "snapshot.id")
    _text(value["authorization_id"], "snapshot.authorization_id")
    if not isinstance(value["category"], str) or value["category"] not in CATEGORIES or value["preparation"] != "ready-for-agent":
        raise IntakeError("snapshot inválido: category o preparation no admitidos")
    for key in ("motive", "next_step", "execution"):
        _text(value[key], f"snapshot.{key}")
    revision = _number(value["revision"], "snapshot.revision")
    _text(source["title"], "snapshot.source.title")
    _strings(source["labels"], "snapshot.source.labels")
    _timestamp(source["observed_at"], "snapshot.source.observed_at")
    if not isinstance(source["fingerprint"], str) or not re.fullmatch(r"[0-9a-f]{64}", source["fingerprint"]):
        raise IntakeError("snapshot inválido: source.fingerprint")
    _timestamp(value["observed_at"], "snapshot.observed_at")
    _timestamp(value["updated_at"], "snapshot.updated_at")
    _text(brief["objective"], "snapshot.brief.objective")
    _text(brief["scope"], "snapshot.brief.scope")
    for key in ("exclusions", "acceptance", "risks", "dependencies", "context", "checks", "reviews"):
        _strings(brief[key], f"snapshot.brief.{key}", nonempty=(key == "acceptance"))
    for key in ("base", "configuration", "limits", "checkpoints"):
        _text(brief[key], f"snapshot.brief.{key}")
    if source["observed_at"] != value["observed_at"] or revision < 1:
        raise IntakeError("snapshot inválido: fechas o revisión incoherentes")
    return value


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


def _validate_proposal(raw: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    _exact_keys(raw, PROPOSAL_KEYS, "propuesta")
    forbidden = _contains_forbidden(raw)
    if forbidden:
        raise IntakeError(f"Campo de autoridad o configuración no permitido: {forbidden}")
    source, brief = raw["source"], raw["brief"]
    if not isinstance(source, dict):
        raise IntakeError("source debe ser un objeto")
    if not isinstance(brief, dict):
        raise IntakeError("brief debe ser un objeto")
    _exact_keys(source, SOURCE_KEYS, "source")
    _exact_keys(brief, BRIEF_KEYS, "brief")
    source = dict(source)
    source["repo"] = _repo(source["repo"])
    source["number"] = _number(source["number"], "source.number")
    source["title"] = _text(source["title"], "source.title")
    _text(source["body"], "source.body")
    source["labels"] = _strings(source["labels"], "source.labels")
    source["observed_at"] = _timestamp(source["observed_at"], "source.observed_at")
    brief = dict(brief)
    brief["objective"] = _text(brief["objective"], "brief.objective")
    brief["scope"] = _text(brief["scope"], "brief.scope")
    for key in ("exclusions", "risks", "dependencies", "context", "checks", "reviews"):
        brief[key] = _strings(brief[key], f"brief.{key}", nonempty=(key == "acceptance"))
    brief["acceptance"] = _strings(brief["acceptance"], "brief.acceptance", nonempty=True)
    for key in ("base", "configuration", "limits", "checkpoints"):
        brief[key] = _text(brief[key], f"brief.{key}")
    if not isinstance(raw["category"], str) or raw["category"] not in CATEGORIES:
        raise IntakeError("category debe ser feature, bug, maintenance o research")
    if raw["preparation"] != "ready-for-agent":
        raise IntakeError("U1 solo admite preparation=ready-for-agent para issues claras")
    expected = raw["expected_revision"]
    if isinstance(expected, bool) or not isinstance(expected, int) or expected < 0:
        raise IntakeError("expected_revision debe ser un entero no negativo")
    return source, brief


def prepare(state: str | Path, filename: str | Path) -> dict[str, Any]:
    raw = _json_file(filename)
    source, brief = _validate_proposal(raw)
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
            "category": raw["category"], "preparation": "ready-for-agent",
            "motive": _text(raw["motive"], "motive"), "next_step": _text(raw["next_step"], "next_step"),
            "brief": brief, "execution": "no disponible en S01"}
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
