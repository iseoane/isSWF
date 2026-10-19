# J014 installed planning tools

## Work and candidate

J014, brief-r1. Source installer delivered in PR59. Integration delivered in PR61, merged at `a6f96cb929da25c4cc02d172da6c613991b7c06e`.

## What changed and why

Target planning and observation executables install under `.factory/tools`, separately from Markdown resource activation. Six committed modules have a verified receipt and coherent imports. Source-checkout use remains available.

## Visual summary

`fixed source revision → install-tools → target .factory/tools`

## Scope

Includes plan, status, panel, response, intake and quality-discovery modules. Excludes the SDK/job runtime, dependencies, tests, audit archives and development tooling. No client installation was performed.

## Checks and results

The public test creates owned synthetic Git source and target repositories, installs exact committed files, exercises plan/status/panel, imports all six modules and checks reuse, conflicts, tampering, symlinks and held claims. A native review-runtime read-only probe passed. Intake/response imports are not full behavioral integration tests. Aggregate quality, ESLint and Knip passed; PR61 CI `39213697433` and main CI `39213781388` succeeded.

## Problems and resolution

Earlier source reviews were inconclusive until full installer evidence was supplied. The third source review passed; the integration review independently passed after explicit model/effort and exact aggregate evidence were supplied. Failed and inconclusive reports remain preserved.

## Independent review

Source evidence: [A001.md](A001.md). Integration evidence and actual report: [integration-verification.json](integration-verification.json). Standards and Spec passed for the documented bounded integration.

## Closure and acceptance

The operator explicitly accepted this bounded delivery: “J014 aceptada.” J014 is completed for the documented six-tool installation subset. This acceptance does not accept the J013 retention proposal or close v1.

## Integration risk and recovery

Installation is explicit and receipt-bound. Partial claims and conflicts block rather than overwrite. No automatic upgrade or hostile-concurrent-path protection is claimed. Code is reversible through Git; no external installation needs rollback from this work.

## Blockers and next action

No acceptance blocker remains for this bounded delivery. Preserve the accepted six-tool subset and separation from the source-bound runtime; continue the remaining v1 jobs.
