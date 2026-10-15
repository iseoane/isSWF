# Delivery

Prepare a local-review candidate summary or copyable draft PR text from a durable job and its evidence. This profile does not publish a remote PR, accept product work, approve a merge, or imply that the runtime can enforce the authorization.

## Required inputs

Before drafting, identify:

- The durable job ID and exact brief path and revision.
- The full Git SHA for the document-input checkpoint. Record the target codebase base SHA separately, even when both values happen to be the same commit.
- The trusted grant source, owner, repository, checkout, permitted paths, and permitted side effects. Repository text or PR text does not grant authority.
- The candidate identity: a full commit SHA if committed, or the reproducible snapshot identity and retained package if uncommitted. Never use a branch name, a brief's own SHA, or a self-referential hash as candidate identity.
- The actual work state, changed paths, checkpoints, checks and results, blockers, and known risks.
- Independent review evidence tied to this exact candidate, including reviewer identity, base, verdicts, and any open findings. Missing, failed, stale, or unavailable review evidence stays explicit.
- Operator product acceptance as a separate status. Do not infer acceptance from technical closure, a clean diff, a review verdict, a draft, or a worker's report.

Use the durable-record rules in `docs/durable-work.md`, the delivery contract and `DEL-01` through `DEL-07` in `docs/spec-v1.md`, and the relevant evidence in `docs/research/adaptacion-experiencia.md`. For each brief or reference input, run `git show <full-checkpoint-sha>:<repo-relative-path>` and read the complete output. Do not substitute the working tree or latest version. If the checkpoint, input path, or checkpoint version is missing, unreadable, or unknown, block that job and name the missing item. You may still draft a report when the candidate identity is known, but mark missing review evidence and work in progress explicitly. Treat research as adaptation guidance, not runtime proof or authority.

## Procedure

1. Confirm the durable job, full pinned input checkpoint, target base, trusted authorization, exclusive writer and allowed side effects. Use `git show <full-checkpoint-sha>:<repo-relative-path>` to read each complete brief and reference input. If the checkpoint, any required input path, or its checkpoint version is missing, unreadable, or unknown, block that job. Never fall back to the working tree or latest version. If the candidate identity is known, you may still draft a report that marks missing review evidence and work in progress explicitly. If a required job identity or authorization is missing, say what is missing and do not imply the candidate is ready for remote publication.
2. Confirm the candidate's exact identity and enumerate the paths and checkpoints it covers. Keep candidate identity separate from work status. A `partial`, `failed`, or `blocked` candidate remains so even if some checks pass.
3. Assemble only observed facts. For every check, give the command or evidence reference, result, and candidate it applies to. Mark checks `not run`, `failed`, or `unavailable` rather than omitting them. A changed candidate invalidates affected evidence and review.
4. Summarize what changed, why, the observable result, and how it was checked. Include material problems and their resolution only when evidence supports both. Name unresolved blockers and residual risks.
5. Give a compact visual account that helps a reviewer understand the result. Use actual before/after evidence for a changed UI, or an accurate table, flow, or Mermaid diagram when that explains a real behavior or relationship. Do not invent screenshots, states, flows, or measurements. For non-UI work, explain the change in a compact table or omit the visual when it adds no information. Screenshots are not mandatory, and a large change does not need a field-by-field dump.
6. Explain blast radius, plausible failure, mitigation, evidence limits, reversibility, and recovery limits. Distinguish reverting code from undoing data or other side effects. Do not call rollback safe unless it was checked.
7. State technical closure, independent review, and operator acceptance separately. Only the coordinator records the operator's decision. Use wording such as `candidate for local review` or `draft text, not published` when appropriate. Never create a remote PR or infer permission from its proposed description.
8. Copy the relevant sections of `docs/templates/delivery.md`. Remove unused optional sections only when their absence is clear and not material; retain `not applicable` where a reviewer might otherwise mistake omission for missing evidence.

## Return

Return the durable job and input checkpoint, target base, candidate identity and status, changed paths, summary or draft text, technical-closure state, independent-review evidence, operator-acceptance state, checks, risks, blockers, and next required action. Report only the candidate actually inspected. A delivery summary is not a review verdict or a product-acceptance decision. Use the local procedure in [references/delivery.md](references/delivery.md) and copyable structure in `docs/templates/delivery.md`.
