## Plan proposal — J101

**Pinned inputs and base:** Brief `.factory/jobs/J101/brief-r1.md`, `spec.md`, and `plan.md` read with `git show` at input checkpoint `6cfbb7c100ff05b425ffa9792fe56ea4c53ebcdb`. The fixture’s `HEAD` is that same SHA on `main`; `git status --short --branch` showed no changes. The brief names `/tmp/isswf-profiles57-WRTbOy` as the exclusive checkout. Profile: frozen `planner.md` and `references/planning.md`.

**Objective:** Extend the sum CLI to optionally multiply while preserving default sum. Keep the work to `src/math.mjs`, `src/cli.mjs`, and `check.mjs`; no remote PR action.

**Observed grounding:** `sum(a, b)` is exported from `src/math.mjs`; `src/cli.mjs` currently accepts two positional operands and prints their sum. `check.mjs` asserts two sum cases. `node check.mjs` passed (“2 assertions pass”).

**Decision for coordinator:** The pinned inputs do not specify how users select multiplication. Recommend `--multiply` followed by the two operands; confirm or revise this interface before implementation.

**Functional unit and checkpoint**
1. **Add opt-in multiplication while preserving sum.** Export multiplication from `src/math.mjs`; make `src/cli.mjs` select it only when the agreed option is supplied, leaving the existing two-operand invocation as sum. Extend `check.mjs` to assert both operations through observable results.  
   **Acceptance:** default invocation still prints the sum; multiplication invocation prints the product; checks cover both.  
   **Dependency/unblock:** The CLI option contract must be approved by the coordinator before implementation. No other code dependency identified.  
   **Checkpoint:** One coherent commit on the target base after the vertical slice and checks pass.

**Delivery path:** Run `node check.mjs`, manually verify both CLI invocations, then conduct independent review against the exact candidate. Correct accepted findings and rerun affected checks and review before reporting. Optional local stack is unnecessary for this single slice; if split later, base each local change on the target SHA and recheck descendants if an ancestor changes. No remote operation is authorized.

**Missing-reference control:** `git show 6cfbb7c100ff05b425ffa9792fe56ea4c53ebcdb:.factory/jobs/J999/brief-r1.md` returned “path … does not exist.” **J999 is blocked**; do not substitute a latest brief.

**Evidence limits:** Only pinned text and the named source files were inspected; the only check run was the baseline `node check.mjs`. No implementation or feature verification was performed.
