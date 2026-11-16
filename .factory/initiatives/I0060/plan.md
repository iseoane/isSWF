# I0060: Handoff coverage counts every review of a job

Type: bug

On 2026-11-16, during I0059, `node tools/isswf-handoff.mjs coverage` failed with `unreviewed-commits` for commit 20331c0, although J002 V001 had reviewed it (base 6d6b4f4, candidate 20331c0). The tool only reads each job's latest review (`tools/isswf-handoff.mjs:139-147`). A delta review that starts after an earlier reviewed range therefore leaves that range uncovered. The coordinator override cannot excuse it either, because it only covers documentation-only commits (`tools/isswf-handoff-core.mjs:116-124`). The operator approved an extra full-range review (J002 V003) to get past it and asked for this initiative.

## J001

- Status: pending
- Size: S (one flow: how coverage collects reviewed ranges)
- Scope: factory (`tools/isswf-handoff.mjs`, used by `check-quality` and CI in target projects).
- Objective: A commit is covered when it lies in the base..candidate range of any passing review of its job, not only the latest one, so delta review rounds do not force a full-range re-review.
- Depends on: None
- Brief: pending
- Blocker: None.
- Next step: Decide which earlier reviews count (for example, only those whose verdict is pass or pass-with-notes, or any review followed by a passing delta that chains to it), then prepare the brief. Do not dispatch until the operator gives an explicit start.

### Acceptance

- A job whose reviews are V001 (base A, candidate B) and a delta V002 (base B, candidate C) covers every commit in A..C.
- A commit reviewed only by a failing review whose range is not chained to a later passing review stays uncovered, so a failed round cannot hide unreviewed code.
- Existing coverage tests still pass; new tests cover the chained-delta case and the failed-review case.
- The coverage section of the operations guide (English and Spanish) describes the rule.

### Evidence

- 2026-11-16: I0059 branch `feat/i0059-team-guard`, `coverage` output: `"uncovered":[{"commit":"20331c0…","paths":[".agents/hosts/claude-code-review-launch.md",".claude-plugin/plugin.json","tests/host-portability.mjs"]}]` for both J001 V002 and J002 V002.
- Workaround used: J002 V003, a full-range review approved by the operator.
