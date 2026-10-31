# I0017: Explicit start before new dispatch

Type: enhancement

## J001

- Status: in-progress
- Objective: Resolve #123 by distinguishing design/brief approval from an explicit instruction to start execution.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None; operator explicitly requests implementing the next issue, identified as #123.
- Next step: One sequential native worker implements the bounded contract/test change; independent review and exact-head CI follow.

### Acceptance

- An option choice or brief approval alone never grants a new actor dispatch; explicit start evidence is checked before dispatch.
- Represent prepared, not started in existing plan fields and brief template without adding persisted statuses or a dispatcher.
- Preserve continuation under already explicit grants, in-budget corrections and narrower prepare-only/no-start restrictions.

### Evidence

- Current operator asks to do the next issue after #122/#129; prior ordered list identifies #123. Coordinator stated that selection before acting.
- Source base 2ab51f69dee933e5a3c95c3b69e497b76fa48804; issue observed OPEN and current ambiguous approval wording inspected.
