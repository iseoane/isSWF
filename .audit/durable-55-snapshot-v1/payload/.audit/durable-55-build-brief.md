# Issue #55 build brief: durable Markdown work documents

Status: executed within the authorized documentation unit. This file records the assignment and its immutable pre-change base. It is an audit artifact, not an authorization source or a runtime record.

## Assignment

Implement the selected durable Markdown work-document contract for issue #55. Give coordinators, workers, and reviewers concise documentation and copyable artifacts for explicit project files and Git checkpoints. Do not duplicate initiative plans or specifications, and do not claim guarantees the repository does not provide.

## Decision and grounding

The selected design combines ownership separation from design A with project-scoped flat IDs and Git references from design B. The coordinator owns the current plan, job IDs, assignments, and brief revisions. Workers and reviewers own their attempt and review artifacts in exclusive checkouts. The coordinator integrates references without rewriting conclusions.

The exact target-codebase base at dispatch was `9cd0eebfea8ecf79043a42b4cfcf560bf299936f`. This is distinct from each job's document-input checkpoint. The decision source was `.audit/durable-55-decision.md`, read from the supplied main-checkout path because it and the design inputs are untracked and absent from the isolated worktree. The source explicitly identifies base `9cd0eeb`; the companion design files were `.audit/durable-55-design-a.md` and `.audit/durable-55-design-b.md`. They were read, not copied or edited.

Tracked grounding was reopened at the target base. `docs/spec-v1.md` establishes reference-first delegation and authority (15-48), grounding (58-66), checkpoints and limits (82-100), model constraints (194-219), brief and result contracts (259-269), project authorization (293-319), and plan ownership (330-332). `docs/plan-v1.md` establishes #55 sequencing and runtime exclusions (20-28) and worker/model distinctions (66-83). `docs/vision.md` covers coordinator plan ownership (51-57), profile and handoff (87-97), and #55 limits (124-132). `GLOSSARY.md` defines domain terms (11-37). `.agents/roles/worker.md` defines assignment, execution, and return boundaries (3-17, 21-38). `.agents/roles/reviewer.md` requires exact candidate context and separate Standards and Spec outcomes (3-12, 20-32). `.agents/skills/isswf-coordinator/SKILL.md` establishes grounding, dispatch, ownership, review, and reported-status rules (29-51, 55-89).

## Scope and exclusions

Authorized write paths only:

- `docs/durable-work.md`
- `docs/templates/job-brief.md`
- `docs/templates/attempt.md`
- `docs/templates/review.md`
- `.agents/skills/isswf-coordinator/SKILL.md`
- `.audit/durable-55-build-brief.md`

No commits, pushes, network access, installs, global configuration, external writes, Python or other runtime, code, tests, subagents, reviewers, probes, or edits to the main checkout were authorized. Do not touch source/runtime, issue #44, remotes, or any other path.

The chosen records use `.factory/jobs/J001/brief-r1.md` and create `A001.md` and `V001.md` only when needed. Current initiative spec and plan remain at their explicit existing paths and may pre-exist; the plan links to jobs. IDs are readable coordinator-allocated project IDs and are not silently reused. A full SHA and relative path pin document inputs; `git show <full-sha>:<path>` is the existing lookup procedure. Missing references block the affected job. New brief revisions preserve old attempt inputs. External trusted grant path and full SHA carry authorization; no document self-authorizes.

The guide distinguishes target codebase base from the document-input checkpoint, states ownership and handoff boundaries, and explains that reported status is not process liveness. Git checkpoints are not complete backups, atomicity, process recovery, or exactly-once guarantees. Engram is learning context, not a work database. There is no resolver, command, database, planner or researcher profile, or per-job copy of the spec or plan. The agreed future researcher route is recorded only as a future agreement. This work does not validate, configure, or run it.

## Acceptance

- The guide is concise and describes the selected layout, ownership, checkpoint resolution, handoff, brief revisions, report semantics, and recovery limits.
- Each of the three templates is concise and records its role-specific identity, pinned context, authority, status, evidence, and return details.
- The coordinator skill receives only a minimal plain-text path pointer, with instructions to load the guide when job reference and checkpoint are supplied and to block unknown inputs rather than resolve latest.
- Local Markdown links, paths, formatting, scope, and consistency with worker/reviewer contracts are checked.
- No independent review or self-approval is claimed.

## Worker and checkpoint policy

The authorized worker profile is `.agents/roles/worker.md`. The dispatch specified effective destination `openai-codex/gpt-6-luna`, effort `high`, and dispatcher profile `pstack:poteto-agent-high`. No fallback is authorized. Worker status is reported with timestamp and evidence, not as proof a process is alive.

The exclusive checkout is `/home/iseoane/Work/isSWF/.claude/worktrees/agent-a1d9474202f09e28d`. Its exact pre-edit HEAD was verified as `9cd0eebfea8ecf79043a42b4cfcf560bf299936f`. No commit is authorized. The checkpoint is the completed six-path diff and final scope and link inspection in this checkout. Timestamp for this brief: 2026-10-14T22:07:47+02:00.

## Verification and evidence

Before edits, `git rev-parse HEAD`, `git status --short --branch`, and `git rev-parse --show-toplevel` confirmed the exact base, worktree, and checkout path. The worktree was clean at dispatch. Read-only inspection of the separate main checkout showed the supplied untracked decision/design files; no changes were made there. The specified tracked contracts were reopened at the exact base.

Final inspection confirmed the exact six authorized paths: the coordinator skill is modified, and the audit brief, guide, and three templates are new. The complete skill diff was inspected; all new documents were read in full. The guide links resolve to the two initiative documents and three templates. `git diff --check` passed for the tracked diff, and a trailing-whitespace check passed for the new files. A trial 180-column limit was rejected by long Markdown prose lines; Markdown has no such limit, so no line-width requirement is claimed. The coordinator change is a two-line pointer and leaves dispatch and ownership rules intact. No test suite was run because this unit is documentation-only. No independent reviewer was authorized or used. No commit was created.

Final commands included `git status --short`, `git ls-files --others --exclude-standard`, `git diff --check`, a link-target existence loop for every relative guide link, a trailing-whitespace scan of all new files, `wc -l` for guide/templates/audit, and the exact-base check before edits. The guide has 44 lines; templates have 48, 35, and 31 lines. The audit brief has 54 lines after its verification record.
