# Host support: Pi and Claude Code

isSWF supplies shared methodology on native Windows and Linux. The host owns agent execution. Pi uses the separately installed `pi-subagents` extension; Claude Code uses native agents through the isSWF plugin. Neither installation, configuration nor skill discovery authorises a model call.

## Shared instructions and entry points

Both integrations read `.agents/skills/` and `.agents/roles/`. `.agents/hosts/pi/agents/` exposes Pi role definitions through `package.json` → `pi.subagents.agents`. Claude's `skills/`, `agents/isswf-*.md` and `.claude-plugin/` remain thin wrappers. Claude discovers its four roles from the default top-level `agents/` directory; Pi profiles stay outside that directory. On pinned Claude 2.1.299, explicit per-file manifest agent entries produced an empty component inventory even for a minimal valid profile; default-directory discovery is verified separately. Do not copy the methodology or build another dispatcher for a new host.

For Pi, the normal integration uses Pi 1.4.0 and `pi-subagents` 0.83.0. Install the extension only with permission, using Pi's package manager and the selected scope. It is not automatically installed by isSWF. Role model/effort selections belong to the host's user or trusted-project settings, not the legacy executor's `.factory/models.json`:

```json
{
  "subagents": {
    "agentOverrides": {
      "isswf-worker": { "model": "openai/gpt-6-luna", "thinking": "high" },
      "isswf-reviewer": { "model": "openai/gpt-6.1-sol", "thinking": "medium" }
    }
  }
}
```

This is a configuration example, not a universal default, availability claim or cost grant. Verify the selected host's current mapping before launch. The factory package must be loaded by Pi for its package agents to be discovered. Follow [.agents/hosts/pi.md](../.agents/hosts/pi.md) for the Pi-native delegation contract.

For an explicitly authorised trusted checkout, Claude's session-only plugin loading command is:

```sh
claude --plugin-dir /absolute/path/to/trusted/isswf-checkout
```

The coordinator entry is `/isswf:isswf-coordinator`. Follow [.agents/hosts/claude-code.md](../.agents/hosts/claude-code.md) for native model choices and the child handoff. Pi provider IDs do not configure Claude. There is no factory pin/receipt or compiled executable prerequisite for a new host-native task.

## Host boundaries

The coordinator supplies the objective, scope, working directory, shared resources, model/effort, finite budget, relevant checks and exact review candidate. Small tasks do not need committed job JSON. Parallel writers need exclusive workspaces; unknown execution blocks a replacement writer. Independent review, when required, stays separate from implementation. Do not enable nested agents, missions, schedules or correction loops merely because an extension offers them.

Native host sessions and tool restrictions are not OS filesystem/network containment or durable crash recovery. Bash is not a sandbox; the Pi extension also adds a `contact_supervisor` communication tool to children. This path does not establish Pi-equivalent sandboxing to the retained LPAC/Bubblewrap executors. Missing models or capabilities are reported, never silently replaced. A response is not a passing check, acceptance, publication or merge.

Explicitly selected legacy runtime jobs retain their original pins, grants, claims and [lifecycle](local-worker-lifecycle.md), [routing](model-routing.md) and [installation](installation.md) contracts. The host-native path does not migrate or complete them. Never erase an inconclusive verdict or use a new host to bypass an unresolved old writer.

## Verify the integration

`node tests/host-portability.mjs .` is a static contract check, not proof of live delegation. Offline SDK tests with a loopback synthetic provider can check role discovery, model/effort, tools, results, failures and cancellation without consuming real model calls. The isolated package trial exercised Pi 1.4.0 plus pi-subagents 0.83.0 on native Windows and Linux (Debian/WSL), not Claude live delegation or all background features.

The acceptance target includes Windows/Pi, Linux/Pi, Windows/Claude Code and Linux/Claude Code. Report each observed combination and limitation separately. A live test needs its own current authorization; earlier demonstrations, configured CI and consumed grants are not current execution evidence.
