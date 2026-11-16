# I0059: The isSWF mod works where cc-plugin-sec-default is seated

Type: bug

On 2026-11-16 the operator reported that users with Team subscriptions cannot use the initiatives pane, and selected option B: move the coordinator-activation signal and the post-compaction reminder onto events the built-in guard lets through, with tests and English and Spanish documentation. On the same day the operator added the `isswf_git_evidence` MCP configuration error seen in the same log (J002).

Claude Code seats the built-in guard `cc-plugin-sec-default@builtin` ahead of every user-tier mod when the session uses a Team or Enterprise `/login`, or the machine has managed settings. A user cannot turn it off. Where it is seated, a user mod's hooks on `classic.*`, `skill.prompt`, `session.compact`, `prompt.*`, `settings.read` and some `session.append` rows never run. `tool.call`, `session.start`, `command.run` and `ui.render` still run. Settings-style hooks in a plugin's `hooks/hooks.json` are not affected. Source: [Manage mods for your organization](https://code.claude.com/docs/en/plugins/mods/admin), section "Know which hooks of a user's mod don't run".

## J001

- Status: completed
- Size: M (two related flows: coordinator activation and post-compaction continuity)
- Scope: factory (Claude Code mod; Pi unaffected, to be confirmed in the brief).
- Objective: Where the guard is seated, `/isswf-initiatives` and the pane work after the coordinator loads, and a session resumed after compaction is still told to reload the coordinator.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md) 
- Blocker: None.
- Next step: None. Closed 2026-11-16 by the operator ("dalos por cerradas"), merged in #339, released in v1.9.4. The operator approved the `.agents/hosts/**` change. Live Team/Enterprise and Windows checks were not observed before closing; reopen with new evidence if they fail.

### Acceptance

- Loading `isswf-coordinator` through the Skill tool records the coordinator as activated through a `tool.call` hook, so `/isswf-initiatives` opens the pane and the pane renders initiatives while `skill.prompt` is bypassed. `skill.prompt` keeps working where no guard is seated.
- After a compaction, the reminder to reload the coordinator reaches the model through a `SessionStart` hook with matcher `compact` in the plugin's `hooks/hooks.json`, only when the coordinator was activated in that session, on Linux and Windows.
- The loss of the `session.compact` steering where the guard is seated is documented as a known limit.
- English and Spanish guides describe the Team/Enterprise behavior, how to confirm it (`/plugin` note, `claude --debug`), and the administrator option of installing isSWF as an organization mod.
- Tests cover activation through `tool.call`, and the hook script's output with and without a recorded activation.

### Evidence

- 2026-11-16: operator debug log from a Team account on Windows (`/home/iseoane/Work/isswf-team.log`, outside the repository): `cc-plugin-sec-default@builtin seated outermost: the organization is team`; `isswf: skill.prompt bypassed by cc-plugin-sec-default (tier user)`; `isswf: classic.SessionStart bypassed`; `isswf (user) answered command.run without next() in 50.7ms` with no pane opened, since `IS_ACTIVATED` was never set (`hooks/register.tsx:571`, `:623`, `:642`).
- 2026-11-16: the operator's `/plugin` Errors tab: "Its hooks on skill.prompt, session.compact, classic.SessionStart do not run here".
- Related public reports: anthropics/claude-code#103626, oikon48/prompt-rail#69.

## J002

- Status: completed
- Size: S (one flow: how the plugin declares the evidence server's environment)
- Scope: factory (Claude Code plugin manifest).
- Objective: An ordinary Claude Code session with the isSWF plugin, where no review binding is set, no longer reports `mcp-config-invalid` errors for `isswf_git_evidence`; a bound review still receives its binding, and an unbound call still fails closed.
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md) 
- Blocker: None.
- Next step: None. Closed 2026-11-16 by the operator, merged in #339, released in v1.9.4. Reviews V001–V003 pass; the Windows debug-log check was not observed before closing.

### Acceptance

- With `ISSWF_GIT_EVIDENCE_BINDINGS` unset, the debug log of a session with the plugin has no `Missing environment variables` warning or `mcp-config-invalid` error for `isswf_git_evidence`, on Linux and Windows.
- With the variable unset or empty, every evidence tool call still fails closed; with a valid binding set in a `claude -p` reviewer process, the tools still work (`tests/claude-reviewer-tools.mjs`).
- `.agents/hosts/claude-code-review-launch.md` describes the unset case as it now behaves.

### Evidence

- 2026-11-16: the operator's Team log on Windows shows `[WARN] Missing environment variables in plugin MCP config: ISSWF_GIT_EVIDENCE_BINDINGS` and `[ERROR] Plugin MCP server error - mcp-config-invalid` at each plugin load, then `Successfully connected` for the same server.
- `.claude-plugin/plugin.json:22` declares `"ISSWF_GIT_EVIDENCE_BINDINGS": "${ISSWF_GIT_EVIDENCE_BINDINGS}"`; the variable is unset by design outside a bound review (`docs/en/installation.md:114`).
