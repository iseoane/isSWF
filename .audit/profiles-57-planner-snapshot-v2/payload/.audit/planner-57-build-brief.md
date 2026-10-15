# #57 planner profile build brief

## Identity and authorization

- Job: #57, authorized sole-writer assignment.
- Current grant: operator instruction in this conversation authorizes this writer to edit only `.audit/planner-57-build-brief.md` in this isolated worktree.
- Repository: isSWF checkout at `/home/iseoane/Work/isSWF/.claude/worktrees/agent-aae47d45dde92d228`.
- This file is the build report for the planner-profile work. It is not the future planner job brief, and it was newly written as an untracked audit file, so it cannot be retrieved at the pinned Git commit.
- This correction was written by the current actor in this session. It does not establish prior-writer provenance or treat the prior audit as proof.
- Side effects for this correction: one local edit to this file and read-only Git checks only. No other writes, delegation, commits, network, installation, runtime execution, global configuration, or remote operations.

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

- Future planner job brief: it must be supplied and present at the full-SHA document-input checkpoint before the planner starts. This build report is not that brief, is not available at the checkpoint, and cannot be used as a live untracked-latest fallback.
- Document-input checkpoint: `da1ab009a455fca754aabd5f07e340d252d8563a` (full Git SHA). This SHA pins the existing grounding documents, not this newly written audit report.
- Target codebase base: `da1ab009a455fca754aabd5f07e340d252d8563a`, recorded separately from the document-input checkpoint.
- The prior audit reported checkout `HEAD` and `main` at this SHA and a clean initial status. Those claims were not independently verified by this writer.
- Relevant tracked sources read at that base: `docs/durable-work.md`, `docs/templates/job-brief.md`, `docs/vision.md`, `docs/spec-v1.md`, `docs/plan-v1.md`, `docs/research/adaptacion-matt.md`, and `docs/research/adaptacion-pstack-addy.md`.
- Local grounding: `docs/vision.md` assigns planning responsibility to the coordinator and says a planner may be delegated for broad work; `docs/spec-v1.md` requires proportional procedures and functional slices, review and corrections, and distinguishes integrated contracts from proposals; `docs/plan-v1.md` preserves explicit prerequisites and staged work; the two research notes recommend adaptive planning, concise role-specific procedures, and no universal TDD or extra planner hierarchy.
- Durable-work contract: `docs/durable-work.md` pins brief/spec inputs, separates target base from input checkpoint, and reserves canonical plan ownership to the coordinator. Its job-brief template requires authorization, scope, acceptance, grounding, dependencies, model/effort, and checkpoint policy. A future planner must receive its actual job brief at the full-SHA document-input checkpoint and resolve its references there. If the brief or checkpoint is missing or abbreviated, block rather than use latest files or this build report.

## Ownership and dependencies

- The coordinator owns the canonical plan and decides whether to adopt this plan-proposal workflow.
- This worker owns only the three included paths in the exclusive checkout.
- No implementation dependency is created by this documentation change. No PR stack or remote delivery is authorized.

## Verification and limits

Observed read-only checks:

- `git diff --check` returned no whitespace errors. Each new file also passed `git diff --no-index --check /dev/null <path>`; exit code 1 indicated a new-file diff, not a whitespace failure.
- A prior Node check using built-in `fs`, `path`, and `child_process` reported that both planner links resolve and that there are exactly two source references. Correction: the link result was a false PASS and is not reliable. Resolving `../../docs/durable-work.md` from `.agents/roles/references/planning.md` gives `.agents/docs/durable-work.md`, which is absent. The durable-work path is now written as the repository-root code path `docs/durable-work.md`, not as a Markdown link.
- The current actor's scoped `git status` showed the two planner source files and this report as untracked. The current actor edited only this report; the source files were not edited. Their untracked status does not establish their content or prior provenance. No project runtime commands were run for this correction.

These checks establish only the content and path targets actually tested. They do not establish LLM compliance, independent review, runtime behavior, product acceptance, PR-stack safety, or authorization beyond this grant. Return the exact candidate path, diff summary, observed checks, and limits. Do not commit.
