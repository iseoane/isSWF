# I0061 J010 brief r1

- Authorization: operator, 2026-11-20, "Sigue". Feature-to-PR start on `feat/i0061-j010-close-gate`; merge per the standing rule.
- Writer: one isswf-worker, sole writer in the primary checkout.
- Objective and acceptance: [plan.md](../../plan.md) J010.

## Design (reuse existing pieces; no new guard module if an existing one fits)

1. Close record: `isswf-verify --tier initiative --record <initiative>` (or the closest fit to its existing flags) runs the initiative tier, including `cost: ci` checks such as E2E (J005 V001 S2: the `--table` initiative-close row must list them too), and writes `<state>/initiatives/<I>/close-verification.json` with schema id, the verified head SHA, the approved verification file digest, and each check's id and status. A CI source is allowed: the same record with `source: "ci"`, the run URL and head SHA, written by the coordinator after a manually dispatched run passes.
2. Close gate: the initiative closes when its plan's last job turns `completed`. Extend the plan commit guard (`tools/isswf-plan-commit-guard-core.mjs`, already wired in Claude hooks and the Pi extension) so a commit that makes every job `completed` (and HEAD's plan did not) is refused unless the close record exists, every check passed, and its head is the newest commit that changes anything outside `<state>/initiatives/` (records-only commits after the verified head are fine). Keep it fail-open like the rest of the guard, and say so.
3. Setup (`.agents/skills/isswf-setup/SKILL.md`): offer, as an operator choice, running the close suite as a manually dispatched CI workflow (`workflow_dispatch`) instead of locally; the per-PR fast tier stays automatic. Give the workflow shape in the existing "Tiered CI for private repositories" guide section (EN and ES) rather than shipping a new workflow file; do not change this repository's workflows.
4. Small deferred items: `tier-required` message lists `--stale` (J007 V001 F4); `tests/isswf-record-check.mjs` asserts the real template resolution line exists before using it (J009 V002 N1); `.agents/roles/references/review.md` record-check command uses the `<factory-root>/` prefix (J009 V002 N2).

If item 2 cannot be done cleanly in the plan commit guard, stop and report instead of building a new guard.

## Scope

- Out: pinned worktrees (J011), changes to this repository's `.github/workflows/`, closing I0061 itself.

## Checks

TDD for the record writer and the guard. Focused tests: `tests/isswf-verify.mjs`, `tests/isswf-plan-commit-guard.mjs`, `tests/isswf-record-check.mjs`, tests that read the edited skills, `node tooling/quality/check-docs.mjs`, `git diff --check`. Record wall-clock times. Full suite to CI. Leave no background shells.

## Method

TDD. One opus/medium reviewer, 2 rounds, 1 correction.
