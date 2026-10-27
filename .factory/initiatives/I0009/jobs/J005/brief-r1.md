# J005: Native directory-alias fixtures (#86) and Bubblewrap verification

## Current authorization and objective

The operator requested committing #85, then correcting #86 and resolving missing Bubblewrap. #85 is retained in 5a59fff5e09225851f9a88eba2823775ba5160dc without push. This unit authorizes reversible fixture/CI changes and scoped local Linux sandbox setup/checks, not global host reconfiguration, root-policy bypass, provider calls, issue closure, push or publication. No independent reviewer or isolated native Windows worker is claimed.

## Grounding and acceptance

Issue #86 and retained native Windows logs show both tests fail while creating directory-only symlink fixtures, before the application's refusal assertion. tests/plan-grant-boundary.mjs already uses Windows junctions for canonical directory aliases. Preserve Linux symlinks, actual application refusal, installed file/receipt integrity, and absence of target writes. Do not skip assertions or enable Developer Mode/elevation to manufacture a green result.

The selected bounded change uses Windows junctions and Linux directory symlinks in tests/factory-tools-install.mjs and tests/initiative-plan.mjs. Both assert lstat.isSymbolicLink. The former compares all aliased tool/receipt bytes after refusal; the latter asserts the actual directory-boundary diagnostic and unchanged empty target. Add both suites to the existing native Linux/Windows CI step.

## Bubblewrap setup and verification

Initial WSL checks found missing Bubblewrap, working unprivileged user/PID/network namespaces, and sudo requiring an interactive password. A private official Debian package was downloaded/extracted and SHA256 verified; it passed a namespace smoke test, but was insufficient for native code that deliberately pins /usr/bin/bwrap. No executable-path policy was changed and no root alternative was used. The operator then installed the canonical Debian package interactively. Confirmed /usr/bin/bwrap version 0.12.0, package 0.12.0-1~deb13u1, and namespace smoke success. Private extraction is not reported as a system installation; global PATH was not changed.

## Exact retained evidence

Runtime/test fixture candidate 4e8e88b03349fecbde345c96936edfead802a576 is a local verification fixture, not source HEAD or a published release. Its Windows temporary directory is isswf-86-regression-20261026/source, and its Linux native-filesystem copy is /tmp/isswf-86-regression-20261026. Ignored driver: tooling/.local/windows-86/retain-candidate.mjs. Full Linux log: /tmp/isswf-86-regression-full.log, also retained in the Windows temporary root as linux-full.private.log.

- Native Windows clean LF checkout: both corrected suites PASS, including the previously unreachable refusal assertions. No privilege changes or skips.
- Native Windows initiative-plan in the current checkout: PASS. Direct factory-tools-install in the older working checkout still fails earlier on pre-existing raw CRLF bytes versus Git LF. Use the fresh policy-materialized candidate rather than resetting user files or weakening exact comparison.
- Linux full portable quality with ISSWF_TEST_BUN=/home/iseoane/.local/bin/bun and ISSWF_TEST_BUN_WORKER=1: PASS. Compiled Bun synthetic isolated task now PASS, not the previous missing-Bubblewrap SKIP. Bun version remains 1.4.4, distinct from CI's 1.4.3.
- Explicit node tests/diagnostic-probes.mjs . --sandbox: PASS actual host network positive control, isolated network/home/environment/Git, read-only project, unchanged canary/Git tree, and timeout/output/dirty-target refusal.
- First diagnostic invocation accidentally omitted the required source positional argument and failed module resolution; corrected command above passed. This invocation mistake is not a newly reported product defect.
- Documentation structure and whitespace checks PASS. CI wiring and work records were added after the exact runtime/test fixture; no remote CI result or Windows Bun artifact result is claimed.

Combined mechanical and semantic boundary verification is selected; independent semantic assessment remains pending. The unavailable native Windows isolation path is not substituted with another dispatcher. No live provider, SDK model session or paid worker was launched. Keep this unit in-review and preserve earlier failures and setup limitations rather than rewriting them as historical success.
