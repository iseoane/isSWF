# Job brief J001 / r2

- Source: issue 278 item 1; plan [I0050](../../plan.md) J001; supersedes r1 for authorization and base only.
- Authorization: operator start 2026-11-13 ("Si y ok a tu plan"): implementation, focused checks, commits on `feat/i0050-bound-review-evidence`, push, one I0050 PR against main, exact-head CI. Merge needs a separate operator decision.
- Base: branch head at dispatch (after J003/J004 commits); r1's base 8c6c278 is stale.
- Objective: the coordinator hands bound reviewers a checks block bound to the candidate SHA, written mechanically on that SHA.
- Acceptance (from the plan, proportional):
  - A small packaged helper (under `tools/`, ESM, Node 24, no new dependency) runs the given check commands on a clean checkout of the candidate SHA and writes a block: candidate SHA, each command, exit code, short output tail. It refuses or marks the block when the working tree is not at that SHA or is dirty.
  - Reviewer guidance (`.agents/roles/references/review.md` or reviewer.md, one canonical place) says: a block naming a different SHA is reported as "checks not bound to candidate"; a matching block counts as observed checks, so the review needs no "observed build missing" limit.
  - Coordinator/host review-launch guidance (`.agents/hosts/pi.md` bound review section, which `.agents/hosts/claude-code-review-launch.md` follows) tells the coordinator to produce and supply the block. Same outcome for Pi and Claude Code.
  - Tests: one focused `tests/<name>.mjs` covering the risks: SHA mismatch, dirty tree, nonzero exit recorded, output truncation, Windows-safe paths/spawn (no shell string concatenation). Linux and Windows CI.
- Reading map: tools/git-evidence.mjs (canonical repo/Git executable handling to reuse), tools/reviewer-task.mjs, tools/check-quality.mjs (how tests are listed), .agents/hosts/pi.md bound review section, .agents/roles/references/review.md, package/allowlist manifests if a new tool file must ship (packaging rule: adding a shipped file means the full suite is needed once, by the coordinator).
- Checks: the new focused test, check-docs, host-portability, plus eslint on changed files. Do not run the full suite; the coordinator runs it once because packaging changes.
- Methodology considered: isswf-writing selected (agent guidance); design principles selected (new contract/data shape); TDD not selected (cheap seam but tests written with the change are enough; name risks above); E2E not applicable; security: the helper runs commands supplied by the coordinator, never from the candidate or model text — state this boundary in guidance.
- Review: semantic review of the whole I0050 candidate after J002.
- Budget: 1 worker, 1 correction round.
