# J023: Corrected Pi identity candidate delta review

## Identity and authority

Current scope/authority remains brief-r6 and Pi-first r5, with explicit TDD/E2E and actual reviewer-use acceptance. No new worker or review allowance is created. Full J023 includes later operations and separate Windows/Claude gates; this is first identity slice only. Base `d5ba7f23d46bf4618b5da362fbc03e5800a68892`; first reviewed candidate `dae68b9f83ba51735878fe6454156671b409a621`; corrected exact candidate `ef9059337b3216b9f1f1a5b93d4e10aae2c57afb`. Target/factory `/home/iseoane/Work/isSWF`. No writer is active; coordinator owns uncommitted .factory records, excluded from functional candidate.

## Retained adverse evidence and actual reviewer use

V002 independently reported Standards FAIL/Spec FAIL/aggregate FAIL for commondir escape, conditional include bypass and unbounded errors; metadata preallocation was a suggestion. Retain it without relabeling. First implementation reviewer2568d303 actually called isswf_git_identity, matched exact dae68b9 identities and used the returned evidence in its assessment. That satisfies actual-use on the old candidate, not correctness or automatic acceptance of the correction.

## Changed delta and TDD application

Only three functional paths changed from dae68b9: tools/git-evidence.mjs, tests/git-evidence.mjs and tests/git-evidence.md. Coordinator authored focused corrections after review terminal completion:

- External common-store fixture cloned .git outside the inspected gitdir and added regular commondir. Observed RED: original CLI returned success. Reject any commondir before Git. Subsequent run passed that assertion and reached next gap.
- Long repository binding with outputBytes512. Observed RED: error exceeded declared wire budget. Validate full mandatory error context fits; use common output-bound logic for success/error including newline, with compact digest-only oversized-context refusal. Subsequent run passed and reached next gap.
- Matching conditional include pointing to external config. Observed RED: CLI accepted it. Reject includeif.* as well as include.*. Assert config/sentinel unchanged/helper absent. Resulting complete suite GREEN.
- Replace full readdir allocation with incremental opendir and per-entry deadline/count checks, addressing reviewer suggestion. This is bounded traversal, not an OS hard-timeout/race guarantee.

All three blocking findings now have executed prospective behavioral red→correction→green observations. Initial worker implementation predates TDD and remains a disclosed non-red-first portion. No retrospective reconstruction of red. Updated E2E map retains public entrypoint/substitution/coverage limits.

## Exact-candidate verification

On ef9059337b3216b9f1f1a5b93d4e10aae2c57afb, coordinator observed:

- Full node tools/check-quality.mjs PASS, including exact committed materialization/offline installed release, Bun executable and Linux synthetic isolated task.
- CLI regression suite PASS including all three new controls and existing identity/topology/helper/byte-preservation cases.
- Real Pi SDK extension fixture PASS, and native Pi/subagent E2E with loopback synthetic provider PASS; explicit existing installed0.83.0 path override, no dependency installation. Private report root recorded in native harness output.
- Locked ESLint/Knip, docs/static contracts and diff checks PASS. These are supplied coordinator results, not reviewer reruns.

## Final allocated implementation review

Use second of two existing independent contexts, fresh native Pi isswf-reviewer on project Sol6.1MEDIUM max900000ms, no nested actor/retry/model substitute. Both worker calls consumed, first implementation review consumed, V001 planning review separate. Require actual fresh isswf_git_identity invocation with exact immutable launch binding for ef90593 and source delta assessment. No shell, writes, active mutation probe or external network. One remaining context, not permission for automatic retries.

Required reviewer procedure remains r6: role/review guidance, bounded security/design and selected TDD/E2E skill references. Consume actual resources and report omissions. Compare against V002, assess affected boundary/output/method risks, preserve unchanged independent conclusions with proper provenance. Read tests/contract first. Return Standards/Spec/aggregate with concrete findings and consequence-based risk. Passing mechanical checks alone is insufficient for these trust-boundary corrections; missing tool use stays incomplete.

## State

Corrected identity candidate mechanically green on Pi/Linux, pending second independent review and new actual reviewer invocation. No publication, merge, installation, release, cleanup or PR87 action. Full J023, Windows/Claude acceptance and later diff/content/status remain pending.
