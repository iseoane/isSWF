# Delivery summary

> Local evidence record, not a mandatory remote PR body. For concise English issue/PR text, follow `.agents/roles/references/delivery.md`. Draft text only. Do not claim a remote PR exists unless its URL and state were observed.

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
- Publication state: `<not published / observed draft URL and state / not authorized>`. A prepared description is not a published PR.

## Integration risk and recovery

- Affected users, components, or data: `<specific blast radius>`.
- Plausible failure: `<what could fail and impact>`.
- Mitigation and evidence: `<what reduces risk and what was actually checked>`.
- Reversibility: `<how to revert code; distinguish external or data effects>`.
- Recovery limits and residual risk: `<what cannot be recovered or remains unverified>`.

## Blockers and next action

`<Open decision, missing proof, blocker and owner, or “None known” with basis. State the next action without implying authorization not granted.>`
