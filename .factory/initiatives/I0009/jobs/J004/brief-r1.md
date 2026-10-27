# J004: Windows first-plan publication (#85) and regression

## Objective, authorization and boundary

The operator explicitly requested committing #83/#84, then correcting #85 and running regression if no independent blocker appears. #83/#84 are retained in 8ea8d2adc978aace0a17fc517b79d04a94ed2440, with no push. That is this unit's examined base. Local #85 code/tests/docs and regression are authorized; new independent deficiencies must be reported through duplicate-checked needs-triage issues, not automatically implemented. No privilege changes, dependencies installation, host migration, remote code push, merge, release, issue closure or provider cost increase is selected. No source commit for the current #85 changes is claimed.

## Grounding and bounded implementation

- tools/isswf-plan.mjs: publication links/renames a synced regular file, then flushes the parent directory before removing .plan-write. This raises EPERM on Windows after publishing plan.md.
- tools/platform-runtime.mjs: existing syncDirectory omits unsupported Windows directory flushes, while regular-file writes elsewhere remain mandatory and Linux directory flush errors propagate.
- tools/factory-package.mjs: installedToolNames owns the explicitly distributed planning/observation import closure.
- tools/isswf-job.mjs: runtimeFiles owns native source-runtime identity pins; its new transitive platform dependency must be pinned too.
- docs/durable-work.md and docs/source-activation.md own interruption and tool-subset contracts. Human development mirrors describe the native test scope.

Reuse syncDirectory in the plan writer. Keep every regular-file flush and Linux directory flush. Detect an existing claim before identical no-op success, never remove an uncertain prior claim, and append whether a caught write failure happened before or after publication. Retain failed bytes/claim and require inspection rather than inventing recovery. Extend installed import and source-pin closures to platform-runtime.mjs and update affected fixtures. Do not sweep other durable writers under this grant.

## Verification selection

Combined verification: deterministic native publication/absence/preservation/error-phase assertions plus semantic review of claim/integrity boundaries. Independent assessment remains pending; author checks are not independent review. The native Windows isolated-worker path remains unsupported and no activated binding/current provider grant was established, so coordinator-owned local work continued without worker or substitute dispatcher. No reviewer/model session is claimed.

## Observed evidence

- Cheap regression first failed natively on Windows with EPERM fsync. After repair tests/plan-publication.mjs passes on native Windows and Linux, including fatal regular-file-sync error, post-link failure, retained claims and refusal of identical retries. Linux additionally injects directory-sync failure after publication.
- Retained exact runtime/test candidate: local fixture commit 30e303fd928d639074d2505785f7d31052982ea9, not an upstream/source commit or published release. Windows private root: temporary isswf-85-regression-20261026; Linux copy: /tmp/isswf-85-regression-20261026. The ignored retention and regression drivers are under tooling/.local/windows-85/.
- Windows clean-candidate PASS: plan-publication, plan-grant-boundary, checkout-line-endings, host-portability (static), worker-route-admission, and init-platform (actual built Node development release, pinned first-plan/repeat, pin/model preservation and fatal sync failure).
- Linux full node tools/check-quality.mjs PASS on its native filesystem inside Debian WSL. All portable contracts, planning/publication, reviewer/planner/diagnostician synthetic callers, tool installation, package installation/migration/recovery and worker admission controls passed. Actual Bun packed executable regression passed with installed Bun 1.4.4. The isolated synthetic worker task explicitly SKIPPED because Bubblewrap is absent. No fresh live-provider/model/worker result is inferred.
- Previous full-suite failures/timeouts on Windows-mounted source remain in J001/J003 history. Native-filesystem success does not by itself prove their causes.
- Syntax, bilingual documentation and diff whitespace checks PASS. ESLint/Knip dependencies unavailable; no installation performed. Native Windows Bun and exact-head remote CI remain unverified.

## New independent deficiency and stopping condition

Windows factory-tools-install and initiative-plan proceed to their unchanged directory-symlink negative fixtures and fail EPERM while creating them. This is not evidence that the factory accepted unsafe aliases. A minimal same-host probe confirms default symlink creation fails while a directory junction succeeds and isSymbolicLink is true. After open/closed duplicate search, created https://github.com/iseoane/isSWF/issues/86 with bug and needs-triage; exact sanitized body/labels/state verified by readback. No #86 test changes, elevation, Developer Mode changes or skipped negative assertions were introduced.

The authorized #85 behavior is locally verified; full native Windows regression is not green. Keep this unit in-review with independent review, Windows Bun/CI and separate #86 decision visible. Preserve private failure records and original claims. Technical verification, operator acceptance and publication remain distinct.
