# J006: Native Windows distribution and host integration verification

## Authorization, base and outcome

The operator explicitly approved isolated native Bun and locked host-test dependency preparation and reaffirmed the final Linux/Windows factory-operation objective. This milestone tests installation/discovery; it does not authorize model calls, personal host configuration changes, global registration, publication or weakening worker boundaries. Examined exact source: 23ab7c8d8f766cacda61986699006b8a677c1080. The current source working tree was clean before this record.

Mechanical verification is sufficient for this no-product-code installation milestone; independent review of earlier changes and final runtime acceptance remain separate gates. No alternate worker dispatcher was used.

## Bounded environment and checks

Reused the existing policy-clean exact-HEAD Windows fixture rather than creating another full copy. Available disk exceeds 1 TB; the private compiler/dependencies/platform fixtures were bounded to a few GB. Installed @oven/bun-windows-x64 1.4.3 with lifecycle scripts disabled and verified its npm lock integrity against registry metadata before invoking it. Installed the checked-in tooling/host-tests lock with npm ci --ignore-scripts --no-audit --no-fund in that isolated fixture. No global PATH update; compiler PATH applies to the test subprocess only. Tests create their own isolated HOME, APPDATA, Pi and Claude configurations with no credentials or model prompts.

- tests/platform-package.mjs: PASS native win32/x64 Bun build, real npm tarball installation, exact receipt, executable version/usage, readonly inspection, init/repeat, pinned first plan/repeat, Unicode/spaces, native Git worktree recipes and resource contracts.
- ArtifactId: 6d276448edf6907584a4425302b6a5ff5cc4bee9214c1d97609d5577701ab3e3. This is a locally built development artifact, not a published release.
- tests/host-discovery.mjs: PASS actual Pi 1.4.0 user/project package installation and DefaultResourceLoader inventory; Claude 2.1.299 local marketplace/plugin installation and inventory. All 14 packaged skills match installed resources.
- tests/source-host-isolation.mjs: PASS Pi collision positive control, idempotent project filtering, 15 source skills and unrelated resources preserved, neighbour/untrusted configurations, malformed/conflicting refusal, no custom manager execution, Claude inline source discovery and preserved user settings.

## Retention and interrupted wrapper

Private Windows temporary root: isswf-windows-install-1793021783265. Native platform and host reports are under native-platform/platform-report.json and host-report.json; the full compiled installed artifact and tarball are retained there. The first combined wrapper exceeded its outer 300-second allowance during the optional source-isolation suite; the first two durable PASS reports survived, but no third result was claimed. CIM inspection confirmed no remaining relevant test processes. A fresh isolated configuration directory, source-isolation-separate, reused the same artifact/report and gave the third suite its own bounded invocation; it passed and retained source-isolation-report.json plus observations.private.json. Original partial profiles remain untouched. Ignored driver: tooling/.local/windows-install/native-host.mjs.

## Remaining final-objective boundary

Initialization still deliberately leaves setup readiness partial until model/delivery/runtime choices and real capabilities are established. No coordinator session, live provider, Windows isolated worker, full migration/recovery or network-sandbox equivalence is proven by package/host discovery. J007 grounds that native runtime gap rather than lowering acceptance to what already works. Linux already has portable and actual Bubblewrap synthetic execution PASS, not a blanket real-provider guarantee.
