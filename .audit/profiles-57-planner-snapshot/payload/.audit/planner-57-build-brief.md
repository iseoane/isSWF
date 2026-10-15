# #57 planner profile build brief

## Identity and authorization

- Job: #57, authorized sole-writer assignment.
- Trusted grant: operator instruction in this conversation. It authorizes only the three paths listed below in this isolated worktree.
- Repository: isSWF checkout at `/home/iseoane/Work/isSWF/.claude/worktrees/agent-aae47d45dde92d228`.
- Profile: `.agents/roles/planner.md`.
- Requested/effective dispatch: `openai-codex/gpt-6-luna`, high, per the actual dispatch record.
- Child provenance: `aae47d45dde92d228`. This audit does not claim to have independently observed session metadata.
- Side effects: local file edits and read-only Git checks only. No delegation, commits, network, installation, runtime execution, global configuration, or remote operations.

## Objective

Add an English planner profile and its concise progressive guidance. The planner consumes an explicit trusted grant and checkpoint-pinned specification and brief, then returns a coordinator-owned plan proposal as a separate artifact. The canonical plan remains untouched.

## Scope and exclusions

Included paths:

- `.agents/roles/planner.md`
- `.agents/roles/references/planning.md`
- `.audit/planner-57-build-brief.md`

Explicit exclusions: all other paths, including the coordinator profile, canonical plan, templates, source code, and tests. Do not create or update a canonical plan, initiate implementation work, delegate, or perform new upstream research.

## Acceptance criteria

- The planner requires an explicit trusted grant, a brief, pinned inputs, and a matching exclusive checkout before planning.
- It creates a separate plan proposal for coordinator review and cannot mutate the canonical plan.
- Plans use demonstrable vertical functional units, not SLOC quotas or technical-layer sequencing. Each unit states scope, acceptance, verification, dependencies with explicit unblock conditions, and a coherent commit/checkpoint.
- Code dependencies require the named integrated contract unless the grant expressly authorizes another local route.
- The proposal includes review, corrections, and affected re-verification, with checks selected proportionally.
- Interviews and TDD are conditional, not mandatory.
- PR stacking is optional and local. The proposal identifies bases, dependencies, and rechecks, and never implies remote permission.
- The profile stays concise and progressively points to at most two sources.
- English instructions and links resolve to existing repository files.
- The audit record captures scope, ownership, acceptance, base, requested/effective model information available, checks, and limits without claiming self-approval.

## Inputs and grounding

- Durable brief path: `.audit/planner-57-build-brief.md`.
- Document-input checkpoint: `da1ab009a455fca754aabd5f07e340d252d8563a` (full Git SHA).
- Target codebase base: `da1ab009a455fca754aabd5f07e340d252d8563a`, recorded separately from the document-input checkpoint.
- Verified checkout HEAD before edits: `da1ab009a455fca754aabd5f07e340d252d8563a`; `main` resolved to the same SHA. The prior audit reported a clean initial status, but this worktree currently contains unrelated untracked files, so that status claim is not independently reliable.
- Relevant tracked sources read at that base: `docs/durable-work.md`, `docs/templates/job-brief.md`, `docs/vision.md`, `docs/spec-v1.md`, `docs/plan-v1.md`, `docs/research/adaptacion-matt.md`, and `docs/research/adaptacion-pstack-addy.md`.
- Local grounding: `docs/vision.md` assigns planning responsibility to the coordinator and says a planner may be delegated for broad work; `docs/spec-v1.md` requires proportional procedures and functional slices, review and corrections, and distinguishes integrated contracts from proposals; `docs/plan-v1.md` preserves explicit prerequisites and staged work; the two research notes recommend adaptive planning, concise role-specific procedures, and no universal TDD or extra planner hierarchy.
- Durable-work contract: `docs/durable-work.md` pins brief/spec inputs, separates target base from input checkpoint, and reserves canonical plan ownership to the coordinator. Its job-brief template requires authorization, scope, acceptance, grounding, dependencies, model/effort, and checkpoint policy. Resolve this brief and its references at the full-SHA document-input checkpoint; if the checkpoint is missing or abbreviated, block rather than use latest files.

## Ownership and dependencies

- The coordinator owns the canonical plan and decides whether to adopt this plan-proposal workflow.
- This worker owns only the three included paths in the exclusive checkout.
- No implementation dependency is created by this documentation change. No PR stack or remote delivery is authorized.

## Verification and limits

Observed read-only checks:

- `git diff --check` returned no whitespace errors. Each new file also passed `git diff --no-index --check /dev/null <path>`; exit code 1 indicated a new-file diff, not a whitespace failure.
- A prior Node check using built-in `fs`, `path`, and `child_process` reported that both planner links resolve and that there are exactly two source references. Correction: the link result was a false PASS and is not reliable. Resolving `../../docs/durable-work.md` from `.agents/roles/references/planning.md` gives `.agents/docs/durable-work.md`, which is absent. The durable-work path is now written as the repository-root code path `docs/durable-work.md`, not as a Markdown link.
- The prior audit reported that the final worktree status contained exactly the three authorized files as untracked. This session observed unrelated untracked files too, so that historical scope claim is not independently reliable. The final files were reread. No project runtime commands were run because this task changes Markdown instructions only.

These checks establish only the content and path targets actually tested. They do not establish LLM compliance, independent review, runtime behavior, product acceptance, PR-stack safety, or authorization beyond this grant. Return the exact candidate path, diff summary, observed checks, and limits. Do not commit.
