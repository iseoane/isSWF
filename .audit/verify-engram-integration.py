#!/usr/bin/env python3
"""Engram integration verification for isSWF against the operator's real store.

Writes the two operator-approved memories into project `isswf`, reads them back,
checks project isolation, and shows isSWF keeps working with Engram unusable.
Inside the repository this script writes only .audit/engram-integration.json.
It never deletes a memory, never passes --all, and never stores the output of a
query scoped to another project.
"""

import hashlib
import json
import os
import re
import shlex
import shutil
import sqlite3
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / ".audit" / "engram-integration.json"
PROJECT = "isswf"
SCOPE = "project"
TYPE = "note"
ENGRAM_FALLBACK = "/home/linuxbrew/.linuxbrew/bin/engram"
BROKEN_PATH = "/usr/bin:/bin"
TITLE_RE = re.compile(r"^\s*\[\d+\]\s+#(\d+)\s+\(([^)]+)\)\s+\u2014\s+(.+?)\s*$", re.M)
FOUND_RE = re.compile(r"Found (\d+) memories?")
SAVED_RE = re.compile(r"Memory saved:\s+#(\d+)")
PROJECTS_RE = re.compile(r"^\s{2}(\S.*?)\s{2,}(\d+) obs\s+(\d+) session", re.M)

MEMORIES = [
    {
        "key": "u2_closure",
        "title": "isSWF U2 cerrado localmente",
        "body": (
            "U2 (decisiones pendientes y retriage) integrado en main con 31 tests, censo estructural de 96 "
            "variantes y recorrido real CLI/HTTP/Chromium sobre fixtures. Sin workers ni GitHub real. U1+U2 "
            "locales no equivalen a S01 ni H1 completos."
        ),
    },
    {
        "key": "compatibility_not_preflight",
        "title": "Engram: la sonda compatibility no sirve como preflight de este store",
        "body": (
            "La sonda rechaza cualquier directorio con ficheros -wal/-shm/-journal "
            "(internal/store/compatibility.go L60) y una parada limpia de engram serve no los retira. El store "
            "está sano (integrity_check ok, 28 tablas). Usar --project explícito: el proceso serve corre con cwd "
            "agent-depot. El cloud no está configurado; el push de sync.log es el mecanismo git del usuario."
        ),
    },
]

SESSION_TMP = Path(tempfile.mkdtemp(prefix="isswf-engram-integration-"))
COMMANDS: list[str] = []
CHECKS: list[dict] = []
AMBIENT_ENGRAM_ENV = sorted(name for name in os.environ if name.startswith("ENGRAM_"))


def check(name: str, ok: bool, detail: str = "") -> bool:
    CHECKS.append({"name": name, "ok": bool(ok), "detail": detail})
    return bool(ok)


def clip(text: str, limit: int = 1400) -> str:
    text = text or ""
    return text if len(text) <= limit else text[:limit] + f"\n[clipped {len(text) - limit} chars]"


def display(args) -> str:
    parts = []
    for arg in args:
        value = str(arg).replace(str(SESSION_TMP), "<TMP>").replace(str(ROOT), "<REPO>")
        parts.append(shlex.quote(value))
    return " ".join(parts)


def base_env(extra: dict | None = None) -> dict:
    env = {k: v for k, v in os.environ.items() if not k.startswith("ENGRAM_")}
    env["ENGRAM_CLOUD_AUTOSYNC"] = "0"
    env.update(extra or {})
    return env


def run(args, env, cwd=None, timeout=300):
    if "--all" in args:
        raise AssertionError(f"--all is forbidden by this audit: {args}")
    rendered = display(args)
    COMMANDS.append(rendered)
    proc = subprocess.run([str(a) for a in args], cwd=cwd, env=env, text=True, capture_output=True, timeout=timeout)
    return {"command": rendered, "exit_code": proc.returncode, "stdout": clip(proc.stdout), "stderr": clip(proc.stderr)}, proc


def engram_bin() -> str:
    found = shutil.which("engram")
    if found:
        return found
    if Path(ENGRAM_FALLBACK).exists():
        return ENGRAM_FALLBACK
    raise RuntimeError("engram not found on PATH and fallback missing")


def parse_projects(stdout: str) -> dict[str, int]:
    return {name.strip(): int(count) for name, count, _ in PROJECTS_RE.findall(stdout or "")}


def parse_search(stdout: str) -> tuple[int, list[dict]]:
    found = FOUND_RE.search(stdout or "")
    entries = [{"obs_id": int(obs), "type": kind, "title": title} for obs, kind, title in TITLE_RE.findall(stdout or "")]
    return (int(found.group(1)) if found else 0), entries


def stats_record(engram: str, env: dict) -> dict:
    record, _ = run([engram, "stats", "--project", PROJECT], env=env, cwd=ROOT)
    return record


def store_database_path(record: dict) -> str | None:
    match = re.search(r"^\s*Database:\s+(\S+)\s*$", record.get("stdout", ""), re.M)
    return match.group(1) if match else None


def section_a_write(engram: str, env: dict) -> dict:
    projects_record, projects_proc = run([engram, "projects", "list"], env=env, cwd=ROOT)
    projects = parse_projects(projects_proc.stdout)
    retried = False
    if not projects:
        retried = True
        projects_record, projects_proc = run([engram, "projects", "list"], env=env, cwd=ROOT)
        projects = parse_projects(projects_proc.stdout)
    check("a-store-projects-list-readable", bool(projects), f"parsed {len(projects)} projects, retried {retried}")
    before_stats = stats_record(engram, env)
    written = []
    for memory in MEMORIES:
        search_record, search_proc = run(
            [engram, "search", memory["title"], "--project", PROJECT, "--scope", SCOPE], env=env, cwd=ROOT
        )
        found, entries = parse_search(search_proc.stdout)
        exact = next((entry for entry in entries if entry["title"] == memory["title"]), None)
        entry = {
            "key": memory["key"],
            "title": memory["title"],
            "body_length": len(memory["body"]),
            "project": PROJECT,
            "scope": SCOPE,
            "type": TYPE,
            "pre_write_search": {"command": search_record["command"], "exit_code": search_record["exit_code"], "found_count": found},
        }
        if exact:
            entry.update({"action": "skipped-existing", "obs_id": exact["obs_id"], "reason": "title already present in project isswf"})
        else:
            save_record, save_proc = run(
                [engram, "save", memory["title"], memory["body"], "--type", TYPE, "--project", PROJECT, "--scope", SCOPE],
                env=env,
                cwd=ROOT,
            )
            match = SAVED_RE.search(save_proc.stdout or "")
            entry.update(
                {
                    "action": "created" if save_proc.returncode == 0 and match else "failed",
                    "obs_id": int(match.group(1)) if match else None,
                    "save_command": save_record["command"],
                    "save_exit_code": save_record["exit_code"],
                    "save_stdout": save_record["stdout"],
                    "save_stderr": save_record["stderr"],
                }
            )
        written.append(entry)
    after_stats = stats_record(engram, env)
    after_projects_record, after_projects_proc = run([engram, "projects", "list"], env=env, cwd=ROOT)
    after_projects = parse_projects(after_projects_proc.stdout)
    ids_ok = all(entry.get("obs_id") for entry in written)
    check("a-both-memories-in-real-store", ids_ok, f"actions {[e['action'] for e in written]} obs ids {[e.get('obs_id') for e in written]}")
    check(
        "a-store-is-the-real-one",
        store_database_path(after_stats) is not None and str(Path.home() / ".engram") in (store_database_path(after_stats) or ""),
        f"database {store_database_path(after_stats)}",
    )
    foreign_counts = {name: count for name, count in after_projects.items() if name != PROJECT}
    return {
        "target": "operator's real store (ambient ENGRAM_* variables removed except ENGRAM_CLOUD_AUTOSYNC=0)",
        "project_existed_before": PROJECT in projects,
        "project_count_before": len(projects),
        "projects_list_retried": retried,
        "stats_before": before_stats,
        "stats_after": after_stats,
        "memories": written,
        "idempotency": "each title is searched in project isswf before saving; an existing title is reported as skipped-existing with its observation id, so reruns never duplicate the memories",
        "projects_list_after": after_projects_record,
        "isolation_reference_project": max(foreign_counts, key=foreign_counts.get) if foreign_counts else None,
        "isolation_reference_observations": max(foreign_counts.values()) if foreign_counts else 0,
        "foreign_project_names_recorded": "only the single reference name and its count",
        "note": "project_existed_before is informational: on a first run the isswf project does not exist yet, which is why stats --project isswf fails before the writes.",
    }


def verify_stored_bodies(engram: str, env: dict, written: list[dict]) -> dict:
    target = SESSION_TMP / "isswf-export.json"
    record, _ = run([engram, "export", str(target), "--project", PROJECT], env=env, cwd=ROOT)
    data = json.loads(target.read_text()) if target.exists() else {}
    by_id = {observation["id"]: observation for observation in data.get("observations", [])}
    results = []
    for memory, entry in zip(MEMORIES, written):
        stored = by_id.get(entry.get("obs_id"), {})
        content = stored.get("content", "")
        results.append(
            {
                "key": memory["key"],
                "obs_id": entry.get("obs_id"),
                "title_exact": stored.get("title") == memory["title"],
                "expected_title_chars": len(memory["title"]),
                "stored_title_chars": len(stored.get("title", "")),
                "body_exact": content == memory["body"],
                "expected_body_chars": len(memory["body"]),
                "stored_body_chars": len(content),
                "stored_project": stored.get("project"),
                "stored_scope": stored.get("scope"),
                "stored_type": stored.get("type"),
                "stored_created_at": stored.get("created_at"),
                "stored_revision_count": stored.get("revision_count"),
                "stored_duplicate_count": stored.get("duplicate_count"),
            }
        )
    check(
        "b-stored-title-and-body-match-the-request",
        all(item["title_exact"] and item["body_exact"] and item["stored_project"] == PROJECT and item["stored_scope"] == SCOPE for item in results),
        json.dumps(results, ensure_ascii=False)[:500],
    )
    return {
        "command": record["command"],
        "exit_code": record["exit_code"],
        "export_file": "<TMP>/isswf-export.json",
        "export_scope": f"--project {PROJECT} only",
        "note": "the search and context views truncate a long body in their display, so the exact text is verified against the project's own export instead",
        "memories": results,
    }


def section_b_readback(engram: str, env: dict, written: list[dict]) -> dict:
    searches = []
    for memory in MEMORIES:
        record, proc = run([engram, "search", memory["title"], "--project", PROJECT, "--scope", SCOPE], env=env, cwd=ROOT)
        found, entries = parse_search(proc.stdout)
        matches = [entry for entry in entries if entry["title"] == memory["title"]]
        searches.append(
            {
                "key": memory["key"],
                "command": record["command"],
                "exit_code": record["exit_code"],
                "found_count": found,
                "exact_title_present": bool(matches),
                "obs_ids": [entry["obs_id"] for entry in matches],
            }
        )
        check(f"b-search-{memory['key']}", bool(matches) and record["exit_code"] == 0, f"found {found}, exact {bool(matches)}")
    context_record, context_proc = run([engram, "context", "--project", PROJECT, "--scope", SCOPE], env=env, cwd=ROOT)
    context_text = context_proc.stdout or ""
    present = {memory["key"]: memory["title"] in context_text for memory in MEMORIES}
    check("b-context-both-titles", all(present.values()), f"titles present {present}")
    return {
        "searches": searches,
        "stored_content": verify_stored_bodies(engram, env, written),
        "context": {
            "command": context_record["command"],
            "exit_code": context_record["exit_code"],
            "titles_present": present,
            "stdout": clip(context_text, 900),
        },
    }


def section_c_isolation(engram: str, env: dict, reference_project: str | None) -> dict:
    own = []
    for memory in MEMORIES:
        record, proc = run([engram, "search", memory["title"], "--project", PROJECT, "--scope", SCOPE], env=env, cwd=ROOT)
        found, entries = parse_search(proc.stdout)
        own.append({"key": memory["key"], "found_count": found, "exact_title_present": any(e["title"] == memory["title"] for e in entries)})

    foreign = []
    for memory in MEMORIES:
        if not reference_project:
            foreign.append({"key": memory["key"], "skipped": "no other project with observations exists in the store"})
            continue
        record, proc = run(
            [engram, "search", memory["title"], "--project", reference_project, "--scope", SCOPE], env=env, cwd=ROOT
        )
        found, entries = parse_search(proc.stdout)
        foreign.append(
            {
                "key": memory["key"],
                "project": reference_project,
                "exit_code": record["exit_code"],
                "found_count": found,
                "our_title_present": any(e["title"] == memory["title"] for e in entries),
                "stdout_stored": False,
            }
        )
    performed = [item for item in foreign if "found_count" in item]
    foreign_ok = bool(performed) and all(item["found_count"] == 0 for item in performed)
    check("c-foreign-project-selector-returns-nothing", foreign_ok, f"project {reference_project}, performed {len(performed)} of {len(foreign)}")
    check("c-own-selector-is-the-control", all(item["found_count"] >= 1 for item in own), f"own {own}")

    neutral_dir = SESSION_TMP / "neutral-cwd" / ("neutral-" + os.urandom(3).hex())
    neutral_dir.mkdir(parents=True)
    neutral = []
    for memory in MEMORIES:
        record, proc = run([engram, "search", memory["title"]], env=env, cwd=neutral_dir)
        found, entries = parse_search(proc.stdout)
        unknown = re.search(r"unknown project:\s*(\S+)", proc.stderr or "")
        neutral.append(
            {
                "key": memory["key"],
                "cwd": "<TMP>/neutral-cwd/<neutral>",
                "exit_code": record["exit_code"],
                "found_count": found,
                "our_title_present": any(e["title"] == memory["title"] for e in entries),
                "attributed_project": unknown.group(1) if unknown else None,
                "stderr": (proc.stderr or "").strip(),
                "stdout_stored": False,
            }
        )
    neutral_ok = all(
        item["found_count"] == 0 and not item["our_title_present"] and item["attributed_project"] != PROJECT for item in neutral
    )
    check(
        "c-neutral-cwd-without-project-returns-nothing",
        neutral_ok,
        f"neutral cwd results {[{k: v for k, v in item.items() if k in ('found_count', 'our_title_present', 'attributed_project')} for item in neutral]}",
    )

    repo_cwd = []
    for memory in MEMORIES:
        record, proc = run([engram, "search", memory["title"]], env=env, cwd=ROOT)
        found, entries = parse_search(proc.stdout)
        repo_cwd.append({"key": memory["key"], "cwd": "<REPO>", "found_count": found, "our_title_present": any(e["title"] == memory["title"] for e in entries)})

    detection = cwd_detection_probe(engram)
    disposable = disposable_isolation_control(engram)
    forbidden = [command for command in COMMANDS if "--all" in command]
    check("c-no-all-flag", not forbidden, f"{len(COMMANDS)} commands checked, offenders {forbidden}")
    return {
        "method": "every query is scoped with an explicit --project; no --all anywhere; another project's output is never stored",
        "neutral_cwd_evidence": "for a neutral cwd the CLI reports which project it derived, so the record shows the call was attributed to the neutral directory and not to isswf",
        "own_project": own,
        "foreign_project_selector": foreign,
        "foreign_project_stdout_policy": "parsed for counts and title presence only, raw output discarded",
        "neutral_cwd_without_project": neutral,
        "repo_cwd_without_project_observation": {
            "results": repo_cwd,
            "note": "Informational, not an assertion. The repository directory is named isSWF, so an unprojected call made from inside it is expected to resolve to the isswf project and to return our own memories. The required isolation property is the neutral-cwd result above.",
        },
        "cwd_detection_probe_on_disposable_store": detection,
        "disposable_store_control": disposable,
        "no_all_flag": {"commands_checked": len(COMMANDS), "offenders": forbidden},
    }


def disposable_isolation_control(engram: str) -> dict:
    store = SESSION_TMP / "isolation-store"
    store.mkdir()
    env = base_env({"ENGRAM_DATA_DIR": str(store)})
    marker = "ISOLATION-MARKER-" + os.urandom(3).hex().upper()
    decoy = "DECOY-MARKER-" + os.urandom(3).hex().upper()
    neutral_dir = SESSION_TMP / "isolation-neutral" / ("derived-" + os.urandom(3).hex())
    neutral_dir.mkdir(parents=True)
    derived_project = neutral_dir.name
    run([engram, "save", marker, "isolation probe body", "--type", TYPE, "--project", PROJECT, "--scope", SCOPE], env=env, cwd=SESSION_TMP)
    run([engram, "save", decoy, "decoy body", "--type", TYPE, "--project", derived_project, "--scope", SCOPE], env=env, cwd=SESSION_TMP)
    run([engram, "save", "second project marker", "second project body", "--type", TYPE, "--project", "isolation-other", "--scope", SCOPE], env=env, cwd=SESSION_TMP)

    def scoped(query, project, cwd):
        record, proc = run([engram, "search", query, "--project", project, "--scope", SCOPE], env=env, cwd=cwd)
        found, entries = parse_search(proc.stdout)
        return {"query_kind": "marker" if query == marker else "decoy", "project": project, "exit_code": record["exit_code"], "found_count": found, "titles": [e["title"] for e in entries]}

    def unprojected(query):
        record, proc = run([engram, "search", query], env=env, cwd=neutral_dir)
        found, entries = parse_search(proc.stdout)
        return {"query_kind": "marker" if query == marker else "decoy", "cwd_basename": neutral_dir.name, "exit_code": record["exit_code"], "found_count": found, "titles": [e["title"] for e in entries]}

    own = scoped(marker, PROJECT, SESSION_TMP)
    foreign = scoped(marker, "isolation-other", SESSION_TMP)
    derived_marker = unprojected(marker)
    derived_decoy = unprojected(decoy)
    check(
        "c-disposable-derived-project-sees-only-itself",
        derived_marker["found_count"] == 0 and derived_decoy["found_count"] == 1,
        f"unprojected from {neutral_dir.name}: marker {derived_marker['found_count']}, decoy {derived_decoy['found_count']}",
    )
    check(
        "c-disposable-foreign-and-own-selectors",
        own["found_count"] == 1 and foreign["found_count"] == 0,
        f"own {own['found_count']}, foreign on an existing project {foreign['found_count']}",
    )
    return {
        "purpose": "same isolation question on a disposable store where every selector exists and holds memories, so a zero result cannot come from a missing project",
        "marker": marker,
        "own_project_selector": own,
        "foreign_project_selector": foreign,
        "unprojected_from_derived_cwd": {"marker": derived_marker, "decoy": derived_decoy},
        "real_store_difference": "on the real store the neutral cwd is a random directory whose derived project does not exist, so the CLI answers No memories found with exit 0; here the derived project exists and holds the decoy, which makes the marker's absence a real filter result",
    }


def cwd_detection_probe(engram: str) -> dict:
    store = SESSION_TMP / "probe-store"
    store.mkdir()
    env = base_env({"ENGRAM_DATA_DIR": str(store)})
    probe_dir = SESSION_TMP / "probe-cwd" / ("probedir-" + os.urandom(2).hex())
    probe_dir.mkdir(parents=True)
    save_record, _ = run(
        [engram, "save", "basename probe", "marker for cwd derivation", "--type", TYPE, "--scope", SCOPE],
        env=env,
        cwd=probe_dir,
    )
    _, list_proc = run([engram, "projects", "list"], env=env, cwd=probe_dir)
    derived = sorted(parse_projects(list_proc.stdout))
    fold_project = "CaseFold-" + os.urandom(2).hex()
    run([engram, "save", "fold marker title", "fold marker body", "--type", TYPE, "--project", fold_project, "--scope", SCOPE], env=env, cwd=SESSION_TMP)
    fold_dir = SESSION_TMP / "probe-cwd" / fold_project.lower()
    fold_dir.mkdir()
    fold_record, fold_proc = run([engram, "search", "fold marker title"], env=env, cwd=fold_dir)
    fold_stored, _ = run([engram, "projects", "list"], env=env, cwd=SESSION_TMP)
    return {
        "purpose": "measure how Engram derives the project when --project is absent, without touching the real store",
        "basename_probe": {
            "save_command": save_record["command"],
            "save_exit_code": save_record["exit_code"],
            "cwd_basename": probe_dir.name,
            "projects_in_disposable_store": derived,
            "derived_equals_basename": derived == [probe_dir.name],
        },
        "case_fold_probe": {
            "stored_project_names": sorted(parse_projects(fold_stored["stdout"])),
            "cwd_basename": fold_dir.name,
            "search_found_count": int(FOUND_RE.search(fold_proc.stdout or "").group(1)) if FOUND_RE.search(fold_proc.stdout or "") else 0,
            "search_exit_code": fold_record["exit_code"],
        },
    }


def logical_state(state: Path) -> dict:
    db = Path(state) / "isswf.sqlite3"
    con = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    try:
        work = [dict(row) for row in con.execute("select id, repo, issue, revision, snapshot from work order by id")]
        history = [dict(row) for row in con.execute("select work_id, revision, snapshot from history order by work_id, revision")]
        grants = [dict(row) for row in con.execute("select id, repo, issue, objective, scope, actor, decision from grants")]
        tables = [row[0] for row in con.execute("select name from sqlite_master where type='table' order by name")]
    finally:
        con.close()

    def digest(raw: str) -> str:
        return hashlib.sha256(raw.encode()).hexdigest()

    def normalize(raw: str) -> dict:
        snapshot = json.loads(raw)
        for key in ("updated_at", "authorization_id"):
            snapshot.pop(key, None)
        return snapshot

    return {
        "database": str(db),
        "tables": tables,
        "grants_count": len(grants),
        "grant_ids": sorted(grant["id"] for grant in grants),
        "work": [
            {
                "id": row["id"],
                "repo": row["repo"],
                "issue": row["issue"],
                "revision": row["revision"],
                "snapshot_sha256": digest(json.dumps(normalize(row["snapshot"]), sort_keys=True, ensure_ascii=False)),
            }
            for row in work
        ],
        "history": [
            {"work_id": row["work_id"], "revision": row["revision"], "snapshot_sha256": digest(json.dumps(normalize(row["snapshot"]), sort_keys=True, ensure_ascii=False))}
            for row in history
        ],
        "raw_snapshots": [json.loads(row["snapshot"]) for row in work],
        "snapshot_volatile_keys": ["updated_at", "authorization_id"],
        "work_updated_at_not_compared": "the work table's updated_at column equals snapshot.updated_at and differs by construction between two runs at different times, so the compared work tuple excludes it",
    }


def diff_paths(left, right, prefix="") -> list[str]:
    if isinstance(left, dict) and isinstance(right, dict):
        found = []
        for key in sorted(set(left) | set(right)):
            found += diff_paths(left.get(key), right.get(key), f"{prefix}.{key}" if prefix else key)
        return found
    if isinstance(left, list) and isinstance(right, list) and len(left) == len(right):
        found = []
        for index, (a, b) in enumerate(zip(left, right)):
            found += diff_paths(a, b, f"{prefix}[{index}]")
        return found
    return [] if left == right else [prefix or "<root>"]


def walkthrough(name: str, workdir: Path, env: dict, python: str) -> dict:
    workdir.mkdir(parents=True, exist_ok=True)
    state = workdir / "state"
    steps = []
    record, proc = run([python, "-m", "isswf", "--state", str(state), "authorize", str(ROOT / "examples/u1/authorization.json")], env=env, cwd=ROOT)
    steps.append(record)
    result = {"name": name, "exit_codes": [record["exit_code"]], "state": str(workdir / "state")}
    if proc.returncode != 0:
        result["failed_at"] = "authorize"
        return result
    authorization = json.loads(proc.stdout)
    proposal = json.loads((ROOT / "examples/u1/proposal.json").read_text())
    proposal["authorization_id"] = authorization["id"]
    proposal_file = workdir / "proposal.json"
    proposal_file.write_text(json.dumps(proposal, ensure_ascii=False))
    record, proc = run([python, "-m", "isswf", "--state", str(state), "prepare", str(proposal_file)], env=env, cwd=ROOT)
    steps.append(record)
    result["exit_codes"].append(record["exit_code"])
    if proc.returncode != 0:
        result["failed_at"] = "prepare"
        return result
    snapshot = json.loads(proc.stdout)
    record, proc = run([python, "-m", "isswf", "--state", str(state), "show", snapshot["id"]], env=env, cwd=ROOT)
    steps.append(record)
    result["exit_codes"].append(record["exit_code"])
    shown = json.loads(proc.stdout) if proc.returncode == 0 else None
    record, proc = run([python, "-m", "isswf", "--state", str(state), "show"], env=env, cwd=ROOT)
    steps.append(record)
    result["exit_codes"].append(record["exit_code"])
    listed = json.loads(proc.stdout) if proc.returncode == 0 else None
    logical = logical_state(state)
    result.update(
        {
            "steps": steps,
            "work_id": snapshot["id"],
            "revision": snapshot["revision"],
            "preparation": snapshot["preparation"],
            "show_detail_matches_prepare": shown == snapshot,
            "show_list_count": len(listed) if isinstance(listed, list) else None,
            "logical": logical,
        }
    )
    return result


def section_d_closed_failure(engram: str) -> dict:
    broken_target = SESSION_TMP / "engram-data-is-a-file"
    broken_target.write_text("not a directory")
    python = sys.executable
    suite_command = [python, "-m", "unittest", "discover", "-s", "tests", "-q"]
    broken_env = base_env({"PATH": BROKEN_PATH, "ENGRAM_DATA_DIR": str(broken_target)})
    control_env = base_env()

    broken_suite, broken_suite_proc = run(suite_command, env=broken_env, cwd=ROOT)
    control_suite, control_suite_proc = run(suite_command, env=control_env, cwd=ROOT)

    def suite_summary(record, proc):
        ran = re.search(r"Ran (\d+) tests?", proc.stderr or "")
        return {
            "command": record["command"],
            "exit_code": record["exit_code"],
            "tests_ran": int(ran.group(1)) if ran else None,
            "passed": record["exit_code"] == 0,
            "tail": clip((proc.stderr or "").strip().splitlines()[-1] if proc.stderr else "", 120),
        }

    broken_suite_summary = suite_summary(broken_suite, broken_suite_proc)
    control_suite_summary = suite_summary(control_suite, control_suite_proc)
    check("d-suite-passes-with-engram-unusable", broken_suite_summary["passed"], json.dumps(broken_suite_summary))
    check("d-suite-passes-with-engram-available", control_suite_summary["passed"], json.dumps(control_suite_summary))
    check(
        "d-suite-count-matches-control",
        broken_suite_summary["tests_ran"] == control_suite_summary["tests_ran"] and bool(broken_suite_summary["tests_ran"]),
        f"{broken_suite_summary['tests_ran']} vs {control_suite_summary['tests_ran']}",
    )
    check(
        "d-engram-unresolvable-in-broken-env",
        shutil.which("engram", path=BROKEN_PATH) is None,
        f"PATH {BROKEN_PATH}",
    )

    broken_run = walkthrough("engram-unusable", SESSION_TMP / "walkthrough-broken", broken_env, python)
    control_run = walkthrough("engram-available", SESSION_TMP / "walkthrough-control", control_env, python)
    broken_walk_ok = broken_run.get("failed_at") is None and all(code == 0 for code in broken_run["exit_codes"])
    control_walk_ok = control_run.get("failed_at") is None and all(code == 0 for code in control_run["exit_codes"])
    check("d-cli-walkthrough-with-engram-unusable", broken_walk_ok, f"exit codes {broken_run['exit_codes']}")
    check("d-cli-walkthrough-control", control_walk_ok, f"exit codes {control_run['exit_codes']}")
    check(
        "d-detail-view-matches-prepare",
        bool(broken_run.get("show_detail_matches_prepare")) and bool(control_run.get("show_detail_matches_prepare")),
        "show <id> equals the prepare snapshot in both runs",
    )

    comparison = {"volatile_fields": ["snapshot.updated_at", "snapshot.authorization_id", "grants.id"], "differences": [], "comparable": False}
    if broken_walk_ok and control_walk_ok:
        broken_logical, control_logical = broken_run["logical"], control_run["logical"]
        differences = []
        for field in ("tables", "grants_count", "work", "history"):
            if broken_logical[field] != control_logical[field]:
                differences.append(field)
        if broken_logical["work"] != control_logical["work"]:
            differences += diff_paths(broken_logical["work"], control_logical["work"], "work")
        if broken_logical["history"] != control_logical["history"]:
            differences += diff_paths(broken_logical["history"], control_logical["history"], "history")
        volatile_keys = {"updated_at", "authorization_id"}
        raw_paths = diff_paths(broken_logical["raw_snapshots"], control_logical["raw_snapshots"], "snapshot")
        unexpected = [path for path in raw_paths if path.rsplit(".", 1)[-1] not in volatile_keys]
        comparison.update(
            {
                "comparable": True,
                "differences": sorted(set(differences)),
                "raw_snapshot_differing_paths": raw_paths,
                "unexpected_differences": unexpected,
                "work_equal": broken_logical["work"] == control_logical["work"],
                "history_equal": broken_logical["history"] == control_logical["history"],
                "grant_ids_differ": broken_logical["grant_ids"] != control_logical["grant_ids"],
                "revision": broken_logical["work"][0]["revision"] if broken_logical["work"] else None,
                "history_rows": len(broken_logical["history"]),
            }
        )
        broken_run["logical"].pop("raw_snapshots", None)
        control_run["logical"].pop("raw_snapshots", None)
        check(
            "d-logical-state-independent-of-engram",
            broken_logical["work"] == control_logical["work"]
            and broken_logical["history"] == control_logical["history"]
            and not unexpected,
            f"differing raw snapshot paths {raw_paths}",
        )

    sources = sorted(ROOT.glob("isswf/*.py")) + sorted(ROOT.glob("tests/*.py"))
    scan = {}
    for path in sources:
        hits = len(re.findall(r"engram", path.read_text(errors="replace"), re.I))
        if hits:
            scan[path.relative_to(ROOT).as_posix()] = hits
    check("d-no-engram-reference-in-runtime-code", not scan, f"files with matches {scan}")

    return {
        "broken_environment": {
            "PATH": BROKEN_PATH,
            "engram_resolvable": shutil.which("engram", path=BROKEN_PATH) is not None,
            "ENGRAM_DATA_DIR": str(broken_target).replace(str(SESSION_TMP), "<TMP>"),
            "ENGRAM_DATA_DIR_is_a_regular_file": broken_target.is_file(),
            "python": python,
        },
        "control_environment": {"PATH": "ambient", "ENGRAM_DATA_DIR": "unset", "engram_resolvable": shutil.which("engram") is not None},
        "suite_broken": broken_suite_summary,
        "suite_control": control_suite_summary,
        "walkthrough_broken": broken_run,
        "walkthrough_control": control_run,
        "logical_sqlite_comparison": comparison,
        "runtime_source_scan": {"files": [p.relative_to(ROOT).as_posix() for p in sources], "files_referencing_engram": scan},
    }


def git(*args) -> str:
    return subprocess.run(["git", "-C", str(ROOT), *args], text=True, capture_output=True).stdout.strip()


def main() -> int:
    head = git("rev-parse", "HEAD")
    previous = git("rev-parse", "HEAD~1") or None
    changed = [line for line in (git("diff", "--name-only", "HEAD~1", "HEAD") or "").splitlines() if line]
    report = {
        "scope": (
            "Real integration check between isSWF and Engram: writes two operator-approved memories into project "
            "isswf of the operator's real store, reads them back, checks project isolation, and shows isSWF keeps "
            "working with Engram unusable. Never deletes memories, never uses --all, never reads another project's content."
        ),
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "repo": {
            "path": str(ROOT),
            "commit": head,
            "previous_commit": previous,
            "files_changed_in_commit": changed,
            "runtime_files_changed_in_commit": [path for path in changed if path.startswith(("isswf/", "tests/"))],
            "note": "the commit is HEAD when this script ran; the briefing named 499849e, and HEAD advanced to e1c186d during the session through a commit made outside this work, which touched only .audit/ and docs/research/engram-arranque.md, so the tested isswf/ and tests/ code is the same",
        },
        "ambient_engram_env_variables": AMBIENT_ENGRAM_ENV,
    }
    try:
        engram = engram_bin()
        help_record, help_proc = run([engram, "--help"], env=base_env(), cwd=ROOT)
        version = (help_proc.stdout or "").splitlines()[0].strip() if help_proc.stdout else None
        report["engram"] = {"binary": engram, "version": version, "help_exit_code": help_record["exit_code"]}
        env = base_env()
        report["a_write_real_store"] = section_a_write(engram, env)
        reference = report["a_write_real_store"].get("isolation_reference_project")
        report["b_readback"] = section_b_readback(engram, env, report["a_write_real_store"]["memories"])
        report["c_isolation"] = section_c_isolation(engram, env, reference)
        report["d_closed_failure"] = section_d_closed_failure(engram)
    except Exception as exc:  # keep the failure in the artifact instead of hiding it
        report["fatal"] = {"type": type(exc).__name__, "message": str(exc)}
        CHECKS.append({"name": "fatal", "ok": False, "detail": str(exc)})
    finally:
        report["checks"] = CHECKS
        failures = [entry["name"] for entry in CHECKS if not entry["ok"]]
        report["verdict"] = {
            "checks_total": len(CHECKS),
            "checks_passed": len(CHECKS) - len(failures),
            "checks_failed": failures,
            "commands_executed": len(COMMANDS),
            "all_commands_avoided_all_flag": not any("--all" in command for command in COMMANDS),
        }
        report["limits"] = {
            "proven": [
                "Two memories with the given title, body, project and scope are stored in the real store and retrieved back by search and context.",
                "A query scoped to another project, and a query from a neutral cwd without --project, return none of the isSWF memories.",
                "isSWF's suite, CLI walkthrough and SQLite content are identical with Engram unusable and with Engram available.",
            ],
            "not_proven": [
                "That isSWF consumes Engram at runtime: isswf/ and tests/ contain no reference to Engram, so the closed-failure result shows absent coupling, not a graceful degradation path inside isSWF.",
                "Anything about MCP transport, cloud sync, memory conflict resolution, or the shared store's behaviour under a hostile process of the same user.",
                "That the memories were not modified or deleted later, or that other sessions do not read the shared store's other projects.",
                "Any claim about the store's other projects beyond the single reference name and its observation count.",
            ],
            "notes": [
                "The suite and the walkthrough use absolute sys.executable, so the broken PATH isolates Engram only.",
                "The store is shared with a running engram serve process whose cwd is agent-depot; every isSWF query passes an explicit --project.",
                "No memory was deleted, no --hard and no --all was used, and sync.log and other projects' configuration were not touched.",
                "The search and context views truncate a long body on screen; the stored text is verified exactly through the project's own export, not the display.",
                "The recorded commit is HEAD at execution time, not necessarily the commit named in the briefing.",
            ],
        }
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
        shutil.rmtree(SESSION_TMP, ignore_errors=True)
    failed = [entry["name"] for entry in CHECKS if not entry["ok"]]
    print(f"{'PASS' if not failed else 'FAIL'}: {len(CHECKS) - len(failed)}/{len(CHECKS)} checks; {len(COMMANDS)} commands; wrote {OUTPUT.relative_to(ROOT)}")
    for name in failed:
        print(f"  failed: {name}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
