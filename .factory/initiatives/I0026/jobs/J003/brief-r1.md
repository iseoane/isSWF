# I0026/J003 brief r1 — #204 coordinator plan validation (unit 2 comparison workload)

Status: ready to execute. Base `4e1a5df`. Branch `fix/204-plan-validation`.

Authorization: operator, current Claude Code session (2026-11-04): "entrega la issue #204 como feature hasta PR con CI verde y revisión independiente según las reglas actuales. Es la medición comparativa de la unidad 2 de I0026: trabajo normal, sin atajos ni pasos extra". Selects the feature-delivery default: implement, check, independent review, ≤1 correction cycle, ≤2 review rounds, commit, push branch, PR, exact-head CI. No merge.

Outcome: the coordinator procedure names the valid plan job states and required fields and requires parsing the plan with existing tooling (`isswf-status`, which calls `parsePlan`) before committing a plan change; a portable check rejects this repository's plans when a job has an invalid status or lacks `### Acceptance`, run in the Linux and Windows CI matrix.

Reading map: `tools/isswf-plan.mjs:12` (`planStates`), `:44-80` (`parsePlan`); `tools/isswf-status.mjs:135,154` (status parses plans); `.agents/skills/isswf-coordinator/SKILL.md:64` (manual plans paragraph); `.github/workflows/quality.yml:61-104` (OS matrix job).

Observed: all `.factory/initiatives/*/plan.md` parse except historical I0009 (`unsafe-brief-reference`) and I0012 (`invalid-job`, `Status: ready`). Historical records stay unchanged (AGENTS.md); the check lists them as explicit known exceptions so any other plan failing is caught.

Scope: new `tests/plan-records.mjs`, one step in the matrix job of `.github/workflows/quality.yml`, `.agents/skills/isswf-coordinator/SKILL.md`, this initiative's records. Exclusions: `parsePlan` semantics, new status store or dispatcher, historical plans.

Acceptance: the test rejects synthetic plans with an invalid status and with a missing Acceptance section (`invalid-job`), accepts every current plan except the two listed exceptions, and fails if a listed exception starts parsing (keeps the list honest); runs on ubuntu and windows CI; `node tools/check-quality.mjs`, check-docs, eslint, knip pass.

Method: TDD not selected — no honest behavioral RED: `parsePlan` already rejects these inputs; the change adds a check and procedure text. Coordinator implements directly (small). Review: semantic, one independent `isswf-reviewer` via bound `claude -p` process per the Claude host guide. Risk: item 5 (CI workflow step added), otherwise LOW.
