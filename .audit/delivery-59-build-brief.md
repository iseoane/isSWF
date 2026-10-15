# Delivery profile build brief

## Assignment provenance and authorization

- Assignment: operator-authorized #59, as stated in the current operator conversation. No separate parent-authored brief, grant record ID, or external authorization artifact was supplied. This brief does not claim parent authorship or inherit provenance from another task.
- Grant owner: the operator who issued the current instruction. The instruction authorizes one isolated exclusive writer and exactly these paths: `.agents/roles/delivery.md`, `.agents/roles/references/delivery.md`, `docs/templates/delivery.md`, and `.audit/delivery-59-build-brief.md`.
- Checkout: `/home/iseoane/Work/isSWF/.claude/worktrees/agent-a64d19c6fd1d2a46e`, branch `worktree-agent-a64d19c6fd1d2a46e`.
- Verified base: `f6608f197d2acb8a66d6013c74b4fae1c5a2ee66`, observed as `HEAD` before the earlier writer's edits. The earlier report says the initial porcelain status was empty; that claim was not independently verified during this follow-up. This is the codebase base, not the candidate identity.
- Document-input checkpoint: `f6608f197d2acb8a66d6013c74b4fae1c5a2ee66`. The spec, vision, durable-work guide, and adaptation notes used as grounding are existing checkpoint inputs. Read each complete input with `git show <full-checkpoint-sha>:<repo-relative-path>`. This build brief is a new audit artifact, not the durable job brief and not an input present at that checkpoint. The delivery profile reference and `docs/templates/delivery.md` are also untracked candidate files, so they are not checkpoint inputs. The checkpoint identifies source documents and is recorded separately from the target codebase base even though both name the same commit.
- Authorized effects: edits to the four listed paths and local read-only checks only. No remote PR, network, Python, commits, subagents, other path writes, global configuration, or runtime actions.
- Requested/declared model and effort: LunaHigh, high, per the operator's assignment. The effective runtime model was not independently observable and is not claimed as verified.

## Objective

Add an English delivery profile, a concise local procedure reference, and a copyable delivery summary / draft PR text template. The material must let a reviewer quickly see what changed, why, how it was checked, material problems and their resolution, blockers, blast radius, risk, reversibility, and recovery limits without fabricating evidence or requiring screenshots for non-UI work.

## Acceptance criteria

- The profile and reference require a durable job ID and full input-checkpoint SHA separately from target base and exact candidate identity/status.
- An uncommitted candidate is not identified by branch name, a would-be commit SHA, or a self-hash. Candidate identity and status are distinct.
- Independent review evidence is tied to the exact candidate. Missing, failed, stale, or unavailable evidence remains visible.
- Technical closure and operator product acceptance are separate. Only the coordinator records the operator decision.
- The template covers what changed, why, observable result, checks, relevant problems and resolutions, blockers, blast radius, residual risk, reversibility, and recovery limits.
- Visual evidence is factual and proportionate. No fabricated screenshots/flows, mandatory visuals for non-UI work, or 100-field inventory for a large change.
- Text prepares a local-review candidate or copyable draft only. It does not create an actual remote PR or derive authority from PR text.
- English instructions reference the durable work guide, delivery contract, and relevant delivery-adaptation evidence without reproducing upstream text or cluttering core work with duplicated references.
- Only the four authorized paths are written. This brief records assignment provenance honestly and does not claim a candidate/self SHA.

## Grounding read

- `.agents/roles/worker.md` and `.agents/roles/references/execution-principles.md` for profile conventions, scope, authority, exclusive ownership, local checks, and honest results.
- `docs/vision.md` for the product request that deliveries explain what changes, how it works, problems and resolution, and integration risk; it also distinguishes local authorization from future remote PR capability.
- `docs/spec-v1.md`, especially the delivery contract, review/correction rules, PR visual and risk section, `DEL-01` to `DEL-07`, and durable job authorization boundaries.
- `docs/durable-work.md` and `docs/templates/attempt.md` / `docs/templates/review.md` for durable job identity, full input checkpoint, separate base/candidate, review provenance, and separate coordinator-owned acceptance.
- `docs/research/adaptaciones-agentes.md` and the delivery/review sections of `docs/research/adaptacion-experiencia.md` for proportional visuals, risk-tied review, exact candidate evidence, and limits on PR authority. No external research was performed.

## Candidate and verification record

- Candidate state: uncommitted local edits; no candidate commit exists. This brief deliberately contains no candidate SHA or self-hash. A snapshot identity can only be assigned externally after the exact final bytes are frozen; this four-path authorization does not include a separate retained snapshot package.
- Candidate status: implementation and checks are recorded below; independent review and operator product acceptance have not been performed or granted by this assignment.
- Earlier checks: the previous writer reported that `git diff --check`, whitespace checks for four new files, file-existence checks, and a four-path scope check passed. Those checks apply to that earlier candidate and were not rerun for all four files during this follow-up. No runtime, remote publication, behavioral product acceptance, or independent review is claimed. Operator acceptance remains pending.

## Appendix: follow-up corrections

This file is the build audit for delivery-profile work, not a durable job brief supplied at the document-input checkpoint. Do not cite this file as its own pinned input. Pin existing grounding documents by full checkpoint SHA and repo-relative path, then read each complete file with `git show <full-checkpoint-sha>:<repo-relative-path>`. If the checkpoint, required path, or checkpoint version is missing or unknown, block the affected job. Do not fall back to the working tree or latest version. A draft may still report a known candidate identity with missing review evidence and work in progress explicitly.

The delivery profile now writes the five root-document paths as code-formatted repo-relative paths instead of Markdown links. The valid local link to `references/delivery.md` is unchanged. The procedure makes full-checkpoint reads mandatory for brief and reference inputs and states the missing-input block.

For this follow-up, the operator authorized edits only to `.agents/roles/delivery.md` and `.audit/delivery-59-build-brief.md`. The other three untracked paths reported by the earlier writer were present at handoff and were not edited. Their presence means the checkout was not clean when this follow-up began, regardless of the earlier writer's unverified claim about its initial status. The follow-up whitespace check passed for both authorized files. The profile link scan found only the unchanged local `[references/delivery.md](references/delivery.md)` link. Git status showed no tracked changes and four untracked files: the two authorized files plus the pre-existing reference and template files. This follow-up makes no claim about an independent review of its candidate. Independent review remains pending; operator product acceptance remains separate and pending.
