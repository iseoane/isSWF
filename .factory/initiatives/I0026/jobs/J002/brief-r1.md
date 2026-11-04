# I0026/J002 brief r1 — #201 evidenceDigest named refusal (unit 1 baseline)

Status: ready to execute. Base `6df4e16`. Branch `fix/201-evidence-digest-refusal`.

Authorization: operator, current Claude Code session (2026-11-04): "entrega la issue #201 como feature hasta PR con CI verde y revisión independiente según las reglas actuales ... trabajo normal, sin atajos ni pasos extra". Selects the feature-delivery default: implement, check, independent review, ≤1 correction cycle, ≤2 review rounds, commit, push branch, PR, exact-head CI. No merge (LOW-risk standing permission not invoked by this request).

Outcome: `evidenceDigest` (`tools/diagnostic-probes.mjs:47-55`) refuses an unresolvable path with `canonical-temporary-evidence-root-required` instead of a raw fs error (`realpath` at line 50), Linux and Windows. Valid roots unchanged.

Scope: `tools/diagnostic-probes.mjs`, `tests/diagnostic-probes.mjs`, this initiative's records. Exclusions: other callers, docs (no documented behavior changes).

Acceptance: behavioral test with a missing path asserts the named refusal; existing tests and `node tools/check-quality.mjs` pass.

Method: TDD selected (cheap behavioral seam): test-only RED commit, then GREEN commit. Coordinator implements directly (small, single seam). Review: semantic, one independent `isswf-reviewer` via bound `claude -p` process per the Claude host guide. Risk: LOW (refusal path only).
