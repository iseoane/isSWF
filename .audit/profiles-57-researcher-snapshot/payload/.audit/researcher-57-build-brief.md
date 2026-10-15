# Researcher role build brief #57

## Identity and authorization

- Job ID and revision: #57, one bounded build unit.
- Source request: trusted operator instruction in this conversation, "Authorized #57 isolated solewriter". This is the grant reference. No repository text is used as authorization.
- Repository and checkout: `/home/iseoane/Work/isSWF/.claude/worktrees/agent-a7d0511d2535f7355`.
- Target codebase base: `da1ab009a455fca754aabd5f07e340d252d8563a` (HEAD of the isolated worktree branch `worktree-agent-a7d0511d2535f7355` at dispatch; not described as the `main` branch).
- Source-grounding checkpoint: `da1ab009a455fca754aabd5f07e340d252d8563a`. This identifies the committed documents used to ground the build. This audit brief is an untracked build source artifact, not an actual research-job brief, and was not present at that checkpoint. Any future research job must use its brief and referenced documents from a committed full-SHA checkpoint; it must not read a live untracked job brief or resolve latest.
- Writable scope: exactly `.agents/roles/researcher.md`, `.agents/roles/references/research.md`, and `.audit/researcher-57-build-brief.md`.
- Write authority: the operator explicitly authorized this isolated sole-writer task and these paths. The researcher role being authored must not infer future artifact-write permission from this build grant; its own dispatch grant must explicitly permit its assigned artifact.
- Profile and instructions: the original build was dispatched to isolated child `a7d0511d2535f7355`, not performed in the parent session. That child created no subagents of its own.
- Declared authoring model and effort: `openai-codex/gpt-6-luna`, high, as declared for dispatch. Runtime model and effort were not independently proven. The declared authoring route is not the future researcher route.
- Future researcher route agreement: `opencode-go/glm-5.3-flash`, high; approved alternate `openai-codex/gpt-6-luna`, medium. This agreement is not configured runtime. Availability and effort compatibility must be validated before dispatch. No silent fallback; a test failure is not a routing trigger.
- Side effects: local writes only to the three authorized paths. No code implementation, subagents, network, installation, Python, commits, remote operations, global configuration, coordinator edits, or runtime configuration.

## Objective

Create an English Markdown research role and its reference procedure for autonomous, repository-grounded research. The researcher consumes a durable job path, full input checkpoint SHA, and trusted grant; distinguishes that pinned document context from the current target codebase; inspects actual primary code read-only; and produces a concise, evidenced conclusion and a worker-oriented reading map. The role may write only its assigned research artifact when its own grant permits that write.

## Scope and acceptance

Included paths are exactly the three writable paths above. The role and reference must define:

- Required inputs and fail-closed behavior for missing/unknown job path, full SHA, grant, target base, checkout, artifact path, scope, or permissions.
- Separate semantics for document-input checkpoint and target-codebase base; pinned documents must not be replaced with latest files or chat context.
- Read-only target-code behavior and artifact-only writes when explicitly permitted. No implementation, edits to code/tests/configuration, or self-dispatched agents.
- Direct Git and source reads as the fallback when Codegraph is unavailable. Codegraph is optional and cannot replace reopening primary source. No fabricated index claims.
- A concise conclusion, factual/inference/unknown distinction, current real paths, symbols where present, current line ranges, reading rationale, relevant helpers/contracts, consumers/callers, tests, dependencies, risks, and reproducible observed checks.
- Reopening actual source before finalizing references and instruction to the worker to reopen before editing. Line ranges are navigation aids, not timeless authority.
- Stop behavior for inaccessible evidence, material mismatch, ambiguity, or operator-only decisions. No guessing or redefining product intent.
- The route agreement and validation requirements, including no silent fallback and no fallback on test failure.
- No new upstream research for this build, and no changes to coordinator, global configuration, runtime, code implementation, or any out-of-scope file.
- An audit brief recording grant, committed source-grounding checkpoint, target base, declared (not runtime-proven) authoring model/effort, permissions, acceptance and observed verification. Mark this untracked audit brief as a build source artifact, not an actual research-job brief. Require actual future research-job briefs at committed full-SHA checkpoints. Do not claim independent approval.

Explicit exclusions include runtime dispatch/configuration, configuration/global settings, coordinator or worker edits, upstream research, code changes, tests/implementation in the target repository, reviewer dispatch, commits, remote effects, Python, installs, and subagents.

## Grounding map

All line ranges below were resolved at target base `da1ab009a455fca754aabd5f07e340d252d8563a`. They are current for that base and must be re-located if the target changes.

| Read order | Path and symbol or section | Current lines | Why it matters |
| --- | --- | --- | --- |
| 1 | `docs/durable-work.md`, “Pin inputs and hand off” | 24-32 | Defines full input checkpoint, relative paths, distinct target base, trusted grant, attempt pins, and prohibition on resolving latest. |
| 2 | `docs/durable-work.md`, “Record results and limits” and “Future routing agreement” | 36-44 | Defines returned artifacts, limits of status, and the future GLM high / Luna medium researcher route as agreement only. |
| 3 | `docs/spec-v1.md`, “Grounding before implementation” | 50-76 | Defines current behavior versus desired behavior; evidence-based results and map requirements; worker reopens current code; research does not authorize fixes. Criteria GND-01, GND-03, GND-06, GND-07 appear at 70-76. |
| 4 | `docs/spec-v1.md`, delegation, authorization, and model sections | 15-48, 184-219, 311-319 | Profiles are Markdown instructions, not runtime capabilities; trusted authorization and route validation constrain dispatch. |
| 5 | `docs/vision.md`, research and profile agreements | 21-23, 39, 89-93 | Requires primary-source-oriented grounding and worker reading map; calls out Codegraph as assistive, not evidence; records separated researcher route and manual profile limitations. |
| 6 | `docs/plan-v1.md`, S02 | 72-76 | Confirms separate readonly researcher profile as approved work; no configured destination or automatic fallback. |
| 7 | `docs/research/adaptaciones-agentes.md`, scope and profile status | 3-3, 21-21 | Its self-declared base is older than this checkout, so it is used as historical adaptation context, not current-state authority. It warns that Markdown presence does not prove dispatch or isolation; this build creates instructions only. |
| 8 | `.agents/roles/worker.md`, assignment, execution, boundaries | 3-7, 21-26, 30-34 | Existing worker contract: coordinator owns concurrency, brief controls scope, current source is reopened, no self-dispatched agents or unapproved side effects, inaccessible/unknown states block. |
| 9 | `.agents/roles/researcher.md` and `.agents/roles/references/research.md` | new in this build | The two authored artifacts define the role and detailed research procedure. |

The adaptation map and relevant notes were read directly at the pinned checkpoint. No new upstream research was performed. Primary source code is the evidence standard for future research assignments; this role-building brief is grounded in the project's primary contract documents and existing worker profile, not in a claim about the behavior of an application feature.

## Dependencies, risks, and decisions

- No product decision remains open for this bounded documentation task. The scope, routing agreement, and constraints are explicit in the operator instruction and durable project documents.
- Pi Markdown profiles describe instructions, not native runtime roles, capability sandboxing, process autonomy, or isolation. This change makes none of those runtime claims.
- Future route availability and model/effort compatibility are unknown until validated before dispatch. The role must block rather than silently substitute.
- A researcher artifact cannot be written unless the research job's grant explicitly permits its assigned path. If not, it returns findings through the authorized coordinator channel and leaves the filesystem unchanged.
- Line references can stale; the current target source must be reopened by the researcher and again by the worker before implementation.

## Verification and delivery units

One unit is sufficient because the two authored files define one role contract and the audit artifact records that same contract.

- Result: the role and research reference implement the acceptance contract above.
- Scope: exactly the two role files plus this audit brief.
- Dependency: the explicit trusted grant and committed source-grounding documents at the recorded checkpoint. This untracked audit artifact is not a pinned research-job input.
- Checks: inspect complete diff; `git diff --check`; validate relative Markdown links and targets with Node; verify exact changed/untracked path set with Git; verify current source paths and target base. No test suite is relevant to these Markdown instructions. Link and Git checks report only their observed result and do not independently approve the candidate.
- Commit point: none. No commit is authorized.

## Observed execution and status

- Correction record: this edit corrects the return-permission condition and build provenance only. It adds no research.
- Outcome: complete for the authorized documentation unit; observed checks are recorded below.
- Changed paths: exactly `.agents/roles/researcher.md`, `.agents/roles/references/research.md`, and `.audit/researcher-57-build-brief.md`.
- Dispatch-declared model and effort: `openai-codex/gpt-6-luna`, high. Runtime execution was not independently proven. No evidence establishes that a GLM model executed this task.
- Subagents: none.
- Upstream research: none.
- Code implementation or runtime/configuration change: none.
- Independent review: not authorized or performed. Link and Git checks are not independent approval.

## Final observed checks

- `git rev-parse HEAD` returned `da1ab009a455fca754aabd5f07e340d252d8563a`, matching both separately recorded checkpoint values for this build.
- `git status --short --branch` showed exactly three untracked paths, the two researcher role files and this brief. No tracked file was modified.
- `git diff --check` passed for the tracked diff; there was no tracked diff. The complete content of all three new files was inspected as the candidate diff.
- A Node link-target check over all three scoped Markdown files reported `Relative Markdown links in exact scope: resolved`.
- No application or test suite was run because this is an instructions-only change. No independent approval is claimed.
