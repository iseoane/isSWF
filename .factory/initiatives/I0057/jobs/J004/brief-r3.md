# I0057/J004 brief-r3: Pre-dispatch guard with a per-agent model and effort selection

## Identity and authorization

- Job and brief revision: I0057/J004, r3.
  - r1 was the research ([A001](A001.md)).
  - r2 was the probe ([A002](A002.md)).
- Request mode: feature-to-PR continuation of I0057, under the operator's standing grant.
  - The operator approved integrating J004 on 2026-11-15. That covers grant and authority code and `.agents/hosts/**`.
  - Condition: "cada agente aunque sea en el mismo fichero tienen sus modelos por si quiero usar o mezclar diferentes agentes".
- Operation ownership:
  - The worker edits the paths below, commits on the feature branch and writes `jobs/J004/A003.md`.
  - The coordinator owns the plan, this brief, the reviews, the push, the PR, CI and the merge.
- Profile: `.agents/roles/worker.md`.

## Objective

- Outcome: in Claude Code and Pi, the host refuses a delegation to an isSWF role agent that fails the coordinator's pre-dispatch conditions, before the child starts, and names the failed condition. The approved model and effort come from one structured project-local file with one entry per agent.
- Size: M, from the plan (one flow, with one bounded risk: refusing a legitimate dispatch).

## Evidence this rests on

- **Claude (A002, observed):**
  - The `tool.call` event for `Agent` carries `subagent_type`, `model`, `effort`, `run_in_background` and `prompt`.
  - `agent.spawn` has no effort.
  - Denying before `next(e)` leaves the child unstarted, and the parent sees the reason.
  - Since J001 r4, `hooks/register.tsx` has one unmatched `tool.call` hook that combines the pane observer and the record guard, and the engine refuses a second one. Add this guard to that same hook, before `next(e)`.
  - A hooks module has no Node built-ins; use `$.fs`.
- **Pi (A001, A002):**
  - The tool is `subagent`, with `agent`, `task` and `model`.
  - The thinking level is only a model suffix (`model:high`).
  - A `tool_call` handler blocks the call with `{ block: true, reason }`.
  - The guard goes in the J001 r4 Pi main-session extension mechanism (`package.json` `pi.extensions`).
  - Children do not dispatch isSWF roles, so no child declaration is needed. If the code shows otherwise, say so.

## Scope and acceptance

Included:

- **Selection file `<stateDir>/dispatch-selection.json`**, with the state directory resolved by `tools/project-state.mjs`. For this checkout that is `.factory/dispatch-selection.json`.
  - Schema: `{ "schemaVersion": 1, "agents": { "<agent>": { "host": "claude" | "pi", "model": "<id or alias>", "effort": "<level>" } } }`.
  - `<agent>` is the exact name a dispatch uses, such as `isswf:isswf-worker` or `isswf-worker` for Claude and `isswf-worker` for Pi.
  - Every agent has its own entry, so agents can be mixed freely. There is no fallback order and no per-host role default. Do not restore the legacy `.factory/models.json` routing.
  - Create this checkout's file by migrating the approved Claude preset (`.agents/skills/isswf-setup/SKILL.md` "Confirm portable factory defaults"; `.factory/project-setup.md:57`):
    - worker: sonnet/medium
    - reviewer: opus/medium
    - researcher: haiku/high
    - planner: opus/low
  - Cover both the `isswf:` plugin names and the bare names.
  - Pi entries come from the same table's Pi column only if `project-setup.md` records them as applied here. Otherwise leave them out and state that.
- **Shared core**, for example `tools/isswf-dispatch-guard-core.mjs`, with no Node imports. Given the call (host, agent, model, effort, prompt), the parsed selection file, and the plan text read by the host, it returns `{ allow }` or `{ deny, condition }`. Conditions, each checked mechanically:
  1. The agent is an isSWF role agent: `isswf-` or `isswf:isswf-`. Any other agent is allowed unchanged.
  2. The selection file exists and parses. The agent has an entry. The call's model and effort are present and equal that entry's. In Pi, the model and effort come from the `model:level` suffix.
     - An `Override: model=<m> effort=<e>` line in the prompt replaces the entry for that one call.
     - The denial message says which value was missing or different, and what the file expects.
  3. The prompt names an initiative, a job and a brief path `.../initiatives/<I>/jobs/<J>/brief-r<n>.md`, plus a full 40-hex checkpoint SHA and a full 40-hex base SHA.
  4. The initiative plan parses (`parsePlan`), and the named job's Status is `in-progress`.
  5. The brief file exists. Whether it is committed or ignored needs Git:
     - The Pi extension checks it with `git ls-files --error-unmatch` and `git check-ignore`.
     - The Claude hooks module checks it only if a host capability in `.claude-plugin/types/claude-code/index.d.ts` can run Git without a permission prompt. Otherwise it is a stated Claude limit, and the coordinator skill keeps that check in prose for Claude.
- **Failure mode:** if the guard itself errors, it denies the isSWF role call with "dispatch guard error: <message>" (fail closed, because this is authority code). Calls to other agents are never affected.
- **Claude:** add the guard to the single `tool.call` hook in `hooks/register.tsx`, for `tool === 'Agent'`, before `next(e)`. Return `{ deny }`, and keep the pane and record-guard behaviour. It runs whether or not the pane option is set.
- **Pi:** a `tool_call` handler for `subagent` in the main-session extension (a new file or the J001 r4 extension, your choice; explain it). It returns `{ block: true, reason }`.
- **Setup:** `.agents/skills/isswf-setup/SKILL.md` writes `dispatch-selection.json` when the operator confirms the defaults, one entry per agent, and says the operator may edit any entry.
  - Also correct `.factory/project-setup.md:56-57`, which claims Pi role overrides that `.pi/settings.json` does not hold (A001). Point both lines to the new file.
- **Coordinator skill:** reduce "Pre-dispatch refusal conditions" (`.agents/skills/isswf-coordinator/SKILL.md` near 152-160) to a pointer to the guard. Keep in prose only the checks a host cannot make (condition 5 on Claude, if it is not possible). Add "the job is `in-progress`", which is approved in the plan's acceptance.
- **Host guides:** `.agents/hosts/claude-code.md` and `.agents/hosts/pi.md`. Replace "pass the preset effort" or similar prose with a pointer to the selection file and the guard. This change is approved.
- **Packaging:** ship the new core and extension the way J001 r4 does: `tools/factory-package.mjs`, `tools/build-release.mjs` if needed, and the release and metadata tests. Knip entries and `tools/check-quality.mjs` must run the new test.
- **Tests:** a new `tests/isswf-dispatch-guard.mjs` covering every condition and the override line, on both hosts' event shapes, with fake `$.fs` and fake `pi`.
- **Docs:** `docs/en/operations.md` and `docs/es/operations.md` cover the selection file, the override and what the guard refuses. `docs/{en,es}/architecture.md` list the new files. Add the selection file term to `GLOSSARY.md` and `GLOSSARY.es.md`.

Exclusions:

- `.github/workflows/**` and existing records.
- `.factory/models.json`: leave it untouched.
- Never stage the untracked `.agents/skills/project-release/`.

Acceptance (plan J004):

1. A delegation to an isSWF role agent that fails any condition is refused before the child starts, naming the condition, in Claude Code and Pi.
2. A missing or different model or effort is refused. A per-call `Override:` line is honoured.
3. A delegation that meets every condition runs unchanged. Delegations to other agents are not affected.
4. Passing the guard is never recorded or reported as authorization.
5. The coordinator skill's refusal section is a pointer, plus only the checks a host cannot make.

Checks (the worker runs them and reports the exact commands and results):

- Focused tests: `node tests/isswf-dispatch-guard.mjs .`, `isswf-record-guard`, `isswf-record-check`, `package-metadata`, `release-package`, `host-portability`, plus any test the change touches.
- `node tooling/quality/check-docs.mjs`, `git diff --check`, `node tools/check-quality.mjs`, and local ESLint and Knip.
- Live Claude check, as in A002: outside the repository, `--plugin-dir` set to this checkout, haiku, at most 3 invocations. Cover:
  - a refused `isswf:isswf-worker` dispatch with a wrong effort;
  - an allowed dispatch to a general-purpose agent;
  - a dispatch allowed through an `Override:` line.

  Use a temporary project with its own `.factory/` plan, brief and selection file. Delete it afterwards.
- A live Pi check is optional, with one `pi -e` session.

Methodology:

- isswf-tdd: selected for every condition, the override line and the fail-closed behaviour. Use test-only RED commits, then GREEN commits.
- isswf-security: selected, light. In the attempt, list how a prompt could fake the override line or the SHAs. The guard is not an authority by itself, and the operator's typed override is trusted only as prompt text written by the coordinator. State that limit.
- isswf-writing: for the docs and the glossary.

Required references:

- `AGENTS.md`, `REVIEW.md`, `GLOSSARY.md`, `.agents/roles/worker.md`, `.agents/hosts/claude-code.md`, `.agents/hosts/pi.md`.
- `.agents/skills/isswf-tdd/SKILL.md`, `.agents/skills/isswf-security/SKILL.md`, `.agents/roles/references/code-quality.md`.
- `docs/en/development.md` "Quality checks".
- `jobs/J004/A001.md`, `A002.md`, and `jobs/J001/A007.md`.

## Independent review

- Required: yes, Standards and Spec, with a security lens on refusal bypass and fail-closed scope.
- Reviewer: `isswf:isswf-reviewer`, opus/medium, unbound, given the exact diff file.

## Inputs and bases

- Target base: main after the J001 r4 PR is merged. The full SHA is given in the dispatch.
- Document-input checkpoint: the commit that adds this brief.
- Plan: `.factory/initiatives/I0057/plan.md`, job J004.

## Dependencies, ownership and budget

- Depends on J001, so dispatch only after the J001 r4 merge. Both edit the single `tool.call` hook.
- Checkout: the shared-sequential primary checkout, a new branch `feat/i0057-j004-dispatch-guard`, one writer.
- Budget: 1 worker, sonnet/medium. Up to 3 review rounds and 2 correction cycles. No automatic retries.
