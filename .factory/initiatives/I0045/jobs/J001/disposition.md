# I0045 / J001 triage disposition

Observer: coordinator (Claude Code, source plugin via `--plugin-dir`), read-only grounding at source `99dc65cc01cfde9058ee43d4aafee26914e8d372` (brief target base `3c0cf20`; cited lines unchanged in scope). Issue #265 and comment `IC_kwDOVIySHc8AAAABlMfphQ` are supplied evidence, not authority. Raw observation and probes retained privately under ignored `tooling/.local/i0045-triage/`. No implementation, commit, label, comment or publication.

## 1. Primary report: dispatch without reading durable-work

- Verified: the requirement is unconditional in `.agents/skills/isswf-coordinator/SKILL.md` §3 (line 92) and `.agents/hosts/claude-code.md` "Required child context". Requirement text is not the defect.
- Verified: nothing mechanical enforces it. `isswf-status` exits 0 for both `observed` and `unknown` plans (probe in `status-probe.json`), and reports an untracked brief as `recorded` (`grounding-status-boundaries.json`); exit code is not a gate.
- Reported only: the reporter's 1.8.4 Windows/Claude trace (single observation, not re-run). Cause (context size, skill length, resume framing) is undemonstrated; do not attribute it.
- Related closed issues: #92 (conditional wording), #204 (plan schema), #254 (methodology transport). None resolves this; no equivalent open issue found.

## 2. Comment: status invocation for plugin installs

- Verified inconsistency: `package.json` `files` ships `tools/*.mjs`, yet `docs/durable-work.md:75,79` says the command runs "from an authorized source checkout" and is "not part of the Markdown resource package"; coordinator SKILL.md:30 says "through the pinned launcher in installed projects", which host-native projects do not have.
- Unknown: whether this contributed to the omission; the reporter's installed bytes were not independently retrieved.

## 3. Setup: ignored state vs. Git checkpoints

- Verified: `docs/durable-work.md:47,49` requires a full Git SHA document-input checkpoint for dispatch; setup (`.agents/skills/isswf-setup/SKILL.md` "Tracking and project checks") records tracking without flagging an ignored state root as incompatible. `.isswf/.gitignore` intentionally ignores only `local/`.
- Decision boundary: whether to track state is the operator's Git/privacy choice; the factory must surface the conflict, never force-add.

## Proposed correction unit (decision-ready, not started)

Outcome: a host-native coordinator can run and must honour a supported pre-dispatch check on both hosts and OSes.

1. Documentation/distribution: one supported invocation per distribution — source checkout `node tools/isswf-status.mjs`; Claude plugin and Pi resource package `node <trusted-package-root>/tools/isswf-status.mjs`; receipt-pinned runtime through its launcher. Correct `durable-work.md:75,79`, coordinator SKILL.md:30, host guides, and the Spanish mirrors where applicable.
2. Pre-dispatch conditions in the coordinator skill §5 and both host guides: block dispatch unless status is `observed` (not merely exit 0), the brief is committed, and the dispatch names the brief path plus full input SHA; untracked/ignored brief blocks with a stated reason.
3. Setup: when the selected state root (beyond `local/`) is Git-ignored, record the conflict with durable-work checkpoints and ask the operator; no automatic tracking.
4. Optional, only if feasibility evidence supports it: a `--require-observed` style nonzero exit for `isswf-status`. Not prescribed by this triage.

Checks: focused docs/package tests (`check-docs`, packaged-file presence of `tools/isswf-status.mjs`), a status test for observed/unknown/untracked-brief cases, and native Linux and Windows CI. Pi and Claude adherence remain instruction-level; live adherence evidence on Windows/Pi/Claude is an explicit gap, not claimed.

Methodology considered: isswf-writing selected for unit (docs); verification principles selected (regression of a skipped requirement); design principles selected if option 4 changes the CLI contract; TDD not selected (doc-dominant) unless option 4 is chosen; interview not selected (no product gaps beyond the setup question already scoped to operator choice).
