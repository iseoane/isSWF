# Claude Code host-native delegation

Use this guide only when actually running in Claude Code on native Windows or Linux. Shared methodology stays in `.agents/skills/` and `.agents/roles/`. Claude Code's native agent mechanism and the plugin's role definitions own delegation; Pi and its subagent extension are not a required dependency or fallback.

## Setup model choices

Discover the current host's supported native models and efforts without provider calls or reading credential contents. Reuse approved choices and record only missing decisions in the existing project's `project-setup.md` under `Claude Code model selection`. Pi provider IDs and `.factory/models.json` do not configure Claude. Setup selection is a preference, not assignment approval or evidence of subscription coverage.

The shipped role profiles use `model: inherit` as an explicit configurable default, not proof of actual identity. Confirm approval for inheritance or choose a supported native model through Claude's documented configuration/delegation mechanism. Observe actual model metadata when available; label unknown effort or identity unknown. Never fabricate per-role effort support, silently substitute a model, or dispatch through Pi because Claude cannot satisfy a selection.

## Parallel-writer capability disclosure

During explicit Claude Code setup, inspect the installed host/version and its documented native delegation interface for a supported way to bind each child to the approved prepared external checkout. Record the observed status and evidence in the existing selected-state `project-setup.md`; do not infer binding from `isswf.worktreeRoot`, a profile's isolation setting, or host-managed worktrees. Do not make a model call, install or configure hooks, or widen the approved root for this check. If the interface does not establish that binding, record parallel writers as unavailable or unverified and state the exact gap. The existing project can still be ready for sequential work in its assigned checkout and unrelated authorized work; do not mark parallel readiness as satisfied.

For an assignment that explicitly requires parallel writers, block dispatch until an authorized, verified binding to each prepared checkout is available. Do not silently serialize an explicit concurrency requirement, use automatic worktree isolation when it cannot select the approved root, or claim that instructions and post-hoc verification enforce checkout binding. If parallelism is not required, plan sequential writers in the assigned checkout; missing parallel capability alone does not block that work. Preserve the approved external-root choice and current Pi binding. A future version-specific or hook-based mechanism requires its own evidence and authorization; this check does not install or configure it.

## Required child context

Before the first native dispatch for new work, resolve `docs/durable-work.md` from the trusted factory root and prepare the canonical plan and curated brief in the target's one active state directory, including for inline small tasks. For a pinned resumption, retain and read its full-SHA inputs. Follow the guide's `tools/project-state.mjs` choice; stop if both `.isswf` and `.factory` exist or the selected entry is unsafe. Complete and freeze coordinator-owned plan/brief records before dispatch while a worker writes. Do not stage worker/reviewer artifacts until their writer is stopped; post-hoc collision detection is not containment. These records do not imply liveness or authority. The source plan CLI is optional and requires its explicit guarded conditions; ordinary native Markdown creation needs no legacy executor, runtime pin, grant CLI or installed source tooling.

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

The child must acknowledge its working directory, scope and shared role before task work, then report which selected methodology and required references it actually consumed (read or received in full). Explicitly name missing or unreadable required resources; they block the affected assignment. Optional unused references do not block. Do not infer consumption from selection, configuration or tool availability, and do not require private reasoning transcripts. File-only children must receive usable paths or full contents; do not assume a Skill tool or inherited parent capabilities. Do not claim all present or future Claude children lack Skill support. Return missing input instead of guessing. The coordinator checks the handoff and result. A new host-native task needs no factory release receipt, project runtime pin, external grant file, compiled isSWF executable or capacity store.

## External worktree assignments

For parallel writers or an explicitly requested worktree, follow `.agents/roles/references/worktrees.md`, including `isswf.worktreeRoot`, and verify the host can bind each child to the approved prepared checkout. Sequential work may use the assigned checkout without creating another worktree. Missing binding blocks parallel dispatch (and any sequential dispatch that specifically requires a separate checkout); do not silently use another directory or host. If parallelism is an explicit requirement, do not serialize it; if it is not required, plan sequentially and continue other authorized work. A separate worktree prevents write collisions, not access to other files or the network.

## Native tools and review

Use the plugin's `isswf-worker`, `isswf-reviewer`, `isswf-researcher` and `isswf-planner` only when useful; there is no mandatory pipeline. The coordinator owns permissions, budgets, task state and acceptance. Do not create another dispatcher or enable automatic retry/review loops by default.

Reviewer agents have only Read, Grep and Glob. Bash can mutate files and is not a sandbox. Review the exact retained candidate, including a stopped writer's partial candidate, not a substitute or later workspace. Keep the writer stopped through review, distinguish supplied checks from reviewer observations and preserve findings. An unavailable independent reviewer leaves required independent judgment pending.

A response is not verification or acceptance. Inspect the diff and relevant checks; report failure, cancellation and partial work honestly. Reconcile actual execution and remaining authority before replacement. Native delegation does not promise OS containment, process-tree cessation or Pi-equivalent sandboxing and recovery. Do not use permission bypasses, hooks or MCP to imply enforcement.

## Existing legacy runtime assignments

Explicitly retained legacy assignments keep their original launcher, runtime pin, release identity and checkpointed inputs under `docs/installation.md` and `docs/local-worker-lifecycle.md`. Read those guides from their retained runtime. Do not remove claims, change stores, overwrite inputs or relabel an old failure to enter the new path. Host-native adoption does not migrate an installed project's state or complete historical acceptance.
