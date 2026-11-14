# J030 r7 — Portable Node projection for the reverse route, Linux and Windows

## Current start and decision

On 2026-11-14 the operator resumed J030 on native Windows, after J029 closed (PR322 merge e441d6d). Coordinator observations on Windows 11 x64, Node v26.12.1, Pi 1.5.2, Claude Code 2.1.325:
- `tests/j030-reverse-protocol.mjs` returns NOT_RUN by design.
- `tests/host-portability.mjs` passes.
- `tests/claude-code-adapter-contract.mjs` cannot start: local `tooling/host-tests` dependencies are absent; CI installs them.
- `jq` is not installed.

The reverse procedure (`.agents/hosts/claude-code.md`, "Canonical Linux JSONL projection") depends on `jq`. No installation guide lists `jq` as a prerequisite, so any operator using the reverse route on either platform has an undocumented dependency. Node 24+ is already a required isSWF prerequisite on Linux and Windows.

The operator chose to replace `jq` with a Node projection ("Ok", 2026-11-14). This deliberately supersedes brief-r6's "no new production/runtime parser" constraint for this one projection. All other r6 contracts stay: no bridge, no reviewer shell, no fallback, no retry, unknown effective effort. Historical r4–r6 records, V004/V005 verdicts, PR264 and budgets are unchanged; this is a new bounded unit.

## Outcome and acceptance

1. One shipped Node module (proposed `tools/pi-jsonl-projection.mjs`) reads Pi JSONL on stdin and writes the same projected records the canonical `jq` filter produces today:
   - Keep session (`type`, `cwd`), `agent_settled` (`type`, `aborted`), and the assistant `message_end` with its whitelisted fields and only `text` content blocks.
   - Keep adverse `retry|compaction|error` event types, including suffixed names.
   - Exit nonzero, with no partial success, on malformed JSON, non-array content, an unrecognized or non-string block, or input past a stated byte bound.
   - It is a filter only. It never launches Pi, retries or decides acceptance.
2. The host guide keeps one canonical owner section, renamed to describe a portable projection. The shell form becomes `pi … | node <factory-root>/tools/pi-jsonl-projection.mjs` under `pipefail`, with Windows Git Bash and Linux bash named where verified. The route is available on Linux and Windows only under the same explicit authorization. `pi.md` keeps its link. `jq` disappears from the procedure. The installation guides gain no new prerequisite.
3. `tests/j030-reverse-protocol.mjs` runs natively on Linux and Windows, never NOT_RUN on Windows:
   - Equivalence fixtures: the previously accepted good and adverse inputs give the same output and exit decisions as the retired filter. Record the old filter's results as fixtures; do not depend on `jq` at test time.
   - Every existing negative control is kept: missing, duplicate, malformed or truncated terminal; retry, compaction or error; aborted; identity mismatch; producer failure under pipefail; filter failure; output bound; cancellation of a real synthetic child with observed close or exit.
   - Platform-specific mechanics are named; nothing is extrapolated to real Pi or Claude cancellation.
4. Packaging: the module ships in the release where `build-release` includes top-level tools. The full `node tools/check-quality.mjs` runs locally because a shipped path changes. Existing host-portability and docs checks pass. CI runs the test on both matrix legs.
5. A011 (next unused attempt) reports the candidate, consumed resources, the equivalence and negative-control map, checks, and the remaining live evidence.

Live evidence follows integration as a separate step. It does not count against this unit's review budget, and the coordinator records it:
- One reverse Claude→Pi call on this Windows machine with the approved Pi reviewer selection (`openai-codex/gpt-6.1-sol` medium), through the new projection.
- The forward Pi→Claude direction on Windows needs an operator-run Pi coordinator session. It stays deferred unless the operator runs it.

## Ownership and authority (approved 2026-11-14: "Si coordinador encárgate")

Shared-sequential, dedicated branch `feat/j030-node-projection` from current main, one writer. The branch starts at local main `8566437`, so the I0009/J029 closure and I0055/I0056 records travel with this PR. Out of scope, never staged: untracked `.agents/skills/project-release/`.

Writer paths:
- `tools/pi-jsonl-projection.mjs` (new);
- `.agents/hosts/claude-code.md` reverse section and `.agents/hosts/pi.md` reverse link text;
- `tests/j030-reverse-protocol.mjs`, small test-only fixtures, and `tests/host-portability.mjs` affected assertions;
- `.github/workflows/quality.yml`, only if the test needs a matrix step;
- docs only where the reverse route is described;
- `A011.md`.

Production code elsewhere is read-only. Report any defect found there.

Approved budget: Claude Code native roles, worker `sonnet`/medium and reviewer `opus`/medium. At most 6 child calls: 1 worker, up to 3 review rounds, up to 2 corrections, with no automatic retries. Unbound reviewers receive the exact diff file with its byte count and SHA-256. Separately, 1 live reverse Pi call after integration. Coordinator owns commits beyond the worker's, push, PR and CI. The operator decides the merge, because host guides and the workflow change.

## Methodology and verification

Worker:
- Required: AGENTS.md, REVIEW.md, worker role, comments and code-quality references, `docs/durable-work.md`, `docs/en/development.md`, brief-r6, this brief.
- Selected: isswf-tdd. The equivalence and control fixtures are written first as a test-only RED commit against the absent module, then GREEN; a syntax or setup failure is not RED.
- Also selected: isswf-writing with agent-documents (host guide); design, execution and verification principles.

Independent combined Standards/Spec review is required. A wrong projection could accept an incomplete report or expose thinking text. The review covers equivalence to the retired filter, the strictness of rejection, honest platform claims, and the r6 authority boundaries.
