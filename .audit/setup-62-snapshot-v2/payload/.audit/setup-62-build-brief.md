# Task 62 — build brief

- **Owner:** Task62 sole implementation writer.
- **Grant:** Operator instruction in this task; edit exactly `.agents/skills/isswf-setup/SKILL.md` and `.audit/setup-62-build-brief.md` in the assigned worktree. No agents, Python, network, commits, global configuration, or runtime changes. No other writable paths.
- **Source checkout/base:** `/home/iseoane/Work/isSWF`, observed full Git SHA `9dc64bb34411f18f7ac01ee6fdb3443eced3b002`.
- **Target:** The assigned worktree `/home/iseoane/Work/isSWF/.claude/worktrees/agent-a4ddb0a29e7e8b4b1`; do not conflate it with a future project target.
- **Model/effort:** `openai-codex/gpt-6-luna`, high (operator-specified).
- **Outcome:** Add one explicitly user-invoked skill, `isswf-setup`, and this brief. The skill may update values in an existing target-owned `.factory/models.json` only under an explicit route-update grant; no factory installation/copying or creation of missing runtime config. No template or other files.

## Acceptance

- Skill has `disable-model-invocation: true`, a human-facing description, and English instructions.
- Skill creates/reconciles the authorized target `.factory/project-setup.md`. An explicitly granted route update may modify only values in an existing target-owned `.factory/models.json`, using the whole approved route as the destination and preserving unknown fields. It does not install/copy factory files or create a missing runtime config; absent config leaves the route proposed/pending.
- Model routes are values-only from the approved canonical source; canonical docs are named as root-relative code spans, not external links. Missing granted source checkout/checkpoint blocks assumptions or copies.
- Skill separates source checkout from target; protects dirty work and known active pinned inputs; preserves choices/unknown fields; requests only undecidable choices or missing authorization; proposes before applying; no-op on settled reruns.
- Skill records technical-isolation and client-use-gate status separately from Markdown permissions; unverified isolation blocks client execution even if Markdown grants permission. It reports configured/partial/blocked, actual diffs/checks, observed base versus changed uncommitted bytes, and pending checkpoint; no commit absent specific authorization.
- Exactly the two authorized paths are written; skill is at most 120 lines.

## Verification status

Acceptance tests/reviews have not yet been performed. No behavioral fixture was run. Build verification is pending; report only checks actually run and observed results. No self-referential commit/checkpoint SHA is included.
