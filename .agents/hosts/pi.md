# Pi host-native delegation

Use this guide when coordinating in Pi on native Windows or Linux. The factory owns methodology; Pi and its approved subagent extension own execution. Do not use a Claude launcher or the legacy isSWF executor as an automatic fallback.

## Prerequisite and configuration

The normal integration requires `pi-subagents` 0.83.0 with Pi 1.4.0, the combination exercised by the offline integration trial. isSWF declares its agents through `package.json` → `pi.subagents.agents`; the profiles alone do not install or load the extension. isSWF does not install the extension automatically. Every project setup running in Pi must check this prerequisite and explain the installation below if it is missing. Missing delegation does not block independently authorized coordinator work.

### Install and verify the prerequisite

Inspect the actual host and configured packages without dispatching a model:

```sh
pi --version
pi list
```

If the extension is missing, state that native isSWF delegation requires it and show this pinned installation command. Obtain installation authorization unless the current request already covers it:

```sh
pi install npm:pi-subagents@0.83.0
```

This command installs and registers a user package for all projects. Use `pi install --local npm:pi-subagents@0.83.0` instead only when the operator selects project-local installation. Preserve unrelated packages and role overrides; do not run an automatic dependency upgrade or audit fix.

After installation, run `pi list` to confirm the package, then use `/reload` in the running Pi session or start a new session. Inspect `subagent` or `subagents_enable` capabilities and the effective role mapping without launching an agent. Package registration alone is not proof of a loaded extension. Keep native-delegation readiness partial if loading or role discovery cannot be verified; do not declare setup ready or launch a test model to hide the missing evidence.

### Configure role selections

During explicit setup, offer the [portable factory preset](../skills/isswf-setup/SKILL.md#confirm-portable-factory-defaults) and confirm acceptance or customization before applying it. Preserve approved existing choices unless replacement is explicitly requested. Use trusted-project `.pi/settings.json` for the coordinator startup defaults and `subagents.agentOverrides.isswf-worker` and the other `isswf-` roles; inspect user settings for precedence, but do not change them as a setup side effect. Set `model` to the approved qualified provider/model and `thinking` to its supported effort. Preserve unrelated settings. The legacy `.factory/models.json` belongs to explicit legacy executor assignments, not this host-native path. Do not maintain a second live selection there.

#### Add CodeGraph and Engram tools when installed

`isswf-worker`, `isswf-researcher` and `isswf-planner` use CodeGraph and Engram when they are installed. Never add them to `isswf-reviewer`. The shipped profiles do not list these tools, because pi-subagents fails a run whose explicit allowlist names a tool no loaded provider registers. During setup, check each provider in the current Pi session; package registration or a file on disk alone is not evidence that it is installed and loaded. For each provider that is installed and loaded, add its tools to those three roles' project overrides:

- CodeGraph: `codegraph`, registered by a loaded CodeGraph tool extension.
- Engram: `mem_current_project`, `mem_context`, `mem_search`, `mem_get_observation` and `mem_save`, registered by the loaded `gentle-engram` package.

An override `tools` list replaces the profile allowlist instead of merging, so write the profile's complete current list followed by the detected tool names. Add the resolved absolute path of each provider's loaded extension entry file to the role's `subagentOnlyExtensions`, preserving existing entries, because foreground children do not load the parent's ambient extensions. Omit a provider that is not detected and never install one. Do not change user settings. If a provider is later removed or a profile's tool list changes, reconcile these fields through setup again.

For current Pi work, trusted project `.pi/settings.json` is the single editable project selection owner; the setup record describes approval and application status, not a second model table. Selected-state `models.json` belongs only to explicitly selected legacy execution and must not supply missing native selections. Missing, unsupported or approval-conflicting effective mappings leave the affected role pending until reconciled through the supported host mechanism; never silently repair settings or substitute a legacy route.

Before launch, inspect current model/effort availability and the actual loaded agent mapping. Configuration is not permission or proof of subscription coverage. A missing or unsupported selection blocks that delegation; do not silently inherit, clamp, switch providers, or substitute a model. Explicit parent inheritance is allowed only when approved and its effective selection is known.

## Pi coordinator to Claude Code: supplied-evidence review

Use this only when the coordinator has explicitly authorized a separate-context, read-only Claude review. This is the installed `pi-subagents` code-owned `claude-code` external-CLI adapter—not a Claude native Agent bridge and not bound Git-tool review.

Before a live call, confirm through an authorized sanitized preflight that the exact existing Claude executable is a direct safe binary, the selected account is the approved first-party subscription route, and trusted user settings/hooks do not install helpers, change endpoints, or introduce alternate providers. Check only relevant flag/presence and route metadata; never read or record credential values, auth files, private hook contents, or transcripts. The adapter inherits allowlisted credential and endpoint variables, so its profile does not itself enforce subscription-only billing. If paid-key/alternate-provider routing or trusted settings cannot be ruled out, stop before launch. Do not use a PATH command or run a version/help preflight to discover the executable if it could be a mutating package-manager wrapper.

The code-owned adapter owns its arguments and runs asynchronously. Do not widen it with `runner.args`, `agentOverrides.<name>.runner`, a launcher, Pi-native tool declarations, MCP bindings, or other native-only options. To select an existing command without changing host configuration, an operator may explicitly authorize and trust a project-local custom agent at `.pi/agents/claude-code.md`: copy the currently installed builtin profile, preserve its no-tools instructions and prerequisites, and change only `runner.command` to the absolute path of the independently verified executable. A custom file shadows the builtin wholesale; do not create or register it as a task side effect, and do not put a machine-specific path in shared defaults.

For an authorized launch, set `cwd` explicitly and request `model: "opus:medium"`. The adapter translates this to `--model opus --effort medium`; this proves the requested argv, not the host's effective effort. Record the host-reported model separately; leave effective effort unknown unless the host exposes it. Never infer it from the model's text. The adapter is fixed to `plan`, no built-in tools, strict empty MCP, user-only setting sources, stdin, stream-JSON and no session persistence. It cannot invoke bound Git evidence tools. Supply the complete exact candidate diff and necessary committed contents, full canonical reviewer methodology (review role/skill/guidance/convergence, `REVIEW.md`, and selected methods), objective, and check provenance in the handoff itself. Do not rely on resource paths, tool claims, or omitted/truncated evidence; narrow or block if the full packet cannot be supplied intact.

Accept only one successful nonempty terminal result with no parser/exit error. Malformed or absent terminal state, duplicate results, nonzero exit, output-limit failure, timeout, or stop is not success. Stop/cancellation is not proof of process-tree cessation; preserve unknown cleanup state and never retry or replace a failed call without new explicit authority. This route demonstrates supplied-evidence judgment only, not bound-tool invocation, host filesystem isolation, Windows live-model behavior, or effective effort unless separately observed.

## Reverse direction: Claude coordinator to Pi reviewer

The currently authorized reverse direction is an explicitly authorized Claude coordinator consuming a separate no-tools Pi reviewer report for supplied evidence. It is not a Claude-native Agent→Pi bridge. The coordinator owns the synchronous Linux CLI/Bash launch, exact candidate and cwd, selection and resource packet, bounded transport, and result reconciliation. The Pi reviewer receives no shell or launch authority. Do not confuse this with the separate Pi coordinator→Claude reviewer procedure above. For the canonical filter, full preflight, terminal contract and failure controls, see [Claude Code: Reverse supplied-evidence contract](claude-code.md#reverse-supplied-evidence-contract). Tests and historical journey evidence do not establish current host adherence or Windows support; native Windows reverse evidence remains deliberately deferred.

## Apply the selected writing-workspace policy

Use the project's settled setup policy: separate worktree per writing assignment (recommended where this native Pi `cwd` binding can select the prepared checkout) or explicitly selected shared-sequential checkout on a dedicated feature branch. Reuse the policy; a configured `isswf.worktreeRoot` is location only. For worktree mode, supply the exact approved checkout as explicit `cwd` and verify binding evidence; if unavailable, block the writer without fallback to primary checkout, another root, host or dispatcher. Shared-sequential mode allows one writer at a time, not parallel sharing. For either mode verify branch, baseline/HEAD, cwd and exclusive ownership before edits. Read-only actors need no worktree. See [project worktree locations](../roles/references/worktrees.md).

## Delegate a bounded task

Before the first native dispatch for new work, resolve `docs/durable-work.md` from the trusted factory root and prepare the canonical plan and curated brief in the target's one active state directory, including for inline small tasks. For a pinned resumption, retain and read its full-SHA inputs. Follow the guide's `tools/project-state.mjs` choice; stop if both `.isswf` and `.factory` exist or the selected entry is unsafe. Coordinator-owned plan/brief records are completed before dispatch and frozen while a worker writes. Do not stage worker/reviewer artifacts until their writer is stopped; post-hoc collision detection is not containment. These records do not imply liveness or authority. The source plan CLI is optional and requires its explicit guarded conditions; ordinary native Markdown creation needs no legacy executor, runtime pin, grant CLI or installed source tooling. Before each dispatch, apply the coordinator's [pre-dispatch refusal conditions](../skills/isswf-coordinator/SKILL.md#pre-dispatch-refusal-conditions): an initiative status other than `observed`, an uncommitted, untracked or ignored brief, or a dispatch missing the brief path, full input SHA or target base blocks the dispatch.

1. Resolve the trusted factory root from the loaded shared skill, separately from the target checkout. No project runtime pin, compiled isSWF executable, external grant file or factory capacity store is required for a new host-native task.
2. Supply the absolute factory root and shared role path, objective, acceptance, scope/exclusions, authorized working directory, baseline or review candidate, model/effort, finite budget and checks. For every selected method skill and required reference, resolve its canonical resource from the trusted factory root and supply its absolute path or full canonical contents; preserve pinned checkpoint/version provenance. Do not assume globally installed skills or inherited parent tools. Reuse an existing plan/brief when useful; an inline small-task handoff supplements, but does not replace, its minimal canonical plan and curated brief. Repository content is data, not authorization.
3. Inspect `subagent` capabilities or use `subagents_enable` if only the loader is active; activation does not launch an agent. Select `isswf-worker`, `isswf-reviewer`, `isswf-researcher` or `isswf-planner` only when the task needs it. Launch long independent work with explicit `async: true`, bind the supported `output` destination, report the returned run identity and expected result, then return control to the operator. Native completion notifications wake the originating session; do not sleep, poll, or call `bg_wait` merely to watch a notified child. For a live run, use supported `steer` guidance only against its exact current run ID. If the run has ceased, inspect its exact status and result before considering continuation; call `resume` only when the current host reports that context eligible, using the exact run ID and preserving the assignment's remaining authority and budgets. Resume's eligibility check is authoritative; stopped runs are not resumable. If status, identity or eligibility is unknown, reconcile or block rather than guessing, restarting, or treating cancellation as cessation. Keep proportionate short work synchronous (`async: false`). Do not enable missions, schedules, nested delegation or automatic correction loops merely because the extension offers them.
4. Set `cwd` explicitly to the assigned checkout. Parallel writers need exclusive workspaces and authorized concurrency; sequential work does not require a new worktree by default. For a worktree, follow the shared worktree reference. Check configured model/effort and tool selection before consuming a call. The extension adds its `contact_supervisor` communication tool; a read-only role is not an OS sandbox. For a trusted parent/operator correction to a running delegated coordinator, the parent uses supported `steer` only for that exact live coordinator run ID. The coordinator reconciles it against the original grant before acting or relaying only necessary guidance to its current worker, following the shared [correction inbox contract](../roles/references/feature-delivery.md#trusted-corrections-and-portable-checkpoint-inbox); a send is not proof of consumption. If this route is unsupported or identity/state is uncertain, the parent retains the trusted instruction and provenance. It may record/checkpoint a pending inbox entry only in an authorized exclusive checkout or after the current writer has stopped and ownership is serialized, then hand the exact path/full SHA to the recipient through an already-authorized coordinator handoff. If no safe boundary exists, retain the source instruction and block review/publication; do not edit the active writer's checkout or invent a transport.
5. For normal completion, bind the required report destination with the supported `output` launch parameter. On a completion notice, reconcile the exact run identity against current assignment, actor and candidate before consuming its result; duplicate, late or mismatched notices cause status/result reconciliation only, never a second dispatch or publication. For CI waiting policy, follow the shared [feature-delivery contract](../roles/references/feature-delivery.md#drive-the-work-through-delivery); native Pi child completion is not evidence of a CI event. Observe terminal execution status, consume known completion/result references returned by the native call, and verify the required report/evidence before elective successful-path stopping. A commit is only a candidate; do not infer a lost report from context stop alone—check known accessible result artifacts within scope. Errors, cancellation and incomplete output are not success. On safety stop, denial/no-retry, timeout, cancellation or exhausted budget, stop promptly; do not let evidence collection delay cessation, keep an unsafe actor alive or authorize another call. Preserve partial work and explicitly attribute unavailable evidence. Inspect partial work before any authorized replacement; unknown execution blocks another writer, not unrelated safe work. Respect remaining total actors, concurrent actors, costs and correction budgets. An optional extension recovery behavior does not grant an additional attempt.
6. Check the result using the shared role and review guidance. Require the child to identify selected methodology actually read or supplied in full and any missing/unreadable required resource; selection alone is not consumption. Missing required methodology blocks the affected assignment, while optional unused references remain optional. Where the host makes a child's Pi session record available, the coordinator may inspect tool calls for required-resource reads and report each as observed or self-reported; do not assume the trace is available or retain its transcript. A trace proves a read, not understanding or application; no trace leaves consumption self-reported. A required independent review uses a separate context and the exact stopped writer's candidate. Return the candidate, relevant checks, findings and limitations, not only a model's completion message.

## Bound identity, committed diff and file content for Pi reviewers

The child-only extension exposes `isswf_git_identity`, `isswf_git_diff`, and `isswf_git_content`. Identity and diff accept no arguments. Each requires its own explicit fresh child launch binding; none infers repository or revisions from `cwd`, project files, task text, or ordinary environment variables. Missing or malformed bindings fail closed.

The diff tool returns exact patch bytes as base64, with byte count and SHA-256. The `isswf.git-evidence.diff/1` binding allows at most 192,000 raw patch bytes and a separate 256 KiB encoded response. The invoker verifies canonical base64, length and digest, then provides an exact UTF-8 view when valid; invalid UTF-8 remains base64-only. The complete displayed result is capped at 512 KiB.

The content binding uses `isswf.git-evidence.content/1` and contains the same canonical repository, full base/candidate commit IDs, absolute trusted Git executable and timeout as the other bindings, plus `paths` and `outputBytes`. `paths` is a finite allowlist of 1–64 unique relative Git paths, each at most 1,024 UTF-8 bytes and 8,192 bytes total. Absolute, drive, UNC, backslash and traversal paths are rejected. The raw content limit is at most 65,536 bytes; the complete CLI response is capped at 96 KiB and the native tool result at 192 KiB. The base64 appears once in the model-visible text, not again in the structured details, so a 65,536-byte ordinary text blob fits; text dominated by characters that JSON escapes can exceed the native cap and then fails closed without truncation. The model may select only a listed path and `base` or `candidate` slot; it cannot select a repository, revision, executable, command, environment or limit. `isswf_git_content` returns the selected commit/path and exact blob bytes as base64, byte count and SHA-256. An absent path is `status: absent`; a present empty blob is `status: ok`, zero bytes and the empty-byte digest. Only regular 100644/100755 blobs are returned; symlinks, submodules, trees and other entry types are refused. No content is obtained from the working tree. The native invoker checks canonical base64, length and digest, and exposes a fatal-decoded exact UTF-8 view when valid (preserving BOM and line endings); otherwise it explicitly leaves the content base64-only.

All three namespaces, including content path selection, are shown in the fresh-launch example below. The public CLI requires complete binding JSON and stdin EOF within 2 seconds, with at most 16,384 input bytes. Stalled input returns `binding-input-timeout` before the operation-specific Git deadline begins; the Pi invoker supplies and closes the complete input automatically.

Use this tool only on a coordinator-approved repository with the author stopped and no untrusted concurrent writer. This is an operational prerequisite, not an OS-enforced condition: the tool runs with Pi's host permissions, cannot make the filesystem immutable, and does not promise race-proof containment or hard deadlines for blocking OS calls. The configuration/topology guards and no-write tests verify the narrow evidence boundary, not system isolation. If the required review involves a hostile or concurrently mutable repository, stop that affected step and separately select and verify protected immutable input; do not reactivate the parked isolated executor or weaken this boundary automatically.

For an authorized review, the coordinator supplies `options.extensionBindings` on a **fresh** `subagent` launch. Use full exact commit IDs, canonical paths, and the trusted Git executable selected by the coordinator:

```js
subagent({
  agent: "isswf-reviewer",
  task: "Invoke isswf_git_identity and isswf_git_diff first. Decode and use the returned exact patch bytes for the base-to-candidate review; report both tool results. Then review the exact supplied candidate.",
  cwd: "/canonical/repository/root",
  async: false,
  options: {
    extensionBindings: {
      "isswf.git-evidence/1": {
        version: 1,
        repository: "/canonical/repository/root",
        baseSha: "<full-commit-sha>",
        candidateSha: "<full-commit-sha>",
        gitExecutable: "/canonical/path/to/git",
        timeoutMs: 5000,
        outputBytes: 4096
      },
      "isswf.git-evidence.diff/1": {
        version: 1,
        repository: "/canonical/repository/root",
        baseSha: "<full-commit-sha>",
        candidateSha: "<full-commit-sha>",
        gitExecutable: "/canonical/path/to/git",
        timeoutMs: 5000,
        outputBytes: 131072
      },
      "isswf.git-evidence.content/1": {
        version: 1,
        repository: "/canonical/repository/root",
        baseSha: "<full-commit-sha>",
        candidateSha: "<full-commit-sha>",
        gitExecutable: "/canonical/path/to/git",
        timeoutMs: 5000,
        outputBytes: 65536,
        paths: ["src/example.mjs", "docs/guide ñ.md"]
      }
    }
  }
});
```

The loaded `pi-subagents` contract passes these namespaces through `PI_SUBAGENT_EXTENSION_BINDINGS` during child extension startup. The child-only extension captures and validates each once before any later environment restoration. The reviewer must call `isswf_git_diff`, check the returned bound identities, `patchBytes`, `patchSha256` and native integrity-verification result, and use the exact returned patch block. When exact file evidence is required, call `isswf_git_content` with an allowlisted path and base/candidate slot; check the selected commit/path, status, byte count, digest verification and exact readable view or explicit base64-only result. The invoker performs byte decoding and digest verification; do not attribute those computations to a reviewer that has no execution tool. Do not resume a retained child for this evidence step: `extensionBindings` is launch-only and retained resumes reject it. A coordinator-supplied result or synthetic fixture does not prove that the reviewer invoked the tool.

## Continue a unit in a fresh coordinator context

Apply the shared [unit handoff rule](../roles/references/feature-delivery.md#close-each-functional-unit-with-a-compact-handoff) with Pi's supported mechanisms: the operator starts a fresh session by running `pi` in the assigned checkout without `--continue` or `--resume` and gives it the handoff, or runs `/compact [instructions]` with instructions to retain the handoff. Then reload the coordinator skill (`/skill:isswf-coordinator`) and the methodology the next step requires, and reconcile the records before acting. Do not change Pi's automatic compaction settings for this purpose.

## Boundaries

Use only the extension's verified capabilities. Do not claim OS filesystem/network containment, descendant-process cessation or durable crash recovery from a foreground session, tool list or separate context window. These are not the guarantees of the retained LPAC/Bubblewrap executors. Host settings and extensions execute trusted code; do not load project resources without the host's trust decision or copy credentials between profiles.

For an explicitly selected existing legacy assignment, use its original runtime and `docs/local-worker-lifecycle.md` plus `docs/model-routing.md`. Preserve its pins, grants, reservations and failures. Never reinterpret it as a new host-native task to bypass an unresolved claim.
