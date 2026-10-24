---
name: isswf-pr
description: Prepare or update a pull request with a clear description, verified evidence, and a mandatory risk assessment. Use for PR descriptions, review-readiness preparation, or authorized PR creation and updates, directly or through a delivery workflow.
---

# Prepare a pull request with explicit risk

Use this skill directly in any project or from its delivery workflow. Follow applicable language, terminology, PR templates, and publication rules. A direct user does not need factory activation, a job, or initiative records. When a delivery workflow supplies required identities, evidence, or restrictions, preserve them.

## 1. Resolve the action and candidate

Distinguish drafting text, inspecting an existing PR, running checks, creating a PR, and updating a published PR. Use the request and current authorization to establish the repository, target, scope, and permitted effects. Ask only when an unresolved ambiguity or missing permission affects the next action. For a coordinator's [feature-to-PR assignment](../../roles/references/feature-delivery.md), the trusted current feature start selects covered PR publication/updates and exact-head CI under the configured scope and limits; do not require another publication confirmation. It does not select integration or override explicit local-only/prepare-only restrictions. A direct request to draft a PR remains drafting. Continue independently authorized local preparation when publication is blocked.

Identify the actual base and head commits for a committed candidate. For a local uncommitted draft, identify the base and included tracked and untracked changes, label it uncommitted, and retain a reproducible snapshot when the project requires one. A branch name alone does not establish the inspected content. Preserve unrelated operator changes.

For an existing PR, inspect its current base, head, description, and state through the supported host tools only when access is authorized. If unavailable, use supplied evidence with explicit limits rather than inventing remote state. Confirm the intended target before making remote changes.

This step ends when the candidate, requested operation, and applicable boundaries are identified, or with the specific blocker.

## 2. Inspect the change and evidence

Read the complete candidate diff against its intended base and enough surrounding code, affected consumers, requirements, and project rules to understand the change. Cover the whole PR, not only its latest commit. Identify the problem, observable result, included scope, exclusions, compatibility concerns, and useful reviewer entry points.

Associate checks with the candidate actually checked. Distinguish executed checks, supplied evidence, independent review, and future CI. Name failures, missing checks, stale results, open findings, and unavailable evidence. Passing tests do not establish product acceptance or independent review.

Run only relevant checks within the current grant. Do not rewrite code or history, commit, push, retarget, merge, deploy, or mark a PR ready as a side effect of drafting. Recommend a scope split when unrelated changes prevent meaningful review, without changing the branch automatically.

This step ends when the explanation and evidence cover the inspected scope, with any gaps explicit.

## 3. Assess risk for every PR

Read [risk assessment](references/risk-assessment.md) and apply it to the exact candidate, including documentation-only changes. Keep its classification, reasoning, mitigations, and residual uncertainty in the description. Risk assessment is mandatory even when evidence is missing or no tests ran.

A delivery workflow uses this same assessment for its local record and PR, rather than maintaining another rubric. Risk assessment by the author is not independent review, acceptance, or permission to merge.

This step ends with an evidence-backed assessment or an explicit unresolved assessment naming missing information. Neither a bare label nor an empty section is sufficient.

## 4. Draft for the reviewer

Use [the PR description format](references/pr-description.md). Respect the project's template while retaining mandatory risk and testing content, inside existing sections when appropriate. If an enforced template cannot accommodate those requirements, report the conflict instead of silently dropping them. Include required closure or review limits in the body and link supporting details only when recipients can access them safely.

Use the smallest representation that explains the real change. A table, flow, tree, or diff can help; prose is sufficient when clearer. Use genuine UI captures when available and relevant. Label sketches as illustrative, not observed evidence. Keep secrets, private paths, and sensitive logs out of shared text.

This step ends with a title and description supported by the inspected candidate and usable by its reviewers. A partial or blocked candidate can have a draft description without being ready to integrate.

## 5. Deliver or publish within authorization

Return copyable text by default. Save a local file when requested or required by the delivery workflow, using its existing destination. No persistent record is required for direct use.

Create or update a remote PR only when that operation is covered by current authorization and the required prerequisites are met. Use the project's supported forge or host tool. Do not install tooling, push, rewrite history, change readiness, start monitoring, or merge implicitly. In a feature-to-PR assignment the coordinator performs explicitly covered branch push and CI observation as separate workflow actions, not as side effects of drafting. Honor the requested draft/readiness state and project gates; do not force every PR ready or draft.

Before a remote write, confirm that the candidate still matches the assessment and checks. If it changed, repeat affected inspection, evidence checks, and risk assessment. After writing, read back the target, description, head, and state. Report a failure or uncertain outcome without claiming publication or retrying blindly.

Return the text or observed PR URL and state, key verification limits, unresolved risks, and next action. Technical closure, independent review, operator acceptance, publication, and merge remain separate states.
