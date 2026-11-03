# J006 / r8 — Local Claude transcript usage reader (primary zero-token capture)

## Authority

On 2026-11-03 the operator judged telemetry daemons/global settings over-engineered for the I0025 goal (obtain consumption values without spending extra tokens, to detect excessive or illogical consumption and analyse causes) and approved a local transcript reader, adding: if the format is not valid, recommend the user open an isSWF issue. Budget: one isswf-worker ≤40 min, one bound isswf-reviewer ≤15 min; only for bounded review defects, one correction ≤15 min and one second review ≤15 min. Sequential, no push/PR/install/global configuration/cleanup/provider calls.

## Objective

Read Claude Code's local session transcripts and produce, with no model call, per-session usage with one row for the parent session and one per subagent, plus a session total, in the existing token report so Claude matches Pi's parent/child shape. It must cover ordinary `claude` launches (no helper, telemetry or daemon needed). The r5–r7 OTel snapshot capture (deaf6b9) stays as an optional secondary path, unchanged except for documentation cross-references.

## Observed facts (coordinator, 2026-11-03, Claude Code 2.1.312, Linux)

- `~/.claude/projects/<encoded-project>/<sessionId>.jsonl`; subagents in `<sessionId>/subagents/agent-<id>.jsonl` with `agent-<id>.meta.json`.
- Assistant entries carry `message.usage` (`input_tokens`, `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`, others) and entry fields including `requestId`, `sessionId`, `timestamp`, `version`, `isSidechain`, `effort`, model in `message.model`.
- One request can appear on several lines (93 usage lines, fewer requests): deduplicate by `requestId` deterministically; never double-count.
- The format is undocumented; locating the project directory (path encoding) must work on Linux and Windows.

## Requirements

- Extract only numeric counters and bounded identifiers (model, effort, version, timestamps, hashed session/agent IDs, agent type from meta when safe). Never copy message text, tool input/output, prompts, paths beyond the selected project, or secrets into outputs, fixtures, logs or errors.
- Strict, bounded parsing: size/line/entry limits, malformed or unrecognised structure fails visibly for that file without silent zero. Unknown-but-harmless extra fields are tolerated; missing required usage structure is invalid.
- **On invalid/unrecognised format:** report which file/version failed (no content) and recommend the user open an issue at https://github.com/iseoane/isSWF/issues (via the isswf-issue workflow where available), including Claude Code version and the failing check name only.
- Report total = sum of deduplicated requests across parent and subagent files; state coverage honestly (e.g. files present/parsed/invalid). Do not claim billing precision.
- Selection by project and session (latest or explicit id); CLI integrates with existing `tools/token-report.mjs` conventions. No writes into `~/.claude`.
- Portable Linux/Windows path handling with fixture coverage; actual Windows run remains separate evidence.
- Tests with small synthetic/sanitised fixtures (duplicate requestIds, subagents, malformed lines, unknown version, oversize, missing usage); never commit real transcripts. One coordinator-observable real run on this machine's current project, outputting counts only.
- EN/ES docs (operations guides) and setup skill mention as appropriate; `node tooling/quality/check-docs.mjs` must pass.

## Checks

Focused suites, locked ESLint/Knip, check-docs, `git diff --check`, `node tools/check-quality.mjs` on the committed candidate. Stop once and report if the transcript format cannot be parsed reliably for parent/subagent usage.
