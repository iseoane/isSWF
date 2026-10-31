# #126: source delivery

## What changed and why

Report missing native host prerequisites as explicit BLOCKED with nonzero exit and keep unexecuted changed tests inconclusive, without weakening real failure gates.

## Scope

Affected tests/host-native-delegation.mjs prerequisite/readiness boundary, focused dependency-free regression tests, tools/check-quality.mjs result/coverage summary, and canonical review guidance. Allow one small shared development-only helper if needed for actual tested reuse, not a new runner/framework.; Inspect current portable runner: it does not execute host-native-delegation; distinguish testing injected prerequisite detection from actually running native host behavior. Use existing locked dependencies if present, no install.

## Checks and results

Base e9fde26615b806495abdc1dbea56f40ca69bed76; document input d64e1d688233d20b3f7d66ea71b468d35658018a; source-reviewed candidate f54621958055af4aa270c54de6578c087bff25cf. TDD RED50f3d91102ae33af876fd777aa0cdc10d355aca0 replayed from its exact archive: exit1 vs expected2; GREENbea01c945eb375d950d8b9716436f37864231faf and corrected candidatef54621958055af4aa270c54de6578c087bff25cf injected regressions PASS. Coordinator full portable quality, locked ESLint/Knip, focal/docs/diff PASS on f546219; native Linux synthetic suite PASS using explicit already-installed pinned pi-subagents0.83.0 path (no install/provider call). Initial no-edit required-guide blocker, original missing-bundle BLOCKED and diagnostic packet/phrase failures are retained; compact equivalent review wording resolved packet compatibility without raising caps. No native Windows/live-model result claimed before final CI. Final exact-head native PR CI remains pending.

## Independent review

Independent Standards/Spec/aggregate PASS as attributed below; exact identities and limitations retained. This is not operator acceptance, live host behavior or integration authority. No source changes follow this report-only checkpoint.

## Integration risk and recovery

LOW, bounded development-test/reporting change. Maintainers could otherwise mistake missing prerequisites for executed tests or hide a real host failure. ENOENT-only classification, nonzero BLOCKED, failure controls, mandatory native CI and independent review preserve fail-closed behavior; production dispatch/state/permissions are untouched. Hermetic fixture PASS is not native execution; exact final native CI is still required. Detect with missing/broken/normal controls and CI output; source revert restores prior diagnostics but cannot undo earlier mistaken acceptance. Live-model behavior, OS containment and rollback are not certified.

## Closure and acceptance

Source verification complete. Final-head PR/native CI and integration remain separate gates; merge only under applicable explicit LOW-risk approval through normal protected expected-head path. No direct-main push, bypass, installation, release or cleanup. Final observations will be retained externally on the PR to avoid receipt/source CI loops.

## Blockers and next action

Publish final head and verify native CI. No active writer/reviewer or unrelated canonical changes included. Missing capability and evidence stay explicit.

## Author handoff — coordinator transcription

# J001 / #126 handoff — partial, implementation checkpoint complete

**Checkout:** `/home/iseoane/Work/isSWF`, branch `fix/126-host-test-blocked`. Baseline `d64e1d688233d20b3f7d66ea71b468d35658018a`; clean working tree after commits, no staged files. Implementation candidate `bea01c945eb375d950d8b9716436f37864231faf`.

Implemented host-native preflight: missing Pi SDK, `pi-subagents@0.83.0` bundle, or (outside Pi-only mode) Claude executable yields structured `BLOCKED` JSON and exit 2 before fixture setup. Existing-but-broken bundles remain failures. Portable quality summary explicitly says native delegation `NOT_RUN`; required CI remains separate/nonzero on BLOCKED. Review guidance says changed, required, unexecuted checks are inconclusive absent exact-candidate CI/coordinator evidence; optional missing checks are not universal blockers. EN/ES docs updated in parity.

**TDD evidence:** RED test-only commit `50f3d91102ae33af876fd777aa0cdc10d355aca0` (`git rev-parse 50f3d91`; initial assertion at `tests/host-prerequisites.mjs:20`): `node tests/host-prerequisites.mjs .` failed because absent bundle yielded exit 1 instead of required 2 (downstream loader assertion), demonstrating the behavioral mismatch, not setup/syntax. GREEN commit `bea01c945eb375d950d8b9716436f37864231faf`; same command passes missing-bundle, Pi-only/unused-Claude, broken-present-bundle-as-failure and missing-Claude cases. `node tests/review-guidance.mjs .` passed; `node --check` on changed JS passed. `git show --check HEAD` passed.

**Environment/remaining evidence:** `node tests/host-native-delegation.mjs .` emitted `BLOCKED` for missing `/home/iseoane/Work/isSWF/tooling/host-tests/node_modules/pi-subagents/bundle/index.js`, exit 2. No install performed. Thus actual native integration and required Linux/Windows final-CI runs remain pending; injected prerequisite tests are not live-host certification. `node tools/check-quality.mjs` was attempted and failed at existing `tests/diagnostic-task.mjs` assertion `diagnostic-bundle-too-large` (`tools/diagnostic-task.mjs:101`); not established as baseline or caused by this patch. No network, model, host configuration, push or PR action.

**Method/reference consumption (self-reported; no host trace):** worker role, Pi guide, canonical test-value skill and decision examples, TDD skill plus `.agents/roles/references/tdd.md`, code-quality, comments, verification-principles, writing agent-documents, initiative plan and J001 brief. Concrete applications: red/green provenance above; focused behavioral checks in `tests/host-prerequisites.mjs`; review contract in `.agents/roles/references/review.md`; portable reporting in `tools/check-quality.mjs`. No dependencies changed. Residual: exact-candidate independent review and CI, particularly native Linux/Windows, remain coordinator actions.

```acceptance-report
{
  "criteriaSatisfied": [
    {"id":"criterion-1","status":"satisfied","evidence":"Concise implementation outcome and remaining CI/environment risks are stated above."}
  ],
  "changedFiles": ["tests/host-native-delegation.mjs","tests/host-prerequisites.mjs","tests/review-guidance.mjs","tools/check-quality.mjs",".agents/roles/references/review.md","docs/en/development.md","docs/es/development.md"],
  "testsAddedOrUpdated": ["tests/host-prerequisites.mjs","tests/review-guidance.mjs"],
  "commandsRun": [
    {"command":"node tests/host-prerequisites.mjs .","result":"passed","summary":"Injected missing/broken/optional prerequisite cases pass."},
    {"command":"node tests/review-guidance.mjs .","result":"passed","summary":"Review instruction fixture checks pass."},
    {"command":"node --check tests/host-native-delegation.mjs && node --check tests/host-prerequisites.mjs && node --check tools/check-quality.mjs","result":"passed","summary":"Changed JavaScript parses."},
    {"command":"node tests/host-native-delegation.mjs .","result":"failed","summary":"Expected BLOCKED, exit 2: local pi-subagents bundle absent."},
    {"command":"node tools/check-quality.mjs","result":"failed","summary":"Unresolved diagnostic-bundle-too-large assertion at tests/diagnostic-task.mjs:43."}
  ],
  "validationOutput": ["RED 50f3d91102ae33af876fd777aa0cdc10d355aca0: exact focused command failed at expected-exit assertion; GREEN bea01c945eb375d950d8b9716436f37864231faf passes."],
  "residualRisks": ["Native Linux/Windows CI and exact-candidate independent review pending; local native suite blocked on absent bundle.","Full portable quality command failed on diagnostic-bundle-too-large; baseline relationship unknown."],
  "noStagedFiles": true,
  "diffSummary":"Preflight explicit BLOCKED, portable NOT_RUN reporting, reviewer inconclusive gate and EN/ES docs; separate RED/GREEN commits.",
  "reviewFindings":["no independent review performed"],
  "manualNotes":"Partial checkpoint; do not interpret injected tests or portable summary as native host verification."
}
```

## Independent handoff — coordinator transcription

# Independent review — #126 / I0020

**Standards: pass. Spec: pass. Aggregate: pass for scoped review; final CI remains pending.**

**Identity:** base `e9fde26615b806495abdc1dbea56f40ca69bed76`; candidate `f54621958055af4aa270c54de6578c087bff25cf`. Reviewed the complete supplied patch (attested SHA-256 `77c505d915eb1257592d44a72049c2aafc4477ef8d8b19dbff8d14058062e22f`), affected implementation/tests, workflow, bilingual documentation and initiative inputs. Identity, clean porcelain and checkpoint preservation rely on coordinator attestation; no independent Git/hash execution was available.

## Findings

**No blocking findings.**

- `tests/host-native-delegation.mjs:14–23`: preflight precedes artifact reading, temporary profile creation and host invocation. Only `ENOENT` becomes structured `BLOCKED`, exit 2; invalid files and other filesystem errors remain failures. Explicit paths remain authoritative, with no fallback search. Pi-only omits Claude.
- `tests/host-prerequisites.mjs:24–46`: hermetic fixtures discriminate missing SDK/bundle/Claude, unused Claude, broken SDK and invalid bundle. Their PASS is correctly labelled injected evidence, not native integration.
- `tools/check-quality.mjs:11–17,100`: nonzero checks cannot reach aggregate PASS; native delegation is explicitly `NOT_RUN`. `.github/workflows/quality.yml:122–126` retains the mandatory native invocation without a BLOCKED-success conversion.
- `.agents/roles/references/review.md:7,41`: compression preserves mandatory methodology consumption and checkpoint pinning. Required unexecuted changed tests need sufficient exact-candidate evidence or inconclusive verification; optional gaps do not universally block.

## Evidence and application

Read both author reports; their initial missing-resource blocker, later partial quality failure and native BLOCKED remain historical outcomes, not retroactively passing observations.

Coordinator’s retained RED replay at `50f3d91102ae33af876fd777aa0cdc10d355aca0` shows the intended exit assertion `1 !== 2`, caused by missing-bundle handling. GREEN `bea01c945eb375d950d8b9716436f37864231faf` and subsequent candidate checks are coordinator-supplied, not personally rerun. `quality-final.log` identifies the exact candidate and records focused fixture/review checks, full portable quality and explicit native `NOT_RUN`. `native-existing-extension.log` records Linux native PASS; the coordinator attributes it to the current candidate with an already-installed pinned extension override. ESLint/Knip/docs PASS is coordinator-attested.

Consumed reviewer role, review skill/guide, TDD skill/reference, writing skill plus agent/human-document references, code-quality/comments/verification, external test-value skill/decision examples, AGENTS, plan and brief. Application outcomes: TDD provenance, narrow existing-owner repair, truthful result boundaries, restrained comments, discriminating fixtures and bilingual parity are **observed in candidate**. Static walkthroughs preserve ordinary completion, missing-required-evidence inconclusive, and optional-gap branches. Author resource consumption remains self-reported; no trace claim is made.

**Risks:** exact-final Linux/Windows CI and installed-artifact native checks remain publication gates. Injected fixtures and local synthetic-provider execution do not establish live-model behavior, Windows execution or OS containment.
