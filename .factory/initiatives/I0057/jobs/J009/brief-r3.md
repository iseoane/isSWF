# I0057/J009 brief-r3: Refuse a commit on a branch the session did not select

## Identity and authorization

- Job and brief revision: I0057/J009, r3.
  - r1 was the research ([A001](A001.md)).
  - r2 was the probe ([A002](A002.md)).
- Request mode: feature-to-PR continuation of I0057, under the operator's standing grant. The merge needs the operator's approval if the change touches `.agents/hosts/**`, `tools/factory-package.mjs` or `tools/build-release.mjs`.
- Operation ownership:
  - The worker edits the paths below, commits on the feature branch and writes `jobs/J009/A003.md`.
  - The coordinator owns the plan, this brief, the reviews, the push, the PR, CI and the merge.
- Profile: `.agents/roles/worker.md`.

## Objective

- Outcome: in Claude Code and Pi, a `git commit` from the session's shell is refused before it runs when the checkout's current branch is not the branch the session expects, naming both branches. The session's own `git switch` or `git checkout` updates the expected branch.
- Size: S, from the plan (one flow, no special risk: compare the branch before a commit).

## Evidence this rests on

- **Claude (A001, A002, J003, observed):**
  - `$.state` keys declared through `PluginState` merging survive a manual compaction.
  - `$.process.run(['git', ...], { cwd })` runs Git from a hooks module with no permission prompt and returns `{ exitCode, stdout }`.
  - A linked worktree's `.git` file holds `gitdir: <absolute path>`, and that directory's `HEAD` holds `ref: refs/heads/<branch>`; both read through `$.fs` on Windows.
  - Child calls reach the parent hook with `agentId`, and a child may work in its own worktree.
  - Since J003, `hooks/register.tsx` runs the command guard for `Bash` and `PowerShell` before `next(e)`, using `tools/isswf-command-core.mjs`. Its `tokenize` returns segments with `words`, `command` and `args`.
  - The host resets a standalone `cd` between calls, so the session directory is `$.session.cwd()` unless a segment of the same command moves it.
- **Pi (A001, J003):**
  - `tool_call` blocks with `{ block: true, reason }`; `tool_result` observes the result.
  - The extension can use `node:fs` or `pi.exec('git', ...)`.
  - The command-guard extension `tools/isswf-command-guard-pi-extension.mjs` already covers `bash` and `powershell` in the main session and the worker child.

## Scope and acceptance

Included:

- **Git parsing in the command core** (`tools/isswf-command-core.mjs`), generic and reusable: for a segment whose command is `git`, return its global options (`-C <dir>`, `-c <k=v>`, `--git-dir=<d>`, `--work-tree=<d>`, `--no-pager`, `-P`, and their `--opt <v>` forms) and its subcommand. Track a directory change made by an earlier `cd <dir>` or `pushd <dir>` segment in the same command, at the same depth.
- **Branch guard core**, for example `tools/isswf-branch-guard-core.mjs`, with no Node imports. It takes the command, the session directory, a function that reads the current branch of a directory, and the expected-branch store. It returns `{ allow }` or `{ deny, reason }` before the call, and a list of directories to re-observe after the call:
  - **Expected branch.** Keyed by agent loop (Claude `agentId ?? 'main'`; Pi one per session) and by the repository's top-level directory. It is set from the current branch the first time the loop runs a shell command that touches that repository, and after every call of the loop that contains `git switch` or `git checkout` in that repository, whatever the call's outcome (A001 finding 2). A detached HEAD is stored as `detached` plus the commit SHA.
  - **Refusal.** A segment `git commit` (any options, any global options) whose target directory's current branch differs from the expected branch is refused. The reason names the current and the expected branch, says another actor may have switched the checkout, and says the guard switches, stashes or resets nothing: re-select the branch with the session's own `git switch <expected>`, or `git switch` to the current one to adopt it on purpose.
  - The target directory is `-C <dir>`, else the directory set by an earlier `cd` segment, else the session directory. `--git-dir` or `--work-tree` makes the target the given repository.
  - A commit on the expected branch runs unchanged.
- **Reading the current branch:**
  - Claude: `$.process.run(['git', 'symbolic-ref', '--short', '-q', 'HEAD'], { cwd })` and `git rev-parse --show-toplevel`, falling back to reading `.git` or the `gitdir:` target's `HEAD` through `$.fs` when the process call fails.
  - Pi: `pi.exec('git', ...)` or `node:fs`, your choice; explain it.
- **Failure mode:** if reading the branch or the guard itself errors, allow the command and do not update the store. This guard enforces a process rule, not an authority. State the limit.
- **Claude:** in the single `tool.call` hook, for `Bash` and `PowerShell`, after the command guard and before `next(e)`; re-observe after `next(e)` returns, without changing `ran`. Store the expected branches in `$.state` through `PluginState` merging. It applies to the main session and children, whether or not the pane option is set.
- **Pi:** extend `tools/isswf-command-guard-pi-extension.mjs` (preferred, so the worker profile needs no new entry) or add a file; `tool_call` refuses, `tool_result` re-observes, and `session_start` clears the session's store.
- **Packaging:** ship any new file like the J003 core, with Knip entries, and make `tools/check-quality.mjs` run any new test.
- **Tests:** `tests/isswf-branch-guard.mjs` (or extend `tests/isswf-command-guard.mjs`), covering:
  - with real Git in temporary repositories on the running platform: a commit refused after a branch switch made outside the session, naming both branches; a commit allowed on the expected branch; the session's own `git switch` (including `-c`, `checkout -b`, and a failed switch) re-observed; `-C <dir>` and `cd <dir> && git commit`; a linked worktree; a detached HEAD;
  - the git global-option parsing, including quoted text and heredocs that mention `git commit` (a commit message, a `gh pr create --body`), which are not commits;
  - separate expected branches for the main loop and a child `agentId`;
  - the Claude event shape and the Pi `tool_call` and `tool_result` shapes, with fakes;
  - the fail-open behaviour.
- **Docs:** `docs/{en,es}/operations.md` describe the branch guard, the refusal and how to adopt a branch, and the known limits. `docs/{en,es}/architecture.md` list any new file.

Exclusions:

- Plumbing and other history-changing commands: `commit-tree`, `update-ref`, `merge`, `rebase`, `cherry-pick`, `revert`, `am`, `stash`, `pull`, `reset`. They are known limits.
- Pi `user_bash`, `.github/workflows/**`, existing records and `.factory/models.json`.
- Never stage the untracked `.agents/skills/project-release/`.

Acceptance (plan J009):

1. A `git commit` from the session's shell on a branch other than the expected one is refused, naming both branches, in Claude Code and Pi, on Linux and Windows.
2. A commit on the expected branch runs unchanged, and so do commits through the commands this guard does not cover, which are named as known limits.
3. The session's own `git switch` or `git checkout` makes the selected branch the expected one; the guard never switches branches, stashes or resets anything.
4. Known limits are listed in the attempt and the operations guide: at least the excluded commands, aliases, scripts, `eval`, `bash -c`, commands built from variables, a peer switch that lands inside the same chained command, parallel Pi calls, a session's first command running after a peer switch, and the fail-open boundary.

Checks (the worker runs them and reports the exact commands and results):

- Focused tests: the new or extended branch-guard test, plus `isswf-command-guard`, `isswf-dispatch-guard`, `isswf-record-guard`, `package-metadata`, `release-package`, `host-portability` and any test the change touches.
- `node tooling/quality/check-docs.mjs`, `git diff --check`, `node tools/check-quality.mjs`, and local ESLint and Knip.
- Live Claude check, as in J009/A002: outside the repository, `--plugin-dir` set to this checkout, haiku, at most 3 invocations, in a throwaway repository. One session with staged turns (held-open stdin and bounded sleeps): the session commits on `main` (allowed); between turns the probe harness runs `git switch -c other` outside the session; the session's next `git commit` is refused naming both branches; the session runs `git switch main` and commits again (allowed). Delete the probe directory and the transcript directory afterwards.
- A live Pi check is optional, with one `pi -e` session.
- Use node, not python, for any scripting.

Methodology:

- isswf-tdd: selected for every behaviour above. Use test-only RED commits, then GREEN commits. Check each RED fails for the intended assertion.
- isswf-writing: selected for the docs. Load it before editing them.

Required references (read each in full and report consumption honestly):

- `AGENTS.md`, `REVIEW.md`, `GLOSSARY.md`, `.agents/roles/worker.md`, `.agents/hosts/claude-code.md`, `.agents/hosts/pi.md`.
- `.agents/skills/isswf-tdd/SKILL.md`, `.agents/skills/isswf-writing/SKILL.md`, `.agents/roles/references/code-quality.md`.
- `docs/en/development.md` "Quality checks".
- `jobs/J009/A001.md`, `jobs/J009/A002.md`, `jobs/J003/V001.md` and `jobs/J003/V002.md` (the tokenizer's known pitfalls).

## Independent review

- Required: yes, Standards and Spec, with a lens on false refusals of legitimate commits and on the expected-branch bookkeeping.
- Reviewer: `isswf:isswf-reviewer`, opus/medium, unbound, given the exact diff file.

## Inputs and bases

- Target base: 204d70770be511fd060cec22d47d24121d8ca3a4 (main after the J003 merge).
- Document-input checkpoint: the commit that adds this brief.
- Plan: `.factory/initiatives/I0057/plan.md`, job J009.

## Dependencies, ownership and budget

- J003 is merged. J005 waits for this job, because both edit the single `tool.call` hook.
- Checkout: the shared-sequential primary checkout, branch `feat/i0057-j009-branch-guard`, one writer.
- Budget: 1 worker, sonnet/medium. Up to 3 review rounds and 2 correction cycles. No automatic retries.
