# I0066 J018 brief r1

- Size: S
- Authorization: coordinator under the I0066 standing grant; operator agreed on 2026-11-27 to fix the pane test harness before the remaining panel jobs.
- Objective and acceptance: [plan.md](../../plan.md) J018.
- Observation: on Claude Code 2.1.332, `claude plugin test .` fails 39 tests in `hooks/register.test.tsx`, in the primary checkout too, each with `test's fs.read hook was skipped: test: ENOENT`. The test engine's `fs.read` stub (`hooks/register.test.tsx:68`) throws `Error('ENOENT')` for files absent from its fixture.

## Method

- `isswf-debug`: confirm the cause before changing code (how the current host treats a throwing hook versus a not-found result; check the plugin test docs or host behavior). `isswf-tdd` not required: the 39 failing tests are the red evidence.
- Review: one reviewer, standards and spec.
- Risks: the fix must change only test scaffolding, not production hook behavior; do not mask real failures.
- Stop and report if the cause is a host bug that the test code cannot work around.
