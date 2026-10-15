# Task 65 — actual run, partial evidence

Status: IN PROGRESS. No source integration or task completion approved by this note. Independent final evidence review pending.

## Actual evidence

Frozen candidate: `boundary-65-snapshot-v4/manifest.json`; factory baseline `cb58f811b3c5c5127d437d60d5f2994125ec0ab1`. Parent verified current candidate matches both frozen payload files before and after the real run.

`boundary-65-real-result-v4.json` records the corrected real prompt path: `openai-codex/gpt-6-luna`, high, three tool invocations, active and callable tool list exactly `sandbox_shell`, no deadline exhaustion. The original failing sum fixture now passes the three original checks; independent host replay in `boundary-65-real-parent-checks-v4.json` also exits zero. The model performed a useful code change through the bridge.

The parent-controlled post-run canary returned the expected outside/symlink/subprocess ENOENT, source EROFS, absent fake environment credential and network ECONNREFUSED. The live host TCP positive control succeeded. Original protected manifest hashes and fresh parent canary hash remained unchanged. These are bounded checks of this concrete policy and fixture, not exhaustive confinement.

## Missing requirement

`modelInvokedCanary` and `modelReturnedStructuredControls` are both false. The aggregate result is PARTIAL, exit 2, and remains so. No raw transcript or tool commands were retained. The instrument attributes canary execution only to a normalized command exactly equal to `node boundary-check.mjs`; a compound invocation could escape attribution. Consequently the records do not establish either that the model executed the canary or that it omitted execution. Parent evidence cannot substitute for the missing model-attributed result. Do not rerun merely to obtain a green result.

## Preserved failures and boundaries

The initial `real-result.json` was PARTIAL before a demonstrated provider prompt: the SDK configured-auth snapshot was not initialized. Separate opaque no-provider diagnostics show false with skipped refresh and true with local initialization. V4 shared offline preflight covers actual SDK/session initialization and singleton callable tools without `session.prompt`. The corrected v4 prompt is the only demonstrated real model run; there was no fallback or quality retry.

Prior candidate/review failures and snapshots remain retained. The supervisor remains trusted and uses ordinary opaque host authorization; credentials are not mounted into the sandbox or logged. Pstack transport and this machine's runtime remain dependencies of the experiment. No MCP authority broker, client-ready deployment, exhaustive FD/path/kernel security, lifecycle recovery, multiwriter safety or complete resource confinement is proven. #44 stays paused.
