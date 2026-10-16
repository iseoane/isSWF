# Lifecycle-44 local runner implementation brief

## Candidate identity and scope

- **Actual checkout base Git SHA:** `f1316072c5447e857fe16caa4804990ac8e6d741`.
- **Candidate status:** uncommitted; no candidate commit or would-be commit is claimed. A parent-side frozen-packet/replay gate must establish the eventual Git binding.
- **Executable bytes:** `tools/worker-lifecycle.mjs` SHA-256 `9715aada25f79fac4dbf44b83f692206232c3418e644718aacfa6bfef9bb82d9`.
- **Verifier bytes:** `.audit/verify-lifecycle-44.mjs` SHA-256 `96cbc4eb27b5367acd9b61ef1356877d198d11f0368c1e88647c4e0bda1ca534`.
- **Only intended changed paths:** `tools/worker-lifecycle.mjs`, `docs/local-worker-lifecycle.md`, `.audit/verify-lifecycle-44.mjs`, `.audit/lifecycle-44-build-brief.md`.
- **Parent fixture:** read only; not modified. The verifier copies its committed tree into a unique `/tmp/isswf-lifecycle44-*` directory and leaves that private copy for inspection. It creates no Git commits or remotes.

## Implemented contract

The CLI has explicit `launch`, `read`, and `reconcile` surfaces. Launch requires a local Git repository, full document-input SHA, committed regular brief path, separate full target-base SHA, never-reused attempt ID, absolute run store, grant reference, absolute trusted Node task script, timeout and output bound. A grant string is recorded, never treated as permission. It rejects unknown options.

An exclusive attempt directory receives immutable dispatch and byte-copied/hash-pinned lifecycle and task programs. The detached host executes the copied lifecycle bytes, materializes committed regular blobs locally from the target base into the attempt-derived workspace, and runs the selected task as an owned subprocess with bounded output and a deadline. No caller checkout path is accepted. Reads are read-only. Linux boot ID, PID, process start ticks, executable and nonce are rechecked on every owner observation. Terminal publication is atomic/write-once and does not require an A001. Unknown state never releases or retries an ID; a killed host with a potentially-live task leaves partial work untouched.

This is a local trusted-code process runner, not a sandbox or authorization service. It does not implement a native Pi/model worker, general watchdog, process-tree recovery, chat teardown proof, multi-platform identity, or exactly-once effects. A deterministic task result does not establish product acceptance.

## Observed verification

Command run against the current uncommitted candidate:

```text
node --check tools/worker-lifecycle.mjs
node --check .audit/verify-lifecycle-44.mjs
node .audit/verify-lifecycle-44.mjs
```

All commands exited successfully. The verifier reported `PASS` from its private copy at `/tmp/isswf-lifecycle44-2yU9jG/project`, copied from parent fixture `/tmp/isswf-lifecycle44-project-Xe19TZ`; both fixture input checkpoint and target base were the existing SHA `98d1bce6baa7e4aca53fba3311d16d68f706574c`. The verifier created no commit and changed no parent-fixture bytes. Observed assertions:

- Parent-pinned J601 arithmetic baseline failed as expected with product `11 !== 21`; the trusted task corrected the materialized workspace and the actual check printed `PASS two sum and three product assertions`.
- The launcher CLI exited before delayed task completion; a subsequent fresh read/reconcile observed terminal output. Repeated launch was rejected after live and terminal states.
- Nonzero exit `7` published failure without A001; deadline published timeout; task output stayed within the explicit per-stream byte bound.
- Different IDs produced distinct attempt-derived workspaces.
- Torn dispatch, corrupt terminal, and mismatched identity stayed unknown and could not be relaunched under those IDs.
- Killing the verifier-owned execution host after verifying its boot ID, start ticks, executable, and nonce left the child to cease naturally; the reader stayed unknown, partial work remained byte-readable, and same-ID relaunch was rejected.
- Unknown CLI options were refused.

The test is an independent Node-process lifecycle fixture. It does **not** claim actual Pi child-session teardown or native-worker behavior. The parent has separately reported an upgraded offline Pi RPC feasibility result; it is parent evidence only, does not change this candidate's scope, and was not rerun or edited here.

## Review and next gate

No self-review or independent review PASS is claimed. Parent inspection, exact-byte freeze, fresh independent review, and committed-source replay remain pending. Do not broaden this four-path candidate or infer coordinator acceptance from these process checks.
