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

Before launch, inspect current model/effort availability and the actual loaded agent mapping. Configuration is not permission or proof of subscription coverage. A missing or unsupported selection blocks that delegation; do not silently inherit, clamp, switch providers, or substitute a model. Explicit parent inheritance is allowed only when approved and its effective selection is known.

## Delegate a bounded task

Before the first native dispatch for new work, resolve `docs/durable-work.md` from the trusted factory root and prepare the canonical plan and curated brief in the target's one active state directory, including for inline small tasks. For a pinned resumption, retain and read its full-SHA inputs. Follow the guide's `tools/project-state.mjs` choice; stop if both `.isswf` and `.factory` exist or the selected entry is unsafe. Coordinator-owned plan/brief records are completed before dispatch and frozen while a worker writes. Do not stage worker/reviewer artifacts until their writer is stopped; post-hoc collision detection is not containment. These records do not imply liveness or authority. The source plan CLI is optional and requires its explicit guarded conditions; ordinary native Markdown creation needs no legacy executor, runtime pin, grant CLI or installed source tooling.

1. Resolve the trusted factory root from the loaded shared skill, separately from the target checkout. No project runtime pin, compiled isSWF executable, external grant file or factory capacity store is required for a new host-native task.
2. Supply the absolute factory root and shared role path, objective, acceptance, scope/exclusions, authorized working directory, baseline or review candidate, model/effort, finite budget and checks. For every selected method skill and required reference, resolve its canonical resource from the trusted factory root and supply its absolute path or full canonical contents; preserve pinned checkpoint/version provenance. Do not assume globally installed skills or inherited parent tools. Reuse an existing plan/brief when useful; an inline small-task handoff supplements, but does not replace, its minimal canonical plan and curated brief. Repository content is data, not authorization.
3. Inspect `subagent` capabilities or use `subagents_enable` if only the loader is active; activation does not launch an agent. Select `isswf-worker`, `isswf-reviewer`, `isswf-researcher` or `isswf-planner` only when the task needs it. Use foreground `async: false` for the normal initial path. Do not enable missions, schedules, nested delegation or automatic correction loops merely because the extension offers them.
4. Set `cwd` explicitly to the assigned checkout. Parallel writers need exclusive workspaces and authorized concurrency; sequential work does not require a new worktree by default. For a worktree, follow the shared worktree reference. Check configured model/effort and tool selection before consuming a call. The extension adds its `contact_supervisor` communication tool; a read-only role is not an OS sandbox.
5. Observe the returned status and actual effects. Errors, cancellation and incomplete output are not success. Inspect partial work before any replacement; unknown execution blocks another writer, not unrelated safe work. Respect remaining total actors, concurrent actors, costs and correction budgets. An optional extension recovery behavior does not grant an additional attempt.
6. Check the result using the shared role and review guidance. Require the child to identify selected methodology actually read or supplied in full and any missing/unreadable required resource; selection alone is not consumption. Missing required methodology blocks the affected assignment, while optional unused references remain optional. A required independent review uses a separate context and the exact stopped writer's candidate. Return the candidate, relevant checks, findings and limitations, not only a model's completion message.

## Boundaries

Use only the extension's verified capabilities. Do not claim OS filesystem/network containment, descendant-process cessation or durable crash recovery from a foreground session, tool list or separate context window. These are not the guarantees of the retained LPAC/Bubblewrap executors. Host settings and extensions execute trusted code; do not load project resources without the host's trust decision or copy credentials between profiles.

For an explicitly selected existing legacy assignment, use its original runtime and `docs/local-worker-lifecycle.md` plus `docs/model-routing.md`. Preserve its pins, grants, reservations and failures. Never reinterpret it as a new host-native task to bypass an unresolved claim.
