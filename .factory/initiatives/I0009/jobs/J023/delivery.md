# J023 vertical delivery checkpoints

## Work and candidate

- Brief: brief-r7, current trusted native operator/coordinator handoff; uncommitted input at execution, no invented document-input SHA.
- Base: `d5ba7f23d46bf4618b5da362fbc03e5800a68892`.
- Reviewed functional source: `ef9059337b3216b9f1f1a5b93d4e10aae2c57afb`; earlier source checkpoints1d6ee97/dae68b9 and V002 FAIL retained.
- Status: first Pi identity slice independently reviewed; exact-head native CI/publication pending. Full J023 is not complete.
- Current operator selected J023 feature start, minimum native invoker, Pi-first delivery, actual reviewer CLI use, vertical slices and TDD/E2E. Coordinator owns feature commit/push/PR/CI, not merge/install/release/cleanup/PR87.

## What changed and why

A fresh native Pi reviewer can invoke `isswf_git_identity` to obtain the coordinator-bound canonical repository/full base/candidate/observed HEAD. Tool arguments cannot choose execution context. Shared CLI validates fixed identity operations and Git topology/config/environment/output policy; child-only extension supplies one argument-free tool without Bash.

## Visual summary

Coordinator launch binding → child-only Pi tool → shared identity CLI → bounded Git identity → reviewer evidence and independent verdict. No UI capture applies.

## Scope

Identity only with focused CLI/SDK/native-synthetic tests, packaged resources/profile and paired guides. No arbitrary Git argv/shell, diff/content/status, Claude invoker, OS sandbox, raceproof containment, installation/global config or isolated executor. Windows native acceptance remains pending CI. Other pending I0009 planning records remain prepare-only and local; do not publish them as part of this feature.

## Checks and results

Exact ef90593: full Linux `node tools/check-quality.mjs` PASS including actual committed materialization/offline installed package, Bun executable and synthetic isolated task; focused CLI/SDK, native Pi/subagent loopback-synthetic E2E, docs/ESLint/Knip/diff PASS. Existing installed pi-subagents0.83.0 path override was explicit for local transport fixture; no dependency install. This is not Windows or real-provider reliability evidence.

## Problems and resolution

Retain initial no-edit worker blocker and continuation tool-loss report. Initial code predates TDD request; no retroactive red-first claim. Linked pack-store regression observed behavioral RED before coordinator correction/GREEN. Fixture masking/syntax/link/static-entry/curated-resource failures are separately retained in briefs, not called TDD RED. V002 identified commondir, includeIf and error-budget gaps; each has executed behavioral RED→correction→GREEN in ef90593. Incremental metadata traversal strengthened resource handling.

## Independent review

V002 Standards/Spec/aggregate FAIL on dae68b9 remains unchanged. V003 reviewer1ff84416 at exact ef90593: Standards PASS, Spec PASS, aggregate PASS, no blockers. It personally invoked the tool and consumed candidate/HEAD ef90593 plus binding digestaf11bf9273b25cbf42a8fd6b9a9937c86f2ab9d9d984de732ecd4b6f52b23454. Reviewer procedure fully consumed; initial wrong skill lookup corrected. Both implementation-review contexts and two author calls consumed; no automatic further call.

## Closure and acceptance

Pi/Linux source/method/actual-use gates met for identity only; native CI/artifact PR gates remain pending at this checkpoint. No PR or green remote CI is claimed yet. No operator product acceptance or integration decision inferred. MEDIUM integration requires separate explicit approval after actual PR/exact-head CI verification. Full J023 stays open for later operations/host/platform evidence.

## Integration risk and recovery

**MEDIUM**, same assessment for PR: Pi review evidence acquisition, native profiles and packaging are affected. Wrong binding/topology/config/output handling could return misleading commit evidence, read outside intended Git storage, execute inherited helpers or block valid review. Strict fixed binding, direct no-shell Git, fresh restricted env, common/alternate/link/include refusal and output limits plus adversarial tests/independent correction review mitigate observed classes. Concurrent filesystem mutation and blocking OS operations remain assumptions, not eliminated by cooperative deadlines; Windows behavior unverified here. Errors, binding digests, regression checks and native CI support detection. Reverting source can withdraw the tool but cannot undo past reads or already published artifacts; live rollback not tested. No sensitive-data exposure was observed. Do not downgrade for green tests or merge automatically.

## PR publication and first native CI observation

Draft PR https://github.com/iseoane/isSWF/pull/114 observed OPEN, base main at d5ba7f2, first head `a529429a05c191468e1b3fd54e6814a108e78cb5`. This receipt-only head preserves functional ef90593 exactly. Only J023 records/selected plan section were committed; unrelated prepare-only J027–J032 records and plan delta remain local.

Run41179535701: portable and Ubuntu package/host jobs PASS; Windows124473918762 FAIL at tests/git-evidence.mjs:104 before intended unconditional include-refusal assertion. Actual result git-identity-command-failed: raw Windows backslashes produced invalid Git config syntax. Coordinator corrected only the fixture include path to forward slashes, preserving the configuration-refused assertion and production bytes. Conditional include and prior Windows controls had reached/passed before this failure. No Windows/full-native acceptance claimed; fresh head CI pending. V003 reviewed production bytes remain unchanged; bounded test-data delta is mechanically assessed, not a third independent verdict or model call.

## Superseding final identity-slice receipt

PR114 observed OPEN and ready for review, exact head `933822073102df5156918d5e2c7304096cd6b06e`, base d5ba7f23d46bf4618b5da362fbc03e5800a68892. Final Quality41179942394 PASS3/3: portable124475108848, Ubuntu124475108791 and Windows124475108694. Inspected Windows log confirms full identity/refusal controls, actual Pi SDK invoker and installed packaged native-subagent synthetic-provider route PASS. Real-model reviewer use is verified in Pi/Linux; native Windows synthetic checks are not relabelled as a second real-model review.

Second run41179713582 also failed the include assertion: normalizing the pointer alone was insufficient because the included helper value still contained raw Windows backslashes. Final fixture-only correction normalizes that value and adds explicit Git config parsing before security assertions, with all intended refusal/sentinel checks unchanged. Both failed runs remain retained. Production CLI/invoker/profile bytes are identical to reviewed ef90593; subsequent changes are records and bounded fixture spelling/parse control, so V003 affected source judgment remains applicable without another actor.

Actual CI packaging tested synthetic merge `ff0ca72ecdf2525cf8a2067f63163b97bd4a19e3`, parents[d5ba7f2,9338220], entire tree `c224bb71b84bb8e31a2f340d97b8141d3bc8d286` exactly equal final head tree. Not called a literal-head build. Windows report artifactId/receiptSHA `a3403c4792f1f62333342d713b88cd7157363fe15d2660ce0679422e3fc58ffc`; coordinator downloaded the native tarball and verified all116 receipt payload digests plus exact committed CLI/invoker/reviewer bytes. Linux report artifactId7d4d4292d3948a362a21f5792f4d7457fb54bbfb1f305977648bc1b10f04f7ab. Raw logs/reports/package and inspection receipt stay ignored under tooling/.local/j023-identity-review. No operative installation occurred.

Operator subsequently chose to retain current .mjs CLI/Pi runtime invocation and existing quality.yml checks: no separate binary or workflow. This is a distribution preference, not MEDIUM merge permission.

This final receipt and updated local canonical plan are intentionally uncommitted to avoid changing the verified PR head; the observed remote PR description records the final head/run/limits. Other prepare-only I0009 records remain local and preserved.

## Authorized PR114 integration

The operator explicitly approved MEDIUM integration and requested documenting the operational trust/non-isolation boundary. Three-file docs-only head `3bedb701e7f4de0f5bee09b3f3578e1428c3298e` states approved repo/stopped author/no untrusted concurrent writer as operational prerequisites, not OS enforcement; hostile mutable input needs separately selected protected input. Static ordinary/conditional/missing-binding walkthrough and paired-doc checks PASS. No runtime/test bytes changed after the previously verified head.

Final-head Quality41195878872 PASS3/3 including native Windows124521806546, Ubuntu124521806705 and portable124521806754. Normal protected merge with expected-head guard completed PR114 as main `b28e66257b8780ae7ed8a9275a419e1de79f2846`, parents[d5ba7f2,3bedb70], exact same tree `b313bf2679ccca9841e9d7c5332f7ef9aa69e271` as approved head. GitHub PR state MERGED/main ref and fetched commit observed. No admin bypass/auto-merge/direct-main push/installation/release/cleanup. Post-merge Quality41196113196 was initially observed in progress; subsequent readback shows completed SUCCESS on exact b28e662, preserving the earlier timing distinction.

## Exact committed-diff slice checkpoint

Base integrated identity main `b28e66257b8780ae7ed8a9275a419e1de79f2846`; corrected functional candidate `fd0b9993f6e339eaa2448258ac3b44171cd3e6ec`, brief-r11. Public diff operation and argument-free Pi isswf_git_diff use separate immutable diff launch binding, preserve identity compatibility, pin candidate attributes, refuse local/external overrides/helpers, and return exact base64 bytes/count/digest. Pi invoker executes actual CLI, verifies integrity and exposes exact valid UTF-8 patch without normalization, retaining explicit base64-only handling otherwise. Raw cap192000/CLI wire256KiB/native display512KiB, explicit errors not truncation.

Author f621c04e returned partial; coordinator corrected operation labelling, uncommitted info attributes, practical larger-patch cap and actual CLI/readable native view with observed behavioral RED→GREEN. Prospective author unsupported-diff RED evidence retained separately from intermediate fixture mistakes. V004 first independent FAIL found unbounded public stdin while actual reviewer patch use passed. Coordinator real process kept stdin open, observed guard-required termination RED, added fixed2s input collection deadline and observed autonomous refusal/GREEN. Original FAIL remains.

V005 independent Standards/Spec/aggregate PASS, MEDIUM, exact fd0b999. Fresh reviewer b22c7289 personally invoked identity/diff and consumed complete77061byte verified UTF-8 patch, SHA cb845c79f7fdea13ecfbca29d0f7c59470eda69adb662bb1110b1c1494c0f065, binding digest aaf14169e40c7da0c594b5dff62d03a795c5138c9907464884134a4975b0c1e0. Native-tool computations are not personal reviewer shell commands. Required methods consumed; no blockers in scoped Pi/Linux source review. One diff author and two diff reviews consumed; do not retry or borrow later unit ceilings automatically.

Exact fd0b999 full Linux quality/committed materialization/offline artifact/Bun/synthetic task PASS; focal public CLI/Pi SDK/native synthetic transport/docs/ESLint/Knip PASS. No diff PR/CI/native Windows result is claimed at this checkpoint. Unrelated local planning remains uncommitted and excluded from feature publication.

Risk remains MEDIUM for evidence integrity and resource/host assumptions: fixed binding, config/topology/attribute refusals, byte/response/deadline limits, meaningful regression/E2E controls and independent review mitigate the inspected classes. Quiescence is operational, not OS isolation; reverting code cannot undo earlier reads or published artifacts. No observed secret exposure or repository mutation. Source acceptance/PR publication/CI/integration/full-J023 closure are separate.

## Blockers and next action

Publish bounded diff unit/J023 receipts and verify exact-head native Linux/Windows CI. Identity dependency is integrated. Full J023 still requires committed content/status and remaining host/platform acceptance; J032 is not automatically unblocked. Integration follows applicable explicit grant/standing policy after exact retained head, required checks and affected review; do not infer it from reviewer PASS alone. Preserve all failures and unique local planning.
