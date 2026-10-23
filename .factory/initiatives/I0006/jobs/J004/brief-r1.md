# I0006/J004: Native Claude validation of published 1.1.1

## Objective and authority

The operator requested Claude validation after the Linux x64 reference Pi release. The operator explicitly approved Sonnet with the existing Team account, one native coordinator, one worker and one independent reviewer, no fallback/retry or additional authorized costs. Two coordinator-only preparation attempts stopped before delegation. Each subsequent attempt received its own explicit operator approval. The third approval additionally allowed normal Bash for local disposable-project checks and repair. No global host installation, permission-bypass mode, main merge, release mutation or extra actor was authorized.

Validate the unchanged published version 1.1.1 at source 9114a60d1a86c5599dc354adaa3facbe15fd9af0, runtimeId 93129ae563cc8364ff1192813b094e4fcfd9eae3c6dcd291a68efb5fd3659647 and artifactId 98a444e9ea6900a6537c4e59340fe7edd6dc66923e4a4d23da6e55149b54a73c. Use actual Claude native plugin delegation, not Pi SDK or an advisory dispatcher. Existing source-checkout .claude/ remains untracked and was neither inspected nor changed.

## Host and preparation observations

Actual CLI is Claude Code 2.1.299. Its auth status reports first-party claude.ai Team authentication; no API-key override was configured. The actual parent and both child assistant stream messages identify claude-sonnet-5-5. Requested effort was medium, but effective effort was not independently observed for each child. Rate-limit observations report allowed, isUsingOverage false and overage rejected with member_zero_credit_limit. These are runtime observations, not an account billing audit.

The first test incorrectly invoked locate from the retained package inside its store, contrary to the installed-package/store separation. The runtime refused. The second used the correct original installed launcher but its test allowlist omitted git status/cat in a compound command, so Claude correctly stopped on a denied action. Both attempts are preserved and are not workflow PASS. No worker or reviewer was launched in them.

The third, separately approved session used the original installed launcher outside the store, explicit --plugin-dir, restricted file tools, disabled user hooks/custom MCP configuration, normal authorized Bash and dontAsk mode. It was bounded to one parent process, 18 parent turns and a 240-second outer deadline. No bypass mode was used. Per-child turn limits were prompt requests, not host-enforced counters. This is not an OS sandbox or Pi-style lifecycle/recovery guarantee.

## Observed functional result

The actual Claude init event loads isswf1.1.1 and discovers its worker/reviewer roles. One foreground native worker repaired a two-argument sum in an exclusive scratch Git repository. A distinct foreground native reviewer read the exact candidate and returned Standards PASS and Spec PASS, with explicit limitations. Forwarded child events independently show the worker used Read and Bash and the reviewer used only Read and Glob. All three actors identify Sonnet5.5, not merely model inheritance.

Host inspection confirms baseline commit 984861f2eab5ba21a665ebbcc06977e23ccdd8fc is unchanged, only sum.mjs changed and there are no untracked project files. Original protected check.mjs and every other tracked file retain their SHA256 digests. The original check failed before repair and passes afterward; the host reran it independently. The final sum.mjs digest is c01a4dda8409c0ac1b53b9223b8700f9be4a9024245cf8ec125ceebf4f7f5709 and check.mjs remains 1f1fee830c593a28524657dbd383d3da49eed169c58528807b39adf4f2b4d39b. The reviewed fingerprint still matches after review. Original and retained package receipts/artifacts were independently verified identical.

## Open contract findings

1. The coordinator did not supply the child assignments with the explicit pinned runtime root and full receipt identity required by the installed role entrypoints. The children read their roles from the original installed plugin directory rather than the resolved retained root. Subsequent receipt verification proves identical bytes in this test, but does not retroactively make the handoff contract complete. The worker itself reports this limitation.
2. The reviewer was given an ambiguous plan.md reference and read a nonexistent job-level path instead of the existing initiative-level plan. Its self-contained brief supports the bounded arithmetic verdict, but plan propagation is not fully validated.
3. The coordinator wrote its diff to /tmp/j001.diff outside the selected private evidence directory. Preserve it rather than cleaning or silently claiming workspace confinement. Bash permissions are not an OS isolation boundary.

Functional flow is PASS. Full host-contract validation remains PARTIAL, not a release-wide Claude readiness claim. The independent repair verdict does not certify these missing coordinator handoff criteria. Do not alter published assets or support claims on the basis of that verdict alone.

## Next bounded unit and stopping condition

Prepare complete native child assignments with explicit original launcher, verified pinned root, full receipt identity, exact baseline/candidate, complete initiative plan path, applicable role/review references and approved model metadata. Keep reviewer tools read-only and freeze the actual candidate. Use the dedicated private evidence directory for artifacts. Any new actor session requires a fresh bounded operator grant; current approved sessions are consumed. No automatic retry, renaming, fallback or grant reset is permitted.

Closure requires actual native delegation with those fields observed, original protected checks and all nonmutable hashes preserved, independent read-only Standards/Spec assessment and accurately recorded remaining host limitations. No non-Linux or Pi-equivalent sandbox/recovery claim is included.

## Retained evidence

Primary private root: /home/iseoane/.cache/isswf-claude-validation-sjqwi5wk, containing request.json, invocation.json, baseline.json, stdout.jsonl, events-summary.json, coordinator-report.md, reviewer-report.md and validation-result.json. Earlier roots r0CNpe and bsc0pwbc retain stopped attempts. Repository-local pointers are under tooling/.local/bun-release-delivery/claude-validation-*.txt. These records are excluded from distribution and contain no copied credential contents. No product code was changed during this validation.
