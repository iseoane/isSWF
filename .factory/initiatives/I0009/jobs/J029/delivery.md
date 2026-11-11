# Delivery summary — J029 normal installed migration

## Work and candidate

- Job I0009/J029; brief `.factory/initiatives/I0009/jobs/J029/brief-r2.md`, r2.
- Document-input checkpoint: `85275f6334d4f78aee234d9d43bd1b1eccd4807b`.
- Target codebase base: `3c0cf20526dc3d707f30032dc6ca0dd8c93c9a50`.
- Functional candidate: `467d4f25e32da9951448f87c0f15f6b1ca1a1724`; exact reviewed source plus records candidate `8efee1ee523be8b01a23400b1031da10f4b27125`. Later records preserve unchanged functional bytes.
- Current recorded head before this delivery record: `278d4f3085c994c63b63662c7da0765ddff9818b`.
- Work status: source verified/reviewed with one operator-accepted method deviation; publication/exact-head CI pending. Full J029 incomplete.
- Authorization: explicit operator J029 Linux start/continuation covers coordinator commits/push/PR/CI; operator subsequently accepted one-off historical TDD deviation and asked to retain it for Windows follow-up. No merge grant. Shared-sequential feature branch `feat/j029-state-migration`; no active native author/reviewer at observed completion.

## What changed and why

Normal `.factory`→`.isswf` migration keeps the existing public interface and rename/journal/inventory contract, but omits unsupported Windows directory flushes instead of suppressing only a later sync EPERM. Mandatory regular-file write/sync/close errors remain fatal everywhere; Linux directory open/sync/close errors remain fatal. This resolves the source portability policy gap without weakening identity or rewriting state.

## Visual summary

Installed inspect → refuse stale/dirty/unsafe/claimed state or move unchanged payloads → identical repeat succeeds; changed installed bytes refuse repeat and remain retained.

## Scope

Runtime change is limited to the existing state-migration sync helper. Added focused publication faults, installed Node/Bun journeys, one CI matrix command and equivalent English/Spanish guidance. J030 integration receipts are retained records only. Excludes real-project migration, forced recovery, identity/format changes, new dependencies/dispatcher, installation changes, publication releases, and actual interrupted-owner acceptance. Native Windows evidence remains pending until observed CI. Uncommitted I0045/#265 triage and unrelated `.pi/subagents/` are excluded.

## Checks and results

- Coordinator ran final `node tests/state-migration-publication.mjs .`: PASS; native Linux file write/sync/close and directory open/sync/close controls. The process-platform override is a policy seam, not native Windows proof.
- Coordinator ran `node tests/release-package.mjs .` on retained head278d4f3: PASS; committed-source installed Node fixture checks. Raw output retained ignored `tooling/.local/j029-normal/coordinator-release-final.log`.
- Coordinator docs check PASS11pairs205links; targeted ESLint and diff checks PASS. Full local quality not run: no packaging machinery or new shipped path changed; CI full suite remains required.
- Worker executed `node tests/platform-package.mjs .` on exact functional467d4f2: Linux x64 PASS, actual offline-installed compiled Bun1.4.4 and genuine Node26.13 release launcher. Existing CI uses its separately pinned compiler; local result does not attest that compiler/platform.
- Coordinator independently reverified retained installed artifact with verifyRelease: revision467d4f2 and artifactId `dde4b3a5c7ab011a6ec2b694b2c90422fd0070c45456c07165b833b494b714b0` match. Artifact verification is not a coordinator rerun of the installed journey.
- A002 and ignored `correction1-platform-report.json` map literal model/setup/history/pin payload bytes, Linux modes, stale inventory, dirty state, symlink/junction, active legacy claim, uncertain transition/journal and dual roots to public refusal/preservation assertions. Bad-byte repeat negative control refuses and retains the altered pin. Reports/logs under `tooling/.local/j029-normal/` are local evidence, not shipped assets.

## Problems and resolution

Initial coverage omissions and harness expectation defects were corrected within correction1/2, preserving A001/A002 and first failures. Coordinator replay then contradicted the author-reported GREEN: original test-only REDe52c1921b9f31934a7318acf7e37dd587b80cb82 fails the intended policy assertion, but claimedGREEN124a60598c7673043311ba5f563bef8c65b49435 also fails a later missing-stdout assertion. Later21207c4 fixes harness output; final467d4f2 passes. Exact immutable history and adverse reports remain unchanged. No retrospective GREEN or invented RED/GREEN claim.

## Independent review

V001 reviewer5436f9ca-353d-41b4-8124-01e40e872aae terminal complete/process terminal observed. Base85275f6334d4f78aee234d9d43bd1b1eccd4807b→candidate8efee1ee523be8b01a23400b1031da10f4b27125, personally consumed verified bound diff51474bytes SHA256a833717dc7d3f99bbc26e307cae7bb868e4ad6e09149fa6a02732f412ee60262. Standards FAIL, scoped source Spec PASS, aggregate FAIL; one introduced blocking J029-R1-01 is the historical TDD sequence, no demonstrated production defect. All required resources consumed/self-reported, no missing resource. Reviewer did not execute tests. Operator explicitly accepts this requirement deviation for this candidate and continued PR/CI; that disposition supersedes the human wait, not the original FAIL. Record-only acceptance delta changes no reviewed functional bytes; no extra model call solely to repeat the verdict.

## Closure and acceptance

Source behavior verified for scoped normal Linux unit; one method deviation explicitly accepted. Publication and required exact-head CI still pending here, not technical closure. Operator asked to retain the deviation for Windows review: rerun actual native checks, revisit evidence/report accuracy and repair any current harness/product defect; a later Windows pass cannot make124a605 historically GREEN. Full J029/actual interrupted-owner recovery remains incomplete. Merge remains a separate human decision after CI, particularly because `.github/workflows/quality.yml` changed.

## Integration risk and recovery

**MEDIUM.** Affects operators explicitly moving legacy state and both host consumers of the shared CLI. A bad publication policy or false unchanged result could leave uncertain directory state, misreport completion or expose state loss under interruption/power loss. Likelihood is unquantified; bounded existing-owner code, retained regular-file failures, Linux fatal directory controls, literal installed byte/refusal tests and independent Spec assessment mitigate inspected normal-path risks. Windows deliberately omits directory-entry flushing, so Linux-equivalent power-loss persistence is not promised. Detection uses nonzero refusal, exact inventory mismatch and retained claim/journal evidence. Reverting source does not undo a completed move or repair lost bytes; recovery requires separately authorized inspection/public recovery, not blind replay. Actual owner interruption/recovery and rollback of this change were not live-tested. Native Windows CI is still pending; historical selected-TDD failure remains operator-accepted, not a passing Standards verdict. No release/update/migration of operator data follows from integration.

## Blockers and next action

Publish this bounded unit, inspect exact-head native CI without polling/watch/model waits, diagnose any actual failure within remaining authority, then request human merge decision. Calls3/6 reviews1/3 corrections1/2 spent; no new actor needed for accepted historical deviation. Keep Windows follow-up and actual interrupted-owner phase visible. Do not include or commit I0045 triage under J029 authority.

## Publication receipt (local, pending next bounded checkpoint)

Observed OPEN PR266 https://github.com/iseoane/isSWF/pull/266, head `a9269f6b81e91062ada7e421ea29f88dfa380010`, base `3c0cf20526dc3d707f30032dc6ca0dd8c93c9a50`. Exact body/risk/head/base/state read back after push/create. Rollup empty at publication: CI pending/unobserved, not green. This receipt does not change the published/tested source head and will be retained at the next authorized boundary. Original V001 FAIL, one-off operator acceptance and Windows follow-up are explicit in the PR. No merge, release or cleanup performed.

## CI correction (correction 2/2)

Exact-head CI run 42993033539 on `a9269f6` failed Portable checks only: `tests/directory-sync-portability.mjs` reported `tools/state-migration.mjs:20` (static guard form not recognized; behavior already skipped win32 directory flush). Coordinator rewrote the guard into the recognized `process.platform === 'win32') return` form without changing behavior. Local Linux: directory-sync-portability ok, state-migration-publication PASS, check-docs PASS, eslint ok, `node tools/check-quality.mjs` exit 0. Mechanical correction; no new semantic review selected because behavior and reviewed tests are unchanged. Corrections budget now exhausted (2/2).
