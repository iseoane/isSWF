# Inspect work without starting agents

[Home](../../README.md) · [Documentation](index.md) · [Español de España](../es/operations.md)

Use the coordinator to understand the next step. The commands below inspect recorded work or open its local panel; they do not call a model. Replace example paths and initiative IDs with existing values. They do not initialise a repository or create a plan.

## Normal host-native work

New ordinary tasks use the host's delegation with shared isSWF roles: Pi with the separately installed `pi-subagents` extension, or Claude Code with native agents. See [host support](../host-portability.md) for the configuration example and boundaries. Configure model and effort in the selected host, not in the legacy executor's route file. A missing extension requires an installation decision, not a new supervisor.

The coordinator supplies scope, working directory, budget and checks, then verifies the actual change. For long work, a supported native background launch returns control while the operator continues the conversation; the coordinator reports the real run identity and consumes its completion/result before dependent actions. Long CI uses a verified completion event or one bounded deferred check, never continuous watching or model polling. Stale or duplicate results require reconciliation, not repeated actions. In Claude Code, directing a live child or continuing a finished one uses only the exact returned agent ID and the host's exposed eligibility, within the original authority and budgets; see [live direction and eligible continuation](../../.agents/hosts/claude-code.md#live-direction-and-eligible-continuation). No compiled factory executable, project runtime pin, external grant file or capacity store is required for this path. Windows and Linux are both targets; report actual host/platform evidence separately. Do not reinterpret existing interrupted runtime jobs as new tasks to bypass claims. The inspection commands below remain available for recorded legacy work.

## From a source checkout

Run from the isSWF repository root:

```bash
node tools/isswf-status.mjs --project /absolute/project --initiative I0001
node tools/isswf-snapshot.mjs --project /absolute/project
node tools/isswf-panel.mjs --project /absolute/project --port 0
```

The first command reads an initiative's plan and supporting records. It exits 1, with the same JSON, when the plan is invalid or changes while it is read (`reason: invalid-or-changing-plan`, with `planError` when the parser says where); every other result, including `unreadable-or-unsafe-plan`, exits 0, because that result can come from the environment (for example a project that is not a Git root) rather than from the plan. The second prints a JSON snapshot of every open initiative; see [initiative snapshot](#initiative-snapshot). The third starts a foreground server on `127.0.0.1` and prints its URL. Stop it with Ctrl-C. It lists initiatives and lets you inspect their jobs, evidence, and recorded decisions.

The panel can record local notes when the displayed evidence still matches. A note is not automatically applied, authenticated operator acceptance, or permission to dispatch work. Do not expose the panel publicly or put secrets in its records.

## Record check

```bash
node tools/isswf-record-check.mjs --project /absolute/project --file /absolute/project/.factory/initiatives/I0001/plan.md --file /absolute/project/.factory/initiatives/I0001/jobs/J001/A001.md
```

`tools/isswf-record-check.mjs` prints `{ ok, files }`, one entry per `--file` with its `violations` (`code`, `message` and, when known, `job`, `field` and 1-based `line`), and exits 1 when any file has one. It only reports: it never edits a file, grants permission or starts work. Each `--file` must be an absolute path to a regular file inside the project. Both `\` and `/` work. `tools/isswf-record-check-core.mjs` has no Node imports and checks one file's text from its path, so a runtime without Node built-ins can call `checkRecord({ path, text, jobFiles })` itself.

- `plan.md`: a plan the plan parser rejects reports the parser's code (for example `invalid-job`) with its job, field and line. A job reported `pending` or `blocked` whose directory holds an `A<nnn>.md` or `V<nnn>.md` record is `records-for-unstarted-job`; the CLI reads each job directory next to the plan for this.
- `A<nnn>.md` and `V<nnn>.md`: a `- Run:` line the snapshot's parser would ignore is `run-line-unparsed`, and one with `unknown` as its ID is `run-id-unknown` (the template says to omit the line). A record without a template label is `missing-field` with the exact label: `Deviations from required procedure and consequence:` and `Process deviations observed:` in an attempt, and `Unreviewed areas and evidence limits:`, `Convergence advice:` and `Process deviations observed:` in a review.
- Other files are not checked.

### Automatic check after a write

When an Edit, Write or MultiEdit (Claude Code) or an edit or write (Pi) leaves a plan, attempt or review record under `.isswf/initiatives/` or `.factory/initiatives/` with a violation, the same check runs and the model sees each violation (code, job, field and line) in the same turn. The tool result is not changed or withheld, a clean write adds nothing, and the check only reports: it never edits a file, blocks a write or starts work. In Claude Code it applies to the main session and to delegated agents, whether or not the initiatives pane is on. In Pi it applies to the main session through the package and to the worker agent through `subagentOnlyExtensions` (the planner and researcher are read-only); a project setting that overrides that list replaces it instead of merging, so keep `tools/isswf-record-guard-pi-extension.mjs` in the override. A failure of the check itself reports nothing.

## Dispatch guard

Before a delegation to an isSWF role agent starts, the host checks it and refuses it when a condition fails, naming that condition. In Claude Code the plugin's `tool.call` hook checks each `Agent` call, with or without the initiatives pane. In Pi the package extension `tools/isswf-dispatch-guard-pi-extension.mjs` checks each `subagent` call of the main session, including its `tasks` and `chain` forms. Only agents named `isswf-<role>` or `isswf:isswf-<role>` are checked; every other agent runs as before. In Pi one refused isSWF role blocks the whole `subagent` call, including its other children. The shared rules live in `tools/isswf-dispatch-guard-core.mjs`, which has no Node imports.

The project's approved model and effort are kept in `<state directory>/dispatch-selection.json` (`.factory/` or `.isswf/`), one entry per agent under its host (`claude` or `pi`). Each entry has its own model and effort, so you can use or mix agents and hosts freely, and the same bare name can carry a different model on each host; there is no fallback order and no per-host default. Edit any entry by hand. `isswf-setup` writes the file when you confirm the defaults.

```json
{
  "schemaVersion": 1,
  "agents": {
    "claude": {
      "isswf:isswf-worker": { "model": "sonnet", "effort": "medium" },
      "isswf-worker": { "model": "sonnet", "effort": "medium" }
    },
    "pi": {
      "isswf-worker": { "model": "openai-codex/gpt-6.1-sol", "effort": "medium" }
    }
  }
}
```

An entry is named exactly as a dispatch names the agent. Claude Code has both `isswf:isswf-worker` and `isswf-worker`. The call must carry the same values: in Claude Code its `model` and `effort`; in Pi `model` as `<model>:<effort>`, for example `openai-codex/gpt-6.1-sol:medium` (a model id may contain `:`, so only a final thinking level is the effort).

The guard refuses when any of these fails:

1. The agent is an isSWF role agent. Otherwise the call is allowed unchanged.
2. The selection file exists and parses, the agent has an entry under this host (a missing host or agent is "no entry for this host"), and the call's model and effort are present and equal that entry's. The message says which value is missing or different and what the file expects.
3. The prompt names the job's brief as `.../initiatives/<I>/jobs/<J>/brief-r<n>.md` and gives the full 40-character SHA of the document-input checkpoint after the word "checkpoint" and of the target base after the word "base".
4. The initiative plan parses and the job is `in-progress`.
5. The brief exists, is tracked by Git, is not Git-ignored (also when it was force-added) and is committed at the named checkpoint (`git cat-file -e <checkpoint>:./<brief>`, resolved from the project directory). The guard does not check that the base SHA exists; a missing checkpoint is refused through this commit check. Claude Code runs Git through the host's process call and Pi through `git`; if Git cannot run, the guard refuses.

A line that starts with `Override: model=<m> effort=<e>` in the prompt replaces the entry's model and effort for that one call. Only one such line is accepted, and conditions 3 to 5 still apply.

The guard only refuses. Passing it is not an authorization and is never recorded or reported as one: the grant, the budget and the other coordinator rules still apply. It does not check that the SHAs exist or that the brief is unchanged since the checkpoint. The project is the session's working directory. If the guard itself fails, it refuses the isSWF role call with `dispatch guard error: <message>` and never affects another agent (in Pi, a failure blocks the whole call that names an isSWF role). Pi management actions that name no isSWF role agent, workflow scripts and slash commands do not go through it.

## Shell command guard

Before a shell command runs, the host checks it and refuses it when it waits on CI continuously or acquires packages. The refusal names the rule and the documented alternative, and says it is not a retry signal: do not rephrase the command to get past it. In Claude Code the plugin's `tool.call` hook checks each `Bash` and `PowerShell` call of the main session and of delegated agents, with or without the initiatives pane. In Pi the package extension `tools/isswf-command-guard-pi-extension.mjs` checks each `bash` and `powershell` call of the main session, and the worker agent, the only role with a shell, loads it through `subagentOnlyExtensions` next to the record guard; a project setting that overrides that list replaces it instead of merging, so keep both entries. Commands you type yourself with Pi's `!` are not guarded. The tokenizer and the rules live in `tools/isswf-command-core.mjs`, which has no Node imports.

The guard splits a command on `&&`, `||`, `;`, a single `&`, `|` and newlines after setting aside heredocs, comments and quoted text, so text that only mentions a refused command, such as a commit message that contains `npx`, is not refused. It drops leading variable assignments and these prefixes: `sudo`, `env`, `command`, `exec`, `nohup`, `nice` (with an optional `-n N`), `xargs` (with its flags), `cmd /c` and `timeout <n>`. `timeout /t N` is not a prefix; it counts as a sleep. It compares a command by its lower-case name without its directory, `.cmd`, `.exe`, `.bat` or `.ps1`. Redirections such as `2>&1`, `> file` and `2>/dev/null` are not arguments.

It refuses:

- **CI waiting** (`ci-waiting`): `gh pr checks` with `--watch`, `gh run watch`, `watch` running `gh`, any loop that contains both a sleep (`sleep`, `Start-Sleep`, `timeout /t`) and `gh` (`while`, `until` and `for` in Bash; `while`, `do`, `for`, `foreach` and `ForEach-Object` or `%` with a braces body in PowerShell; `select` is not a loop, and a loop word with no body does not stay open), and a `gh` command that follows more than 900 seconds of sleep in the same command. The alternatives are a native completion event, one bounded deferred check, or reporting CI as pending, as `.agents/roles/references/feature-delivery.md` describes.
- **Package acquisition** (`package-acquisition`): `npx`, `bunx`, `uvx`, `corepack`, `npm install`, `i`, `add`, `ci`, `exec` and `x`, `pnpm dlx`, `add`, `install`, `i` and `exec`, `yarn dlx`, `add`, `install` and bare `yarn`, `pip` or `pip3 install`, `python`, `python3` or `py -m pip install`, `uv pip install`, `uv tool install`, and `bun add`, `install`, `i` and `x`. The alternative is the installed local ESLint and Knip commands in [the development guide](development.md#quality-checks).

It allows one bounded check, which is sleeping at most 900 seconds in total and then running one `gh pr checks`, with no loop. It also allows the two documented locked installs, `npm ci --prefix tooling/quality --ignore-scripts` and `npm ci --prefix tooling/host-tests --ignore-scripts`, in any flag order, with optional `--no-audit` and `--no-fund` and no package arguments. The prefix may also be an absolute path that ends in `/tooling/quality` or `/tooling/host-tests` (backslashes count as slashes) and has no `.` or `..` segment. The guard has no project root, so it does not check that an absolute prefix is inside the project. Redirections such as `2>&1 | tail -5` or `> ci.log` may follow. `node <path>`, `npm run`, `npm test` and installed local tools run as before. A sleep length the guard cannot read, such as a variable, counts as zero. A loop that pairs any `gh` command with a sleep is refused, even when it only spaces out calls.

This guard reduces mistakes; it is not a sandbox, and it enforces a process rule, not an authority. If the guard itself fails, the command is allowed, because failing closed would block every shell call. Its reading of quotes and comments is simple: it pairs quotes and recognizes comments without a full shell grammar, and it recognizes heredoc delimiters made only of letters, digits and underscores, so an unusual quoting or delimiter can hide a command or expose text. Wrappers other than the prefixes above are not unwrapped. A command can evade it through `eval`, `bash -c`, `sh -c`, `pwsh -c` or `node -e`, aliases, functions, sourced scripts, command substitution inside quotes, a variable used as a command name, a quoted command line such as `watch "gh pr checks"`, a script that polls, repeated separate calls, background tools or `curl | sh`. Treat those as breaches of the rule, not as permitted alternatives.

The guard does not restrict `cd`. Claude Code 2.1.325 resets a standalone `cd` at the end of the call (observed on Windows with Git Bash), so a shell `cd` does not persist there. That is version-dependent host behavior, not something this guard provides. Pi starts each `bash` call in a new process, so a `cd` never persists either.

## Branch guard

Before a shell command runs, the host checks that a `git commit` would land on the branch the session selected. When the checkout is on another branch, for example because a person, a peer session or an agent switched it, the guard refuses the commit and names both branches. It only compares: it never switches branches, stashes or resets anything. It is a process rule, not an authority, and its refusal is not a retry signal.

- **Where it runs.** In Claude Code, the same `tool.call` hook as the shell command guard checks each `Bash` and `PowerShell` call of the main session and of delegated agents, after the command guard and before the call, with or without the initiatives pane. It reads the branch with `git` (through the host), falls back to reading `HEAD` from the files, and keeps the expected branches in the plugin state. In Pi, `tools/isswf-command-guard-pi-extension.mjs` refuses on `tool_call`, looks again on `tool_result` and starts afresh on `session_start`. It reads `HEAD` from the files with `node:fs`, so it needs no process per call, and the worker agent loads it like the command guard. The logic is in `tools/isswf-branch-guard-core.mjs`, which has no Node imports; the `git` parsing is in `tools/isswf-command-core.mjs`.
- **The expected branch.** The guard keeps one per agent loop (the main session, and each delegated Claude agent by its agent id; one per Pi session) and per repository, keyed by its top-level directory. A linked worktree is its own repository. The first time a loop runs a shell command that touches a repository, the guard records the branch the checkout is on. After every call of the loop that contains `git switch` or `git checkout` in that repository, the guard reads the checkout again and adopts what it finds, whatever the call's outcome: a failed switch and `git checkout -- <file>` adopt the branch the checkout is on. A detached HEAD is expected as detached, whatever commit it is on.
- **What it refuses.** A `git commit` with any options and any global option (`-C`, `-c`, `--git-dir`, `--work-tree`, `--no-pager`) on a checkout whose branch differs from the expected one. The checkout it looks at is the `-C` directory, else the directory an earlier `cd` or `pushd` in the same command set, else the session directory; `--git-dir` or `--work-tree` makes it the given repository. Text that only mentions a commit, such as a commit message or a `gh pr create --body`, is not a commit. A commit on the expected branch, and every other command, runs unchanged.
- **How to continue.** The refusal names the current and the expected branch and says that another actor may have switched the checkout. Re-select the branch with your own `git switch <expected>`, or adopt the current one on purpose with `git switch <current>` (`git switch --detach` for a detached HEAD). A `git switch main && git commit` in one command runs, because the switch re-selects the branch.

The guard fails open: if it cannot read the branch, cannot read or write its state, or fails itself, it allows the command and leaves the expected branches as they were. A command whose directory it cannot read, such as one given by a variable, `~`, `-` or quoted text with spaces, or an MSYS-style path such as `/c/repo`, runs unchecked.

Known limits:

- Only `git commit` is checked. `commit-tree`, `update-ref`, `merge`, `rebase`, `cherry-pick`, `revert`, `am`, `stash`, `pull` and `reset` are not.
- Aliases, scripts, `eval`, `bash -c` and commands built from variables are not parsed. Commands you type yourself with Pi's `!` are not guarded.
- The guard compares before the call. A peer switch that lands inside the same chained command is not seen, and after a `git switch` or `git checkout` the guard adopts whatever branch the checkout is on, including one a peer switched to meanwhile. Parallel Pi tool calls can interleave.
- The first look at a repository adopts the branch it is on, so a session's first command that runs after a peer switch is not refused.
- A rename of the current branch (`git branch -m`) or an operation in progress that detaches HEAD, such as an interactive `rebase` stop or `bisect`, makes the next `git commit` look like a switch. Adopt the state with the `git switch` command the refusal names; the guard reads the checkout after that call even if Git refuses it.
- A child that Claude Code starts in its own worktree is judged against the session directory unless its command names the directory. `--git-dir` pointing at a linked worktree's private directory is read as the main checkout. Pi reads `HEAD` from files, so a repository that stores references in the reftable format is not checked there.

## Plan edit

```bash
node tools/isswf-plan-edit.mjs set --project /absolute/project --initiative I0001 --job J001 --field Status --value in-progress
node tools/isswf-plan-edit.mjs append-evidence --project /absolute/project --initiative I0001 --job J001 --value "2026-11-15: focused test passed"
node tools/isswf-plan-edit.mjs add-job --project /absolute/project --initiative I0001 --job J002 --objective "Outcome" --depends-on J001 --size "S (one flow)" --next-step "Prepare a brief." --acceptance "Observable outcome"
node tools/isswf-plan-edit.mjs new-plan --project /absolute/project --initiative I0002 --title "Title" --type enhancement --job J001 --objective "Outcome" --depends-on None --size "S (one flow)" --next-step "Prepare a brief." --acceptance "Observable outcome"
```

`tools/isswf-plan-edit.mjs` edits `<state directory>/initiatives/<ID>/plan.md` so that a plan job field is not hand-written. `set` changes `Status`, `Blocker` or `Next step`. `append-evidence` adds an evidence item. `add-job` appends a `pending` job with a pending brief reference (`--depends-on` is `None` or `J1,J2`, and `--acceptance` repeats). `new-plan` creates a plan with its first job and refuses an existing plan. It writes a complete temporary file and links it into place, so a plan that appears meanwhile is not replaced. Every subcommand needs the project directory and its `.isswf` or `.factory` state directory to exist already (`state-not-found` otherwise) and never creates them. Each value is one line and is written verbatim. Every result is read back with `parsePlan`: a request that would produce an invalid plan, or a plan that another writer changed meanwhile, prints `{ ok: false, code, ... }` and exits 1 with the plan unchanged. Success prints `{ ok: true, initiative, job, action }` and exits 0. Line endings and every other byte are kept, and both `\` and `/` work in the project path.

The command grants nothing: it reads no grant file and does not replace `tools/isswf-plan.mjs`, which renders a whole plan from a proposal. It does not lock the plan, so hand edits stay valid and `tools/isswf-record-check.mjs` still checks them. The check that the plan did not change runs just before the rename, so a writer that lands in that instant can still be overwritten.

## Initiative snapshot

`tools/isswf-snapshot.mjs` reads every initiative under the active state directory (`.isswf` or `.factory`) and prints one JSON object with `schemaVersion: 1`, `project`, `stateDir`, `initiatives`, `unopened` and `skipped`. It is read-only and calls no model or network. It wraps `tools/isswf-snapshot-core.mjs`, which has no Node imports and does every read, including the state-directory choice, through an injected object with async `exists`, `list`, `stat` and `read`. Runtimes without Node built-ins import the core and call `readSnapshot(project, fs)` with their own `fs`. The Node wrapper's `readSnapshot(project, fs)` defaults `fs` to Node and also applies the regular-directory check from `tools/project-state.mjs`, which the core cannot do.

- Initiatives whose jobs are all `completed` are omitted. Those whose jobs are all `pending` without records appear in `unopened` with `id` and `title` only.
- Each other initiative has `id`, `title`, `type`, `status` (`parsed` or `unparsed`) and `jobs`. A plan rejected by the plan parser is `unparsed` with no jobs and a `planError`: the parser's `code` and, when known, the `job`, `field` and 1-based `line` that broke it.
- Each job has `id`, `status`, `objective`, `dependsOn`, `issues` and `prs` (numbers cited in its next step, evidence or `delivery.md`), `recordCount` and `rounds`. Each round has `round` (the `brief-r<n>.md` revision), `reviewRound` and `entries`, and only rounds with records appear. Records go to the brief they cite, otherwise the latest, otherwise `unknown`. Within a brief, the k-th review is `reviewRound` k; an attempt is round 1 unless it states `Review round: <n>`, so a correction attempt should state its round. The review template's job-wide round field is not used. An unknown brief is labelled `r?`.
- Each `A<nnn>`/`V<nnn>` record entry has `id`, `kind` (`attempt` or `review`), `role`, `model`, `modelSource` (`actual`, `requested`, `approved` or `stated`), `effort`, `verdict` (`passed`, `changes-requested`, `failed`, `partial` or `running`), `outcome` (the record's stated `complete`, `partial`, `blocked`, `failed` or `cancelled` value), `round` and `roundSource` (`stated` or `latest`). Values not stated explicitly in the record are `unknown`.
- Each entry also has `runs`: one `{ host, kind, id }` per [`Run:` line](../durable-work.md#record-the-launch-identity) in the record (`claude`/`agent`, `claude`/`session` or `pi`/`child`), or an empty array. Malformed lines are ignored. This field was added without changing `schemaVersion: 1`, because existing fields are unchanged.
- `outcome` is read from a `Reported status`, `Status`, `Outcome`, `Estado` or `Resultado` line whose value ends the line or clause. `blocked`, `failed` and `cancelled` make the verdict `failed`, `partial` makes it `partial`, and an attempt with another stated outcome is `passed`; an attempt without one is `unknown`. Review verdicts are otherwise read from English or Spanish labels (`aggregate`/`agregado`, `verdict`/`veredicto`, `changes requested`/`cambios pedidos` or `cambios solicitados`).
- `role` prefers a shared role file named on an identity line (`Profile`, `Role`, `Agent`, `Observer`), so a diagnostician run as the worker agent reads as `diagnostician`; an identity line naming `isswf-coordinator/SKILL.md` or "coordinator acting as writer" reads as `coordinator`; otherwise the first role file or `isswf-<role>` agent name in the record.
- The `failed` and `partial` verdicts, `outcome`, the round filter, `reviewRound` and the `coordinator` role were added without changing `schemaVersion: 1`; a reader must treat a verdict value it does not know as `unknown`.
- Files over 1 MB or unreadable are listed in `skipped`; one bad record never aborts the snapshot. Both or no state directory, or a missing `initiatives` directory, is an error.

### Run usage

`--usage` adds `usage` to every `runs` entry; without it the snapshot does not open any transcript:

```bash
node tools/isswf-snapshot.mjs --project /absolute/project --usage
```

It reads the local transcripts the hosts already write, read-only and without model calls. `tools/isswf-run-usage-core.mjs` holds the logic with no Node imports; runtimes without Node built-ins call `addRunUsage(snapshot, { fs, claudeDir, piDir, cache })` or `resolveRunUsage(run, { fs, claudeDir, piDir, project, cache })` with their own `fs`. The wrapper uses `CLAUDE_CONFIG_DIR` or `~/.claude`, and `PI_CODING_AGENT_DIR` or `~/.pi/agent`.

- `claude agent=<id>`: `projects/*/*/subagents/agent-<id>.jsonl` under the Claude directory. `claude session=<id>`: `projects/*/<id>.jsonl`. Every project directory is searched, so runs launched from a worktree are found too.
- `pi child=<id>`: the single `<id>_*_transcript.jsonl` in `sessions/*/subagent-artifacts` under the Pi directory or in the project's `.pi/subagents/artifacts`. Children written to Pi's temporary artifact directory are not found.
- `usage` has `found`, `finished`, `model` (`mixed` when several), `tokens` (`input`, `output`, `cacheRead`, `cacheWrite`), `durationMs` (first to last transcript timestamp), `skills` and `agentsReads` (counts per skill name and per path from `.agents/`), and `usedSkills` and `usedReferences`, the methodology the run used: skills it invoked with the `Skill` tool, plus the `.agents/` skills and references that it read and that its prompt or a brief it read names (by the path from `.agents/` or from the parent folder, either separator, or a skill by its bare name), or that a file so named links to directly (on Pi, whose prompt is redacted, the agent's system sections also count as its assignment), except files the run itself edited.
- `costUsd` prices `tokens` with `tools/isswf-prices.mjs` (Anthropic first-party API prices listed in Claude Code's claude-api reference, dated 2026-11-03; 5-minute cache writes; Claude Haiku 5.5 at its rate for prompts up to 100K tokens, so longer prompts are underestimated). It is `unknown` when `model` is not an exact entry of that table, which covers Pi and non-Anthropic models, `mixed` and `unknown`. A run with `tokensPartial` and a known cost adds `costPartial: true`. It is an estimate from recorded counters, not billing.
- Claude tokens come from the same transcript parser as `tools/token-native-claude-transcript.mjs`, each request counted once, plus the extra iterations a request records for server-side calls such as the advisor (their model joins `model`). They cover only that run's own transcript: a session excludes its subagents, and Claude's auxiliary calls that write no transcript entry (for example small Haiku calls) are missing. Pi tokens add the per-message usage of the child transcript.
- A skill load is a `Skill` tool call (without its `<plugin>:` prefix), or a read of a `SKILL.md` file (named after its directory). `agentsReads` counts the hosts' file-read tool calls only; shell reads are not seen.
- A run is finished when its `claude -p` session has a `cost-state` entry with no later `user` or `assistant` entry, its Claude agent's final reply is `end_turn`, or its Pi child has a `_meta.json` with an `exitCode`. For an oversized transcript, `finished` is still decided from the whole file.
- When the transcript is not found, the id is invalid, or several Pi transcripts match, `found` is `false`, `reason` is `transcript-not-found`, `invalid-id` or `ambiguous-transcript`, and every other field is `unknown`. A transcript that is found but has invalid lines or exceeds 64 MB still sums its valid entries (only its complete lines within roughly the first 64 MB when oversized; the limit counts characters, not bytes) and adds `tokensPartial: true` with the first failing check in `reason`. A found but unreadable transcript has `found: true`, `reason` `unreadable-transcript`, and every other field `unknown`. An incomplete last line is ignored.
- `cache` is a `Map` the caller owns and keeps between calls; nothing is written to disk or to the initiative records. A finished run is stored under host, kind and id with its transcript size and reused while the size is unchanged, because continuing a run appends to its transcript. Unfinished runs are read every time. The command line starts with an empty cache.

## From a prepared installation

`RELEASE` below means the absolute directory of an already prepared, trusted package. It is not a download address. No public release is assumed.

Use `bin/isswf.exe` on Windows. For a retained legacy Node release, follow that release's installation guide and Node prerequisite. These commands do not establish native mutation or isolation support outside Linux.

```bash
RELEASE/bin/isswf inspect --project /absolute/project
RELEASE/bin/isswf locate --project /absolute/project
RELEASE/bin/isswf exec --project /absolute/project -- isswf-status --initiative I0001
RELEASE/bin/isswf exec --project /absolute/project -- isswf-panel --port 0
```

`inspect` shows installation and migration information without changing the project or store. Its `blockers` list includes open legacy attempts, each with the original pin to reconcile them under before migrating. `locate` verifies and locates the selected retained runtime. `exec` uses that project's pinned runtime, not automatically the newest globally installed package. Missing or damaged retained code blocks the operation.

## Create an offline token summary

`tools/token-report.mjs` reports only bounded summaries you explicitly supply, including an automatically captured native Claude receipt after you convert it. It does not inspect host sessions, call a model, or estimate billing. Manually transcribed Pi and Claude summaries are labelled in the input. Keep input files sanitized and local.

Each JSON file has `version: 1`, `mode: "window"`, and `rows`. A row is one independent, nonoverlapping window and contains a bounded opaque `id`, `host` (`pi` or `claude`), `hostVersion`, `model`, `effort`, `taskClass`, `candidate`, `outcome`, nonnegative `accepted` count, provenance (`manual-pi`, `manual-claude`, `native-pi-summary`, or `native-claude-summary`), `scope` (`agent`, `unattributed`, or `tree`), `window`, and `counters` with `input`, `output`, `cacheRead`, and `cacheWrite`. IDs and metadata use 1–128 ASCII letters, digits, `.`, `_`, `:`, `+`, or `-`; use opaque identifiers, never paths or private text. Counters are nonnegative safe integers or JSON `null` for unknown. Categories must be disjoint. Rows sharing a window and outcome repeat the same candidate and acceptance count; the report counts that outcome once, not once per agent. Contradictory declarations for that group are rejected. Cumulative, reset, resumed, and event data must first be converted by the supplier to one bounded, nonoverlapping window; unsupported modes are rejected. Do not combine a tree row with other rows for the same window. Include an unattributed row when coverage is unknown; never invent actor shares. Unknown fields are refused and output contains only the allowlisted summary fields. Optional `durationSeconds`, `requests`, `turns`, `corrections`, and non-additive `reasoning` counters are separately labelled.

Provide a single summary or matched before/after files:

A minimal valid single-row summary is:

```json
{
  "version": 1,
  "mode": "window",
  "rows": [
    {
      "id": "agent1",
      "host": "pi",
      "hostVersion": "1.0",
      "model": "model1",
      "effort": "high",
      "taskClass": "task1",
      "candidate": "candidate1",
      "outcome": "outcome1",
      "accepted": 1,
      "provenance": "manual-pi",
      "scope": "agent",
      "window": "window1",
      "counters": { "input": 100, "output": 20, "cacheRead": 30, "cacheWrite": 5 }
    }
  ]
}
```

Run one summary or compare before/after files:

```bash
node tools/token-report.mjs --input "summary.json"
node tools/token-report.mjs --before "before.json" --after "after.json"
```

The accepted count covers the supplied window, including failed, review, and correction work. The report shows known components, a complete processed total or labelled partial subtotal, cache-read share only when its denominator is known and positive, and tokens per accepted outcome only when all components and a positive acceptance count are known. The report labels tree-only data `aggregate-only`, individual rows `individual`, and missing attribution `unattributed` or `partial`; it does not describe an inclusive tree total as agent attribution. Comparisons match each row by window, actor ID, and outcome identity, then require matching host/version, model/effort, task class, scopes, acceptance counts and category availability. Candidate may differ between the before and after runs. A positive known baseline is required for differences. Otherwise differences are explicitly incomparable or undefined. A lower cache-read share or total alone is not a quality or savings claim. Input is capped at 1 MiB combined and 100 rows; each row is capped at 4 KiB and output at 64 KiB. This is offline arithmetic, not measured live host behavior or billing.

### Normalize supported native summaries

`tools/token-native-summary.mjs` accepts one explicit Pi receipt from the optional source extension or one explicitly supplied Claude final-result JSON. It reads at most 1 MiB combined and emits bounded normalized JSON; it never searches session stores or reads transcripts. A standalone receipt/result is emitted with `mode: "snapshot"`, which the unchanged `token-report.mjs` rejects. Snapshots are cumulative and cannot be used as accepted-outcome windows.

For a Pi report window, supply both cumulative snapshots. The converter requires the same opaque session identity and host version, a start-branch prefix of the end branch, monotone parent/child counters, stable existing child identities and no removed rows or unresolved async children. New child rows contribute their reported attempt counters. If lineage is not established, retain the labelled snapshot or refuse the window; do not add snapshots together.

Claude accepts a window only from two explicit final-result summaries for the same `session_id`, identical model identities and a known caller-declared host version (an `unknown` version is refused). Counters are compared per model and must be monotone; a reset/session change or model-set change is refused. If either boundary lacks a category, its window delta remains unknown. The emitted report contains one inclusive tree row, never additive model/agent rows. A single result—including a resumed cumulative result—remains a snapshot and is rejected by `token-report.mjs`.

Claude tree summaries use only `modelUsage`; they never promote main-loop `usage` or add thinking tokens. Model identities are represented by a stable hash, not names. An optional explicitly supplied `{ "agentOutput": ... }` completed AgentOutput summary is separately normalized as an individual snapshot; each absent numeric category stays unknown, nullable cache fields stay unknown, and malformed present values or asynchronous launches are refused. Prompt, content, worktree and raw agent IDs are filtered or hashed. Individual snapshots remain separate from tree windows. That adapter is grounded in the locked local `@anthropic-ai/claude-code` 2.1.299 declaration only; it does not establish installed Claude 2.1.312 output compatibility or live availability. Neither individual snapshots nor a tree snapshot alone can claim a report window or accepted-outcome efficiency.

```bash
node tools/token-native-summary.mjs --input "pi-receipt.json" --host pi > "pi-snapshot.json"
node tools/token-native-summary.mjs --input "pi-end.json" --start "pi-start.json" --host pi --id task --window task-window --host-version unknown --effort high --task-class implementation --candidate current --outcome task --accepted 1 > "native-window.json"
node tools/token-report.mjs --input "native-window.json"
node tools/token-native-summary.mjs --input "claude-final-result.json" --host claude --host-version 2.1.312 > "claude-snapshot.json"
node tools/token-native-summary.mjs --input "claude-end.json" --start "claude-start.json" --host claude --host-version 2.1.312 --id task --window task-window --effort unknown --task-class implementation --candidate current --outcome task --accepted 1 > "claude-window.json"
node tools/token-report.mjs --input "claude-window.json"
node tools/token-native-summary.mjs --input "claude-agent-output.json" --host claude --host-version 2.1.312 > "claude-agent-snapshot.json"
```

`tools/token-native-pi.mjs` can be loaded as an explicitly enabled project extension. During authorized setup, resolve the trusted factory root separately from the target project and add its absolute `<trusted-factory-root>/tools/token-native-pi.mjs` path to the target project's `.pi/settings.json` `extensions` list; Pi resolves configured paths independently of the project root. Create `<selected-state>/native-usage.json` with an explicit enabled choice and `destination: "native-usage"` inside the existing `.isswf` or `.factory` state root. A new session or `/reload` is required; this does not hot-load the current extension instance. With capture disabled or its opt-in file absent/invalid, the extension makes no cost RPC requests and writes no capture data. When enabled, it takes a baseline at session start and replacement snapshots at Pi `agent_settled` and `subagent:async-complete` boundaries; it does not poll or ask a model to start a capture. The local `native-usage/<opaque-session-id>.json` file retains a baseline, latest snapshot and bounded event snapshots (up to 100 records/1 MiB); automatic failures show a generic Pi status and do not change product work. A per-session exclusive transaction claim serializes cooperating extension instances; a competing claim fails closed, and a claim left by abrupt termination is never automatically removed or recovered. Initial file creation is no-clobber. These are ordinary-writer safeguards, not OS isolation or power-loss guarantees. Counters are host-normalized, not provider-certified; unresolved child coverage is retained. The stored snapshot is not itself an accepted-outcome report: pass the capture file directly to `tools/token-native-summary.mjs --capture <capture-file>` with the actual window metadata, then pass the resulting window to `tools/token-report.mjs`. This source has mock lifecycle tests; Linux native automatic-workflow and Windows native tests are not claimed here.

### Read Claude Code session usage from local transcripts

This is the primary way to get Claude usage without extra tokens. `tools/token-native-claude-transcript.mjs` reads the local transcripts that Claude Code already writes for ordinary `claude` launches, so no helper, telemetry or daemon is needed. It reads only the selected project's directory under `--claude-dir`, `CLAUDE_CONFIG_DIR` or `~/.claude` and never writes there. It emits a `token-report.mjs` window with one `unattributed` row for the parent session and one `agent` row per subagent, plus a counts-only coverage record on stderr.

```bash
node tools/token-native-claude-transcript.mjs --project "/absolute/project" > "claude-session.json"
node tools/token-report.mjs --input "claude-session.json"
```

Use `--session <uuid>` for a session other than the most recent. Only numeric counters and bounded identifiers (model, effort, version, hashed session and agent IDs, safe agent type) are kept; message text, tool data and paths are never copied. Each request is counted once by `requestId`: a repeat with identical counters, in the same file or a later one, is counted once (later-file repeats appear as `crossFileDuplicates`), while a repeat with different counters makes that file invalid. Malformed lines, missing usage and size limits (64 MiB per file, 256 MiB total, 4 MiB per line in bytes, 200,000 entries) also make that file invalid. More than 99 subagent files, a missing parent transcript for `--session`, or no transcript for the project stop the run with a fixed error and no window. An invalid file becomes a row with unknown counters, so the report shows a `partial-subtotal` instead of a silent zero. A trailing incomplete line is tolerated and counted in coverage. The format is undocumented and was observed on Claude Code 2.1.312 on Linux; Windows path handling is covered by fixtures only. When a file fails a format check or the recorded version is not recognised, coverage recommends opening an issue at https://github.com/iseoane/isSWF/issues, through the isswf-issue workflow where available, with the Claude Code version (also recorded from invalid files when present) and failing check names only. Missing, unreadable or oversized files are reported without that recommendation. Totals are host-recorded counters, not billing. The OpenTelemetry capture below remains an optional secondary path.

### Capture Claude Code metrics during a session

Claude capture is opt-in and requires the setup-owned `<selected-state>/claude-native-usage.json` with `version: 1`, `enabled: true`, and a project-local `destination`. Setup instructions are in `isswf-setup`. Launch the installed CLI through the trusted helper to capture that process:

```bash
node /absolute/trusted-factory-root/tools/token-native-claude.mjs -- --model sonnet
```

The helper preserves interactive input/output, permissions, tools, model and auth arguments. It enables only process-local OTLP HTTP/JSON metrics, with logs/traces disabled, and stores bounded allowlisted numeric data on process exit. Sessions started as plain `claude` outside this helper are not captured. Conflicting OTEL/Claude telemetry environment settings fail closed; do not override managed policy. Policy compatibility is not inspected before launch: managed or server-managed settings can redirect exports. After the run the receipt records `exportStatus`: `export-observed` when the loopback receiver accepted at least one validated, authenticated export carrying native Claude token series, or `no-export-observed` when none arrived (cause unknown, for example an endpoint override or a missing final export; never zero usage). An observed export proves local delivery for that run only, not policy compliance or that no other destination received telemetry. The default export interval is the native 60 seconds; setup may set `exportIntervalMs` between 1000 and 60000. Requests with the wrong route or credentials are ignored and counted in `ignoredRequests`. A malformed, oversized (`request-too-large`), over-concurrent (`concurrency-limit`) or conflicting export invalidates the capture, reports its rejection code and retains no receipt. A receiver or child failure is reported separately from the Claude exit. The receipt does not contain prompts or tool output and does not establish per-agent identities. Unknown or absent query categories remain unknown; each native series (resource, instrumentation scope and every point attribute) keeps its own start and end; repeated cumulative exports replace the prior point for that series, an identical repeat is ignored, and a conflict, regression or changed start invalidates the capture.

Convert the retained receipt to an observed-series snapshot with explicit task metadata, then report it or compare it with an earlier snapshot:

```bash
node tools/token-native-summary.mjs --otel "claude-receipt.json" --effort unknown --task-class implementation --candidate current > "claude-snapshot.json"
node tools/token-report.mjs --input "claude-snapshot.json"
node tools/token-report.mjs --before "baseline-snapshot.json" --after "claude-snapshot.json"
```

The snapshot (`mode: "observed-snapshot"`) lists each observed series and per source/model/category values; `main`, `subagent`, and `auxiliary` are query-source categories, not individual agent IDs. Its `observedSubtotal` sums only observed values; `total` stays `null` with `totalStatus: "unknown-coverage"`, because this is not a process, session or workflow total, and no accepted-outcome ratio is computed. Comparison requires matching host, version, effort, task class and observed exports in both snapshots; it matches source/model/category values, lists unmatched ones explicitly, and is labelled `exploratory-coverage-limited`. Native capture and series IDs are provenance, not equality requirements. Plain Claude launch and actual Windows collection are not covered by this helper's capture. Never infer a zero for a missing counter.

## Understand the result

`awaiting-human` means a specific decision is needed, whether during definition, setup, acceptance or PR integration. The record should name the question and what answer allows work to resume; a definition question does not need a delivery first. `blocked` describes a technical condition needing resolution, not automatically a request for your approval. Notes in the panel do not apply either decision; the coordinator reconciles your actual instruction.

A plan status describes recorded work, not a heartbeat or a fresh GitHub query. Missing or inconsistent evidence remains unknown. A completed worker does not prove independent review, operator acceptance, publication, or merge.

Before retrying interrupted work, inspect the actual process identity and partial files. Do not free claims, change stores, or invent a new job ID to bypass an unresolved writer. Execution callers require their own exact inputs, model and budget checks, and current permission. The status command and this guide grant none of them.

For installation and recovery, read [installation](installation.md). Durable records are described in the English [durable records](../durable-work.md) contract. The legacy executor is no longer shipped: an existing legacy attempt is reconciled with its original pinned runtime before the project migrates, and that runtime keeps its own contracts. These are implementation contracts, not a getting-started checklist or permission to reproduce old runs.
