# I0029: Literal pathspecs for pinned Git reads

Type: bug

## Objective and authority

Make every pinned Git read resolve requested paths literally and select the exact entry, so a path such as `:/x` is read exactly or refused, never substituted. Operator requested opening and triaging the report on 2026-11-03 ("Ok y haz luego el triage de los dos"); this plan records triage only.

## Triage summary

Reported in #180 from the independent review of #178. #178 already fixed reviewer, planner and diagnostic preparation. Remaining sites: `tools/pi-worker-task.mjs:75` and `tools/worker-lifecycle.mjs:130` take the first ls-tree entry (possible substitution); `tools/pi-worker-task.mjs:87` and `tools/isswf-job.mjs:36` match exact names; `tools/factory-package.mjs:476` uses factory-controlled names. The substitution risk is a hypothesis until reproduced through these tools. No duplicate found.

## J001

- Status: pending
- Objective: Read pinned paths literally and by exact entry name in the remaining worker tools (#180).
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None; triaged ready-for-agent.
- Next step: Reproduce the first-entry substitution with a committed ':/x' path, then set GIT_LITERAL_PATHSPECS in each git helper, select exact entries and extend tests/git-literal-pathspecs.mjs.

### Acceptance

- A committed path beginning with pathspec magic is read exactly or refused at every listed site, never substituted.
- tests/git-literal-pathspecs.mjs covers pi-worker-task, worker-lifecycle, isswf-job and factory-package.
- Existing worker and package tests still pass on Linux and Windows.

### Evidence

- None.
