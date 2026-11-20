# I0061 J001 brief r1 (research)

- Authorization: operator, 2026-11-20, "J006 y luego la investigacion". Read-only research only; the implementation brief needs the operator's review of the design first.
- Actor: one isswf-researcher (read-only), budget one pass.
- Baseline: origin/main at this brief's commit.
- Objective and acceptance: [plan.md](../../plan.md) J001; J002, J003 and J005 depend on its file format and cost class.

## Questions

1. What setup already detects about a target project's quality checks (the setup quality areas in `.agents/skills/isswf-setup/`, `tools/project-quality*`, `tools/check-quality.mjs`), and what of it can seed the verification file.
2. A proposed versioned verification file: location under the selected state directory, format (JSON vs Markdown table), fields per check (id, command, platforms, cost class, paths it covers, manifests it derives from for J002 hashes), and a cost-class scale usable by J005 tiers (per job / per initiative / CI only).
3. A runner design: where it lives in `tools/`, how it runs identically on Linux and Windows (no shell differences), its per-check result shape usable as I0058 J001's verification stamp.
4. Risks and open operator decisions.

## Output

A concise research report with file:line evidence, a proposed format example, and the decisions the operator must take. No edits.
