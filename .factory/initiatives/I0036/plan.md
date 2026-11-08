# I0036: Practices adopted from unclebob/ub-mode

Type: enhancement

## Objective and authority

Adopt three low-cost practices from `unclebob/ub-mode` (HEAD 3da62bf3, 2026-11-02) and record two larger ones as future actions. Operator request 2026-11-08: "1 y 3 a futuro, 2,5,6 dale ya y sacamos release patch con /project-release". Feature-to-PR scope on branch `feat/ub-mode-practices`; release through the operator-invoked `/project-release`.

## Decisions

- confirmed by operator (2026-11-08): methodology selection must be explicit and recorded now, not deferred ("esto es básico en la factoría"); resources stay optional.

- confirmed by operator: implement "attack the premise" (2), the empty-return test check (5) and "build the lever" (6).
- confirmed by operator: project-declared numeric quality gates (1) and an optional refactor assignment (3) go to future actions, EN/ES.

## J002

- Status: completed
- Objective: Make optional methodology selection a recorded decision: one trigger catalog, a brief line per triggered resource, reviewer check.
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None.
- Next step: Integration through the feature PR, then release through `/project-release`.

### Acceptance

- The coordinator has one compact trigger catalog for optional skills and references; vague triggers (verification principles) are concrete.
- The brief template records, for every resource whose trigger applies, selected or not selected with a one-line reason; resources stay optional.
- The reviewer reports, as a minor finding, a triggered resource that the brief neither selected nor declined.
- Existing tests and check-docs pass; no new mandatory method.

### Evidence

- Worker commits 2158f44 (coordinator trigger table and brief content item), fc2765b (job-brief `Methodology considered` field), 29e6713 (reviewer minor-finding rule), acadf97 (isswf-writing row), 8acc411 (worker.md links to the table), a33f4cb (review suggestions: interview bullet links to the table, E2E always-weigh restored), 752d4ed (table applies to every role; planner links to it). Attempt record [A001](jobs/J002/A001.md).
- Dogfood: this job's brief carries its own `Methodology considered` section; applying it exposed the missing isswf-writing row, now added.
- Checks pass on 752d4ed: worker-methodology, worker-method-evidence, host-portability, review-guidance, reviewer-task, diagnostic-task, planner-task, release-package, bun-release, check-docs, git diff --check (worker-reported).
- Independent semantic review round 1 (supplied diff a695b76..8acc411): Standards pass, Spec pass, no blocking findings; suggestions 1-2 applied in a33f4cb; suggestion 3 is the intended narrowing. Delta 8acc411..752d4ed inspected by the coordinator (mechanical; no further independent review).

## J001

- Status: completed
- Objective: Add the three practices to the shared methodology and record the two future actions.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: Integration through the feature PR, then release through `/project-release`.

### Acceptance

- After two failed fixes sharing one premise against the same check, the worker records that premise in its attempt record and challenges it or returns to the coordinator, before a third fix.
- TDD and review test-quality guidance reject a test that would still pass if every function under test returned nothing.
- Automation guidance requires one hand-done unit first and comparison of the tool's output against it.
- `docs/en/future-actions.md` and `docs/es/future-actions.md` record project-declared numeric quality gates and an optional refactor assignment, with source and cost/risk.
- check-docs, host-portability and the worker/methodology tests pass.

### Evidence

- Worker commits 398827e (attack the premise; the existing "Cause before patch" sentence was made stricter instead of duplicated), 0b19723 (empty-return check), 1a3b200 (build the lever), eafdbf9 (future actions EN/ES). Attempt record [A001](jobs/J001/A001.md).
- Worker-reported checks pass: check-docs, host-portability, worker-methodology, worker-method-evidence, review-guidance, reviewer-task, diagnostic-task (33065 of 98304 bytes free), documentation, release-package, bun-release, git diff --check.
- Independent semantic review round 1 (Agent-tool reviewer, supplied diff fef2d0a..eafdbf9): Standards pass, Spec pass, no blocking findings; the Spanish terminology suggestion was applied by the coordinator.
- Follow-up (operator request 2026-11-08): "build the lever" trigger also added to `worker.md` Execution step 3, because the worker always loads its role while `execution-principles.md` is conditional. Coordinator edit, one sentence; worker-methodology, worker-method-evidence, host-portability, diagnostic-task, check-docs and diff --check exit 0. No independent review for this sentence.
