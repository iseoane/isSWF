# Local worker lifecycle runner

`tools/worker-lifecycle.mjs` is a small Linux/Node local-process runner. It is not an authorization service, sandbox, model adapter, queue, watchdog, or recovery daemon. A trusted caller must independently decide whether a launch is authorized. The `--grant-ref` value is recorded evidence only; the program does not interpret it or grant permission from it.

## Run a job from an activated project

Use `tools/isswf-job.mjs` from the fixed source checkout after [project activation](activacion-por-proyecto.md). This entry point connects the activated resource package to the existing task preparer and lifecycle runner. It does not start a coordinator model. A human or the user-invoked coordinator skill remains responsible for the grant, exclusive job ownership, and independent review.

Commit a trusted job JSON and a brief in the target project. Review every command and writable path before authorizing a run. A minimal job has this shape:

```json
{
  "version": 1,
  "runtimeSha": "<full SHA of the activated package and runtime source>",
  "targetBase": "<full SHA of the project workspace baseline>",
  "methodologySha": "37a56ebc902e94f21fc10666f33fceac44946af7",
  "exclusiveAttempt": true,
  "workerTotal": 1,
  "models": {
    "sha": "<full project commit containing the model configuration>",
    "path": ".factory/models.json",
    "sha256": "<SHA-256 of those exact committed config bytes>"
  },
  "briefPath": ".factory/jobs/J801/brief.md",
  "referencedInputs": ["tools/example.mjs", "check.mjs"],
  "expectedMutablePaths": ["tools/example.mjs"],
  "protectedCheckCommand": "node check.mjs"
}
```

The model configuration must select exactly `openai-codex/gpt-6-luna` at `high` for the worker, with no fallback. The input checkpoint, target base, runtime/package revision, model-config checkpoint, and methodology revision have different meanings. Referenced inputs must have identical committed bytes at the input checkpoint and target base. The brief is read at the input checkpoint, not from the working tree. The four runtime files must match their Git blobs at `runtimeSha`; unrelated later commits do not change that identity. Exactly one local isSWF package declaration must exist, and it must be an absolute, string-form declaration matching that revision; its complete receipt/payload is verified. Relative local declarations are resolved from `.pi/settings.json`; home-relative paths and `file://` URLs are also normalized and counted, rather than silently bypassing this check. Nonlocal declarations explicitly naming this factory are refused as ambiguous; unrelated remote packages are not fetched or inspected.

The entry uses the Node executable that invoked it. It locates an existing SDK through `PI_MANAGED_INSTALL_ROOT` only when supplied by the actual managed Pi launcher, reads its validated `current-version`, and verifies the release package identity. This is a managed-install convention, not a general Pi environment API. Other installations must provide an absolute `sdkPath` in the trusted job JSON. The opaque host auth path defaults to `auth.json` under Pi's `PI_CODING_AGENT_DIR`, or `~/.pi/agent`; an explicit absolute `authPath` overrides it. No credentials are copied into the sandbox or printed. No dependencies or global settings are installed or changed.

```sh
node /absolute/fixed-isSWF/tools/isswf-job.mjs run \
  --project /absolute/project \
  --input-sha <full-commit-containing-job-and-brief> \
  --job .factory/jobs/J801/job.json \
  --runs-store /absolute/operator-owned/private-runs-store \
  --attempt-id J801-A001 \
  --grant-ref operator-approval-reference

node /absolute/fixed-isSWF/tools/isswf-job.mjs read \
  --runs-store /absolute/operator-owned/private-runs-store --attempt-id J801-A001
```

The runs store must be outside both the project and runtime source trees. The entry creates the task/config snapshot there itself; callers do not prepare a temporary task or use an audit harness. It returns after dispatch. Consult `read` or its read-only alias `reconcile` later, even after the initiating session has gone. The entry publishes `<runs-store>/<attempt-id>.job.json` with input/config/runtime bindings before dispatch, using exclusive creation. The attempt directory contains the usual lifecycle records and safe `pi-result.json`. `read` and `reconcile` require the binding to match the dispatch's repository, input, base, brief, task hash, grant, and attempt identity; missing or inconsistent evidence reports `unknown`. Preparation artifacts are preserved in `.prepare-*` directories. Same-ID repeats refuse when either the attempt or its binding already exists, including a crash after binding publication but before dispatch; an unknown state never permits automatic replacement. A different attempt ID does not establish exclusive ownership of the same job. The caller must verify that precondition externally.

`reviewRequired: true` is always reported. A terminal process success is not product acceptance, and no result is automatically merged or copied into the target checkout. Independently review the exact changed workspace bytes and protected checks before delivery. Failure may leave preparation or partial attempt records; inspect them rather than retrying blindly. To run reproducible no-provider controls, pass `--mode offline` with explicitly trusted `offlineChecks` in the job. This exercises the same preparation/dispatch path but is not model proof. Run `node .audit/verify-operational-44.mjs` for the disposable offline regression suite; normal job use does not depend on that test file.

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

The host also publishes write-once `execution-child.json` after spawning the task. For attempts without a terminal record, readers expose a separate `executionChild` observation: `live` requires the recorded boot ID, PID, start ticks, executable and process group to match; `not-live` means only the direct child is absent or a zombie. Both leave descendant cessation unproven. Missing, corrupt, mismatched or pre-publication identity evidence remains `unknown`; older attempts without this record retain their previous blocking behavior. An absent host still makes the overall attempt `unknown`, even when its direct child is positively observed. This record neither authorizes replacement nor closes general recovery: the spawn-to-publication crash window and unrecorded descendants remain unresolved. Run `node .audit/verify-recovery-68-host-loss.mjs` for the disposable host-loss regression; it uses no provider.

The host alone writes process-lifecycle metadata. A terminal record is write-once and records success, nonzero failure, or timeout, plus per-stream truncation and whether capture was forcibly closed with descendant state uncertain; an A001 report is optional and is not a precondition for failure publication. Task changes and any A001 report remain task-owned. Product acceptance remains coordinator-owned. If the execution host dies while its task child may still run, observation is `unknown`; partial files are preserved. Do not kill a PID discovered by a fresh reader or assume that an absent host proves its child ceased. Any signal used for deadline enforcement is sent only by the live owner to its own child process group.

A failed or unknown attempt is never resumed or re-executed under the same ID. Inspect partial work and actual process evidence; a coordinator may explicitly authorize a new distinct attempt. There is no automatic retry, general watchdog, exact-once side-effect guarantee, power-loss guarantee, non-Linux identity support, or proof from this generic runner of Pi RPC, interactive-chat, or native-coordinator teardown. The deterministic verifier proves only bounded local process lifecycle mechanics. Run it with an explicit fixture JSON path when the fixture is outside the checkout, for example `node .audit/verify-lifecycle-44.mjs /absolute/path/to/lifecycle-44-fixture.json`; it otherwise reads `.audit/lifecycle-44-fixture.json` from this checkout. It creates its disposable test data under a uniquely named `isSWF-lifecycle44-*` temporary directory.

## Pi task snapshot

`tools/pi-worker-task.mjs prepare --config /absolute/trusted.json --output /absolute/nonexistent-task.mjs` creates a self-contained task snapshot for the existing runner. The trusted config pins the Pi SDK and Node paths, opaque host auth-file path, baseline Git profile/reference map, a brief object `{ "repo": "/absolute/local/repository", "inputSha": "<full-lowercase-commit-sha>", "path": ".factory/jobs/J601/brief.md" }`, mode (`offline` or explicitly authorized `real`), protected check command, and expected mutable paths. Preparation reads methodology and exact brief bytes from the pinned local Git objects, requires a committed regular-file brief of 1–32,000 bytes, and emits `briefPath`, `inputSha`, and `briefSha256` in preparation metadata and the safe task result; subsequent task execution does not reread that config or checkout. Pass the generated script to `worker-lifecycle.mjs launch` as `--task-script`, with the usual 120000 ms outer timeout. Offline mode validates SDK/session/tool setup without a provider prompt. Real mode requests only `openai-codex/gpt-6-luna` at `high`, with a 12-tool-call cap and 110-second inner deadline; process completion is not product acceptance. The coordinator's [dispatch instructions](../.agents/skills/isswf-coordinator/SKILL.md#5-decide-si-puedes-despachar) define transport authorization, separate revision pins, input availability, and actor-budget reconciliation. The adapter prepares only the pinned worker route, not other roles. The caller must match its emitted brief identity to the lifecycle dispatch; neither CLI authorizes work or validates the caller's grant. Legacy free-form `briefText` is rejected. This narrow integration is not a general sandbox, authorization service, coordinator, recovery mechanism, or client-readiness guarantee; its real-run verification confirms teardown of the isolated initiating Pi RPC, not of the main interactive chat or native coordinator (see `.audit/verify-pi-worker-44.mjs` for the trusted config example).
