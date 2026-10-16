# Local worker lifecycle runner

`tools/worker-lifecycle.mjs` is a small Linux/Node local-process runner. It is not an authorization service, sandbox, model adapter, queue, watchdog, or recovery daemon. A trusted caller must independently decide whether a launch is authorized. The `--grant-ref` value is recorded evidence only; the program does not interpret it or grant permission from it.

## Launch

The caller selects the task script as trusted local code, snapshots and hashes it outside the materialized project workspace, and supplies every input explicitly. Example (replace the placeholders with verified local paths and full lowercase Git SHAs):

```sh
node tools/worker-lifecycle.mjs launch \
  --repo /absolute/path/to/local-git-repository \
  --input-sha 0123456789abcdef0123456789abcdef01234567 \
  --brief .factory/jobs/J601/brief-r1.md \
  --target-base 89abcdef0123456789abcdef0123456789abcdef \
  --attempt-id J601-r1-a1 \
  --runs-store /absolute/path/to/private-runs-store \
  --grant-ref operator-record-identifier \
  --task-script /absolute/path/to/trusted-task.mjs \
  --timeout-ms 30000 \
  --output-bytes 16384
```

`--repo`, `--runs-store`, and `--task-script` must be absolute paths; the brief is repository-relative. `--input-sha` pins the committed regular-file brief. `--target-base` pins the committed project tree used for the fresh workspace; neither SHA is inferred from a grant, branch name, or mutable checkout. The local Git repository must already contain both commits. The runner uses local Git object reads only (`ls-tree`, `cat-file`); it does not fetch, write Git metadata, export the repository's history, or accept a caller-selected checkout path. Only committed regular files are materialized. The derived workspace lives at `<runs-store>/<attempt-id>/workspace`; it is not a Git checkpoint.

The attempt directory is claimed with exclusive creation before dispatch. The copied task script and immutable `dispatch.json` are stored there. A detached Node execution host publishes `owner.json`, creates the workspace and runs the task with that workspace path as its sole argument. The host passes a small fixed environment, captures at most `output-bytes` of each output stream, and enforces a 100–120000 ms deadline. Captured output is a UTF-8-safe tail; when bytes are omitted, the stream begins with an explicit `[...truncated...]` marker, included within the byte bound. At the deadline the owner signals its child process group with `SIGTERM`, escalates to `SIGKILL` after 250 ms regardless of the leader's exit state, then allows a bounded 250 ms close grace. If pipes remain open, it closes capture and publishes `captureIncomplete: true` with `descendants: "uncertain"`; this does not claim every descendant died or that execution succeeded. The trusted script itself is executable code and can access the host user's permissions; this runner does not sandbox it. Its selection and integrity are the caller's responsibility. Never point it at project-controlled code without an independent trust decision.

Do not place credentials in task arguments or output. The runner does not serialize inherited environment variables into metadata or logs. Local process execution is not a security boundary against a hostile task.

## Observe and reconcile

```sh
node tools/worker-lifecycle.mjs read --runs-store /absolute/path/to/private-runs-store --attempt-id J601-r1-a1
node tools/worker-lifecycle.mjs reconcile --runs-store /absolute/path/to/private-runs-store --attempt-id J601-r1-a1
```

Both commands are read-only aliases. They report `running` only when Linux boot ID, a positive integer PID, process start ticks, executable and a 48-character lowercase hexadecimal nonce as an exact process-argument element match the recorded owner. A valid write-once terminal record reports `terminal`; missing, torn, corrupt or mismatched evidence reports `unknown`. Readers never signal, rerun, repair claims, free an attempt ID, or rewrite worker output. Same-ID launches fail closed whether the original attempt is live, terminal or unknown. A distinct ID gets a different derived workspace.

The host alone writes process-lifecycle metadata. A terminal record is write-once and records success, nonzero failure, or timeout, plus per-stream truncation and whether capture was forcibly closed with descendant state uncertain; an A001 report is optional and is not a precondition for failure publication. Task changes and any A001 report remain task-owned. Product acceptance remains coordinator-owned. If the execution host dies while its task child may still run, observation is `unknown`; partial files are preserved. Do not kill a PID discovered by a fresh reader or assume that an absent host proves its child ceased. Any signal used for deadline enforcement is sent only by the live owner to its own child process group.

A failed or unknown attempt is never resumed or re-executed under the same ID. Inspect partial work and actual process evidence; a coordinator may explicitly authorize a new distinct attempt. There is no automatic retry, general watchdog, exact-once side-effect guarantee, power-loss guarantee, non-Linux identity support, or proof from this generic runner of Pi RPC, interactive-chat, or native-coordinator teardown. The deterministic verifier proves only bounded local process lifecycle mechanics. Run it with an explicit fixture JSON path when the fixture is outside the checkout, for example `node .audit/verify-lifecycle-44.mjs /absolute/path/to/lifecycle-44-fixture.json`; it otherwise reads `.audit/lifecycle-44-fixture.json` from this checkout. It creates its disposable test data under a uniquely named `isSWF-lifecycle44-*` temporary directory.

## Pi task snapshot

`tools/pi-worker-task.mjs prepare --config /absolute/trusted.json --output /absolute/nonexistent-task.mjs` creates a self-contained task snapshot for the existing runner. The trusted config pins the Pi SDK and Node paths, opaque host auth-file path, baseline Git profile/reference map, a brief object `{ "repo": "/absolute/local/repository", "inputSha": "<full-lowercase-commit-sha>", "path": ".factory/jobs/J601/brief.md" }`, mode (`offline` or explicitly authorized `real`), protected check command, and expected mutable paths. Preparation reads methodology and exact brief bytes from the pinned local Git objects, requires a committed regular-file brief of 1–32,000 bytes, and emits `briefPath`, `inputSha`, and `briefSha256` in preparation metadata and the safe task result; subsequent task execution does not reread that config or checkout. Pass the generated script to `worker-lifecycle.mjs launch` as `--task-script`, with the usual 120000 ms outer timeout. Offline mode validates SDK/session/tool setup without a provider prompt. Real mode requests only `openai-codex/gpt-6-luna` at `high`, with a 12-tool-call cap and 110-second inner deadline; process completion is not product acceptance. For a coordinator native path, require explicit transport authorization and the source checkout, CLI, initialized SDK, and nested bwrap prerequisites. Pin the canonical model config SHA/full worker route, job input SHA, target-base SHA, and methodology SHA separately. Read inputs from Git; referenced brief inputs must exist in the target base with identical blob OIDs at the input checkpoint, or this path is blocked. Use the existing prepare, launch, read, and reconcile CLIs. Verify fresh attempt-directory absence before using a new ID, then rely on the runner atomic claim; unknown is not fresh. Reconcile running, unknown, or partial work and remaining TOTAL actor grant before replacement; terminal status does not authorize another actor. Match prepared brief identity to dispatch. A saved report is not liveness, and process success is not coordinator/product acceptance. Pstack is optional only on explicit grant, never a native prerequisite or silent fallback. This narrow integration is not a general sandbox, authorization service, coordinator, recovery mechanism, or client-readiness guarantee; its real-run verification confirms teardown of the isolated initiating Pi RPC, not of the main interactive chat or native coordinator (see `.audit/verify-pi-worker-44.mjs` for the trusted config example).
