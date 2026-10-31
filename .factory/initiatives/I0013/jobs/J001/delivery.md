# I0013/J001 delivery

## What changed and why

Current model selections have one native editable owner per host: trusted project Pi settings or supported Claude-native mechanisms. Offered presets, approval/status records and retained legacy models.json no longer appear to be competing current configurations. Existing selections were not changed.

## Visual summary

Current Pi → native project settings; current Claude → supported native configuration. Explicitly selected retained legacy execution → pinned models.json only. No synchronization engine or shared cross-host model file.

## Scope

Native host/setup guidance, current setup lookup, routing/durable/source docs, paired EN/ES installation guidance, legacy initializer output wording and focused release/native fixture checks. Legacy payloads, pins, initialization copy/schema/no-op behavior and approved actual settings unchanged. No old-executor retirement (ultra-low I0014 backlog only), future UI, installation, migration, global config change or unrelated jobs. Historical I0009/J033 planning checkpoint retained, independent I0013 owns implementation; planner budget not reset.

## Checks and results

Code baseline5cd5a95c49e7a9b735328979d752b37679f1548c; inputba4e258e4d8f5ba23faed51fce2abde2e6969463; reviewed functional candidate1a7d3b851ccb5242375d46c32210bad07a14d047. Coordinator reproduced test-only initializer-output REDc98c7ab and GREENd03b93e from exact commit clone with node tests/release-package.mjs .; expected text-output assertion, not setup failure. Native Pi SDK/subagent loopback-synthetic fixture PASS with project-over-user precedence, conflicting legacy routes ignored/preserved, settings bytes preserved, unknown model refused before provider request. Coordinator full quality/docs/ESLint/Knip/host/pin/diff checks PASS on functional candidate. Same-version installed pi-subagents0.83.0 was explicitly selected to resolve missing local test dependency, no install. Added existing-behavior controls and prose do not claim a new prospective RED. No live provider or native Claude effort-application claim. Exact published-head native CI pending.

## Independent review

V001 reviewer928d07b0 on exact1a7d3b: Standards PASS, Spec PASS, aggregate PASS, no blockers. Required procedure consumed, none missing; executions honestly coordinator-attributed. Reviewer inspected full13-file patch with coordinator-supplied digest. One planner, one author and one review consumed; second review unused, not mandatory. Author initial partial result/missing dependency and follow-up restoration are retained in A001.

## Integration risk and recovery

MEDIUM: shared setup/configuration instructions and generated setup records influence future model selection and dispatch decisions. Ambiguous native-vs-legacy ownership or unsupported effort claims could select unintended models or block valid work. Clear conditional boundaries, actual SDK precedence/no-fallback/preservation controls, pinned legacy compatibility tests and independent review mitigate observed cases. Missing selection/effort/approval drift are instruction-based coordinator gates, not new runtime enforcement. Native settings are untouched; no dependency or data migration. Problems are detected through native mapping preflight and review/check failures. Reverting changes restores instructions/output wording but cannot undo earlier agent calls or already-generated records. Live rollback and real Claude effort persistence were not tested; CI/install discovery is not live adherence proof.

## Closure and acceptance

Source implementation and independent review verified. Publication/exact-head CI and separate human MEDIUM integration approval remain pending at this record. Preserve test-only RED/GREEN history via merge commit, no squash if integrated. No product acceptance/merge inferred.

## Blockers and next action

Coordinator publishes bounded feature branch/PR, observes exact-head Linux/Windows CI, then asks the specific human integration decision. Keep unrelated dirty planning and backlog records local; no automatic install, cleanup, other jobs or runtime retirement.


## Final publication and CI receipt

PR119 OPEN https://github.com/iseoane/isSWF/pull/119 at publication head `d694266148a808a3e76932a7754519c316daf96a`, base5cd5a95c49e7a9b735328979d752b37679f1548c. Receipt-only delta preserves independently reviewed functional source. Coordinator full local quality on published head PASS. Quality41231857268 SUCCESS3/3: portable124627548122, Ubuntu124627548318, Windows124627548253. Inspected actual logs confirm installed host-native SDK/subagent fixture and Claude plugin inventory PASS on native platforms; synthetic provider, not live effort/adherence proof. CI checkout synthetic merge9f5624ebf861f1fde36d242e78f5567bc1b98edd has exact base/head parents and whole tree046b65f2ed5e5ff9ee3bc35d790243068222f547 equal published head; not literal-head execution. Source/PR technical gates met, awaiting operator MEDIUM integration decision using merge commit, not squash. Final local plan/receipt intentionally uncommitted to keep verified head. No install, merge, cleanup, legacy removal or other job.


## Approved integration and release

Operator approved integration and repository release. PR119 merged normally with expected-headd694266 as mainfc8fe2c00787e0c1464637eba96f15fb3709b709, exact same approved tree. Postmerge Quality41232143067 SUCCESS on literal merged source. Configuration unit included in publishedv1.6.0, sourcee9b4e86f28723c013d1edf8706066dd97becb5d9; independent I0015 owns release-source review/native archive inspection/remote checksum verification. No current model setting, project pin or installed package changed automatically.
