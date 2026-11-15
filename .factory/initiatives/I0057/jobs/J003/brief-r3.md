# I0057/J003 brief-r3: Shell guard for CI waiting and package acquisition

## Identity and authorization

- Job and brief revision: I0057/J003, r3.
  - r1 was the research ([A001](A001.md)).
  - r2 was the probe ([A002](A002.md)).
- Request mode: feature-to-PR continuation of I0057, under the operator's standing grant. The merge needs the operator's approval, because the change touches `.agents/hosts/**`, `tools/factory-package.mjs` and `tools/build-release.mjs`.
- Operation ownership:
  - The worker edits the paths below, commits on the feature branch and writes `jobs/J003/A003.md`.
  - The coordinator owns the plan, this brief, the reviews, the push, the PR, CI and the merge.
- Profile: `.agents/roles/worker.md`.

## Objective

- Outcome: in Claude Code and Pi, a shell command from the coordinator or a child that waits on CI continuously, or that acquires packages, is refused before it runs. The refusal names the rule and the documented alternative.
- Size: M, from the plan (three related command patterns, with one bounded risk: refusing legitimate commands).

## Evidence this rests on

- **Claude (A001, A002, observed):**
  - A `tool.call` event for `Bash` carries the command in `e.command`. A separate `PowerShell` tool carries it in `e.command` too.
  - `{ deny }` before `next(e)` refuses the call, and the model sees the text.
  - Child calls reach the parent hook with `agentId`.
  - `hooks/register.tsx` has one unmatched `tool.call` hook. Since J004 it also runs the dispatch guard for `Agent` before `next(e)`. Add this guard in the same hook, before `next(e)`, and keep the pane, record-guard and dispatch-guard behaviour.
  - The host resets every standalone `cd` on Claude Code 2.1.325, so the plan's `cd` acceptance is met natively on this version.
- **Pi (A001, observed):**
  - A `tool_call` handler blocks `bash` with `{ block: true, reason }`. The command is `event.input.command`.
  - Each bash call is a new process, so a `cd` never persists.
  - User `!` commands are a separate `user_bash` event. They are the operator's own and are not guarded.
  - Only the worker profile has `bash`. It already declares `subagentOnlyExtensions: ../../../../tools/isswf-record-guard-pi-extension.mjs`. Check in Pi's documentation or code whether that field takes a list. If it does not, put this guard in the record-guard extension module instead of adding a second entry, and say which you chose.
  - Pi may ship a `powershell` tool (`extensions.md:2360`). Cover it only if it exists in the installed Pi; say what you found.

## Scope and acceptance

Included:

- **Shared core `tools/isswf-command-core.mjs`**, with no Node imports:
  - A tokeniser that strips heredocs and quoted text, then splits a command into segments on `&&`, `||`, `;`, `|` and newlines. Move the `HEREDOC` and `QUOTED` patterns from `hooks/register.tsx:266-267` into it, and make the pane's existing use import them, unchanged in behaviour.
  - Each segment has its words, its subshell or loop depth, and whether it is inside a loop (`while`, `until`, `for` in Bash; `while`, `do`, `for`, `foreach` in PowerShell).
  - Strip leading variable assignments and the `sudo`, `env`, `command` and `exec` prefixes. Normalise a command's basename, dropping `.cmd` and `.exe`.
  - J009 will extend this core for git commands, so keep its output generic.
- **Rules**, each a predicate over the segments that returns `{ rule, reason }`. The first match refuses:
  1. **CI waiting.**
     - Refuse `gh pr checks` with `--watch`, `gh run watch`, `watch` with `gh`, and any loop that contains both a sleep (`sleep`, `Start-Sleep`, `timeout /t`) and `gh`.
     - Allow one bounded check: one sleep of at most 900 seconds followed by one `gh pr checks`, with no loop. A sleep above 900 seconds before `gh` is refused.
     - The refusal names the alternatives in `.agents/roles/references/feature-delivery.md`: a native completion event, one bounded deferred check, or reporting CI as pending.
  2. **Package acquisition.**
     - Refuse `npx`, `bunx`, `uvx`, `npm install|i|add|ci|exec|x`, `pnpm dlx|add|install|i|exec`, `yarn dlx|add` and bare `yarn`, `pip|pip3 install`, `python|python3|py -m pip install`, `uv pip install`, `uv tool install`, `bun add|install|x`, and `corepack`.
     - Allow the documented locked installs: `npm ci --prefix tooling/quality --ignore-scripts` and `npm ci --prefix tooling/host-tests --ignore-scripts`, with no package arguments, in any flag order.
     - Allow `node <path>`, `npm run`, `npm test` and already installed local tools such as `node tooling/quality/node_modules/eslint/bin/eslint.js`.
     - The refusal names the installed local ESLint and Knip commands from `docs/en/development.md` "Quality checks".
  - Every refusal says it is not a retry signal: do not rephrase the command to get past the guard.
- **Failure mode:** if the guard itself errors, allow the command. This guard enforces a process rule, not an authority, and failing closed would block every shell call. State this limit.
- **Claude:** in the single `tool.call` hook, for `tool === 'Bash'` and `tool === 'PowerShell'`, before `next(e)`. It applies to the main session and to children, whether or not the pane option is set.
- **Pi:** a `tool_call` handler for `bash` (and `powershell` if it exists) in the main-session package extension, and in the worker child through `subagentOnlyExtensions` as described above. Keep `package.json` `pi.extensions` and the worker profile consistent.
- **`cd` rule:** out of scope. Record in `docs/en/operations.md` and `docs/es/operations.md` that Claude Code 2.1.325 resets a standalone `cd` itself, and that this is version-dependent host behaviour, not a guarantee of this guard.
- **Packaging:** ship the new core like the J004 core: `tools/factory-package.mjs`, `tools/build-release.mjs` if needed, and the release and metadata tests. Add Knip entries, and make `tools/check-quality.mjs` run the new test.
- **Tests:** a new `tests/isswf-command-guard.mjs`, covering:
  - every refused and allowed form listed above, for Bash and PowerShell text;
  - quoted and heredoc text that mentions a refused command is not refused (for example a commit message that contains `npx`);
  - the 900-second bound, at 900 and 901;
  - the Claude event shape for `Bash`, `PowerShell` and a child `agentId`, and the Pi `tool_call` shape, with fakes;
  - the fail-open behaviour;
  - the pane's heredoc handling is unchanged after the move.
- **Docs:** `docs/{en,es}/operations.md` describe what the guard refuses, the allowed forms, and the known limits. `docs/{en,es}/architecture.md` list the new files. Add a glossary term only if a new product concept appears.

Exclusions:

- The `cd` matcher, Pi `user_bash`, and git-commit rules (J009).
- `.github/workflows/**`, existing records, and `.factory/models.json`.
- Never stage the untracked `.agents/skills/project-release/`.

Acceptance (plan J003):

1. Continuous CI waiting is refused with the documented alternatives, in Claude Code and Pi. One bounded check is allowed.
2. Package acquisition is refused, while the documented locked installs and already installed local tools still run.
3. The `cd` acceptance is recorded as met natively by Claude Code 2.1.325 and not applicable to Pi, as version-dependent evidence.
4. Commands that evade these patterns are listed as known limits in the attempt and in the operations guide: at least `eval`, `bash -c`, `sh -c`, `pwsh -c`, aliases, functions, sourced scripts, command substitution, variables used as command names, scripts that poll, `node -e`, repeated separate calls, background tools and `curl | sh`.

Checks (the worker runs them and reports the exact commands and results):

- Focused tests: `node tests/isswf-command-guard.mjs .`, plus `isswf-dispatch-guard`, `isswf-record-guard`, `package-metadata`, `release-package`, `host-portability` and any test the change touches.
- `node tooling/quality/check-docs.mjs`, `git diff --check`, `node tools/check-quality.mjs`, and local ESLint and Knip (the installed commands in `docs/en/development.md`).
- Live Claude check, as in J003/A002: outside the repository, `--plugin-dir` set to this checkout, haiku, at most 3 invocations. Cover:
  - a refused `gh pr checks 1 --watch`;
  - a refused `npx --version`;
  - an allowed `node --version`;
  - one refused PowerShell command, if the PowerShell tool is available.

  Delete the probe directory and the probe-session transcript directories afterwards.
- A live Pi check is optional, with one `pi -e` session.
- Use node, not python, for any scripting. Python heredocs hung in earlier worker shells.

Methodology:

- isswf-tdd: selected for every rule and allowed form. Use test-only RED commits, then GREEN commits.
- isswf-security: selected, light. This guard reduces mistakes; it is not a sandbox. List the evasions as limits.
- isswf-writing: for the docs.

Required references:

- `AGENTS.md`, `REVIEW.md`, `GLOSSARY.md`, `.agents/roles/worker.md`, `.agents/hosts/claude-code.md`, `.agents/hosts/pi.md`.
- `.agents/skills/isswf-tdd/SKILL.md`, `.agents/skills/isswf-security/SKILL.md`, `.agents/roles/references/code-quality.md`, `.agents/roles/references/feature-delivery.md`.
- `docs/en/development.md` "Quality checks".
- `jobs/J003/A001.md`, `jobs/J003/A002.md`, `jobs/J009/A001.md` (finding 5), and the J004 guard files as the integration pattern.

## Independent review

- Required: yes, Standards and Spec, with a lens on false refusals of legitimate commands.
- Reviewer: `isswf:isswf-reviewer`, opus/medium, unbound, given the exact diff file.

## Inputs and bases

- Target base: e2a66a2378b5884256ee5f894aa5528d8df90a3a (main after the J004 and AGENTS.md merges).
- Document-input checkpoint: the commit that adds this brief.
- Plan: `.factory/initiatives/I0057/plan.md`, job J003.

## Dependencies, ownership and budget

- J004 is merged. J009 and J005 wait for this job, because all three edit the single `tool.call` hook and J009 extends this core.
- Checkout: the shared-sequential primary checkout, a new branch `feat/i0057-j003-shell-guard`, one writer.
- Budget: 1 worker, sonnet/medium. Up to 3 review rounds and 2 correction cycles. No automatic retries.
