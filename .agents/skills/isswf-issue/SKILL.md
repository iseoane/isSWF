---
name: isswf-issue
description: Prepare or create GitHub issues for independent bugs discovered outside the current assignment, new features, or improvements. Route reports to the project or factory repository, protect private information, check duplicates, and require needs-triage on every new issue.
---

# Report a finding without expanding the assignment

Use this skill directly in any project or through its coordinator. Follow the destination repository's templates, language, and contribution rules. Direct use does not require factory activation, a job, or initiative records. An issue records a request for assessment, not approval to implement it.

## 1. Decide whether to report

| Finding | Action |
| --- | --- |
| An implementation error or failed check caused by work in the current assignment | Keep diagnosis and correction within that assignment. Do not create an issue merely to externalize unfinished work. |
| An independent bug discovered during other work | Prepare a separate report. Do not start fixing it or expand the current scope. |
| A new feature or improvement | Prepare a proposal, not an approved implementation task. |
| Uncertain cause or ownership | Preserve the observation and uncertainty. Investigate safely within scope or ask the focused question needed to route it. |
| A possible vulnerability, secret exposure, or sensitive incident | Stop public publication. Follow the destination's security reporting policy using separately authorized private communication; otherwise return a sanitized draft and the missing safe channel. |

If a finding blocks the current assignment, notify the coordinator or user as well as preparing the report. An explicitly requested issue about current work may be drafted, but does not discharge its original acceptance criteria.

This step ends with the report type, its relationship to the current assignment, and any immediate blocker identified.

## 2. Resolve destination and authority

Read [routing and publication](references/routing-and-publication.md) before remote queries or writes. Determine whether the behavior belongs to the user's product or the factory using relevant evidence, not the directory from which the skill was invoked. Verify the exact repository and applicable access. A project publication grant does not authorize a factory report or disclosure of project material there.

Prepare copyable text when publication is not authorized. Save a file only when requested or required by the calling workflow. Ask only for the missing destination decision, permission, or necessary product detail; do not reconfirm already covered actions.

This step ends with an evidence-backed destination and permitted operation, or an explicit unresolved routing or authorization blocker.

## 3. Gather enough evidence and check duplicates

Inspect relevant behavior, versions, and expected contracts without turning reporting into full implementation. Reproduce only through safe, authorized probes. Separate observed facts, supplied reports, suspected causes, and unverified expectations. A failed reproduction does not erase a credible observation; report its limits.

Within authorized access, search the verified destination's open and closed issues and relevant known resolutions by behavior and concept, not just title. Inspect plausible matches. If an existing issue covers the finding, return its observed URL and explain the overlap instead of creating another one. A comment or update to that issue requires its own applicable authorization. A closed match may represent a regression; establish the distinction before proposing a new issue.

If duplicate search is unavailable or incomplete, disclose that gap and keep a draft until resolved or the operator explicitly accepts publication without that search. Do not claim that no duplicate exists from an unsuccessful query.

Read [report content](references/report-content.md) and use the destination's template. Keep the report understandable without access to the user's private project. Use a minimal sanitized example for a factory report. Do not attach full sessions, private code, internal URLs, credentials, customer data, or unreviewed logs.

This step ends with a useful, sanitized report and a recorded duplicate-search outcome or blocker.

## 4. Require needs-triage and publish only when permitted

Every new issue created by this skill must carry the exact existing label `needs-triage`, including bugs, enhancements, project reports, and factory reports. Never substitute `ready-for-agent` or treat the label as permission to execute. Select an appropriate existing category such as `bug` or `enhancement` when the destination uses one and the operation is permitted. Do not invent labels or silently remap the mandatory state label.

Before creating, verify that `needs-triage` exists and can be applied through the supported tooling and current grant. If it is absent, permissions are insufficient, or applicability cannot be established, return the draft and specific blocker. Creating labels needs separate explicit authorization; do not create the issue unlabeled as a workaround.

Follow the write and readback procedure in [routing and publication](references/routing-and-publication.md). Supply `needs-triage` in the creation operation when supported. If creation and labeling cannot be combined, keep a draft unless the operator authorizes the non-atomic sequence and its partial-failure handling. An issue whose label could not be verified or applied is not a successfully completed report.

This step ends with an observed issue URL, correct destination and verified `needs-triage`, or a draft, blocked state, or explicitly partial/uncertain outcome.

## 5. Return the result without starting implementation

Report the type, destination, title or observed URL, duplicate disposition, publication state, labels actually verified, and material evidence or privacy limits. Keep proposed work distinct from accepted work. Do not assign implementers, alter existing triage states, close issues, start intake, create jobs, or launch work as a side effect.

A coordinator can later process the observed issue through its existing intake and triage contracts under separate authorization. This skill creates reports; it does not replace those contracts or repair runtime setup.
