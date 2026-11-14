# I0054: Initiatives pane review rounds and coordinator role

Type: enhancement

Operator feedback 2026-11-13 on the Claude Code initiatives pane (hooks/register.tsx, tools/isswf-snapshot-core.mjs), after I0053/J001: two reviews of one brief (round 1 changes requested, round 2 delta passed) were drawn in the same "R1", and an attempt written by the coordinator itself showed its ID instead of a role.

## J001

- Status: completed
- Objective: The pane distinguishes review rounds within a brief revision and labels attempts the coordinator writes itself as `coordinator`.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: None. I0054 stays open with J002 and J003.

### Acceptance

- Within one brief revision, records are grouped by review round, so a follow-up review of corrected work appears as a new round instead of sharing the first one; the grouping rule is documented and works for records that state no round.
- An attempt record whose profile is the coordinator acting as writer shows the role `coordinator`, and the coordinator guidance tells writers to state it in a form the pane recognises.
- The snapshot JSON contract (docs EN/ES `operations.md`) documents any new or changed field.

### Evidence

- 2026-11-13: started by the operator ("Adelante con I0054"); keep the initiative open after this job.
- 2026-11-13: I0053/J001 records A001 (coordinator writer), V001 (changes requested) and V002 (delta pass) all cite brief-r1 and were drawn as one round "R1 A001 reviewer reviewer".
- 2026-11-13: A001 complete at 8a58d93; bound reviews V001-V003 FAIL (fixed), V004 PASS (round 4 granted by the operator). Accepted under delegated acceptance (low risk).

## J002

- Status: completed
- Objective: The pane has two tabs: Initiatives (current view) and Agents, which lists for each agent of the session, including the coordinator, the skills and references it used and how many times.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- Two tabs at the top of the pane switch between Initiatives and Agents; the choice persists like the other pane state.
- Agents lists the coordinator (this session) and each delegated run, with per-skill and per-reference (`.agents/`) use counts; unknown usage stays "unknown".
- No model call or write; counts come from the session's own messages and the runs' transcripts already read for usage.

### Evidence

- 2026-11-13: operator request.
- 2026-11-13: started by the operator ("continua coordinador con el resto de jobs").
- 2026-11-13: A001 complete at 27ef323; bound reviews V001 PASS (two suggestions fixed), V002 PASS. Accepted under delegated acceptance (low risk).

## J003

- Status: completed
- Objective: An opt-in switch in the pane title schedules a resume of the coordinator's work 5 minutes after the five-hour usage window resets, when usage reached 90% or more while work was in progress.
- Depends on: J001
- Brief: [brief-r2.md](jobs/J003/brief-r2.md)
- Blocker: None.
- Next step: None.

### Acceptance

- A switch in the pane title, off by default, persisted in pane state.
- When on and the `five_hour` rate-limit window is at 90% or more while a coordinator job is in progress, one resume prompt is scheduled for `resetsAt` plus 5 minutes; it names the in-progress initiative and job and asks the coordinator to reconcile state before continuing. No duplicate schedules; switching off cancels it.
- The limit is documented: the schedule lives only while the Claude session stays open.
- r2: the switch reads `AutoWakeUp: sí|no (HH:MM)` with the would-be resume time whenever known.
- r2: the Agents tab counts only methodology a run used, draws nothing unused, and marks whether each role followed its profile (and the coordinator, when it writes, `roles/worker.md`); the record detail drops skill counts and pairs effort with model and cost with tokens. The usage JSON adds `usedSkills`/`usedReferences` (docs EN/ES).

### Evidence

- 2026-11-13: operator request (threshold 90%).
- 2026-11-13: started by the operator ("continua coordinador con el resto de jobs").
- 2026-11-14: operator additions during the job (switch wording, Agents readability and methodology-only counting, profile marks, compact record detail); recorded in brief-r2.
- 2026-11-14: the coordinator wrote J003 first without loading the worker methodology; the operator flagged the quality loss. It then loaded worker.md and the triggered references and reviewed the whole diff against them (A001).
- 2026-11-14: bound reviews V003 (r2 round 1, FAIL; fixed in A002) and V004 (round 2, PASS). PR #307 merged at 17f1e48 after Linux and Windows CI passed on c95943f. Accepted under delegated acceptance (low-medium risk, opt-in UI).

## J004

- Status: completed
- Objective: Selecting an initiative in the Initiatives tab opens a third pane with that initiative's file tree; selecting a file shows its contents below the tree, so plans, briefs and records can be read without leaving the CLI.
- Depends on: J003
- Brief: [brief-r1.md](jobs/J004/brief-r1.md)
- Blocker: None.
- Next step: None. I0054 stays open for further operator ideas.

### Acceptance

- Pressing an initiative's title opens (or retargets) a separate pane listing that initiative's directory as a tree (plan, jobs, briefs, records), collapsible by directory.
- Pressing a file shows it below the tree, Markdown rendered; pressing it again hides it. Only files under that initiative's records directory can be shown.
- Documented in docs EN/ES `installation.md`; tests cover tree, open/close and the path boundary.

### Evidence

- 2026-11-14: operator request; started by the operator ("y ya pasamos al nuevo job") once J003 merged.
- 2026-11-14: open point from the J003 screenshots: a malformed plan field makes the whole card "plan no legible" without naming the field.
- 2026-11-14: A001 at eeb49fb; bound review V001 FAIL (fold showed a false "cannot be read"; CRLF; 4 MiB), fixed in A002 at 8e2e8e9; V002 PASS; docs-only R2-1 wording applied at bec5147. PR #309 merged at e76bf27 after Linux and Windows CI passed on bec5147. Accepted under delegated acceptance (low risk).

## J005

- Status: awaiting-human
- Objective: When a plan cannot be parsed, the pane and isswf-status say which job, field and line broke it instead of only "plan unreadable".
- Depends on: J004
- Brief: [brief-r1.md](jobs/J005/brief-r1.md)
- Blocker: Operator acceptance: the operator wants to try the pane (file tree, rounds, Agents, plan-error detail) before closing.
- Next step: Operator tries the pane on I0054; on acceptance mark J005 completed. Findings become corrections in J005 or new jobs.

### Acceptance

- Plan parser errors keep their current messages and also carry the job, field and 1-based line when they apply.
- The snapshot JSON gives an unparsed initiative a `planError` with that code, job, field and line; `isswf-status` reports the same for an invalid plan. Documented in docs EN/ES `operations.md`.
- The pane's card shows the detail, for example `plan no legible: J003 · Brief, línea 54 (unsafe-brief-reference)`.

### Evidence

- 2026-11-14: found while preparing J004 (a note after the `Brief:` link made I0054 "plan no legible" with no detail); started by the operator ("Aplica esa mejora").
- 2026-11-14: A001 at 3ee8cde; V001 PASS with S1/S2, fixed in A002 at 24df4d1; V002 PASS (I4 known limit). PR #311 merged at a5acce5 after Linux and Windows CI passed on 24df4d1. Accepted under delegated acceptance (low risk).
- 2026-11-14: reopened to awaiting-human at the operator's request: delegated acceptance withdrawn for J005 until the operator has tried the pane ("con la prueba lo cerramos").

## J006

- Status: awaiting-human
- Objective: The initiative file tree is a third tab, Files, beside Initiatives and Agents in the same pane, instead of a separate pane.
- Depends on: J004
- Brief: [brief-r1.md](jobs/J006/brief-r1.md)
- Blocker: Operator acceptance: the operator wants to try the Files tab in the pane before closing.
- Next step: Operator tries the Files tab and the one-open rules on I0054; on acceptance mark J006 completed.

### Acceptance

- The pane has three tabs: Initiatives, Agents and Files. Selecting an initiative card's title switches to Files showing that initiative's tree; Files without a selection lists the visible initiatives to choose from.
- The separate file-tree pane is gone; tree behaviour (fold, open/close file, boundary, limits) is unchanged.
- Docs EN/ES `installation.md` updated; tests cover the tab switch and the chooser.
- Only one completed job is unfolded at a time, and one record detail is open at a time; jobs that are not completed always show their rounds.
- A record's detail lists only what it states (model, effort, verdict, usage); a record with none of these is not selectable.

### Evidence

- 2026-11-14: A001 at bfd0bbd (base ad63815); V001 PASS with S1-S3, fixed in A002 at ab735cb (with 9563964); V002 delta PASS. PR #314 merged at eab8e1f after Linux and Windows CI passed on ab735cb. Awaiting the operator's try.

- 2026-11-14: operator additions while trying the pane: one open detail and one unfolded completed job at a time (two in-progress jobs both stay open); coordinator records reduced to known facts, not selectable when empty.
- 2026-11-14: operator feedback while trying J004/J005 ("lo quería como otro panel al lado de iniciativas y agentes"); started by that request.

## J007

- Status: completed
- Objective: One tool prepares and launches a Claude bound review from the approved preset and the candidate's real parent, and turns its trace into checked record lines, so a review cannot start at the wrong model, effort or base.
- Depends on: None
- Brief: [brief-r1.md](jobs/J007/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- `prepare` writes the three binding namespaces for a primary clone: base is the merge-base of the candidate with the main ref unless `--base` (delta) is given; content paths are the changed files plus the supplied plan, brief and policy files; repository and Git are canonical realpaths. It refuses a linked worktree, a base equal to the candidate, or a candidate missing from the clone.
- `launch` takes model and effort from the reviewer row of the shipped portable preset unless the operator passes both explicitly, runs `claude -p` with the bindings and `MAX_MCP_OUTPUT_TOKENS=100000` only in that child process (no shell), task on standard input, trace to a file; works the same on Linux and Windows.
- `record` reads a trace and prints the `Run:` line, the requested model and effort, whether every diff chunk was fetched, and the final report; a missing or error result is reported incomplete.
- Tests cover base selection, refusals, preset reading and trace parsing with a fake `claude`; the Claude launch reference names the tool.

### Evidence

- 2026-11-14: A001 at bff97ce (base 309ed7f); V001 PASS (S1, S2, I1 fixed in A002 a731e98; S3 known limit); V002 FAIL (B1: A002 claimed tests a stopped command had lost); A003 b7f7565 added them; V003 PASS (I4 known limit). All three reviews launched with the new tool at the preset opus/medium. Operator approved integrating the workflow and host-guide changes ("por lo demas autorizo"). PR #316 merged at 7ca6801 after Linux and Windows CI passed on b7f7565.

- 2026-11-14: proposed after review launches at the wrong effort (high instead of the preset's medium) and a wrong J006 base cost operator quota ("estos fallos cuestan dinero"); started by the operator ("adelante con la 007").

## J008

- Status: awaiting-human
- Objective: Under the pane title and before the tabs, one row shows whether Engram and CodeGraph are available in this session, with a coloured status dot and the command to run when CodeGraph has no index.
- Depends on: J006
- Brief: [brief-r1.md](jobs/J008/brief-r1.md)
- Blocker: Operator acceptance: the operator tries the status row in the pane before closing.
- Next step: Operator tries the row on this repository; on acceptance mark J008 completed.

### Acceptance

- The row reads `🧠 engram ●` and `🗺 codegraph ●`: icon, name, status dot in the theme's success, warning or error colour.
- Engram: green when its MCP tools are in the session, red otherwise. CodeGraph: green when `.codegraph/` exists in the project and its MCP tools are in the session; yellow when the index exists but the tools are not; red with the hint `codegraph init` when there is no `.codegraph/`.
- Read-only: the pane lists tools and checks a path; it never connects a server, calls a tool or runs a command.
- Labels in English and Spanish; tests cover the three CodeGraph states and both Engram states; docs EN/ES `installation.md` updated.

### Evidence

- 2026-11-14: A001 at 35fb08c (base 35c05e0); V001 PASS (S1, I1 accepted), launched with tools/isswf-review-launch.mjs at the preset. PR #319 merged at c198268 after Linux and Windows CI passed on 35fb08c. Awaiting the operator's try.

- 2026-11-14: operator request while trying the pane ("igual ponemos lo de engram y codegraph debajo del titulo y antes de las tabs"; "codegraph OK / parcial / no init y la pelotita podria ser verde, amarilla o roja"; brain for Engram; "icono nombre pelota del estado"); merge authorised ("tiene mi autorizacion para mergearlo en main"). Coordinator defaults the operator did not overrule: 🗺 for CodeGraph and a hint, not a button; no age threshold, because the index file only changes when there is something to index.
