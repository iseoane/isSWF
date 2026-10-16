# Local lifecycle design decision

## Selection

Use Design B's attempt-scoped detached execution and read-only fresh observation, with Design A's durable publication and failure matrix. The independent DeepSeek assessment and later checkout amendment are retained verbatim in `lifecycle-44-design-review.md`.

Prefer a small local process runner before a native model adapter. No import of the top-level boundary-65 audit instrument. No provider call in this implementation/proof unit. The output proves process lifecycle and reconciliation only. Native Pi/model execution, chat-independent product orchestration and broader #44 remain incomplete.

## Shape selected for the first implementation

`tools/worker-lifecycle.mjs` provides `launch`, `read` and `reconcile` commands. A trusted caller explicitly supplies a local source Git repository, full document-input SHA, job-brief path, separate full target-base SHA, never-used attempt ID, explicit run store, grant reference, a trusted local Node task script and execution bounds. The task is selected by the trusted invocation, never discovered from repository text. This CLI is not an authorization service or a sandbox. Do not infer permission from a grant-reference string.

The exclusive attempt-directory claim owns a fresh derived workspace. Do not accept a caller-supplied mutable checkout path or reuse a prior attempt workspace. Materialize committed regular-file target blobs locally without modifying source Git metadata, fetching, or exporting isSWF audit history into the fixture. Validate pinned brief existence separately. Record the derived workspace and source pins. An extracted workspace is not itself a Git input checkpoint.

The trusted Node task script is copied and hash-pinned before execution. It is test/worker host code, not an executable selected from untrusted project content. This first runner executes it as an owned subprocess with bounded output and deadline. This means a detached execution host still has an owned child. Do not repeat Design B's claim that all supervisor/orphan crash risks disappear. Test that risk explicitly and report ambiguous descendants as unknown. There is no external watchdog or general crash-resume service.

The execution host owns machine lifecycle metadata and terminal process results. The task owns any assigned A001 report and source changes. A failed process can publish a failure terminal without A001. The coordinator alone records product acceptance. Use immutable dispatch, owner identity and write-once terminal publication. A fresh reader reports starting/unknown, matching live owner, valid terminal or confirmed ceased/interrupted as justified by actual evidence. It never signals a stale PID, reruns, repairs a claim or rewrites worker output. Preserve partial work and ambiguous ownership. A new attempt always needs a distinct ID and explicit trusted invocation.

First-host identity uses Linux boot ID, PID, process start ticks, executable and nonce/arguments. No pidfd dependency. Signals are limited to the execution host's own child/process group during its lifetime. Fresh readers never signal. Same ID remains claimed in live, terminal and unknown states. Distinct IDs derive distinct workspaces. Do not claim a general multiwriter lock or exactly-once effects.

## Intended file scope

- `tools/worker-lifecycle.mjs` owns lifecycle behavior.
- `docs/local-worker-lifecycle.md` documents trusted invocation and exact supported recovery boundary.
- `.audit/verify-lifecycle-44.mjs` drives actual disposable processes and failures.
- `.audit/lifecycle-44-build-brief.md` records implementation and observed evidence.

No existing skills or unrelated production paths need modification for this standalone process-runner unit.

## Verification contract

Use the grant and acceptance matrix, plus actual expected-red J601 fixture. The verifier uses its own fresh fixture copies. Prove launch caller exits before completion, fresh-reader terminal success/nonzero/deadline, repeat launch refusal, distinct-ID workspace separation, killed execution owner with partial work, identity mismatch and corrupt/torn metadata. Unknown never authorizes a replacement. No model result or comprehensive chat teardown proof is inferred from a deterministic process test.

## Rubric and rejected additions

B has the smaller observer interface and one owner for lifecycle metadata. A contributes explicit publication/failure handling but its pidfd suggestion and extra persistent control plane are rejected. Both original designs concealed a nonexistent production model adapter; this decision replaces that assumption with the explicit trusted Node task interface and labels native model integration pending. Attempt-derived workspaces remove the need for a separate realpath-keyed checkout lock. No queue, schema registry, resolver, global daemon, automatic retry, task scheduler or framework is added.
