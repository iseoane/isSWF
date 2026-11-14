# I0054/J008 r1: Engram and CodeGraph status row in the pane (started 2026-11-14)

Grounding (main 6deb450 + release 35c05e0): hooks/register.tsx builds `header` (title + AutoWakeUp, then the tab row) in the Pane `ui.render` hook; labels live in `LABELS.es`/`LABELS.en`. Add one row between them. Availability: `$.tool.list()` names (`mcp__<server>__<tool>`, plugin servers `mcp__plugin_<plugin>_<server>__`) for `engram` and `codegraph`; index: `$.fs.exists(<cwd>/.codegraph)`. Do not use `$.mcp.connect` or `$.mcp.call` (side effects).
Scope: hooks/register.tsx, hooks/register.test.tsx, docs/en/installation.md and docs/es/installation.md. Excluded: running `codegraph init/sync`, an Engram project key, a staleness threshold.
Methodology: coordinator as writer with roles/worker.md, code-quality, comments, verification-principles; isswf-writing for docs. Checks: `claude plugin test .`, check-docs; bound review with tools/isswf-review-launch.mjs; CI; operator try.
