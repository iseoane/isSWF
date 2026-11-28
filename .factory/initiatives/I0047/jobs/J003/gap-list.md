# I0047 J003 gap list

- Researcher run a71c2ff61264fb9a3 (haiku, high), read-only at checkpoint and base 75370d15f6f346f38bb0f19ca920893532b3437a. Source reading and grep only; nothing run.
- "Panel" is the loopback server `tools/isswf-panel.mjs`; "Claude pane" is `hooks/register.tsx`; "Pi widget" is `tools/isswf-initiatives-pi-extension.mjs`.

## Capabilities

| # | Capability | Panel | Claude pane | Pi widget | Gap |
|---|---|---|---|---|---|
| 1 | Access with no coordinator session or host setting | browser on 127.0.0.1 (isswf-panel.mjs:57-112) | opt-in, activation needed (register.tsx:871, 884, 904) | TUI, trusted, coordinator (extension:78) | LOST |
| 2 | Catalog with closed, unopened, absent and unsafe initiatives | yes (isswf-status.mjs:150-176) | pinned/touched and inactive; closed skipped (snapshot-core:235, 337) | started plus unopened count; closed skipped | LOST for closed, absent, unsafe |
| 3 | Counts for six states | yes (panel:54) | closed/total and open | blocked and open | PARTIAL |
| 4 | Blocker text | yes (panel:23, 54) | status only | count only | LOST |
| 5 | Next job with reason | yes, "suggestion, not authorization" (panel:16, 49; status:40-60) | no | next job id only | PARTIAL |
| 6 | Six-lane Kanban | yes (panel:38-43) | grouped list | no | LOST (layout) |
| 7 | Job detail: objective, dependencies, blocker, next step | yes (panel:17-23) | objective and status | no | PARTIAL |
| 8 | Acceptance as a list | yes (panel:24) | raw plan in Files tab | no | LOST as list |
| 9 | Dependencies | yes | no | no | LOST |
| 10 | Delivery card | yes (panel:25-26) | raw delivery.md in Files | no | LOST as card |
| 11 | Review rounds and verdicts | no | yes (register.tsx:425-459) | no | HOST-ONLY |
| 12 | Declared record metadata | yes (panel:31-32) | model, effort, verdict | no | PARTIAL |
| 13 | Methodology use per role | no | yes (register.tsx:1030-1098) | no | HOST-ONLY |
| 14 | Operator note capture and readback | yes, hash-bound form (panel:28-30, 69-86; isswf-response.mjs:39-50) | no input | no | LOST, the only writer |
| 15 | Provenance and freshness view | yes (panel:33-36, 47-49) | no | no | LOST as view; one initiative stays in status JSON |
| 16 | JSON over HTTP | /api/status (panel:88-94) | no | no | LOST for catalog; one initiative via `isswf-status.mjs --initiative` |
| 17 | Unreadable or unsafe plan with reasons | yes | parser code and line | "plan unreadable" | PARTIAL |
| 18 | Refresh | manual | after tool calls and 60 s | settle, tool results, 60 s | COVERED |
| 19-23 | Recent completed, Files view, pin, AutoWakeUp, Engram/CodeGraph | no | yes | no | HOST-ONLY |
| 24 | Summary under the editor | no | no | yes | PI-ONLY |

## Lost on removal

1. Browser access with no host session.
2. Closed and absent/unsafe initiatives in one catalog.
3. Blocker text.
4. Typed next-step reason (logic stays in tools/isswf-status.mjs).
5. Kanban lanes.
6. Acceptance, dependencies, next step and delivery card per job.
7. Operator note capture, the only writer of responses.
8. Provenance and freshness view.
9. JSON catalog over HTTP.
10. Six-state breakdown and declared metadata per report.

## Removal touch list

- Code: delete tools/isswf-panel.mjs; `recordResponse` in tools/isswf-response.mjs:39-50 becomes dead (`readResponses` stays for status); `initiatives()` in tools/isswf-status.mjs:150-176 keeps only a test caller; comment at tools/token-native-pi.mjs:125; regex token at tests/git-optional-locks.mjs:70.
- Tests: tests/initiative-panel.mjs; panel half of tests/initiative-next-action.mjs; tests/factory-tools-install.mjs:9, 20; tests/release-package.mjs:121; tests/bun-release.mjs:149.
- Packaging (person approval): tools/factory-package.mjs:121, tools/bun-release.mjs:6, tools/isswf.mjs:18. package.json and tools/build-release.mjs need no edit (glob). Existing pins keep the tool.
- Quality and CI: tools/check-quality.mjs:95, 142; tooling/quality/knip.json:25; .github/workflows/quality.yml:97-98.
- Docs en/es: architecture.md:27; operations.md:5, 19-23, 27, 356, 459; reference.md:243, 263, 272, 274; getting-started.md:51; index.md:12; installation.md:84; future-actions.md:17-19; README.md:34 and README.es.md:34. Root contracts: docs/durable-work.md:87, 91-101; docs/installation.md:150; docs/source-activation.md:53.
- Not affected: glossary, skills, agents, .agents, verification.json, hooks, Pi widget.
- Separate decision: Python prototype isswf/panel.py and tests/test_u1.py (not in CI).

## Inconsistencies found

- docs/durable-work.md:95 says the panel shows "Blockers and next action"; the panel renders seven sections without it.
- Two readers: status()/initiatives() for the panel, readSnapshot() for the pane and widget; they differ on closed initiatives.
- "Panel" names the Claude pane and the loopback server in docs/en/reference.md:235-243 and README.md:34-40.

## Unknown

- Whether anyone uses the note form or calls /api/status; no usage data.

## Operator decision (2026-11-28)

- Retire the panel and accept the loss of all ten capabilities listed above; one initiative's state stays available through `tools/isswf-status.mjs`.
- Also remove `recordResponse` (keep `readResponses`), the Python prototype `isswf/panel.py` with its tests in `tests/test_u1.py`, and the "fuller panel for Pi" proposal in future-actions and README (en/es).
- The removal's packaging edits (tools/factory-package.mjs, tools/bun-release.mjs, tools/isswf.mjs) are part of this decision.
