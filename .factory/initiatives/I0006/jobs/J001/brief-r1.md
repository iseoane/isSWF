# I0006/J001: Bun executable distribution

## Objective and authority

The operator selected Bun with "Prefiero bun la verdad.. Implementalo!". Implement local executable packaging and tests. Development remains Node.js and `.mjs`. Do not publish, push, install globally, invoke Claude, or call providers. Existing `.claude/` and the bilingual evaluation edits are operator/session work to preserve.

## Design and scope

Base examined: `bceb0e6b6c8e8a67fe6cf1d7e64d84c516261f1f`.

Compare two shapes before implementation. A compiled interpreter wrapper would minimize changes but would execute installed `.mjs` as the primary runtime. Prefer a compiled tool dispatcher whose modules are bundled, with original source files retained as verified provenance and for existing immutable lifecycle snapshots. Generated tasks still require a bounded JavaScript script entry; Bun supplies that engine without a system Node installation.

Add an explicit Bun release mode to the existing committed-source builder, retaining its Node release mode for existing development fixtures and legacy consumers. A platform-specific package contains one executable and shared Pi/Claude resources. Its manifest and exact receipt inventory include the executable and its target. Format-2 receipts separate a portable source/resource/Bun-version runtime identity from the full native artifact hash. New pins add runtimeFormat: 2; each host retains its variant and a sibling immutable artifact-hash anchor. Legacy format-1 identities and paths remain valid. A self-consistent binary/receipt change must still fail the local anchor check. Original source bytes retain their Git blob identities. Never rewrite archived methodology. Installed execution must spawn the retained runtime's executable, not substitute the globally loaded candidate. A legacy Node runtime may still require Node; do not silently reinterpret its pin with Bun.

The build-time compiler owns module-identity adaptation. Source code remains readable and runnable under Node. Generated bundled copies receive an explicit main-module identity and a real package-root resource location instead of relying on bundled import.meta.url. Executable dispatch metadata is internal bootstrap state, not an environment-selected permission or runtime pin.

## Reading map

- `tools/build-release.mjs`: committed allowlist, manifest, staging, receipt and atomic publication.
- `tools/release-source.mjs`: exact inventory, source identities and hash checks.
- `tools/isswf.mjs`: own package root, retention, pinned execution and leases.
- `tools/isswf-job.mjs`, `tools/pi-worker-task.mjs`, `tools/worker-lifecycle.mjs`: pinned code snapshots, generated tasks, sandbox and subprocess dispatch.
- `tools/pi-worker-task.mjs:27`: exact denied-write error checks. Accept EROFS or EACCES only for the mode-0444 factory-file write. Add an independent factory-directory create control requiring EROFS, with a host writable positive control, and keep SDK EROFS and all other controls exact. Prove a deliberately writable factory mount is rejected.
- `tests/release-package.mjs`: fixture committed builds, tarball, lifecycle and migration contracts.
- `docs/installation.md`, bilingual installation/development guides and shared setup/coordinator skills: installed entry ownership.

## Acceptance and checks

- Build a real native Linux Bun executable from a disposable committed fixture containing the candidate, with no Git operation on operator changes.
- Pack and inspect the actual tarball. Exclude development tools, private evidence and credentials. Keep one version across Pi/core/plugin.
- Execute inspect/init/locate/pinned status/panel without Node or Bun on PATH, except legitimate Git and OS dependencies. Verify spaces, Unicode and invocation outside the package root.
- Exercise a new launcher against a different retained binary revision; prove output comes from that revision. Preserve explicit update/rollback and tamper refusal.
- Run unchanged generated offline worker boundary checks using a synthetic SDK and the actual binary. Preserve all denial, canary, output and mutable-file checks. No real SDK/provider claim.
- Verify successful protected writes remain rejected when accepting alternate permission-denied error codes.
- Keep full recovery/native-provider verification, independent review and unavailable non-Linux runners explicit. Cross-compilation is not runtime support.
- Run portable quality, docs, ESLint, Knip and diff checks against the retained candidate. Do not claim packaging the dirty source directly; build from fixture commits.

## Execution units and closure

One functional local unit includes compiler, manifest/receipt integration, pinned launch selection, tests and bilingual guidance. No automatic commit, release or cleanup. Local mechanical verification is distinct from independent review and operator acceptance. No native worker or advisory subagent was dispatched; current work proceeds directly within the operator's local implementation grant.

## Observed local verification

- Node source development and legacy Node release fixtures remain supported; Bun is now the default release builder mode.
- Native compiled tarball installs locally with npm in a private fixture. Compiled CLI/panel, old/new binary pin selection, explicit migration and rollback, legacy Node requirement, integrity refusal, generated synthetic task, detached lifecycle and namespace cessation pass.
- A disposable mutation removes read-only factory mounts; the new factory-create check detects successful creation and rejects the task. No production mount was weakened.
- SDK dependency metadata resolution now avoids Node-only findPackageJSON, which Bun 1.4.3 does not export. Real SDK/provider behavior is still untested.
- Final portable checks, ESLint, Knip, docs and diff checks passed after portable identity, artifact-anchor, installed-entry and boundary-control reconciliation. The portable run required Bun and Linux Bubblewrap; neither artifact nor worker checks were skipped. There is no duplicate-code detector and none was installed. Release compilation is now an explicit build; no static type-check step applies to source JavaScript.
- Independent review and non-Linux execution remain pending. No advisory/native model dispatch was substituted for missing authorized review.

## Retained candidate and remaining gate

`tooling/.local/bun-implementation/final-quality.log` records the final working-tree run and the isolated committed-source fixture identities. `verification.json` in that directory binds the full diff, new-file hashes, fixture revisions, native executable and portable/native receipt identities. The `verified` directory retains the exact successful fixture and artifacts. These private paths are excluded from distribution. The fixture commits are not commits in the operator checkout. CI is configured with a SHA-pinned Bun setup action and Bun 1.4.3 but has not run on a repository commit.

The local implementation and mechanical checks are complete. Independent review, operator acceptance, real SDK/provider verification, non-Linux execution, signing/publication and native Windows/macOS mutation or isolation parity are not claimed. Keep this job in progress until its remaining review/acceptance gate is reconciled through the canonical plan recorder.
