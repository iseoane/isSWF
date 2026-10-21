# I0005: Installable on-demand factory

Type: enhancement

This coordinator-owned plan records reported progress, not execution permission or process liveness. This checkout remains on its existing legacy state root until its own explicit clean migration.

## J001

- Status: awaiting-human
- Objective: Install complete Pi/plugin integrations with a common version, per-repo .isswf state and explicit safe upgrades without requiring a development checkout.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: Product acceptance, release publication, installation and migration remain separate decisions. The operator has explicitly authorised committing the current work and pushing main to origin; that does not authorise a release or Claude execution.
- Next step: Checkpoint the reviewed working-tree scope, verify the exact commit, and push main without force. Keep the original candidate's independent review distinct from the later English-resource and documentation changes.

### Acceptance

- A built allowlisted release installs as a Pi package and validates as a Claude plugin/marketplace without shipping development records or credentials.
- Installed tools resolve pinned own methodology without a Git checkout; target inputs, grants, model routes, and sandbox contracts retain their existing checks.
- Initialization is explicit, preserves existing configuration, and records a portable `.isswf/install.json` pin to an immutable retained runtime.
- A legacy `.factory` state moves explicitly to `.isswf` with exact byte/mode inventory and recovery; two active state directories refuse selection.
- Pi, core and plugin share a release version. Do not execute Claude for implementation, tests, or review.
- Inspection changes no project/store bytes and reports current/available versions and known blockers.
- Migration requires an exact prior pin digest, a Git checkpoint of affected files, and external-writer reconciliation. It retains old runtime and exact before-bytes.
- Repetition is safe; tamper, symlinks, drift, active/unknown activity, and interrupted operations refuse without overwriting operator work.
- Rollback and explicit interrupted-migration recovery preserve historical plans, briefs, attempts, reviews, and evidence.
- Actual tarball installation, CLI behavior, portable quality checks, and independent review cover the candidate. Publication, global installation, provider calls, and product acceptance remain separate.

### Evidence

- docs/installation.md.
- tests/release-package.mjs.
- Portable quality, isolated Pi manager, ESLint and Knip passed against the current implementation; private raw outputs are not product acceptance.
- jobs/J001/V001.md preserves previous failures and final Standards PASS / Spec PASS for candidate 0b8d40a634e5eedd20f09b12431f0c57dbe1ac38def512ee3af13719e331f0c8.
- jobs/J001/delivery.md records verified scope, checks, limits and pending operator acceptance.
- jobs/J001/candidate-r2.json pins the exact reviewed uncommitted product-source inventory.
