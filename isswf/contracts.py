"""Parse proposal and snapshot documents at the intake boundary."""
from __future__ import annotations

import re
from datetime import datetime
from typing import Any

CATEGORIES = {"feature", "bug", "maintenance", "research"}
REPO_RE = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")
PROPOSAL_KEYS = {"authorization_id", "expected_revision", "source", "category", "preparation", "motive", "next_step", "brief", "questions", "decision_refs", "resolution"}
SOURCE_KEYS = {"repo", "number", "title", "body", "labels", "observed_at"}
BRIEF_KEYS = {"objective", "scope", "exclusions", "acceptance", "risks", "dependencies", "context", "checks", "reviews", "base", "configuration", "limits", "checkpoints"}
SNAPSHOT_KEYS = {"id", "repo", "issue", "source", "authorization_id", "category", "preparation", "motive", "next_step", "brief", "questions", "decision_refs", "answers", "resolution", "execution", "revision", "observed_at", "updated_at"}
LEGACY_SNAPSHOT_KEYS = SNAPSHOT_KEYS - {"questions", "decision_refs", "answers", "resolution"}
SNAPSHOT_SOURCE_KEYS = {"repo", "number", "title", "labels", "observed_at", "fingerprint"}
QUESTION_KEYS = {"id", "kind", "question", "owner", "exit_condition"}
RESOLUTION_KEYS = {"kind", "destination", "evidence", "explanation"}
EVIDENCE_KEYS = {"ref", "observation"}
FORBIDDEN_KEYS = {"command", "commands", "shell", "script", "executable", "execution", "permissions", "authorization", "auth", "token", "secret", "model", "provider", "config", "environment", "env", "answers"}


class ContractError(ValueError):
    """A document does not satisfy the intake contract."""


def _exact(value: dict[str, Any], allowed: set[str], where: str) -> None:
    extra, missing = set(value) - allowed, allowed - set(value)
    if extra:
        raise ContractError(f"Campos no admitidos en {where}: {', '.join(sorted(extra))}")
    if missing:
        raise ContractError(f"Faltan campos en {where}: {', '.join(sorted(missing))}")


def _text(value: Any, where: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ContractError(f"{where} debe ser texto no vacío")
    return value.strip()


def _strings(value: Any, where: str, *, nonempty: bool = False) -> list[str]:
    if not isinstance(value, list) or (nonempty and not value):
        raise ContractError(f"{where} debe ser una lista" + (" no vacía" if nonempty else ""))
    return [_text(item, where) for item in value]


def _repo(value: Any) -> str:
    repo = _text(value, "repo")
    if not REPO_RE.fullmatch(repo) or repo.startswith(".") or repo.endswith("."):
        raise ContractError("repo debe tener formato propietario/repositorio canónico")
    return repo.lower()


def _number(value: Any, where: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise ContractError(f"{where} debe ser un entero positivo")
    return value


def _timestamp(value: Any, where: str) -> str:
    text = _text(value, where)
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            raise ValueError
    except ValueError as exc:
        raise ContractError(f"{where} debe incluir una fecha ISO con zona horaria") from exc
    return text


def _forbidden(value: Any) -> str | None:
    if isinstance(value, dict):
        for key, child in value.items():
            if key.lower() in FORBIDDEN_KEYS:
                return str(key)
            found = _forbidden(child)
            if found:
                return found
    elif isinstance(value, list):
        for child in value:
            found = _forbidden(child)
            if found:
                return found
    return None


def _questions(value: Any) -> list[dict[str, str]]:
    if not isinstance(value, list):
        raise ContractError("questions debe ser una lista")
    result = []
    ids = set()
    for question in value:
        if not isinstance(question, dict):
            raise ContractError("Cada question debe ser un objeto")
        _exact(question, QUESTION_KEYS, "question")
        item = {key: _text(question[key], f"question.{key}") for key in QUESTION_KEYS}
        if item["kind"] not in {"product", "missing-information"}:
            raise ContractError("question.kind debe ser product o missing-information; las dudas técnicas van a grounding")
        if item["owner"] != "operator":
            raise ContractError("question.owner debe ser operator")
        if item["id"] in ids:
            raise ContractError("question.id debe ser único")
        ids.add(item["id"])
        result.append(item)
    return result


def _resolution(value: Any) -> dict[str, Any] | None:
    if value is None:
        return None
    if not isinstance(value, dict):
        raise ContractError("resolution debe ser null o un objeto")
    _exact(value, RESOLUTION_KEYS, "resolution")
    kind = _text(value["kind"], "resolution.kind")
    if kind not in {"duplicate", "already-present"}:
        raise ContractError("resolution.kind debe ser duplicate o already-present")
    destination = _text(value["destination"], "resolution.destination")
    explanation = _text(value["explanation"], "resolution.explanation")
    evidence = value["evidence"]
    if not isinstance(evidence, list):
        raise ContractError("resolution.evidence debe ser una lista")
    parsed_evidence = []
    for item in evidence:
        if not isinstance(item, dict):
            raise ContractError("Cada evidence debe ser un objeto")
        _exact(item, EVIDENCE_KEYS, "resolution.evidence")
        parsed_evidence.append({key: _text(item[key], f"evidence.{key}") for key in EVIDENCE_KEYS})
    return {"kind": kind, "destination": destination, "evidence": parsed_evidence, "explanation": explanation}


def parse_proposal(raw: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any], list[dict[str, str]], list[str], dict[str, Any] | None]:
    _exact(raw, PROPOSAL_KEYS, "propuesta")
    forbidden = _forbidden(raw)
    if forbidden:
        raise ContractError(f"Campo de autoridad o configuración no permitido: {forbidden}")
    source, brief = raw["source"], raw["brief"]
    if not isinstance(source, dict) or not isinstance(brief, dict):
        raise ContractError("source y brief deben ser objetos")
    _exact(source, SOURCE_KEYS, "source")
    _exact(brief, BRIEF_KEYS, "brief")
    source = dict(source)
    source["repo"], source["number"] = _repo(source["repo"]), _number(source["number"], "source.number")
    source["title"], source["body"] = _text(source["title"], "source.title"), _text(source["body"], "source.body")
    source["labels"] = _strings(source["labels"], "source.labels")
    source["observed_at"] = _timestamp(source["observed_at"], "source.observed_at")
    brief = dict(brief)
    brief["objective"], brief["scope"] = _text(brief["objective"], "brief.objective"), _text(brief["scope"], "brief.scope")
    for key in ("exclusions", "acceptance", "risks", "dependencies", "context", "checks", "reviews"):
        brief[key] = _strings(brief[key], f"brief.{key}", nonempty=(key == "acceptance" and raw["preparation"] == "ready-for-agent"))
    for key in ("base", "configuration", "limits", "checkpoints"):
        brief[key] = _text(brief[key], f"brief.{key}")
    if not isinstance(raw["category"], str) or raw["category"] not in CATEGORIES:
        raise ContractError("category debe ser feature, bug, maintenance o research")
    if not isinstance(raw["preparation"], str) or raw["preparation"] not in {"ready-for-agent", "needs-info", "ready-for-human", "needs-triage"}:
        raise ContractError("preparation no admitido")
    expected = raw["expected_revision"]
    if isinstance(expected, bool) or not isinstance(expected, int) or expected < 0:
        raise ContractError("expected_revision debe ser un entero no negativo")
    questions = _questions(raw["questions"])
    refs = _strings(raw["decision_refs"], "decision_refs")
    resolution = _resolution(raw["resolution"])
    preparation = raw["preparation"]
    if preparation == "ready-for-agent" and (not brief["acceptance"] or questions or resolution is not None):
        raise ContractError("ready-for-agent requiere acceptance no vacía, sin preguntas y resolution=null")
    if preparation in {"needs-info", "ready-for-human"} and not questions:
        raise ContractError(f"{preparation} requiere preguntas concretas para el operador")
    if preparation == "needs-triage" and not resolution:
        raise ContractError("needs-triage requiere una resolución no accionable")
    if resolution is not None and (preparation != "needs-triage" or not resolution["evidence"]):
        raise ContractError("resolution concluyente requiere needs-triage y evidencia")
    return source, brief, questions, refs, resolution


def parse_snapshot(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ContractError("snapshot inválido: debe ser un objeto")
    legacy = set(value) == LEGACY_SNAPSHOT_KEYS
    if legacy:
        value = {**value, "questions": [], "decision_refs": [], "answers": [], "resolution": None}
    _exact(value, SNAPSHOT_KEYS, "snapshot")
    source, brief = value["source"], value["brief"]
    if not isinstance(source, dict) or not isinstance(brief, dict):
        raise ContractError("snapshot inválido: source y brief deben ser objetos")
    _exact(source, SNAPSHOT_SOURCE_KEYS, "snapshot.source")
    _exact(brief, BRIEF_KEYS, "snapshot.brief")
    repo, issue = _repo(value["repo"]), _number(value["issue"], "snapshot.issue")
    if _repo(source["repo"]) != repo or _number(source["number"], "snapshot.source.number") != issue:
        raise ContractError("snapshot inválido: source no coincide con repo/issue")
    _text(value["id"], "snapshot.id")
    _text(value["authorization_id"], "snapshot.authorization_id")
    if value["category"] not in CATEGORIES or value["preparation"] not in {"ready-for-agent", "needs-info", "ready-for-human", "needs-triage"}:
        raise ContractError("snapshot inválido: category o preparation no admitidos")
    for key in ("motive", "next_step", "execution"):
        _text(value[key], f"snapshot.{key}")
    revision = _number(value["revision"], "snapshot.revision")
    _text(source["title"], "snapshot.source.title")
    _strings(source["labels"], "snapshot.source.labels")
    _timestamp(source["observed_at"], "snapshot.source.observed_at")
    if not isinstance(source["fingerprint"], str) or not re.fullmatch(r"[0-9a-f]{64}", source["fingerprint"]):
        raise ContractError("snapshot inválido: source.fingerprint")
    _timestamp(value["observed_at"], "snapshot.observed_at")
    _timestamp(value["updated_at"], "snapshot.updated_at")
    _text(brief["objective"], "snapshot.brief.objective")
    _text(brief["scope"], "snapshot.brief.scope")
    for key in ("exclusions", "acceptance", "risks", "dependencies", "context", "checks", "reviews"):
        _strings(brief[key], f"snapshot.brief.{key}", nonempty=(key == "acceptance" and value["preparation"] == "ready-for-agent"))
    for key in ("base", "configuration", "limits", "checkpoints"):
        _text(brief[key], f"snapshot.brief.{key}")
    questions = _questions(value["questions"])
    refs = _strings(value["decision_refs"], "decision_refs")
    resolution = _resolution(value["resolution"])
    if not isinstance(value["answers"], list):
        raise ContractError("snapshot.answers debe ser una lista")
    if value["preparation"] == "ready-for-agent" and (not brief["acceptance"] or questions or resolution is not None):
        raise ContractError("snapshot ready-for-agent inválido")
    if value["preparation"] in {"needs-info", "ready-for-human"} and not questions:
        raise ContractError("snapshot needs-info/ready-for-human requiere preguntas")
    if resolution is not None and (value["preparation"] != "needs-triage" or not resolution["evidence"]):
        raise ContractError("snapshot resolution inválida")
    if source["observed_at"] != value["observed_at"] or revision < 1:
        raise ContractError("snapshot inválido: fechas o revisión incoherentes")
    return value
