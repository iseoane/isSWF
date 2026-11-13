# Claude Code host-native delegation

Use this guide only when actually running in Claude Code on native Windows or Linux. Shared methodology stays in `.agents/skills/` and `.agents/roles/`. Claude Code's native agent mechanism and the plugin's role definitions own delegation; Pi and its subagent extension are not a required dependency or fallback.

## Setup model choices

Discover the current host's supported native models and efforts without provider calls or reading credential contents. Reuse approved choices and record only missing decisions in the existing project's `project-setup.md` under `Claude Code model selection`. Pi provider IDs and `.factory/models.json` do not configure Claude. Setup selection is a preference, not assignment approval or evidence of subscription coverage.

During explicit setup:

- **Offer the preset.** Offer the [portable factory preset](../skills/isswf-setup/SKILL.md#confirm-portable-factory-defaults) and confirm acceptance or customization before applying it. Preserve approved existing choices unless replacement is explicitly requested.
- **Shipped default.** The shipped thin role profiles use `model: inherit` before setup; this is not the confirmed factory preset or proof of actual identity.
- **Apply.** Apply accepted model and effort through Claude's documented project-local configuration/delegation mechanism, verifying support separately for the coordinator and each child. Global effort is not evidence of per-role effort.
- **Unpersisted effort.** If the native host cannot persist a requested per-role effort, record that preference in the setup record and enforce it through a supported explicit delegation parameter only after capability verification; otherwise leave that role pending.
- **Missing approved effort.** Omit an effort parameter only under approved parent inheritance; otherwise block the delegation.
- **Limits.** Do not invent YAML or settings fields, change user-global defaults, or label an approved preference as applied configuration. Observe actual model metadata when available; label unknown effort or identity unknown. Never fabricate per-role effort support, silently substitute a model, or dispatch through Pi because Claude cannot satisfy a selection.

For current Claude work, the supported native configuration/profile/delegation mechanism is the sole selection owner. The setup record reports approval/application status, not a second editable model table; `models.json` is for explicitly selected legacy execution only. Missing native selection or unsupported persistence/effort remains pending, never a reason to read a legacy route, silently inherit a model or rewrite unrelated settings.

## Verify the plugin is loaded

During setup, and before the first delegation in a session, check that the plugin is loaded: the available agents include the `isswf:` roles (for example `isswf:isswf-worker`) and `/mcp` lists the plugin's `isswf_git_evidence` server (documented, unverified display format). If either is missing, report native-delegation readiness as partial and do not dispatch a generic agent in place of an `isswf:` role.

## Parallel-writer capability disclosure

During explicit Claude Code setup, inspect the installed host/version and documented native delegation interface for a supported way to bind each child to the approved prepared external checkout. Record evidence in the existing selected-state `project-setup.md`; do not infer binding from `isswf.worktreeRoot`, a profile's isolation setting, or host-managed worktrees. Do not make a model call, install or configure hooks, or widen the approved root for this check. If the interface does not establish binding, record separate-worktree mode as unavailable or unverified and state the exact gap. The project may use shared-sequential only when that policy was explicitly selected; missing worktree binding is not permission to serialize or use the primary checkout as fallback.

- **Worktree policy.** When a writer's selected policy requires a prepared worktree, block dispatch until authorized binding to that checkout is verified, including when the writer would be sequential. Never use automatic worktree isolation when it cannot select the approved root, or claim that instructions and post-hoc verification enforce checkout binding.
- **Shared-sequential policy.** Shared-sequential writers may use the assigned feature-branch checkout only when that mode is explicitly selected, with one writer at a time.
- **Preserve.** Preserve the approved external-root choice and current Pi binding. A future version-specific or hook-based mechanism requires its own evidence and authorization; this check does not install or configure it.

## Required child context

Before each Agent-tool child or bound review (`claude -p`), the coordinator prepares and freezes the canonical plan and curated brief as its [durable-records step](../skills/isswf-coordinator/SKILL.md#3-ground-the-work-in-verifiable-references-and-durable-records) requires, then applies its [pre-dispatch refusal conditions](../skills/isswf-coordinator/SKILL.md#pre-dispatch-refusal-conditions). A failed condition blocks the dispatch. A new host-native task needs no factory release receipt, project runtime pin, external grant file, compiled isSWF executable or capacity store.

Before delegating, provide:

| Context | Required value |
| --- | --- |
| Factory resources | Trusted absolute factory root and shared role path, resolved from the loaded plugin rather than guessed from the target. |
| Selected methodology | Each selected skill and required reference as trusted-root-resolved absolute resource paths or full canonical contents; identify the exact pinned checkpoint/version. Include only what this assignment selects. |
| Task | Objective, acceptance, scope/exclusions, authorized side effects, checks and finite actor/correction budget. |
| Checkout | Explicit absolute working directory and baseline; concurrent writers need exclusive checkouts. |
| Review | Exact candidate/diff and retained untracked contents when applicable, plus relevant checks and their observer. |
| Host and model | Approved native model/effort or explicit parent inheritance, with observed metadata or a stated limitation. |
| Documents | Exact readable plan/brief paths when assigned; a small task may carry its full brief in the handoff as a supplement to its minimal canonical plan and curated brief. |

The child's first output and its return:

- **Acknowledge.** Before task work, the child acknowledges its working directory, scope and shared role. A missing root, role or task scope blocks the assignment; the child returns the missing input instead of guessing.
- **Report consumption.** The child reports which selected methodology and required references it actually consumed (read or received in full) and names any missing or unreadable required resource; those block the affected assignment. Optional unused references do not block. Do not infer consumption from selection, configuration or tool availability, and do not require private reasoning transcripts.
- **File-only children.** File-only children must receive usable paths or full contents; do not assume a Skill tool or inherited parent capabilities. Do not claim all present or future Claude children lack Skill support.
- **Trace check.** When a child-call trace is available (for a bound review (`claude -p`), its stream-json output), the coordinator may verify required-resource reads and record each as observed or self-reported; without a trace, consumption stays self-reported. A trace proves a read, not understanding or application. Record only the resource/status list, not the transcript, and do not retain secrets or unrelated context.

## Selected writing-workspace policy

Reuse the project's settled setup policy, separate worktree or explicitly selected shared-sequential, as [project worktree locations](../roles/references/worktrees.md) defines, including verifying cwd, branch, baseline/HEAD and exclusive ownership before edits. A configured `isswf.worktreeRoot` identifies a location, not policy acceptance or host binding. The Claude-specific step: for separate-worktree mode, verify that this Claude version and supported native mechanism bind the child to the approved checkout; if unavailable or unverified, block the writer without falling back to the primary checkout, another root, host or dispatcher.

## Writer permission preflight and refusals

Before dispatching a writer, inspect the assigned workspace and the effective Claude Code permission mode/rules and supported approval route using the host's exposed configuration. Record what was actually inspected and what remains unknown. Filesystem writability, `Write`/`Edit` availability, an allowlist, or an interactive session alone do not establish native approval; a static preflight cannot predict whether a later per-action auto-mode classifier will approve an edit. Do not invent a classifier dry-run or probe API.

If editing is allowed, proceed within the assignment. If Claude reports that an action requires a user prompt, ordinary interactive prompt-supported editing may proceed through that supported approval route; do not silently preapprove it or block all interactive work. A known denial, read-only workspace, or unavailable required approval route blocks the affected writer action until supported resolution. If permission or approval capability cannot be verified, record it as unknown and do not represent it as permission or as a guaranteed denial; proceed only with actions already supported by current authority, and block the affected write where approval is required but unavailable.

On a denial or auto-mode no-verdict (including “gave no verdict”), stop the affected mutation immediately. Preserve the exact diagnostic and any partial work. Respect host-tool and assignment instructions not to retry; do not automatically retry, rewrite through Bash/PowerShell or another tool/actor, alter modes/rules/hooks, or otherwise bypass the refusal. The coordinator records whether evidence indicates a permission denial or technical no-verdict, verifies the actor has stopped, inspects partial changes and remaining budget, and resumes only after supported permission/technical resolution under current explicit authority. Independent already-authorized safe work may continue. Do not claim that OS permissions or Pi behavior predict Claude classifier outcomes, on Linux or Windows.

## Native tools and review

Use the plugin's `isswf-worker`, `isswf-reviewer`, `isswf-researcher` and `isswf-planner` only when useful; there is no mandatory pipeline. The coordinator owns permissions, budgets, task state and acceptance. Apply the writer permission preflight above before writer dispatch; this is guidance, not a probe or permission grant. Do not create another dispatcher or enable automatic retry/review loops by default.

- **Background capability.** Background Agent-tool children run concurrently and report completion notifications (documented in the official [sub-agents documentation](https://code.claude.com/docs/en/sub-agents.md#run-subagents-in-foreground-or-background), unverified per host). When the installed Claude version and effective configuration support it, launch long work through that mechanism; verify actual capability and permissions first. CLI background-session help does not establish Agent API support. Do not invent API parameters or claim a live/platform guarantee.
- **Missing capability.** If background support is missing or unverified, block that async outcome; continue only safe independent work.
- **Return control.** After launching a background child, report its agent ID and expected result, then return control to the operator. Do not sleep or poll to watch it; consume its completion notification.

### Live direction and eligible continuation

Use this branch only after launch, when the coordinator must direct or continue an Agent-tool child. The [coordinator skill](../skills/isswf-coordinator/SKILL.md) owns the generic identity, eligibility, budget and stale-result rules; this section adds only the Claude mechanics and creates no scheduler, adapter or restart policy. First verify the installed Claude Code version and its exposed native capability. Observed: Claude Code 2.1.312, Linux, recorded 2026-11-02, with `SendMessage` and the exact agent ID returned by the Agent call, as described in the official [resume documentation](https://code.claude.com/docs/en/sub-agents.md#resume-subagents); it is not proof for Windows, other versions or every interruption mode. If support is missing or unverified, block that continuation and continue only safe independent work. Do not invent an `Agent.resume` call or its parameters.

Keep the exact returned agent ID together with the last consumed task/run, candidate and report state, and address only that ID through supported `SendMessage`. Choose by the state the host actually exposes. A live child may receive guidance for its current assignment. For a completed child, or one that ended at its initial `maxTurns` limit, treat a `maxTurns` partial or missing report as partial work, not normal success: inspect the returned result and candidate before continuing. For a stopped child, a generic stopped label does not prove eligibility. A context stopped with `TaskStop` after its native process exited may be eligible; a context cancelled by the user or SDK refuses automatic continuation. The exposed state or API is authoritative, and unknown eligibility blocks continuation without redispatch or replacement.

Same-ID continuation is not a new assignment, candidate adoption or budget reset. It keeps the approved model, permissions, scope, checkout, candidate and cumulative actor, call, context and time budgets, and the writer refusal rules above still stop the affected mutation. Do not apply Pi's `steer`/`resume` semantics to Claude or add an automatic restart.

For a trusted parent/operator correction to a running delegated coordinator, follow the shared [trusted correction inbox](../roles/references/feature-delivery.md#trusted-corrections-and-portable-checkpoint-inbox); it owns reconciliation against the original grant, the fallback when no live route exists and the safe-boundary rules. The Claude route: the parent addresses only the exact coordinator agent ID via verified `SendMessage`. That observed Linux capability does not establish Windows support. A send acknowledgement is not evidence of consumption.

The host accepts one hand-back per result, so a continued child's second hand-back may be refused. The [worker role](../roles/worker.md#return) writes every report to its job's next attempt record; the attempt record is authoritative over hand-back text. Before accepting any result, especially after a `SendMessage` continuation, read that file. A missing record leaves the report unavailable. Exclude untracked attempt records from an uncommitted snapshot candidate, and commit them only after their writer stops.

Give each consumed native result an identity: agent ID, task/run, candidate and report. Record that launch in the attempt or review record with the shared [`Run:` line](../../docs/durable-work.md#record-the-launch-identity): `claude agent=<id>` for an Agent call, `claude session=<id>` for a `claude -p` process. A duplicate, late or stale notice for an already consumed identity triggers reconciliation against that consumed state only, with no repeated dispatch, message, correction, commit, push, PR or other publication. Check a different identity against the remaining authority before any action. Report activity as the last consumed or observed state, not as instantaneous universal freshness. Follow the [feature-delivery contract](../roles/references/feature-delivery.md#drive-the-work-through-delivery) for CI and delivery; when capability, eligibility or budget is missing, stop and report the exact state.

For shared CI waiting policy and exact-head requirements, follow the [feature-delivery contract](../roles/references/feature-delivery.md#drive-the-work-through-delivery). A Claude Agent completion notification is not itself a CI event.

Reviewer tools and candidate:

- **Tools.** Reviewer agents have Read, Grep and Glob plus, only in a bound review (`claude -p`) launched as [the bound reviewer launch](#bound-identity-committed-diff-and-file-content-for-claude-reviewers) describes, the three bound evidence tools. Bash can mutate files and is not a sandbox.
- **Agent-tool reviewer.** An Agent-tool reviewer is unbound: its git-evidence tools return the not-bound result, so the coordinator's unbound-review rule and the reviewer role's [exact-diff rule](../roles/reviewer.md#required-input) apply, and the handoff carries the exact base..head committed diff.
- **Candidate.** Review the exact retained candidate, including a stopped writer's partial candidate, not a substitute or later workspace. Keep the writer stopped through review, distinguish supplied checks from reviewer observations and preserve findings.
- **No reviewer.** An unavailable independent reviewer leaves required independent judgment pending.

A candidate commit is not terminal execution status, a returned required report, or retained curated evidence.

- **Ordinary completion.** Use the native Agent call's returned completion/result and consume any known returned result references before elective successful-path stopping, and check known accessible result artifacts within scope rather than inferring report loss from a stopped context. Verify the required report/evidence is retained; if unavailable, state the limit and consequence. Do not invent a `TaskOutput` API or substitute Pi/CLI retrieval.
- **Abnormal end.** On safety stop, denial/no-retry, timeout, cancellation or exhausted budget, stop promptly: evidence collection must not delay cessation, keep an unsafe actor alive or authorize extra calls or replacement. Preserve partial work and attribute unavailable evidence; never fabricate retrospective RED.

If the host reports that a child stopped while its own background work is still running, list and stop those tasks, or ask the operator when you cannot, before treating the child as cleanly finished.

A response is not verification or acceptance. Inspect the diff and relevant checks; report failure, cancellation and partial work honestly. Reconcile actual execution and remaining authority before replacement. Native delegation does not promise OS containment, process-tree cessation or Pi-equivalent sandboxing and recovery. Do not use permission bypasses or hooks, and do not treat the evidence tools as enforcement: they narrow what a reviewer can read, they do not contain it.

## Bound identity, committed diff and file content for Claude reviewers

A bound review runs as its own `claude -p` process with `ISSWF_GIT_EVIDENCE_BINDINGS` and `MAX_MCP_OUTPUT_TOKENS=100000` set only in that process; an Agent-tool dispatch inside the coordinator session is not a bound review. Before binding, launching or checking one, read in full the [bound reviewer launch](claude-code-review-launch.md) reference (server, launch forms, trace record and Claude output limits) and the shared [bound review evidence](bound-review-evidence.md) reference (binding namespaces, repository topology, verifier and candidate-bound checks).

## Continue a unit in a fresh coordinator context

Apply the shared [unit handoff rule](../roles/references/feature-delivery.md#close-each-functional-unit-with-a-compact-handoff) with Claude Code's supported mechanisms: the operator starts a fresh interactive `claude` session in the assigned checkout and gives it the handoff, or runs `/compact` with instructions to retain the handoff. After compaction or in the new session, reload the coordinator skill and the methodology the next step requires; a compaction summary is not a substitute for those resources or for reconciling the records.

### Headless coordinator launch

A parent coordinator may launch the next unit as a headless `claude -p` coordinator only when the operator explicitly authorizes that launch, its edit surface and its delivery scope. The child cannot answer prompts, so pass the handoff, the trusted request and its limits in the prompt, and require the final report to state any decision or consent it could not obtain. Verified launch form:

```sh
claude -p --permission-mode acceptEdits --settings '{"permissions":{"allow":["Edit(./<path>/**)"]}}' --allowedTools "Bash Read Edit Write Grep Glob Skill" --output-format stream-json --verbose "<handoff prompt>"
```

- `acceptEdits` alone still prompts for files the host treats as sensitive (observed for `.agents/**` and `tests/**`), and a headless session cannot approve them. The observed cause was `--plugin-dir` pointing at the checkout being edited: files of a loaded plugin are protected. Load the plugin from a different trusted checkout than the one the child edits; then `acceptEdits` plus scoped `Edit(...)` rules edit those paths without prompts.
- Only `Edit(path)` rules are matched by file permission checks, and they cover all file-editing tools; `Write(path)` rules are ignored.
- Keep the allow list limited to the delegated edit surface; one `Edit(./<path>/**)` entry per authorized directory, never the whole checkout.
- `--output-format stream-json --verbose` lets the operator follow the run live; the stream is also the child-call trace described under [Required child context](#required-child-context).

These flags are per-process arguments, not a host configuration change. Do not use permission bypass modes.

## Reverse supplied-evidence contract

Use this only when the operator explicitly authorizes a Pi reviewer from a Claude coordinator on Linux; otherwise this route is unavailable.

- **Shape.** A Claude coordinator consumes an independent no-tools Pi reviewer report for supplied evidence. The coordinator, not the Pi reviewer, owns one explicitly authorized synchronous Linux Bash pipeline invoking the approved existing Pi CLI in JSON mode. This is not a Claude-native Agent→Pi bridge. The Pi reviewer receives no shell, launch authority or other new dispatcher. Existing Pi→Claude supplied-evidence review is the opposite direction and must not be described as this reverse path.
- **Packet.** The coordinator binds the exact candidate/cwd, supplies the complete diff and required canonical review resources inline, requests the approved Pi reviewer selection, and consumes the exact terminal report.
- **Preflight.** Before any live launch, independently verify the current explicit permission, the actual existing safe executable/host route, current selection and bounded budget. Do not discover an unsafe PATH wrapper by invoking version/help. Verify the route/account is the approved one without reading credential values; if that cannot be established, block. A past selection does not establish current availability or authorization.
- **Identity.** The producer argv/request, requested model/effort, host-reported identity and effective effort are separate facts; leave effective effort unknown unless attested.
- **Transport.** Bind explicit candidate cwd and bounded stdin, stdout, stderr and timeout. No host/tool/provider fallback or automatic retry is permitted.
- **Success.** Require successful producer and filter exits under `pipefail`, exactly one session with the expected cwd, exactly one complete final assistant report with expected provider/model, nonempty concatenated text blocks, `stopReason: stop`, no error, and exactly one `agent_settled` with `aborted: false`.
- **Failure.** Missing/duplicate/malformed/truncated terminal, retry/compaction/error events (including suffixed event names), identity mismatch, output/stderr truncation, nonzero exit, timeout and cancellation are failure or inconclusive, never success. Cancellation is not proof of cessation; reconcile the actor before any further action. No descendant, real-provider cancellation, Windows, native bridge, isolation or general recovery claim is made.

### Canonical Linux JSONL projection

This filter follows the public Pi JSONL shape: final `message.content` is an array, and only its `text` blocks are preserved; thinking blocks are dropped. Before projection, it requires each source block to have a recognized shape and all text to be a string; malformed content halts the jq process nonzero rather than being normalized or silently dropped. `cwd` comes only from the whitelisted session event, never inferred from the message. Session and settlement payloads are whitelisted, and adverse event type suffixes are retained. The focused test, `tests/j030-reverse-protocol.mjs`, extracts these exact bytes and runs synthetic no-model transport/failure controls; tests do not enforce runtime behavior. Capture combined pipeline stdout with a 16,000-byte limit; emit any success marker only after producer and filter succeed. Truncation, including loss of settlement, cannot be accepted.

```sh
jq -c 'select(.type == "session" or .type == "agent_settled" or (.type == "message_end" and .message.role == "assistant") or (.type | tostring | test("retry|compaction|error"))) | if .type == "session" then {type, cwd} elif .type == "agent_settled" then {type, aborted} elif .type == "message_end" then (.message.content as $content | if ($content | type) != "array" then "assistant content must be an array" | halt_error(5) elif (all($content[]; type == "object" and ((.type == "text" and (.text | type) == "string") or (.type == "thinking" and (.thinking | type) == "string"))) | not) then "malformed assistant content block" | halt_error(5) else {type, message: (.message | {role, provider, model, stopReason, errorMessage, content: [$content[] | select(.type == "text") | {type, text}]})} end) else {type} end'
```

Evidence note: a historical Linux live run proved only an earlier supplied-evidence scope and does not verify this projection. Native Windows evidence remains deliberately deferred.

## Existing legacy runtime assignments

The legacy executor is no longer shipped. An existing legacy assignment keeps its original launcher, runtime pin, release identity and checkpointed inputs, and is reconciled with that retained runtime before the project migrates under `docs/installation.md`. Read its contracts from that retained runtime. Do not remove claims, change stores, overwrite inputs or relabel an old failure to enter the new path. Host-native adoption does not migrate an installed project's state or complete historical acceptance.
