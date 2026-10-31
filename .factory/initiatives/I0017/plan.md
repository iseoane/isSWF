# I0017: Explicit start before new dispatch

Type: enhancement

## J001

- Status: completed
- Objective: Resolve #123 by distinguishing design/brief approval from an explicit instruction to start execution.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None for implemented/source-reviewed scope; final PR CI and any integration remain separate delivery gates.
- Next step: Publish the source-verified unit, require exact-head CI, and integrate only under applicable LOW-risk approval; retain final remote observations on the PR.

### Acceptance

- An option choice or brief approval alone never grants a new actor dispatch; explicit start evidence is checked before dispatch.
- Represent prepared, not started in existing plan fields and brief template without adding persisted statuses or a dispatcher.
- Preserve continuation under already explicit grants, in-budget corrections and narrower prepare-only/no-start restrictions.

### Evidence

- Current operator asks to do the next issue after #122/#129; prior ordered list identifies #123. Coordinator stated that selection before acting.
- Source base 2ab51f69dee933e5a3c95c3b69e497b76fa48804; issue observed OPEN and current ambiguous approval wording inspected.

## Source completion evidence

Functional authorb201bfd and coordinator corrections3c4031e/7b19cc8 implement the stated acceptance. Independent Standards/Spec PASS onb2d554b and affected paragraph PASS on7b19cc8a7e122cd9fbdf833841d40d7e4171c040. Original full quality FAIL diagnostic-bundle-too-large retained; unchanged65536-byte cap satisfied by shortening text, not relaxing controls. Corrected full portable quality/ESLint/Knip/focal/docs/diff PASS. One author and two bounded independent reviews spent, no further review call granted. Completed denotes implementation/source verification, not a claim of PR publication, CI or merge; final delivery receipt is to be retained externally on the PR to avoid recursive record commits.
