# Describe the PR

Use a concise title that names the actual change and follows the project's title conventions. The body is a briefing for a reviewer who can inspect the diff, not a file-by-file inventory or execution log.

Use this default structure when the project does not prescribe another template:

```markdown
## Why the change

Explain the problem and observable outcome.

## Change outline

Describe the main behavior or responsibility changes, included scope, and material exclusions. Use a small visual only when useful.

## Special things to note

Name reviewer warnings, compatibility constraints, migrations, rollout order, or important deliberate omissions. Omit this section when empty.

## Risk assessment

Give the classification and reasoning required by the risk assessment reference, including affected scope, plausible failure, impact, likelihood or uncertainty, mitigations and evidence, detection and recovery limits, and residual risk.

## Testing

Name checks actually run and their results, with provenance and relevant limits. State material failed, missing, unavailable, or stale checks. If none ran, say so and explain the verification gap.
```

Risk assessment and testing content are mandatory in every PR description. Under another template, map this content into its existing sections rather than adding empty duplicate headings. Do not drop uncertainty to make the body look complete.

Keep ordinary descriptions short without imposing a fixed line count or deleting essential warnings. Link lengthy supporting evidence when it is retained, accessible to reviewers, and safe to share. Keep material blockers and risk conclusions visible in the body.

Distinguish before-and-after observations from expected behavior and illustrative sketches. Use screenshots for an actual visual result only when available and relevant. Never invent a failure, capture, test run, metric, URL, or reviewer verdict to fill the format.

State pending independent review or acceptance when relevant under project rules. Keep exact candidate and base available in the description or linked evidence as the project requires. A local snapshot is not a published PR head; disclose differences or block publication until reconciled.
