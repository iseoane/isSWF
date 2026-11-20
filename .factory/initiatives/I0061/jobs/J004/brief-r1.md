# I0061 J004 brief r1 (research)

- Authorization: operator, 2026-11-20, "Adelante con el siguiente job". Read-only research; any implementation needs a later operator decision.
- Actor: one isswf-researcher, budget one pass.
- Objective and acceptance: [plan.md](../../plan.md) J004.

## Questions

1. Which miss signals the factory can observe mechanically today: reverts on main, CI failures on a reviewed candidate that local checks did not report, review findings later contradicted, issues labelled bug that cite a merged PR. Cite where each signal lives (git history, `gh` data, review records `V*.md`, attempt records, `isswf-handoff coverage`).
2. How the existing review records and the retrospective skill (`.agents/skills/isswf-retrospective/`) could record a miss and attribute it to a reviewer round, a check or a rule.
3. Incident-based evals: turning a recorded miss into a replayable review case (inputs: exact base/candidate diff and brief; expected finding), and how it would run with the handoff tool.
4. Rule pruning: how to detect review rules or checks that never fire or only produce dismissed findings.
5. Recommendation: extend `isswf-retrospective`, a new `isswf-` skill, or a tool; with costs and risks.

## Output

Concise report with file:line evidence, a minimal record shape for a miss, and the operator decisions. No edits.
