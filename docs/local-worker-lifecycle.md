# Local worker lifecycle runner

`tools/worker-lifecycle.mjs` is a small Linux/Node local-process runner. It is not an authorization service, sandbox, model adapter, queue, watchdog, or recovery daemon. A trusted caller must independently decide whether a launch is authorized. The `--grant-ref` value is recorded evidence only; the program does not interpret it or grant permission from it.

## Run a job from an activated project

Use `tools/isswf-job.mjs` from the fixed source checkout after [project activation](activacion-por-proyecto.md). This entry point connects the activated resource package to the existing task preparer and lifecycle runner. It does not start a coordinator model. A human or the user-invoked coordinator skill remains responsible for the grant, exclusive job ownership, and independent review.

Commit a trusted job JSON and a brief in the target project. Review every command and writable path before authorizing a run. A minimal job has this shape:

```json
{
  "version": 1,
  "logicalJobRef": "J801",
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

The model configuration must select exactly `openai-codex/gpt-6-luna` at `high` for the worker, with no fallback. The input checkpoint, target base, runtime/package revision, model-config checkpoint, and methodology revision have different meanings. Referenced inputs must have identical committed bytes at the input checkpoint and target base. The brief is read at the input checkpoint, not from the working tree. The eight runtime files (`isswf-job.mjs`, `factory-package.mjs`, `pi-worker-task.mjs`, `worker-lifecycle.mjs`, `native-recovery.mjs`, `external-effect-journal.mjs`, `recovery-review.mjs`, and `job-successor.mjs` under `tools/`) must match their Git blobs at `runtimeSha`; unrelated later commits do not change that identity. Exactly one local isSWF package declaration must exist, and it must be an absolute, string-form declaration matching that revision; its complete receipt/payload is verified. Relative local declarations are resolved from `.pi/settings.json`; home-relative paths and `file://` URLs are also normalized and counted, rather than silently bypassing this check. Nonlocal declarations explicitly naming this factory are refused as ambiguous; unrelated remote packages are not fetched or inspected.

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

The runs store must be outside both the project and runtime source trees. A committed, stable `logicalJobRef` is mandatory for this runtime. The entry first claims `<runs-store>/admissions/<key>.json`, keyed by the canonical project path and logical job reference, with the exact attempt, input, job digest, grant reference, and explicit `workerTotal: 1` budget. The claim consumes that job's single worker admission before any task preparation. It is never released automatically, including after failure, terminal success, or recovery. The entry then creates the task/config snapshot there itself; callers do not prepare a temporary task or use an audit harness. It returns after dispatch. Consult `read` or the read-only `reconcile` operation later, even after the initiating session has gone. The entry publishes `<runs-store>/<attempt-id>.job.json` with input/config/runtime bindings before dispatch, using exclusive creation. The attempt directory contains the usual lifecycle records and safe `pi-result.json`. `read` and `reconcile` require the binding to match the dispatch's repository, input, base, brief, task hash, grant, and attempt identity; missing or inconsistent evidence reports `unknown`. Preparation artifacts are preserved in `.prepare-*` directories. Same-ID repeats refuse when either the attempt or its binding already exists, including a crash after binding publication but before dispatch; an unknown state never permits automatic replacement. A different attempt ID cannot bypass an existing logical admission without the explicit successor grant described below. Same-project bindings for that logical job also block admission; ambiguous or corrupt prior bindings and legacy same-project bindings without logical identity block rather than imply a free writer slot. `read` and `reconcile` validate the matching admission without modifying it. This guard covers only the normal entry within one fixed, private runs store. It is not a global or cross-store lock; the caller must still establish exclusive ownership outside that boundary. Renaming a job or selecting another store is not a recovery procedure. The generic lifecycle runner remains trusted low-level code, not an alternative recovery path.

`reviewRequired: true` is always reported. A terminal process success is not product acceptance, and no result is automatically merged or copied into the target checkout. Independently review the exact changed workspace bytes and protected checks before delivery. Failure may leave preparation or partial attempt records; inspect them rather than retrying blindly. To run reproducible no-provider controls, pass `--mode offline` with explicitly trusted `offlineChecks` in the job. This exercises the same preparation/dispatch path but is not model proof. Run `node .audit/verify-operational-44.mjs` for the disposable offline regression suite; normal job use does not depend on that test file.

A `stopped-review-required` report does not release its claim or authorize a new writer. The explicit review operation below binds a receipt to exact recovered candidate bytes. Only the separately granted, bounded successor operation can consume one additional worker slot. Run `node .audit/verify-recovery-68-admission.mjs` for disposable normal-CLI host-loss, unknown-writer refusal before preparation, immutable input changes, ambiguous records, and claim-before-preparation crash controls. No provider prompt is requested.

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

The generic lifecycle commands are read-only aliases. The normal `isswf-job.mjs reconcile` entry additionally inspects native recovery evidence described below. They report `running` only when Linux boot ID, a positive integer PID, process start ticks, executable and a 48-character lowercase hexadecimal nonce as an exact process-argument element match the recorded owner. A valid write-once terminal record reports `terminal`; missing, torn, corrupt or mismatched evidence reports `unknown`. Readers never signal, rerun, repair claims, free an attempt ID, or rewrite worker output. Same-ID launches fail closed whether the original attempt is live, terminal or unknown. A distinct ID gets a different derived workspace.

The host also publishes write-once `execution-child.json` after spawning the task. For attempts without a terminal record, readers expose a separate `executionChild` observation: `live` requires the recorded boot ID, PID, start ticks, executable and process group to match; `not-live` means only the direct child is absent or a zombie. Both leave descendant cessation unproven. Missing, corrupt, mismatched or pre-publication identity evidence remains `unknown`; older attempts without this record retain their previous blocking behavior. An absent host still makes the overall attempt `unknown`, even when its direct child is positively observed. This record neither authorizes replacement nor closes general recovery: the spawn-to-publication crash window and unrecorded descendants remain unresolved. Run `node .audit/verify-recovery-68-host-loss.mjs` for the disposable host-loss regression; it uses no provider.

The host alone writes process-lifecycle metadata. A terminal record is write-once and records success, nonzero failure, or timeout, plus per-stream truncation and whether capture was forcibly closed with descendant state uncertain; an A001 report is optional and is not a precondition for failure publication. Task changes and any A001 report remain task-owned. Product acceptance remains coordinator-owned. If the execution host dies while its task child may still run, observation is `unknown`; partial files are preserved. Do not kill a PID discovered by a fresh reader or assume that an absent host proves its child ceased. Any signal used for deadline enforcement is sent only by the live owner to its own child process group.

A failed or unknown attempt is never resumed or re-executed under the same ID. Inspect partial work and actual process evidence; a new distinct attempt needs separate authorization, confirmed prior-writer cessation, reconciled partial work, and exclusive job ownership. An `unknown` observation alone never permits replacement. There is no automatic retry, general watchdog, exact-once side-effect guarantee, power-loss guarantee, non-Linux identity support, or proof from this generic runner of Pi RPC, interactive-chat, or native-coordinator teardown. The deterministic verifier proves only bounded local process lifecycle mechanics. Run it with an explicit fixture JSON path when the fixture is outside the checkout, for example `node .audit/verify-lifecycle-44.mjs /absolute/path/to/lifecycle-44-fixture.json`; it otherwise reads `.audit/lifecycle-44-fixture.json` from this checkout. It creates its disposable test data under a uniquely named `isSWF-lifecycle44-*` temporary directory.

## Reconcile an interrupted native task

New task snapshots record `native-tools-pidns-v1` evidence outside the writable workspace. Before each shell command, the native adapter writes a tool intent, starts Bubblewrap's PID-namespace reaper, records its exact startup identity from `--json-status-fd`, and only then releases a gate mounted read-only inside that namespace. A missing startup record never permits recovery, and the gate cannot execute the command before publication. Provider access and opaque auth remain on the host; they are not mounted into tools.

Real-mode tasks also publish a synced, write-once `pi-model-invocation.json` after validating the exact SDK route and callable tools, before entering the prompt. This is prompt-entry intent, not a provider response or billing receipt. SDK-dispatched tools bind the invocation digest, hashed SDK call ID, and operation into the existing native intent and startup records. Host postchecks and offline controls have no model-call label. These records contain no command text, model output, or auth values and grant no replacement authority.

If the lifecycle host is lost, run the normal `isswf-job.mjs reconcile` command. While the task or a recorded namespace may still act, recovery stays `blocked`. Only after the exact task and every recorded namespace-init process are confirmed absent or matching zombies on the same boot can reconciliation return `recovery.status: "stopped-review-required"`. PID reuse, reboot, unreadable evidence, missing records, changed task/runtime/package/config/brief pins, or partial changes outside the committed mutable scope block that result. The check compares workspace bytes, file executable modes, and entries against the committed target base; it does not execute project checks. Review the reported candidate hashes and run the original protected checks in the sandbox before any delivery.

The overall attempt remains `unknown`: this is recovery of reviewable partial work, not a fabricated terminal result, automatic retry, or authorization to replace a writer. Records and partial files are never repaired or copied automatically. Existing generic tasks and older snapshots without the policy stay uncovered. External effects are reported `not-reconciled`; a stopped local process does not settle a provider charge, remote Git operation, or lost external response. This cut does not supply general restart, exactly-once effects, concurrency exclusion, or client readiness. Run `node .audit/verify-recovery-68-native.mjs` for actual disposable offline host/task-loss, descendant-cessation, partial-scope, and pre-release publication controls; it makes no provider prompt.


## Review an exact recovered candidate

Use the pinned normal CLI only after reconciliation reports `stopped-review-required`:

```sh
node /absolute/fixed-isSWF/tools/isswf-job.mjs review \
  --runs-store /absolute/private-runs-store --attempt-id ID --action inspect
```

Inspect is read-only. Independently review the returned exact candidate fingerprint, then place an operator-owned JSON outside the project, runtime source, and entire runs store. The approval requires `version: 1`, nonblank `grantRef` and `reviewRef`, `independentReview: true`, `verdict: "pass"`, `allowProtectedCheck: true`, the exact `fingerprint`, and the returned candidate's `protectedCheckCommandSha256`. These declarations do not authenticate the reviewer or prove review quality; that remains the trusted caller's responsibility.

Run the same command with `--action record --review-file /absolute/operator-review.json`. Record revalidates the full typed workspace tree, every file and directory's permission bits including the workspace root, committed input/base/runtime/package/models/brief/task pins, admission, and native cessation evidence. A matching logical-job PR with uncertain submitted state blocks locally, without querying GitHub. The original committed protected command must then pass in an offline PID namespace with the workspace mounted read-only, a ten-second timeout, and a 16,000-byte output bound per stream. The fingerprint must remain unchanged afterward. Commands requiring workspace writes cannot pass this review operation; do not substitute another check.

The attempt-local `recovery-review-receipt.json` is atomic and write-once. It records the approval digest/reference, exact candidate, check exit, and output digests, not raw output. Matching repeated records preserve bytes without rerunning the check. `--action check` recomputes the fingerprint and validates the receipt read-only. Missing, corrupt, stale, or conflicting evidence blocks; ordinary `read` and `reconcile` never create receipts or execute checks.

A receipt is an observation of exact bytes, not a lease, authenticated review, product acceptance, charge reconciliation, or successor grant. The logical admission remains consumed. This operation does not handle reboot, arbitrary surviving writers, or unknown external effects. Run `node .audit/verify-recovery-68-review.mjs` for disposable offline controls; no provider prompt or real GitHub call is made.

## Admit one explicitly granted successor

This runtime supports one original attempt followed by at most one successor in the same canonical project, logical job, private runs store, activated package, and pinned runtime. It does not migrate old snapshots or support chains. Keep the original admission and every predecessor record, workspace, and receipt unchanged. A missing or corrupt record blocks, never releases a slot.

First obtain a valid exact-candidate review receipt. Independently commit that recovered workspace tree as the proposed successor target base in the project repository. The CLI does not create this commit or copy recovered files. The base's full typed tree must equal the receipt, including directory entries. Symlinks and Gitlinks are rejected before an edge can be consumed; extra empty trees also fail the comparison. Root and directory permissions must be exactly 0755; regular files must be 0644 or 0755 as represented by Git. Other permissions block this operation without weakening the receipt's full-mode binding.

Commit a new input containing the successor job and brief. Preserve the logical reference, runtime, methodology, model pin, original protected command, and mutable-path contract. The new job must explicitly declare `workerTotal: 2`. This is the cumulative bound of one consumed original slot plus one successor slot, not a reset to one. Changed input and attempt identifiers are mandatory. The original invocation remains uncertain and consumed even if its charge cannot be reconciled.

Provide an absolute operator-owned grant JSON outside the project, runtime source, and entire runs store. It requires `version: 1`, concrete `grantRef` and `reviewRef`, `predecessorAttemptId`, the current `receiptSha256` and `fingerprint`, `newAttemptId`, `newInputSha`, `newJobPath`, the exact committed job blob's `newJobSha256`, `newTargetBase`, explicit `mode`, `cumulativeWorkerTotal: 2`, `priorInvocationUncertainAndConsumed: true`, and `exclusiveSuccessorOwner: true`. The grant reference must equal the normal run's reference. These are trusted caller attestations, not authenticated permissions or proof of billing reconciliation. There are no budget defaults or automatic approvals.

Use the normal run options with that exact new input, job, attempt, and grant reference, plus `--successor-grant /absolute/operator-successor.json`. Before any preparation, the CLI revalidates the stopped original attempt, current receipt, candidate, and local PR phase facts. Unknown submitted PR state blocks without a network query. It atomically publishes one write-once `<runs-store>/successors/<key>.json` edge. That edge consumes the second slot before preparation, binding publication, or launch. A crash after the edge is published still consumes the slot; do not remove it or retry. Competing successor requests can consume only that one edge. A successor cannot itself become a predecessor.

Ordinary successor `read` and `reconcile` stay read-only. They validate the exact edge, original admission, predecessor binding, immutable receipt, and successor request against its job/dispatch binding. That history proves admission at the observed candidate, not a continuing lease on the old workspace. External exclusive ownership remains a caller precondition. Run `node .audit/verify-recovery-68-successor.mjs` for disposable offline public-CLI controls, including concurrent claims and exit after the edge but before preparation. No provider prompt or real GitHub call is made by that verifier.

## Reconcile an uncertain PR response

The separate `isswf-job.mjs effect` command supplies a write-once PR journal. It is not part of ordinary `run`, `read`, or `reconcile`. Ordinary observation remains local and read-only. The coordinator host owns this journal; sandbox workers receive no GitHub authority. The delivery profile remains local-draft-only unless the operator grants a specific external action separately.

The committed job must add `logicalJobRef` and `externalEffect`:

```json
{
  "logicalJobRef": "J900",
  "externalEffect": {
    "operation": "pr-open",
    "repository": "owner/repository",
    "head": "jobs/J900",
    "base": "main",
    "candidateSha": "<full reviewed commit already on the remote head>",
    "baseSha": "<full reviewed remote base commit>",
    "title": "Reviewed change",
    "body": "Reviewed PR description",
    "draft": true
  }
}
```

Only a validated, successful bound attempt with complete capture is supported by this entry. Live, failed, unknown, or merely recovered partial attempts block. Terminal success does not prove independent review or descendant cessation. The trusted caller must establish review, prior-writer cessation, and exclusive effect ownership separately. This cut does not implement a multiwriter job lock.

Run `effect --action inspect --runs-store ABS --attempt-id ID` first. This read-only action returns the immutable intent, its `key`, and `intentSha256` when unprepared. The key derives from the canonical GitHub repository, stable logical job reference, and `pr-open`, never the attempt ID or candidate. Keep that logical identity across replacement attempts. Changed input, base, candidate, description, or grant under an existing key blocks without overwriting records or creating another PR identity.

Provide an absolute operator-owned grant JSON outside the project, runtime source, and entire runs store (including all derived worker workspaces). It must contain `version: 1`, a concrete `grantRef`, `host: "github.com"`, the exact `key` and `intentSha256`, `maxInvocations: 1`, an explicit integer `maxQueries` from 1 to 20, `exclusiveEffectOwner: true`, `priorWritersCeased: true`, a concrete `reviewRef`, and an `actions` array explicitly allowing the required `prepare`, `publish`, or `reconcile` actions. There are no budget defaults. These fields are trusted caller attestations, not an authentication service; a model response or a project file is not operator approval. Query slots count individual GET requests, including pagination and the two remote-ref checks, and are consumed durably before requests. Crashes consume slots too.

```sh
node /absolute/fixed-isSWF/tools/isswf-job.mjs effect \
  --runs-store /absolute/private-runs-store --attempt-id J900-A001 \
  --action prepare --grant-file /absolute/operator-grants/J900.json
```

Use the same options with `--action publish` only under a concrete publication grant. This action uses the existing host `gh` executable and opaque normal GitHub authentication, pinned to `github.com`. It neither installs tools nor creates or pushes branches. It queries existing PRs and verifies remote head/base pins, then durably claims `submitted.json` **before** requesting PR creation. That exclusive claim consumes the entire supported `maxInvocations: 1` budget. No caller can remove or reuse it. The journal lives under `<runs-store>/effects/<key>` across attempt IDs. Concurrent invocation claims cannot submit twice, but this is not general job ownership enforcement or exactly-once delivery.

If the response is lost, use the explicitly authorized `effect --action reconcile`, not `publish` again. Only one exact, completely queried, open and unmerged match of repository, head, base, marker, title, draft status, and candidate/base SHAs can publish an outcome fact. Missing state, closed, or merged PR evidence blocks. A preexisting PR without a local submission claim also blocks for an operator decision; lost or relocated journals are not automatically adopted. Zero, multiple, incomplete, conflicting, failed, or over-budget queries block without retry. A crash after the submission claim but before network transmission deliberately remains uncertain. Confirmed facts record that an open PR was observed at confirmation time, not its current live state. They return idempotently without another network call. Ordinary `read`, ordinary `reconcile`, and effect `inspect` never query GitHub or modify effect facts.

Run `node .audit/verify-external-effects-68.mjs` for disposable fake-`gh` controls, actual initiating-process SIGKILL before submission and after a persistent fake PR but before local response, competing invocation claims, immutable conflicts, numeric grants, and normal CLI integration. These controls make no real GitHub calls or provider prompts. They prove journal/process logic, not real GitHub semantics, race-free remote ref updates, reboot/power-loss recovery, local Git branch/commit/push reconciliation, issue creation, or all S04 criteria. Actual GitHub use needs its own named operator grant and pre-call gates.

## Pi task snapshot

`tools/pi-worker-task.mjs prepare --config /absolute/trusted.json --output /absolute/nonexistent-task.mjs` creates a self-contained task snapshot for the existing runner. The trusted config pins the Pi SDK and Node paths, opaque host auth-file path, baseline Git profile/reference map, a brief object `{ "repo": "/absolute/local/repository", "inputSha": "<full-lowercase-commit-sha>", "path": ".factory/jobs/J601/brief.md" }`, mode (`offline` or explicitly authorized `real`), protected check command, and expected mutable paths. Preparation reads methodology and exact brief bytes from the pinned local Git objects, requires a committed regular-file brief of 1–32,000 bytes, and emits `briefPath`, `inputSha`, and `briefSha256` in preparation metadata and the safe task result; subsequent task execution does not reread that config or checkout. Pass the generated script to `worker-lifecycle.mjs launch` as `--task-script`, with the usual 120000 ms outer timeout. Offline mode validates SDK/session/tool setup without a provider prompt. Real mode requests only `openai-codex/gpt-6-luna` at `high`, with a 12-tool-call cap and 110-second inner deadline; process completion is not product acceptance. The coordinator's [dispatch instructions](../.agents/skills/isswf-coordinator/SKILL.md#5-decide-si-puedes-despachar) define transport authorization, separate revision pins, input availability, and actor-budget reconciliation. The adapter prepares only the pinned worker route, not other roles. The caller must match its emitted brief identity to the lifecycle dispatch; neither CLI authorizes work or validates the caller's grant. Legacy free-form `briefText` is rejected. This narrow integration is not a general sandbox, authorization service, coordinator, recovery mechanism, or client-readiness guarantee; its real-run verification confirms teardown of the isolated initiating Pi RPC, not of the main interactive chat or native coordinator (see `.audit/verify-pi-worker-44.mjs` for the trusted config example).
