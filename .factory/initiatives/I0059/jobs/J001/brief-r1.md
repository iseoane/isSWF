# I0059/J001 brief-r1: Coordinator activation and post-compaction reminder survive cc-plugin-sec-default

## Identity and authorization

- Job and brief revision: I0059/J001, r1.
- Request mode: feature-to-PR start (operator, 2026-11-16: "coordinador, ponte con la I0059"). Covers implementation, checks, review, commits, push of `feat/i0059-team-guard`, PR and CI; not the merge.
- Operation ownership: the worker edits the paths below, commits on `feat/i0059-team-guard` and fills `jobs/J001/A001.md`. The coordinator owns plan, brief, reviews and delivery.
- Profile: `.agents/roles/worker.md`.

## Objective

- Outcome: where Claude Code seats `cc-plugin-sec-default` (Team/Enterprise login or managed settings), `/isswf-initiatives` and the pane work after the coordinator skill loads, and the first start after a compaction still tells the model to reload the coordinator.
- Size: M, from the plan.

## Facts (verified by the coordinator)

- The guard never runs a user mod's hooks on `classic.*`, `skill.prompt`, `session.compact`, `prompt.*`, `settings.read` and some `session.append` rows; `tool.call`, `session.start`, `command.run`, `ui.render` run. Settings hooks in a plugin's `hooks/hooks.json` are unaffected. Source: https://code.claude.com/docs/en/plugins/mods/admin, "Know which hooks of a user's mod don't run".
- Operator's Team log (Windows): `skill.prompt` and `classic.SessionStart` bypassed; `command.run` for `/isswf-initiatives` answered in 50 ms without opening the pane because `IS_ACTIVATED` is only set in the `skill.prompt` hook (`hooks/register.tsx:571`, checked at `:623` and `:642`). The log also shows the guard nests a `settings.read` inside our `command.run` (`labelsFor`, `$.settings.read({ key: 'language' })` at `hooks/register.tsx:126`); check whether that read returns a usable value or falls back, and keep a fallback.

## Scope and acceptance

1. **Activation via `tool.call`.** When the `Skill` tool runs `isswf-coordinator` (with or without the `isswf:` prefix; reuse `isCoordinatorSkill`), set `IS_ACTIVATED` and, with the pane option on, open the pane, exactly as the `skill.prompt` hook does. Keep the `skill.prompt` hook for sessions without the guard; both firing must be harmless (idempotent). Find the real `tool.call` event shape for the Skill tool in the existing `tool.call` hook and tests; do not guess field names.
2. **Post-compaction reminder via a settings hook.** Add a `SessionStart` hook with matcher `compact` to the plugin's `hooks/hooks.json` (alongside `modules`; confirm from Claude Code docs that both keys coexist in a plugin hooks file) that runs a Node script under `hooks/` or `tools/`, invoked portably (`node "${CLAUDE_PLUGIN_ROOT}/..."`), on Linux and Windows. It prints the same reminder `compactionReminder` produces (reuse it from `tools/isswf-compaction.mjs`; do not copy) as `additionalContext`, only when the coordinator was activated in that session. The mod must therefore persist activation (and the assignments the reminder lists) somewhere the script can read for that session: choose a per-session file under the plugin data or Claude config directory, keyed by `session_id` from the hook input, and say why. Avoid double reminders where the guard is absent: either the mod's `classic.SessionStart` hook is removed in favor of the script, or one of them yields; state the choice.
3. **`session.compact` limit.** Keep the hook (it works without the guard) and document that where the guard is seated the compaction summary is not steered.
4. **Docs.** `docs/en/operations.md` (Compaction / initiatives pane sections) and its Spanish mirror: Team/Enterprise behavior, how to confirm it (`/plugin` Errors note, `claude --debug`), the `session.compact` limit and the administrator option to install isSWF as an organization mod (link the admin page). Update `.agents/hosts/claude-code.md` only if its compaction sentence becomes wrong.
- Excluded: Pi (no guard there; state it), J002's manifest `env` change, unrelated pane features.
- Checks: `hooks/register.test.tsx` through the repo's existing test command for it, `node tests/isswf-compaction.mjs .` if it exists, a test for the hook script with and without a recorded activation, `node tooling/quality/check-docs.mjs`, `git diff --check`. Windows not runnable here: say so.
- Methodology considered: TDD selected for contracts 1 and 2 (RED test-only commit then GREEN). isswf-writing selected for docs. isswf-security: not selected; the script only reads a session-keyed file the mod writes and prints text, state any path validation you add.

## Independent review

- Required: yes, one Agent-tool reviewer round. Budget: at most 2 review rounds and 1 correction cycle.

## Inputs and bases

- Target base: 48819253ba758b92784a1ce58562033a4f2f9fb5 (main); J002's commits may precede yours on the branch. Document-input checkpoint: the commit that adds this brief.
- Plan: `.factory/initiatives/I0059/plan.md`, job J001.

## Execution

- Checkout: `/home/iseoane/Work/isSWF`, branch `feat/i0059-team-guard`, shared-sequential, sole writer while you run.
- Model and effort: worker sonnet/medium from `.factory/dispatch-selection.json`. One worker call, no retries. Do not push or open PRs.
