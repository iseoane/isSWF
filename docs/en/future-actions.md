# Possible future actions

[Home](../../README.md) · [Documentation](index.md) · [Español de España](../es/future-actions.md)

These are proposals, not implemented features, a delivery schedule, or permission to run jobs. Check the current code and agree scope before taking one on. Existing plans are records of decisions, not proof that every planned capability exists.

## Distribution

After the current local work is checked and accepted, agree how to publish the first release and replace local-folder installation examples with its real source. Keep the Pi package, core, and Claude plugin on the same version. Publication and new live Claude checks remain separate decisions.

### Evaluate Node SEA and Bun executables

Historical evaluation record: the results below describe the pinned prototype hashes, not the subsequent implementation. The operator later selected Bun and authorized implementation under I0006. Current build and execution behavior is documented in [installation](installation.md) and [development](development.md). Development remains Node.js and `.mjs`; publication, real SDK/provider checks, independent review, and non-Linux execution remain separate.

Use the same committed source and fixtures for three candidates: the current Node.js package as the baseline, a Node SEA executable, and a Bun executable. Produce the executable plus the existing agent-readable resources, not a binary that hides the skills. Keep Pi, core, and Claude plugin versions aligned. This proposal does not revise I0005's accepted scope or its pending acceptance.

#### 1. Freeze inputs and inspect adaptation points

Record the source SHA, fixture hashes, exact Node.js and Bun versions, bundler versions, build flags, SDK version, operating system, architecture, CPU, memory, and filesystem. Select a supported Node.js release for SEA. Check its version-specific documentation instead of assuming that features in the latest Node.js documentation exist in Node.js 24. Record prerequisites and unavailable machines before starting.

Inspect these current adaptation points, observed at source revision `bceb0e6b6c8e8a67fe6cf1d7e64d84c516261f1f`:

- `tools/isswf.mjs` resolves resources with `import.meta.url`, imports retained-runtime modules dynamically, and launches tools through `process.execPath`.
- `tools/isswf-job.mjs` launches preparation, lifecycle, and reconciliation scripts through `process.execPath`.
- `tools/pi-worker-task.mjs` generates a JavaScript task, loads an external SDK with `createRequire`, and binds the runtime executable into a Linux sandbox.
- `tools/worker-lifecycle.mjs` launches copied scripts, uses process groups, and reads Linux `/proc` identities. `tools/native-recovery.mjs` also depends on `/proc` and Bubblewrap.
- `tools/build-release.mjs`, `package.json`, and `docs/installation.md` define the script entry, file allowlist, receipts, retained runtimes, and project pins. Changing the artifact requires adapting verification and version selection together.
- Start test selection with `tests/release-package.mjs`, `tests/factory-tools-install.mjs`, and the worker tests. Classify each check as portable, Linux-specific, fixture-only, or dependent on live providers.

The output is a compatibility inventory with the owning file, observable contract, required change, test, and uncertainty for each item. Reopen the source if the base changes.

#### 2. Build bounded candidates

After separate execution authorization, create exclusive workspaces for SEA and Bun. Start with `inspect`, `locate`, and status, then exercise pinned `exec`, the panel, and one generated worker task. A help-only executable is not a successful prototype.

Keep shared refactoring identical across candidates. Record candidate-specific patches separately. For each candidate, state whether child execution uses compiled subcommands, embedded scripts, or an external runtime. An executable that secretly requires a system Node.js is not standalone. A package that carries a private Node.js runtime is a separate fallback, not a SEA or Bun success.

Bound the first compatibility spike to two engineering days per candidate. Stop at a blocker rather than silently increasing scope. Preserve the failing case, partial work, and revised estimate. Do not weaken sandbox, recovery, integrity, or pinning checks to make a candidate run.

#### 3. Verify behavior before measuring speed

For each candidate, compare JSON results, exit codes, error categories, created files, and resource bytes with the baseline. Cover paths with spaces and Unicode, invocation outside the install directory, read-only installed resources, missing resources, corrupted receipts, and unavailable SDKs. Preserve prior pins and retained runtimes through update and rollback tests. Ensure a new launcher actually invokes the older pinned runtime, not its bundled latest code.

Test the panel through its loopback API, not just process startup. For child processes, test successful work, failure, timeout, output limits, termination, and bounded recovery. Test missing platform capabilities as explicit refusals without partial execution. Verify that credentials and private fixtures are absent from artifacts.

Use injected SDK fixtures first. Treat a real SDK load separately from a fixture result, and a provider-backed run separately from SDK loading. Existing Pi and Claude integration restrictions remain in force. Live host installation or model execution requires a new explicit grant. Test artifacts in a clean environment without Node.js or Bun on PATH, while listing legitimate dependencies such as Git, the host application, external SDKs, or Bubblewrap.

#### 4. Run a reproducible benchmark

Create one rerunnable measurement script and retain its source, raw samples, correctness assertions, and artifact hashes. Do not implement the script during this planning-only assignment. Proposed workloads are:

| Workload | Timed interval and proof of work |
| --- | --- |
| CLI startup | Process creation to validated `inspect` output and exit. Include a separate help result only as a startup microbenchmark. |
| Status | Process creation to parsed status and exit, using fixed fixtures with 1, 25, and 100 initiatives. Verify counts and record hashes. |
| Pinned execution | Launcher start to validated child output and exit, including a project pinned to an older retained release. |
| Panel | Start to first correct loopback API response. Measure a separate fixed sequence of 100 requests and verify every response. |
| Worker lifecycle on Linux | Prepare, launch, deterministic SDK-fixture work, and terminal reconciliation. Verify task output and process cessation. Exclude live model latency from runtime comparison. |
| Packaging | Build wall time, peak build memory, executable bytes, compressed complete-package bytes, installed disk use, and retained two-version disk use. |

Measure wall time, CPU time, and peak process-tree memory for runtime workloads where the platform permits reliable collection. Label unavailable metrics. Sample steady-state panel memory separately. Use the same machine, dataset, concurrency, output capture, and production build settings for each side. Include the Node executable in baseline footprint accounting when comparing self-contained delivery. Report normal package size separately.

After three untimed warmups per candidate, collect at least 30 samples per short workload and five complete build or lifecycle runs. Rotate baseline, SEA, and Bun order to balance drift. Record load and available cores. Do not compare raw timings across different machines or operating systems. A new process with a warm filesystem cache is not a cold-cache run. If measuring first-launch behavior, report cache conditions and reset method separately without privileged cache changes by default.

Report median and range for every workload. Report p95 only for the short workloads with at least 30 samples and label its limited precision. Count every error, timeout, and retry. Keep failures visible and exclude invalid comparisons from speed rankings. Verify that the expected work happened inside the timed interval. Profile bottlenecks in separate, untimed runs. If variation overlaps the claimed improvement or the limiting work is unknown, report no measurable difference or an inconclusive result rather than a winner.

#### 5. Check the platform matrix

Target Linux x64 and ARM64, macOS x64 and ARM64, and Windows x64. Evaluate Windows ARM64 separately. Record Linux libc and minimum supported OS versions for every artifact. Cross-compilation proves artifact creation only. Require execution on each claimed target, using the baseline on that same target. An unavailable machine means untested, not passed. Keep WSL results separate from native Windows results.

Separate portable CLI and host-resource integration from native worker isolation and recovery. Linux Bubblewrap and `/proc` behavior does not become portable through compilation. On Windows and macOS, first test that unsupported worker operations refuse safely. A full native worker port requires a separate isolation and process-identity design, independent verification, and its own authorization. Assess signing and macOS notarization requirements, but do not acquire certificates or use signing services in the comparison without permission.

#### 6. Estimate effort and choose from evidence

These are planning estimates, not measured effort or a delivery commitment. One engineering day means eight focused hours by an engineer familiar with the code. They assume access to target machines and no rewrite of the external SDK. Machine provisioning, certificate waits, paid services, and native Windows or macOS isolation are excluded.

| Work | Initial estimate |
| --- | --- |
| Shared inventory, fixtures, and benchmark script | 2–3 days |
| SEA compatibility prototype | 1–2 days |
| Bun compatibility prototype | 1–2 days |
| Behavioral matrix, measurements, and comparison report | 2–4 days |
| Total evaluation, sequential effort | 6–11 days |
| Production adaptation if SEA is selected, after evaluation | 5–10 additional days |
| Production adaptation if Bun is selected, after evaluation | 5–12 additional days |

The production ranges include child dispatch and generated tasks, resource resolution, receipts and retained versions, cross-platform CLI packaging, host entry updates, regression tests, CI, and bilingual documentation. They exclude full native worker parity outside Linux. Reserve a separate 2–4 day design investigation for that parity before estimating its implementation. Overlapping ranges express uncertainty, not evidence that either candidate needs less work.

During the evaluation, log actual time by shared work, SEA-specific work, Bun-specific work, packaging, and platform portability. Re-estimate each remaining item with an optimistic, likely, and pessimistic value, named blockers, and confidence. Distinguish one-time build adaptation from ongoing release and security-update maintenance.

First eliminate candidates that fail required behavior, integrity, pinning, or safe capability refusal. Among passing candidates, compare full-path latency, memory, complete-package size, adaptation effort, and maintenance. Treat a speed difference below 10% or within run variation as insufficient on its own to justify changing runtime. This is a proposed decision rule, not a predicted result. If performance is effectively tied, prefer lower demonstrated adaptation and maintenance cost. Retaining the Node package or carrying a private Node runtime remains a valid outcome if neither executable earns its cost.

The final deliverable is one comparison report with artifact identities, platform-by-feature pass/fail/untested results, benchmark samples, actual effort, revised adaptation estimates, and a recommendation. Keep raw private evidence out of published packages. Operator approval of the recommendation remains separate from implementation and publication.

Consult the version-specific [Node SEA documentation](https://nodejs.org/api/single-executable-applications.html) and [Bun executable documentation](https://bun.sh/docs/bundler/executables) when execution is authorized.

#### Local evaluation results, 22 October 2026

Status: partial evaluation, not acceptance. Both prototypes build and run portable CLI operations on Linux x64. A revised SEA prototype passes the isolated synthetic worker probe. Bun still fails an exact boundary error-code contract. Neither qualifies for production selection without the remaining SDK, lifecycle, version-handoff, and platform evidence. No runtime source, installed project pin, global installation, host integration, or provider configuration changed.

The measured source is `bceb0e6b6c8e8a67fe6cf1d7e64d84c516261f1f`, using Node.js 26.8.1, Bun 1.4.3, Linux 7.2.5-3-omarchy, and an Intel N100 with four cores and 16.5 GB RAM. These results do not establish SEA support on Node.js 24. Both use the same copied source and shared prototype dispatch changes. SEA uses Bun only as a build-time ESM bundler targeting Node, not as its execution runtime.

| Check | Node baseline | SEA prototype | Bun prototype |
| --- | --- | --- | --- |
| Status, inspect, and locate output parity | Pass | Pass | Pass |
| Spaces, Unicode, and invocation outside installation | Pass | Pass | Pass |
| Inspect without Node or Bun on PATH | Not applicable | Pass | Pass |
| Pinned status through unchanged child dispatch | Pass | Fail | Fail |
| Pinned status with explicit external-script dispatch | Pass | Pass with external CJS bridge | Pass directly or through bridge |
| Invalid option, missing resource, and modified resource refusal | Pass | Pass | Pass |
| Loopback panel, 100 correct requests, foreign-Origin refusal | Pass | Pass | Pass |
| Generated offline worker preparation from pinned brief | Pass | Pass | Pass |
| Synthetic SDK initialization in generated task | Pass | Pass | Pass |
| Initial isolated worker boundary and mutable-file checks | Pass | Fail at first sandbox command | Fail at first sandbox command |
| Revised hermetic worker dispatch with unchanged boundary checks | Pass | Pass with synthetic SDK | Fails exact error code, with access still denied |
| Real SDK, full lifecycle, recovery, and older-release handoff | Not evaluated here | Not evaluated | Not evaluated |
| Other operating systems or architectures | Not evaluated here | Not evaluated | Not evaluated |

The initial bundle activated the CLI guards of imported modules because their `import.meta.url` values became the same. The prototype disables those guards in its copied modules and supplies explicit dispatch. It also supplies an evaluation-only resource root. Both adaptations need a production design. SEA rejects direct file-URL ESM loading from its embedded entry with `ERR_UNKNOWN_BUILTIN_MODULE`. An external CJS module loaded through `createRequire` successfully bridges to the filesystem ESM loader. This demonstrates a workaround, not an integrated release solution.

The worker probe uses an explicitly synthetic SDK with no real authentication or provider access. The Node control passes actual Bubblewrap boundary controls and an owned-file mutation. Both compiled candidates initialize that fixture but report `partial` at the first sandbox bridge check. A second prototype removes the dependency on environment-selected child dispatch. For SEA, it creates an exclusive mode-0600 CJS bridge in a temporary directory, including inside the sandbox, and removes it after loading. The original Node control and revised SEA artifact then pass the unchanged generated worker checks. This supports the dispatch diagnosis for SEA. Bun still reports partial. A separate instrumented task shows that Bun denies the factory write with `EACCES`, while the contract requires `EROFS`. The outside read and write return `ENOENT`, the SDK write returns `EROFS`, and network access returns `ECONNREFUSED`; the canary remains intact. This is an observable compatibility difference, not evidence of a sandbox escape. The production contract was not broadened to accept the different error. Recorded sandbox child PIDs from both initial and revised probes were absent from `/proc` at follow-up. Full lifecycle and recovery were not tested.

The table below shows observed wall-clock medians and ranges in milliseconds for the initial screening artifact hashes. The later hermetic worker artifacts have different hashes and were not rebenchmarked. Do not apply these timings to the revised artifacts. Each cell contains 30 rotated samples after three warmups, with zero invalid outputs. The Node baseline invokes the original release entrypoints. The compiled candidates include the panel in their bundle even for CLI requests. This compares the prototypes as built, not an intrinsic runtime advantage. Status reads one initiative in a project containing 100 fixtures. It does not process all 100 plans. The panel check is one functional run, not a repeated throughput benchmark.

| Workload | Node median [min, max] ms | SEA median [min, max] ms | Bun median [min, max] ms |
| --- | --- | --- | --- |
| Status | 62.4 [54.5, 67.3] | 78.7 [74.1, 83.8] | 37.0 [34.5, 41.2] |
| Inspect | 76.7 [70.3, 81.2] | 98.8 [94.1, 102.3] | 47.0 [43.4, 49.9] |
| Locate | 69.8 [66.9, 72.6] | 90.2 [86.2, 116.2] | 43.0 [38.8, 45.4] |

Bun records shorter command times in these samples. A causal runtime-speed verdict remains inconclusive because startup, module loading, Git subprocess work, and receipt verification have not been profiled separately. CPU time and process-tree peak memory remain unmeasured. No claim about model latency, long-running worker throughput, or platform-wide speed follows from these samples.

Five alternating builds per candidate give a median of 3.285 seconds for SEA, including its ESM bundling step, with a 3.226–3.288 second range. Bun gives 0.370 seconds with a 0.347–0.406 second range. The executable sizes are 150.55 MB for SEA and 90.92 MB for Bun. Prototype archives containing the entire original release tree plus the executable measure 47.04 MB for SEA and 42.24 MB for Bun. The reference archive with a private Node executable measures 49.25 MB. These decimal sizes include retained `.mjs` resources. The prototypes have not demonstrated distribution without runtime `.mjs` files. Compression was measured once per archive and is not a build-speed benchmark.

The frozen candidate hashes and raw samples are in private `tooling/.local/binary-evaluation/results.json`. `followup-results.json` records five-build samples, generated-task preparation, and package hashes. `worker-results.json` and `cessation.json` preserve initial worker failures and process observations. `hermetic-artifacts.json` and `hermetic-worker-results.json` identify the revised candidates and their unchanged worker checks. `bun-diagnostic.json` records the separately instrumented error-code diagnosis. The rerunnable local programs are `evaluate.mjs`, `followup.mjs`, and `worker-probe.mjs` in that directory, run in that order from the repository root. They create new temporary fixtures, execute local compilers and loopback services, and use synthetic SDK data only. The follow-up hermetic experiment runs `hermetic-probe.mjs`, then `worker-probe.mjs hermetic`. Review those programs before rerunning. They are evaluation utilities, not installed tools. Raw results and artifacts remain private and excluded from packages. The final fixture trees and binaries are retained under that directory's `retained` folder so temporary-directory expiry does not destroy the evidence. Timestamps record elapsed runs, not engineering effort by work category.

The SEA synthetic-worker pass reduces one compatibility uncertainty, but real SDK and lifecycle work remain unestimated in detail. There is not enough measured engineering effort to assign a defensible difference between candidates. Replace the earlier production ranges with the following provisional remaining-work estimates for either option. Values are optimistic, likely, and pessimistic engineering days. They assume target runners are available and exclude full native worker isolation outside Linux, certificate acquisition, publication, and real-provider costs.

| Remaining production adaptation | Optimistic | Likely | Pessimistic |
| --- | --- | --- | --- |
| Hermetic command dispatch and resource location | 1 | 2 | 3 |
| Linux worker sandbox, SDK compatibility, and lifecycle | 1 | 2 | 5 |
| Receipts, retained versions, older pins, and migration | 1 | 2 | 4 |
| Cross-platform CLI packaging and CI | 1 | 2 | 3 |
| Regression coverage, host entries, and bilingual guides | 1 | 1 | 2 |
| Total per selected option | 5 | 9 | 17 |

Confidence remains low until real SDK, complete lifecycle, and version-handoff tests pass. These estimates are forecasts, not measured adaptation effort. The local experiment proves neither candidate ready. Prefer SEA provisionally for the next integration experiment because it preserves Node and passes the unchanged synthetic isolation checks. Bun has simpler tested script loading and shorter screening command times, but its error-code difference needs explicit compatibility assessment. This is a conservative recommendation, not a completed production selection. Do not ship either until remaining worker compatibility, exact older-version handoff, measurements on the revised artifacts, and target-platform evidence are resolved. Keep the existing Node distribution meanwhile.

## Updates and recovery

Add explicit, deterministic project-data migrations when a real schema change requires them. Today, the installation update changes the runtime pin; it does not invent conversions for unknown schemas.

Broader recovery across reboot, arbitrary surviving processes, and lost external responses needs its own design and evidence. Do not describe the current bounded recovery as universal automatic resumption.

## Execution and visibility

Consider whether shared capacity should cover more execution paths. Existing capacity reservations are cooperative and grant-bound, not a machine-wide scheduler.

Consider fresh process and remote-state visibility if users need it. The current panel reads project records; live telemetry and automatic dispatch are different features.

## Maintenance

Keep bilingual guides, examples, and checks aligned with the code. Reassess historical documents only when their evidence or inputs are needed; do not turn old demonstrations into the current product manual.

Decide a retention and cleanup workflow before deleting old runtimes, claims, or evidence. Uninstallation does not currently perform automatic garbage collection.
