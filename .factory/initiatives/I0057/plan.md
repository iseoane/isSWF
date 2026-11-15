# I0057: Deterministic guards for coordinator process rules

Type: enhancement

Operator feedback 2026-11-14 during I0009 on native Windows: the process is not deterministic, because it depends on the coordinator remembering written rules. In one session, seven rules held only in Markdown were broken and nothing checked them in time. Scheduled after I0009. Add executable machinery only where this evidence shows a structural need (AGENTS.md).

Operator decision 2026-11-14: every guard ships in the Claude Code plugin (hooks/, registered through .claude-plugin), with an equivalent Pi extension mirror where Pi supports one. Shared rules live in one tools/ module that both hosts call. A guard a host cannot support is recorded as a gap, never silently skipped.

Re-planned 2026-11-14 after a read-only coordinator audit (Engram observation 4583). The traced incidents (J029; `Brief: None.` in I0055 and I0056) show the rules were correct and, for plans, a checker already existed, but nothing ran it when the mistake was made: only CI did, later. Each job moves an existing rule or check to that moment, in one of three ways: generate the record so the mistake cannot be written, check it when written, or refuse the action before it runs.

Rules for every job:

- A guard only refuses or informs. It never grants permission, starts work or approves an action (AGENTS.md).
- The rule lives in the shared tools/ module; the Claude plugin hook and the Pi extension only call it. A host or platform that cannot support the guard is recorded as a gap in the job's evidence.
- The model has no way to bypass a guard. If an override is needed, it is a command the operator types.
- When a guard ships, the Markdown rule it enforces is reduced to a one-line pointer in the same PR, so each rule has one owner.
- Guards narrow mistakes; they are not containment. Shell paths that evade a guard are named in the job's limits, not claimed as covered.
- When closing each job, the coordinator copies the process deviations its attempt and review records report into the deferred candidates below, with date, rule and cost. Until J008 ships, it records any it observes itself.

Sizing: each job's Size line gives its reason, judged by verification cost (.agents/roles/references/planning.md): S is one flow with no special risk; M is two or three related flows, or one bounded special risk. An L job is split before start. Plan approval is preparation only; each job needs an explicit operator start.

Deferred candidates, without an observed incident yet; add a job only after one is observed: plan and brief edits refused while a writer for that job runs; the hook records which files a child read and which commands it ran, so resource consumption and checks run become observed rather than self-reported; the version advisory and Engram/Codegraph availability computed by a script at coordinator load; `gh issue create` without `needs-triage`; `gh pr merge` without `--match-head-commit` or with `--auto`; a warning at the fourth material brief revision; a pre-commit run of `tooling/quality/check-docs.mjs` and `git diff --check`.

The first observed candidate, a commit made on a branch that another session had switched to, became J009 on 2026-11-14.

Further candidates observed on 2026-11-14, to assess:

- A records commit chained after a failed scripted edit still ran: commits of plan changes should require a passing `isswf-status` read-back (a J001 extension).
- `isswf-status` run outside a Git root reports a generic error, which once led to a wrong claim about its output: the tool should name the missing Git root.
- A brief was committed and its job set in-progress, but the coordinator ended the turn without dispatching: an in-progress job with a committed brief and no recorded `Run:` at turn end could warn.
- Briefs recorded a tool limit ("effort not settable") that the tool schema contradicts: capability claims in briefs could be checked against the host's tool schema.
- `hooks/register.test.tsx` is not run by any CI step or test (J001/A002): any hook guard needs a test that runs.
- A wording correction dropped part of a contract definition, and the phrase tests passed (J008/V002 F4): a record field's definition could have one canonical source, with its key phrases asserted.
- Knip and ESLint are not part of `check-quality`, so a worker's local checks can pass while CI fails (J001 PR327): the worker brief or a pre-push check could run them.
- Unbound review handoffs carry a diff byte count and SHA-256 copied by hand (J008 V001-V003): the handoff could be generated (J002).
- Hand-written records repeat template slips: `Run: claude agent=unknown` instead of omitting the line, and "None." followed by a narrative (J008 A002, A003): J001's validator could flag both.
- A tool's behavior changed, and statements describing the old behavior survived the first correction, because each search covered only some directories (J001 V001 F1, V002 F6): a change to a documented contract could come with a mechanical search of every packaged text for the old statement.

Open operator decision, not blocking any job: under the standing grant recorded in the I0009 plan on 2026-11-14, the coordinator itself classifies a PR's risk before merging it. A guard can require a recorded risk line and green exact-head CI, but cannot judge the risk. Whether an independent reviewer must confirm that classification is a product decision.

Suggested order: J008 and J001 first, then J006 and J004; J002 and J007 after them. J003, J005 and J009 are independent.

## J001

- Status: in-progress
- Size: M (two related flows, the strict status read-back and the validation on write, each on two hosts)
- Objective: Writing initiative records gives immediate, mechanical feedback on plan and record contract violations.
- Depends on: None
- Brief: [brief-r2.md](jobs/J001/brief-r2.md)
- Blocker: None.
- Next step: Integrate brief-r2 (PR from feat/i0057-j001-record-check after green exact-head CI); then run the A002 runtime probes and prepare brief-r3 for the hook and Pi wiring.

### Acceptance

- `isswf-status` exits nonzero for a plan that does not parse, keeping its current `planError` detail (code, job, field and line); a valid plan keeps exit 0 and its current output.
- After an Edit or Write to a plan, brief, attempt or review record under `.isswf/` or `.factory/`, the shared validator runs and any violation reaches the model in the same turn, in Claude Code and Pi, on Linux and Windows.
- The validator checks the strict plan parse, that `Run:` lines match the pane's parser, that a job whose records show a started writer is not left `pending` or `blocked`, and that required record fields are present.
- One shared validator owns the rules and the pane parser reuses it; no rule is duplicated in two places.
- The coordinator skill's plan read-back instruction is reduced to a pointer to the check.

### Evidence

- 2026-11-14: I0055 and I0056 used `Brief: None.`; only CI caught `unsafe-brief-reference` (PR323).
- 2026-11-14 correction to the entry above: replaying the pre-fix I0055 plan in a Git repository, `isswf-status` does detect it (`status: unknown`, `invalid-or-changing-plan`, `planError` `unsafe-brief-reference` at J001 Brief line 12), but it exits 0, so only a reader who checks the output notices. Outside a Git root it reports `unreadable-or-unsafe-plan` even for a valid plan. `tests/plan-records.mjs` catches it in about a second but runs only in CI. Plans written at 20:03 (8566437), fixed at 20:38 (03a24a8).
- 2026-11-14: `Run:` lines with trailing notes in A003, A011 and V006 were silently ignored by the pane (tools/isswf-snapshot-core.mjs:116).
- 2026-11-14: J029 stayed `blocked` while its worker, review and PR ran, so the pane's quota-resume prompt (hooks/register.tsx:165) never armed.
- 2026-11-15: brief-r2 candidate 5f34fdf passed review round 3 ([V003](jobs/J001/V003.md)) after V001 (F1) and V002 (F6) failed on stale exit-code statements; attempts A003-A005. On real records the new validator flagged `J008/A002.md:7` `run-id-unknown`.
- 2026-11-15: PR327 CI failed Knip (`REQUIRED_FIELDS` unused: the test imports the core dynamically). After V003 the coordinator added the core as a Knip entry, as for `isswf-snapshot-core.mjs`; Knip passed locally. Not independently reviewed; CI verifies it. Knip was not run locally before review although its locked install is documented.

## J002

- Status: pending
- Size: M (two related flows, generating the review handoff and detecting unreviewed commits before delivery)
- Objective: Delegation handoffs that the methodology requires are generated, not hand-written.
- Depends on: J004
- Brief: [brief-r1.md](jobs/J002/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Prepare a brief after J004, reusing its dispatch guard for the review handoff check.

### Acceptance

- An unbound reviewer handoff is produced by a tool that emits the exact `base..candidate` diff file, its byte count and SHA-256, and the required review resources; a review cannot be dispatched without them.
- Delivery detects commits that change non-record paths after the last reviewed candidate without a recorded delta review, before push or in CI.
- The matching coordinator and host-guide rules are reduced to pointers to the tool and the check.

### Evidence

- 2026-11-14: J029 review call 2 stopped inconclusive because the handoff lacked the diff; one call was lost.
- 2026-11-14: coordinator test changes 2ac2f83 and 12efb53 were merged in PR322 before independent review (V003, J029-R4-04).

## J003

- Status: pending
- Size: M (three related command patterns, with one bounded risk: refusing legitimate commands)
- Objective: Coordinator and child shell use cannot silently break session state, violate the CI-waiting rule or acquire packages.
- Depends on: None
- Brief: [brief-r1.md](jobs/J003/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Prepare a brief; check which guards each host supports, including for child agents.

### Acceptance

- A `cd` that would leave the session working directory outside the project root is refused or reverted, so the pane keeps finding the state directory.
- Continuous CI waiting (`gh pr checks --watch`, `gh run watch`, sleep loops) is refused, with the documented alternatives offered (feature-delivery.md: a native completion event, one bounded deferred check, or manual revisit).
- Package acquisition from coordinator or child shells (`npx`, `npm install`, `npm i`, `pnpm dlx`, `pip install` and equivalents) is refused, while already installed locked tools such as `tooling/quality/node_modules/eslint/bin/eslint.js` still run.
- Commands that evade these patterns are listed as known limits.

### Evidence

- 2026-11-14: a `cd` into jobs/J029 and later into .agents moved the session cwd; the pane showed "no .isswf or .factory state directory".
- 2026-11-14: the coordinator used `gh pr checks --watch` with sleep, contrary to feature-delivery.md:63; one wait was killed for low memory.
- 2026-11-03: a Claude worker ran unauthorized `npx eslint` and `npx knip` with package-acquisition warnings and the wrong tool configuration, a repeated violation (Engram observation 4426).

## J004

- Status: pending
- Size: M (one flow, with one bounded risk: refusing a legitimate dispatch)
- Objective: A delegation that fails the coordinator's pre-dispatch refusal conditions is refused by the host before the child starts.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J004/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Prepare a brief after J001; verify the Pi subagent tool name and arguments the guard must inspect.

### Acceptance

- A delegation to an isSWF role (a Claude Agent call or the Pi subagent call) is refused, naming the failed condition, when any of these holds: the initiative status is not `observed`; the named brief is untracked, uncommitted or ignored; the prompt lacks the brief path, a full checkpoint SHA or a full base SHA; or the job is not `in-progress` in the committed plan.
- A delegation to an isSWF role is also refused when its model or effort is missing or differs from the approved selection for that role. That selection is read from one structured, project-local source that the guard can parse. Prose in project-setup.md does not count. An operator-typed override covers a different value for a single dispatch. If no structured source exists yet, the job creates it first, migrating the approved Claude preset; it does not restore the legacy `.factory/models.json` routing.
- A delegation that meets every condition runs unchanged, and delegations to other agents are not affected.
- Passing the guard is not recorded or reported as authorization.
- The coordinator skill's "Pre-dispatch refusal conditions" section is reduced to a pointer to the guard.

### Evidence

- 2026-11-14: in this session every Claude dispatch (J008, J001 and its reviews) omitted effort. The briefs said effort was "not settable", although the Agent tool accepts it. The approved preset (project-setup.md:57; worker sonnet/medium, reviewer opus/medium, researcher haiku/high) exists only as prose. Operator: "El effort por defecto esta en el setup". The operator also noted that model and effort were once held in a JSON file (`.factory/models.json`, now legacy since 50b502e). They became semantic when native delegation replaced the legacy executor.

- 2026-11-14: J029 was dispatched while its plan job stayed `blocked` (see J001); the conditions in .agents/skills/isswf-coordinator/SKILL.md:152-160 are held only in prose and nothing runs them at dispatch.
- 2026-11-14 audit: the Claude plugin `tool.call` hook can return `deny` before a call runs (.claude-plugin/types/claude-code/index.d.ts, ToolCallResult); Pi 1.5.2 `tool_call` can block (installed docs/extensions.md). The Pi subagent call shape is not yet verified.

## J005

- Status: pending
- Size: M (one flow, but verification needs a real compaction on each host)
- Objective: After a compaction, the coordinator still holds the active assignment and reloads its skill.
- Depends on: None
- Brief: [brief-r1.md](jobs/J005/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Prepare a brief; confirm how each host lets a plugin steer the summary and add context after compaction.

### Acceptance

- When a session in which the coordinator skill is active compacts, the summary instructions keep the active initiative and job, child agent IDs, candidate SHA, remaining budgets and the version-advisory marker, in Claude Code and Pi.
- The first turn after that compaction receives a reminder to reload the coordinator skill and the methodology in use, or the host reloads the skill itself.
- Sessions that never activated the coordinator are not affected.
- The host guides' reload-after-compaction instruction is reduced to a pointer.

### Evidence

- 2026-11-14: the operator reports that forgotten process rules are recurrent. Linking this to compaction is an inference, not a traced cause.
- 2026-11-14 audit: .agents/hosts/claude-code.md asks the coordinator to reload its skill after compaction, a rule that itself depends on memory. Mechanisms found: Claude plugin `session.compact` (steer or skip) and SessionStart `reloadSkills`; Pi `session_before_compact` and `before_agent_start`.

## J006

- Status: pending
- Size: S (one flow, no special risk)
- Objective: The coordinator changes plan job fields through a command instead of hand-editing Markdown.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J006/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Prepare a brief after J001; decide in it how the command relates to the existing grant-guarded tools/isswf-plan.mjs.

### Acceptance

- A command sets a job's Status, Blocker and Next step, appends Evidence, and adds a new job or plan in the form `parsePlan` accepts, including the pending brief reference.
- It writes atomically, reads the plan back with `parsePlan`, and on any failure exits nonzero and leaves the file unchanged.
- Hand edits remain possible and are still checked by J001's validator.

### Evidence

- 2026-11-14: the `Brief: None.` lines in I0055 and I0056 were hand-written (8566437).
- 2026-11-14 audit: the `render()` function in tools/isswf-plan.mjs always writes a valid brief reference, but it requires an external plan-only grant file and is not used for native plans.

## J007

- Status: pending
- Size: M (two related flows, attempt and review records, plus the launch identity)
- Objective: New attempt and review records start with their mechanical fields filled from Git and the launch identity.
- Depends on: J006
- Brief: [brief-r1.md](jobs/J007/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Prepare a brief after J006, listing which template fields are derivable and from which source.

### Acceptance

- A command creates the job's next unused `A<nnn>.md` or `V<nnn>.md` from the template. It fills the record ID, review round, `Run:` line, brief path, revision and checkpoint SHA, base SHA, checkout, branch and requested model from the supplied launch data and Git; semantic fields stay for the author.
- At completion, the changed paths and commits `base..candidate` are filled from Git.
- An existing record ID is never reused; on a conflict the command refuses.

### Evidence

- 2026-11-14: A011 added a `Run note` line, and `Run:` lines with trailing notes in A003, A011 and V006 were ignored by the pane (see J001).
- 2026-11-14 audit: about half of the roughly 30 fields in .factory/templates/attempt.md are copies of data already held in Git or in the launch call.

## J008

- Status: completed
- Size: M (two related flows: the deviations field in both templates, and per-round reviewer limits in review records)
- Objective: Every attempt and review record reports the process deviations its author observed, and every review round records the reviewer's limits, so neither depends on the coordinator's memory.
- Depends on: None
- Brief: [brief-r1.md](jobs/J008/brief-r1.md)
- Blocker: None.
- Next step: None. The J001 validator check of these fields is J001 scope.

### Acceptance

- The attempt and review templates have a required `Process deviations observed:` field. Its value is either `None.` or, for each deviation, a written rule that was not followed, or mechanical data copied by hand that could have been derived.
- The worker and reviewer profiles ask for that field in their return; existing records are not rewritten.
- Each review round, including a delta round appended to an existing review record, records the reviewer's limits (unreviewed areas, evidence not observed, approvals the reviewer cannot give) and its convergence advice in the template's `Unreviewed areas and evidence limits:` field, or `None.`.
- Once J001 ships, its validator reports a new record that lacks the deviations field and a review round that lacks the limits field.
- Both fields are self-reported and are documented as such, not as observed evidence.

### Evidence

- 2026-11-14: the operator asked that worker and reviewer runs be observed for semantic steps that could become deterministic; a rule to remember to observe would itself depend on the coordinator's memory.
- 2026-11-14: the J030 reviewer suggested that the review template ask for reviewer limits and convergence advice (I0009/J030/V006.md, round 4). The coordinator left the reviewer limits out of V006 twice (round 1, suggestion N2; round 3, added in round 4). The template already has the field (.factory/templates/review.md, "Limits and return"), but only 4 of 135 review records in .factory/initiatives use that section: review records are hand-written outside the template, and nothing checks the field.
- 2026-11-14: Candidate 62c501a4007e0e6eb3a7f6aec4d0b8fb01776f9b went through three review rounds.
  - [V001](jobs/J008/V001.md): pass, with three suggestions.
  - [V002](jobs/J008/V002.md): fail. F4: the correction dropped half of the deviation definition.
  - [V003](jobs/J008/V003.md): pass.
  - Two correction cycles: [A002](jobs/J008/A002.md) and [A003](jobs/J008/A003.md).
- 2026-11-14: the operator approved integration of the role-profile change, which REVIEW.md lists under "Always needs a person" ("Si apruebo"). The operator also extended the review budget ("Si necesitas más rondas las tienes").
- 2026-11-14: PR326 merged as 0d2ff5d2fc1a53b00bf422d29fc244d2dcee20ba after green CI on exact head 3d712c37da63df01a9e69c815a84710fc227fa0f (Ubuntu and Windows package and host discovery, portable checks). The deviations reported in A001-A003 and V001-V003 were copied to the deferred candidates.

## J009

- Status: pending
- Size: S (one flow, no special risk: compare the branch before a commit)
- Objective: A session cannot commit on a branch that another actor switched the checkout to without it noticing.
- Depends on: None
- Brief: [brief-r1.md](jobs/J009/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Prepare a brief; decide where the session's expected branch is kept and how each host exposes the session's own switch and checkout commands.

### Acceptance

- The session's expected branch is the one it observed at start or last selected itself with `git switch` or `git checkout`. A `git commit` run from the session's shell on any other branch is refused, naming both branches, in Claude Code and Pi, on Linux and Windows.
- A commit on the expected branch runs unchanged, and so do commits made through the plumbing commands this guard does not cover. Those commands are named as a known limit.
- Re-selecting the branch with the session's own `git switch` makes it the expected branch again; the guard never switches branches, stashes or resets anything itself.

### Evidence

- 2026-11-14: the I0057 re-plan (c07a5dc) was committed on `fix/j030-reverse-stdin`, the branch of PR324, instead of on `main`. A peer session had switched the shared checkout's branch and the coordinator did not check it. Cost: one misplaced commit, moved to `main` (7b840ee) and removed from that branch with `git reset --keep` before it was pushed.
- 2026-11-14: minutes later, the same checkout was on `records/close-i0009`, another branch switch by the peer session.
