# I0036: Practices adopted from unclebob/ub-mode

Type: enhancement

## Objective and authority

Adopt three low-cost practices from `unclebob/ub-mode` (HEAD 3da62bf3, 2026-11-02) and record two larger ones as future actions. Operator request 2026-11-08: "1 y 3 a futuro, 2,5,6 dale ya y sacamos release patch con /project-release". Feature-to-PR scope on branch `feat/ub-mode-practices`; release through the operator-invoked `/project-release`.

## Decisions

- confirmed by operator: implement "attack the premise" (2), the empty-return test check (5) and "build the lever" (6).
- confirmed by operator: project-declared numeric quality gates (1) and an optional refactor assignment (3) go to future actions, EN/ES.

## J001

- Status: pending
- Objective: Add the three practices to the shared methodology and record the two future actions.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: Worker dispatch.

### Acceptance

- After two failed fixes sharing one premise against the same check, the worker records that premise in its attempt record and challenges it or returns to the coordinator, before a third fix.
- TDD and review test-quality guidance reject a test that would still pass if every function under test returned nothing.
- Automation guidance requires one hand-done unit first and comparison of the tool's output against it.
- `docs/en/future-actions.md` and `docs/es/future-actions.md` record project-declared numeric quality gates and an optional refactor assignment, with source and cost/risk.
- check-docs, host-portability and the worker/methodology tests pass.
