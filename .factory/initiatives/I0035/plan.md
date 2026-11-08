# I0035: Claude Code native delegation hygiene from the 2026-11-06 session

Type: maintenance

## Objective and authority

Triage and implement issues #237, #238 and #239, reported from the 2026-11-06 Windows Claude Code session. Operator requests 2026-11-08: "haz triage"; then "adelante con la implementacion de 237, 238 a y ok a la implementacion y 239 tambien"; then "si es de riesgo bajo integra, y luego saca release patch". Branch `feat/i0035-delegation-hygiene`; feature PR, exact-head CI and merge if low risk.

## Decisions

- confirmed by operator: #237 is the priority.
- confirmed by operator: #238 option (a), every worker writes its report to a durable attempt record; the existing `A<nnn>.md` name from `docs/durable-work.md` is reused instead of `attempt-<n>.md`.
- J001 choice: keep the git-evidence tools in `agents/isswf-reviewer.md`, because the bound `claude -p --agent isswf:isswf-reviewer` launch uses that profile; an Agent-tool reviewer gets the documented not-bound result and reviews the exact diff supplied in its handoff.
- J003 Pi assessment: the bounded-wait and stop-own-background-work rules reach Pi workers through the shared worker role. The Pi host guide exposes no "child stopped with background work still running" notice, and `pi.md` already states that Pi does not guarantee descendant process cessation, so no Pi coordinator note was added.
- Parallel writers were not used: Claude per-child checkout binding is unverified and J002/J003 edit the same files.
- The auto-mode classifier returned "no verdict" for worker and coordinator writes four times, including with an `Edit(/home/iseoane/Work/isSWF/**)` allow rule; the operator resolved it by changing the permission mode.

## J001

- Status: completed
- Objective: Agent-tool reviewers must not be offered git-evidence tools that can only fail unbound (#237).
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: Integration through the feature PR.

### Acceptance

- See the prepared brief.

### Evidence

- RED 89b9d55, GREEN 8167284, host guide 2d60697; review correction d9ded4c (not-bound text only when no binding was supplied; the tightened partial-binding test failed on the old code). Attempt records [A001](jobs/J001/A001.md), [A002](jobs/J001/A002.md).
- Coordinator rerun at 2d60697: git-evidence-mcp, host-portability, check-docs and diff --check exit 0. Windows substitution of an unset variable is unobserved; both empty and literal placeholder are handled.

## J002

- Status: completed
- Objective: A continued Claude child's correction report reaches the coordinator even when a second hand-back is refused (#238).
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None.
- Next step: Integration through the feature PR.

### Acceptance

- See the prepared brief.

### Evidence

- 2b6160f and review correction 3a0e325 (template, primary-checkout location, snapshot exclusion, Pi complement).
- Documented reproduction: after a `SendMessage` continuation of the J001 worker, its report arrived in [A001](jobs/J001/A001.md) and the coordinator read it; a later worker wrote [A002](jobs/J001/A002.md). A host refusal of a second hand-back was not observed in this session, so the refusal case is covered by design, not by an observed refusal.

## J003

- Status: completed
- Objective: Native workers leave no background shells or waiters running after hand-back (#239).
- Depends on: None
- Brief: [brief-r1.md](jobs/J003/brief-r1.md)
- Blocker: None.
- Next step: Integration through the feature PR.

### Acceptance

- See the prepared brief.

### Evidence

- 2b6160f: worker role bounded waits and background cleanup; Claude host guide coordinator action. Pi assessment recorded under Decisions. Every worker in this initiative reported no background task left running.
- Independent review round 1 (Agent-tool reviewer, supplied diff 59e761b..2d60697): no blocking findings; M1-M3 resolved in this plan, m1-m4 and s1 resolved in d9ded4c and 3a0e325.
