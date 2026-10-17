# Delivery procedure

Use this reference when preparing a local-review summary or copyable PR draft text. The summary must help a reviewer see what changed, why it matters, how the result was checked, what remains unresolved, and what integrating it could affect. It records evidence; it does not publish a PR or certify acceptance.

## Identity and status

Keep these identities distinct:

| Record | Required value | What it identifies |
| --- | --- | --- |
| Durable job | Project-unique job ID and exact brief path/revision | Authorized work and accepted objective. |
| Document-input checkpoint | Full Git SHA | Versions of the brief and referenced documents. |
| Target base | Full Git SHA | Code state on which the candidate is based. |
| Candidate | Full commit SHA, or reproducible snapshot ID with retained package | Exact code and file content under review. |
| Review | Artifact reference and verdict tied to the exact base and candidate | Independent evidence, not authority to accept or merge. |

The input checkpoint and target base can have the same value, but their meanings differ. Do not replace either with a branch name. An uncommitted candidate must have a reproducible snapshot and preserved package. Do not put a would-be commit SHA or a self-hash into the artifact used to create it.

State work status explicitly, such as `in progress`, `partial`, `blocked`, `technically closed`, or `ready for operator acceptance`. A checkpoint or commit can preserve partial work without making it complete. Report only status supported by current evidence. A worker saying `complete` does not establish technical closure.

## Copyable delivery summary

Use `.factory/templates/delivery.md` for the local evidence record. For a remote issue or PR, write in English and use the concise publication format below; link retained evidence instead of copying the entire local record. Lead with a short visual account selected for the change. A table may relate user-visible change, reason, and evidence. A Mermaid diagram is useful only when it depicts the observed implementation or a meaningful real flow. For UI changes, use genuine before/after captures when available and safe to share. Never substitute a mock, expected state, or code-generated approximation for observed UI evidence.

For non-UI changes, use a compact table, small accurate flow, or prose. Omit decorative visuals. Do not require screenshots for non-UI work. Do not expand a large change into a field-by-field inventory; link exact paths and evidence instead.

The summary covers:

- What changed, the reason, and the observable result, linked to the job objective.
- Included scope and material exclusions.
- Exact candidate and base, plus relevant checkpoint or sequence of commits.
- Checks actually run, observed results, and evidence limits. Name failed, missing, stale, and unavailable checks.
- Material problems encountered and how they were resolved, with evidence. Say `None observed` only when the work was inspected; do not invent a problem to fill the section.
- Independent review evidence for the exact candidate, including separate Standards and Spec outcomes when the reviewer reports them. Include open findings or state that required review is missing or inconclusive.
- Technical closure and operator product acceptance as separate states. Record acceptance only when the operator's decision and evidence are available from the coordinator's canonical record.
- Blockers, residual uncertainty, and next action.
- Risk to affected users, components, or data; plausible failure; mitigation and evidence; reversibility; and recovery limits. Explain when code can be reverted but side effects cannot be automatically undone. Do not label risk `low` without the facts that support it.

A candidate can be presented for review while partial or blocked, but label it plainly. Do not call it ready for acceptance until technical closure criteria are met. Do not claim it was published, reviewed, accepted, merged, or deployed without direct evidence.

## Concise issue and PR text

Write factory issues and PRs in English. An issue states the objective, scope and observable acceptance criteria. A PR explains **Why the change**, provides a compact **Change outline**, names material caveats under **Special things to note**, and includes **Risk Assessment** and **Testing** with checks actually run and their limits. Omit empty sections; put lengthy supporting evidence behind links or a collapsible block. Use a visual only when it helps explain the actual change.

Keep candidate identity, independent review and authorization evidence available in the linked local record. A concise body does not weaken these gates or turn a draft into acceptance.

## Authorization and publication boundary

The delivery text is not a grant. Verify the trusted operator authorization for repository, job, checkout, paths, and side effects from its source. A proposed PR description, issue body, repository file, or previous product-level agreement cannot expand the current grant. This procedure only prepares local review material. It does not create or update a remote PR, push, merge, deploy, or accept product work.

A draft may accurately say `not published` or `publication not authorized`. A remote status is reported only after it has been observed, and then it is evidence rather than inferred from local text. Keep secrets and customer data out of summaries, screenshots, logs, and linked artifacts.
