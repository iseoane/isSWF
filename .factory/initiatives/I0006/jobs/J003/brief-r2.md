# I0006/J003: Repair and validate the stable Linux x64 candidate

## Objective and authority

The operator explicitly requested "Corrige el fallo y repite la validación para tener una release estable" after the published v1.1.0 real worker failed during SDK setup. Repair the root cause, repeat validation and prepare a new aligned 1.1.1 Linux x64 release only after exact-candidate checks, independent native review and CI pass. Preserve the old release, attempts, runtime pins and operator edits. No main merge, npm publication, global host installation, credentials disclosure, API-cost increase or model-route change is included.

This brief supersedes revision 1 for the repair and new-candidate validation, not the historical failed attempt. Existing admissions remain consumed. Fresh validation is separately assigned to the repaired candidate in an exclusive scratch project; it is not a recovery, replay or renaming of the old job.

## Cause, shape and implementation

The published and a minimal compiled Bun executable fail SDK/typebox loading and the SDK's transitive chalk import. Node and interpreted Bun load those same bytes. Bun's compiled mode disables package.json autoload by default. The upstream maintainer specifies --compile-autoload-package-json in https://github.com/oven-sh/bun/issues/27058. A minimal same-SDK comparison changes only that flag and passes. Enable it in the factory's existing compiler command, without bundling the SDK, modifying its installation or substituting Node.

The second discovered defect is relative .mjs dispatch. Generated checks run commands such as node check.mjs. Resolve relative script arguments from cwd through the existing script branch, while keeping factory command dispatch and retained-runtime verification unchanged. This does not implement general Node CLI flag compatibility.

Data remains the existing release manifest/receipt and immutable task snapshots. No new configuration or mutable status store is introduced. Add a behavioral regression at the packed executable boundary using an external package with a nonstandard main, exports-only transitive dependency and both absolute/relative script invocations. A fixture without main was corrected because absolute directory require must have an entry; it is not used as failure proof. The corrected fixture passes on Node and fails on the old compiled artifact.

## Examined source and scope

Base is published commit 62c52118cb0cf94951997b9b99896dd17478a85d. tools/bun-release.mjs owns compiler flags and script dispatch. tests/bun-release.mjs owns compiled tarball, handoff, tamper, migration, sandbox and lifecycle checks. package.json and .claude-plugin/plugin.json must stay version-aligned. README.md/README.es.md name real release downloads and complete extracted package installation paths; docs/installation.md and docs/en/development.md with its Spanish mirror describe actual compilation and test boundaries. No auth, provider route, release trust assumptions or sandbox mounts are weakened.

## Observed fixture evidence

These are author observations, not independent reviewer executions and not final release identities:

- Corrected package-exports regression fails on the old compiled executable with Cannot find module, then passes with package-json autoload enabled. Relative script regression fails before dispatch repair and passes after it.
- Full Bun artifact tests pass with required actual Bubblewrap, synthetic worker/lifecycle/cessation, writable-factory negative control, exact pin selection, paired artifact tamper rejection, legacy Node refusal and migration/rollback. Retained fixture source 564d233de85138c23c931cb2307120b1c16ae5cc.
- Existing actual Pi SDK 1.3.0 passes module probes and the normal installed offline job path with attributed filesystem/network controls and protected check exit 0.
- One current-grant real worker job on that repaired fixture completes with actual SDK and provider openai-codex/gpt-6-luna/high. Four sandbox tool calls, providerPromptStarted true, acceptance true, protectedHashesPreserved true, boundaryCallAttributed true, checkExitCode 0 and only sum.mjs mutable. Independent host inspection reads the repaired bytes, reruns check.mjs and confirms inspectWorkerCessation status ceased.
- Zero-provider-call preflight confirms compatible effort and existing OAuth subscription. No new API-cost attestation, alternate provider, automatic retry or extra worker was substituted.
- Claude's actual plugin validator accepts the packed artifact. No Claude model call or native delegation is claimed. This release's stable execution scope is Linux x64 with the reference Pi worker, not complete host/platform parity.
- Bilingual structural/command/link checks and diff checks pass. Final full suite, exact release artifact validation, exact-head CI and independent review remain gates, not inferred passes from these fixtures.

## Acceptance and stopping conditions

Build and pack the exact final committed candidate. Repeat the normal installed actual-SDK/provider worker validation, inspect changed bytes and protected checks, require attributed boundary checks and ceased native processes. Preserve all failed/partial records. Do not promote on incomplete capture, unknown liveness, quota/error, incompatible route or unmet acceptance.

Run portable quality with Bun and Linux sandbox mandatory, ESLint, Knip, bilingual docs and diff checks. Require sufficient independent native Standards/Spec review tied to the exact candidate, with complete relevant evidence, canonical route, fresh bounded one-attempt subscription-only grant and no fallback. Review the report, not just transport completion. Exact-head CI must pass before release.

A final release includes a complete platform tarball, SHA256SUMS and attributable verification/review evidence. Inspect uploaded/downloaded artifacts and tag target before publication. Publish only a new version; do not mutate v1.1.0, move main or infer Claude/non-Linux/signing support. No benchmark performance claim is included.

## Retained evidence

Private reproductions, module probes, corrected red/green logs, actual SDK jobs and real result/cessation evidence are retained under /home/iseoane/.cache/isswf-stable-validation-au13Un. The repository-local pointer is tooling/.local/bun-release-delivery/stable-validation-root.txt. Those paths are not package inputs and carry no permission. Final-candidate results must state their own exact source/artifact identity separately.
