# J023: Read-only Git evidence for isSWF reviewers

## Objective and authorization

The operator requests recording this as an isSWF task, not a transient agent todo: provide reviewers with direct access to exact Git evidence without a general shell or mutation/publication commands. This request records future work; implementation, installation and remote publication are not selected by the tracking request. Keep it separate from the four Windows issue repairs.

## Observed need

During PR108 review of candidate 990306075f5f1fc1ae93f5225d9b2355d80cc59a against base 82a1338b35df578cbd749011b35278c17f995f61, the native isswf-reviewer could read/search but not execute Git. It requested the full diff and identity evidence from the coordinator. The coordinator supplied them; independent Standards/Spec assessment passed. The missing capability concerns direct evidence acquisition, not the validity of that completed review.

## Proposed scope and acceptance

- Expose narrowly typed read-only operations for diff, committed content, status and commit identity; no arbitrary Git subcommands, arguments or shell fragments.
- Bind operations to the explicitly authorized repository and exact review base/candidate. Do not expose unrelated repositories or arbitrary filesystem reads through Git options.
- Disable pagers, external diff, textconv and other executable helpers. Assess local Git configuration, environment and revision/path handling as trust boundaries rather than assuming a read-only command name is safe.
- Refuse mutation, publication, checkout/reset, configuration writes and command/argument injection. Preserve working-tree, index and repository configuration bytes during evidence reads.
- Assess the actual supported Pi and Claude integration independently. Do not replace native review delegation or claim OS containment from a tool allowlist.
- Verify positive exact-evidence cases and negative side-effect/escape cases on native Linux and Windows; bound output and time without hiding failures.

## Preparation still needed

Inspect the host extension APIs, existing reviewer profiles and tooling before choosing an implementation. Select the smallest supported boundary; do not build a general Git proxy. Prepare a concrete authorized implementation unit, host/model/effort and finite budget, and proportionate security/independent verification before dispatch. No actors have been launched for J023.
