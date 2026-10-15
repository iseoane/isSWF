## Plan proposal — J302

**Pinned inputs and authority**
- Trusted dispatch grants findings-only planning and the explicit planner route `openai-codex/gpt-6-luna` at high effort; no planner default was inferred.
- Input checkpoint: `74f5cd35a22594102f3fd5eb1815740146219a20`. Target base: the same SHA, as separate concepts. In the exclusive fixture `/tmp/isswf-e2e61-u76tcs`, `HEAD` matches; the worktree is clean.
- Read at the input checkpoint: `.factory/jobs/J302/brief-r1.md`, `.factory/jobs/J301/R001.md`, `.factory/jobs/J301/validation.md`, `spec.md`, `plan.md`, `sum.mjs`, `cli.mjs`, and `check.mjs`. Validation identifies the separate factory methodology checkpoint as `d5986363551e96710c0aa015a3f3b7969a8cd55e`.

**Outcome and scope**
Add the specified `--multiply a b` CLI behavior while preserving default two-operand sum. The flag and product behavior are settled; argument parsing is an implementation choice, not an operator question. Exclude invalid-input policy, packages, network, remote PRs, and runtime installation.

**One functional unit**
- **Scope:** `sum.mjs`, `cli.mjs`, `check.mjs`. Recommend keeping `sum`’s sum contract intact and dispatching the selected operation in the CLI.
- **Acceptance:** `node cli.mjs 7 3` prints `10`; `node cli.mjs --multiply 7 3` prints `21`; `node cli.mjs --multiply -2 3` prints `-6`.
- **Verification:** Extend `check.mjs` to exercise observable CLI behavior for all three cases; rerun the existing check and those CLI commands.
- **Dependency/unblock:** None.
- **Checkpoint:** One coherent candidate commit on the target base. Then independent review against that exact candidate; correct findings and rerun affected checks and review before delivery. No stack is needed.

**Observed checks and risk**
`node check.mjs` passes (`2 sum assertions pass`). The default CLI prints `10`; both multiply invocations currently print `NaN`. Invalid-input behavior remains out of scope. Operator product-acceptance recording remains coordinator-owned.

No files or code were changed; no review or implementation was performed. Coordinator should adopt or revise this proposal before implementation.
