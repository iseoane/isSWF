# I0052/J001 r1: Initiatives pane accuracy (prepared, not started)

Grounding (2026-11-13, a038066):
- Empty rounds: every brief-rN creates a round (tools/isswf-snapshot-core.mjs readJob, `rounds = briefRounds.map`).
- Attempt verdict always unknown: parseVerdict returns UNKNOWN for kind attempt; PILL_COLORS in hooks/register.tsx has no failure colour. Needs an agreed outcome field in Annn.md (define it in the template and the coordinator/host guides, EN only for factory resources, with docs mirrors where user guides change).
- Roles: parseRole knows worker/reviewer/researcher/planner; diagnostician missing. The coordinator did not write an attempt record for I0014/J001's researcher, so nothing showed.
- Touch detection: touchedIds in hooks/register.tsx matches record paths anywhere in Bash command text.

Acceptance: see plan. Checks: hooks/register.test.tsx, snapshot tests, check-docs, Linux+Windows CI; Pi sidebar parity is out of scope unless it reuses the snapshot change.
