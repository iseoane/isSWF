# Delivery summary

> Local evidence record, not a mandatory remote PR body. For concise English issue/PR text, follow `.agents/roles/references/delivery.md`. This record does not publish or accept work. The coordinator continues covered feature-to-PR actions without another routine permission request. Do not claim a remote PR exists unless its URL and state were observed.

## Work and candidate

- Job: `<project-unique ID>`, brief `<path>` revision `<revision>`.
- Document-input checkpoint: `<full Git SHA>`.
- Target codebase base: `<full Git SHA>`.
- Candidate: `<full commit SHA>` or `<snapshot ID and retained package reference>`.
- Work status: `<in progress | partial | blocked | technically closed | ready for operator acceptance>`.
- Changed paths and checkpoints: `<paths; relevant commits or snapshot contents>`.
- Authorization source and owner: `<trusted operator conversation/record or external authorization path; owner>`. Scope: `<repository, checkout, paths and permitted effects>`.

## What changed and why

`<Observable result for the user or maintainer, why it was needed, and how the change achieves it. Link the objective or acceptance criteria.>`

## Visual summary

`<Use a compact table, accurate flow, or useful Mermaid diagram based on observed behavior. For UI work, link genuine before/after captures if available and safe. For non-UI work, use a small factual diagram/table only if it adds information. Otherwise write “No visual evidence applies to this non-UI change.” Do not invent visuals or require screenshots.>`

| Change or behavior | Why it matters | Evidence or path |
| --- | --- | --- |
| `<observed change>` | `<user or maintainer impact>` | `<path, check, capture, or artifact>` |

## Scope

- Included: `<summary>`.
- Excluded: `<material exclusions>`.

## Checks and results

| Check or evidence | Candidate | Result | Limits or reference |
| --- | --- | --- | --- |
| `<command or observable check>` | `<candidate identity>` | `<passed, failed, not run, unavailable>` | `<output or artifact; what this does not prove>` |

## Problems and resolution

`<Material problem found and evidence-backed resolution, or “None observed after inspecting the candidate.” Do not invent problems.>`

## Independent review

- Evidence: `<review artifact and reviewer identity, or “not run / unavailable”>`.
- Exact base and candidate reviewed: `<full identities>`.
- Standards: `<pass, fail, or inconclusive, with evidence>`.
- Spec: `<pass, fail, or inconclusive, with evidence>`.
- Findings and disposition: `<open findings, or evidence-backed disposition by coordinator>`.

## Closure and acceptance

- Technical closure: `<closed or not closed, with criteria and evidence>`.
- Operator product acceptance: `<pending, accepted, or rejected; cite the coordinator's canonical decision record. Do not fill in for the operator.>`
- Publication state: `<not published / observed PR URL and state / not authorized>`. A prepared description is not a published PR.
- PR identity and CI: `<observed repository, head SHA, base branch/SHA, required checks and exact checked head>`.
- Human decision: `<definition/setup question, product acceptance, or integration of the verified PR; state the actual question and resume condition>`.
- Integration boundary: `<awaiting-human; no default merge, auto-merge or direct push to the integration branch>`.

## Integration risk and recovery

`<Insert or reference the candidate-specific assessment produced with .agents/skills/isswf-pr/references/risk-assessment.md. Keep its classification, reasoning, evidence limits, and residual risks available. Reuse this same assessment in PR text; this local record is not a separate risk rubric.>`

## Blockers and next action

`<Open decision, missing proof, blocker and owner, or “None known” with basis. State the next action without implying authorization not granted.>`
