# Job brief J003 / r1

- Source: J002 review V001 finding 2. Operator start: "si corrige esas frases" (current Claude Code session, 2026-11-11). Coordinator-direct, no dispatch.
- Objective: remove false "not shipped in the resource package" claims for `tools/isswf-intake.mjs` and `tools/project-quality.mjs`; `package.json` ships `tools/*.mjs` and both tools import only shipped modules.
- Scope: `docs/issue-intake.md:9`, `.agents/skills/isswf-coordinator/SKILL.md:34`, `.agents/skills/isswf-setup/SKILL.md:151`, static assertions in `tests/host-portability.mjs`. No behavior or CLI change.
- Acceptance: the three claims are replaced by trusted-factory-root invocation; static assertions fail without the change (negative control) and pass with it; check-docs, focused tests, lint and diff check pass; exact-head CI.
- Verification: mechanical/empirical (wording correction, LOW risk); no semantic review selected.
- Methodology considered: isswf-writing selected (instruction wording); verification principles selected (negative control); others not triggered.
