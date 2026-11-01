# #127: source delivery

## What changed and why

Reject unsupported manual plan types and structurally empty completed evidence consistently with generated canonical plans, keeping invalid records explicit and readonly.

## Scope

tools/isswf-plan.mjs shared/manual validation and actual status/panel/admission consumers as needed; focused existing initiative/dependency/status tests and supported native CI registration. Small canonical contract clarification only if required.; Do not tighten unrelated grammar or break valid existing renderer output. Inspect actual parsePlan consumers and positive fixtures before changing the parser; keep its array/API shape. A small shared validation primitive may replace duplicate checks if justified.

## Checks and results

Base 0fbfb376902c7bc02728190599877e2e11a3b58d; document input 1f736e3d70dae1bdfeee704affa79822ea9f8f51; source-reviewed candidate 176bfbf545121d7697d4d536436013c6fc4c4fb0. Coordinator replayed exact original RED858ac2aeee5046c4e762f8d538f2b674260c37bb: missing expected exception. Worker GREEN74a89e2 and additional coordinator test-only sentinelRED957cfd529d7ceb6cda5fdb4907a0a3a637ac32e2 -> GREEN1261805142632362660a9fce123a73009b83aae9 cover wrapped None./whitespace. Six focal reader/writer/admission tests, full portable quality, locked ESLint/Knip and diff PASS on1261805; final delta only registers existing tests in native CI. No historical file changes or live model calls. Final exact-head native PR CI remains pending.

## Independent review

Independent Standards/Spec/aggregate PASS as attributed below; exact identities and limitations retained. This is not operator acceptance, live host behavior or integration authority. No source changes follow this report-only checkpoint.

## Integration risk and recovery

MEDIUM operational compatibility exposure, independently identified. Readers and pinned worker admission now reject previously tolerated malformed plans; a malformed completed job can make its entire pinned plan unavailable, including another selected job. This intentional fail-closed tightening preserves bytes and is not evidence of data corruption or migration. Valid type/status/evidence controls, readonly unknown diagnostics, shared parser/render invariant, existing guarded publication/admission tests and independent review support the contract. Detect via explicit parser/unknown errors; restore prior runtime only under actual authority or repair a record through explicit authorized reconciliation. Source revert cannot undo decisions already made, and no live rollback is tested. LOW-risk standing integration permission does not cover this PR: explicit operator integration decision required after CI.

## Closure and acceptance

Source verification complete. Final-head PR/native CI and integration remain separate gates; merge only under applicable explicit LOW-risk approval through normal protected expected-head path. No direct-main push, bypass, installation, release or cleanup. Final observations will be retained externally on the PR to avoid receipt/source CI loops.

## Blockers and next action

Publish final head and verify native CI. No active writer/reviewer or unrelated canonical changes included. Missing capability and evidence stay explicit.

## Author handoff — coordinator transcription

# #127 / I0021 J001 result

Complete implementation, pending coordinator full suite, independent review and native CI. Checkout `/home/iseoane/Work/isSWF`, branch `fix/127-canonical-plan-validation`; began clean at preparation HEAD `1f736e3d70dae1bdfeee704affa79822ea9f8f51` (source base `0fbfb376902c7bc02728190599877e2e11a3b58d` is its ancestor). Final HEAD `74a89e2e270be4203b6a577e31e392891f51455a`; no staged/working changes.

## Outcome and compatibility

`tools/isswf-plan.mjs` now requires one supported top-level canonical Type (`bug`, `enhancement`, `maintenance`, `research`) when parsing; missing, duplicate and unsupported types throw `invalid-plan-type`. Parsed completed jobs require non-whitespace evidence beyond the canonical `None.` sentinel. Rendering also refuses completed evidence containing only that sentinel, so generated plans satisfy the reader. Pending jobs can remain empty. Parser array/API shape, declared statuses, dependencies, brief references and evidence semantics otherwise remain unchanged; nonempty evidence is not authenticated proof. Status and panel continue to expose malformed plans as `unknown`/unavailable and do not rewrite bytes. No historical plan changes.

## TDD provenance

- Test-only RED commit `858ac2aeee5046c4e762f8d538f2b674260c37bb`. `node tests/initiative-dependencies.mjs .` failed behaviorally at `tests/initiative-dependencies.mjs:30`, “Missing expected exception” for invalid type. `node tests/initiative-status.mjs .` failed at `tests/initiative-status.mjs:62` (expected `unknown`, observed `observed`). `node tests/initiative-panel.mjs .` failed at `tests/initiative-panel.mjs:119` (same outcome). A separate direct `parsePlan` assertion against this RED commit's baseline source failed “Missing expected exception” for completed/None evidence. Controls cover all four valid types, pending empty evidence, valid completed evidence, and renderer refusal of completed/None.
- GREEN commit `74a89e2e270be4203b6a577e31e392891f51455a`; the three focused commands above passed.

## Verification and resources

Passed: `node tests/initiative-dependencies.mjs .`; `node tests/initiative-status.mjs .`; `node tests/initiative-panel.mjs .`; `node tests/initiative-plan.mjs .`; `node tests/initiative-next-action.mjs .`; `node tests/worker-dependencies.mjs .`; `git diff --check`. Status/panel malformed-record fixtures compare protected project bytes unchanged. No full suite per instruction; no Windows/native CI run (coordinator gate pending).

Consumed (tool-read, application self-reported): worker role and Pi host guide; canonical I0021 plan and J001 brief; `isswf-tdd` and TDD reference (test-only RED / separate GREEN commits); global `/home/iseoane/.agents/skills/test-value/SKILL.md` and `references/decision-examples.md` (behavioral/compatibility controls); code-quality, comments and verification references (focused seams, local invariant, scoped verification). Quality/comments application is visible in the parser change; docs unchanged, so writing skill not applicable. No reviewer or native-platform result claimed.

```acceptance-report
{
  "criteriaSatisfied": [
    { "id": "criterion-1", "status": "satisfied", "evidence": "Implemented focused parser/render parity; RED/GREEN commits and behavioral consumer controls recorded above. Residual native CI/full-suite gates remain." }
  ],
  "changedFiles": ["tools/isswf-plan.mjs", "tests/initiative-dependencies.mjs", "tests/initiative-status.mjs", "tests/initiative-panel.mjs"],
  "testsAddedOrUpdated": ["tests/initiative-dependencies.mjs", "tests/initiative-status.mjs", "tests/initiative-panel.mjs"],
  "commandsRun": [
    { "command": "node tests/initiative-dependencies.mjs . at RED 858ac2aeee5046c4e762f8d538f2b674260c37bb", "result": "failed", "summary": "Expected invalid type exception missing; behavioral RED." },
    { "command": "node tests/initiative-status.mjs . at RED 858ac2aeee5046c4e762f8d538f2b674260c37bb", "result": "failed", "summary": "Missing-type plan was observed instead of unknown; behavioral RED." },
    { "command": "node tests/initiative-panel.mjs . at RED 858ac2aeee5046c4e762f8d538f2b674260c37bb", "result": "failed", "summary": "Missing-type plan was observed instead of unknown; behavioral RED." },
    { "command": "node tests/initiative-dependencies.mjs . at GREEN 74a89e2e270be4203b6a577e31e392891f51455a", "result": "passed", "summary": "Parser, supported type, completed evidence and renderer controls." },
    { "command": "node tests/initiative-status.mjs . at GREEN 74a89e2e270be4203b6a577e31e392891f51455a", "result": "passed", "summary": "Malformed plan observed unknown; bytes unchanged." },
    { "command": "node tests/initiative-panel.mjs . at GREEN 74a89e2e270be4203b6a577e31e392891f51455a", "result": "passed", "summary": "Malformed plan surfaced unavailable; bytes unchanged." },
    { "command": "node tests/initiative-plan.mjs .", "result": "passed", "summary": "Plan lifecycle, guarded revision and validation controls." },
    { "command": "node tests/initiative-next-action.mjs .", "result": "passed", "summary": "Recommendation/status/panel controls." },
    { "command": "node tests/worker-dependencies.mjs .", "result": "passed", "summary": "Dependency admission controls." },
    { "command": "git diff --check", "result": "passed", "summary": "No whitespace errors." }
  ],
  "validationOutput": ["All six focal test commands passed on final code; test-only RED behavior was observed before production change."],
  "residualRisks": ["Native Windows/CI and coordinator full suite/independent review remain pending."],
  "noStagedFiles": true,
  "diffSummary": "Shared parser validates canonical type and completed evidence; renderer enforces matching completion invariant; consumer tests assert readonly unknown diagnostics.",
  "reviewFindings": [],
  "manualNotes": "TDD RED 858ac2aeee5046c4e762f8d538f2b674260c37bb; GREEN 74a89e2e270be4203b6a577e31e392891f51455a. No push, docs edits, dependency installs, live calls or broader grammar changes."
}
```


## Independent handoff — coordinator transcription

# #127 / I0021 independent combined review

**Standards: pass. Spec: pass. Aggregate: pass. No blocking findings.**

Base: `0fbfb376902c7bc02728190599877e2e11a3b58d`  
Candidate: `176bfbf545121d7697d4d536436013c6fc4c4fb0`  
Unchanged brief checkpoint: `1f736e3d70dae1bdfeee704affa79822ea9f8f51`

Reviewed the complete coordinator-attested patch (`bd4c99f59de00bcf8e104cbf50485a2f57fea377f120c3d2a9db19c0d26137a0`): I0021 preparation records, parser/render implementation, three regression files and native CI registration. Traced actual status/catalog, panel and pinned worker-admission consumers; examined lifecycle, dependency and recommendation tests.

## Standards

Observed in candidate: validation remains at the shared parser/render owner; `hasEvidence` avoids divergent completion rules; existing array/API shape and publication/checkpoint guards remain intact. No dependencies, historical migrations, status additions or unrelated grammar changes. Comments guidance presents no issue.

Tests establish contractual outcomes rather than private implementation structure: four supported types, explicit invalid-type rejection, completed-evidence rejection, positive evidence, pending-empty compatibility, and readonly consumer diagnostics. Existing consumer/lifecycle coverage protects adjacent behavior.

TDD evidence was **not personally rerun**. Relied on worker observations and coordinator replay: test-only RED `858ac2aeee5046c4e762f8d538f2b674260c37bb` failed with the expected missing exception; GREEN `74a89e2e270be4203b6a577e31e392891f51455a` passed. Retained sentinel RED `957cfd529d7ceb6cda5fdb4907a0a3a637ac32e2` and GREEN `1261805142632362660a9fce123a73009b83aae9` cover the subsequently discovered whitespace-wrapped sentinel gap. Earlier adverse evidence remains valid for those earlier candidates.

## Spec

Top-level preamble validation rejects missing, duplicate and unsupported types. Completed evidence must contain substantive text beyond whitespace/`None.`, including whitespace-wrapped sentinels. Renderer and parser share that invariant; pending empty evidence remains valid.

Malformed records become explicit `unknown`/unavailable without rewriting bytes. Pinned dependency admission propagates parser errors before activation/admission effects.

**Compatibility consequence:** bounded **medium operational exposure**, not a demonstrated regression against accepted behavior. Previously tolerated malformed historical records become unavailable; any malformed job can prevent admission from its entire pinned plan, including an otherwise unrelated selected job. This is intentional fail-closed tightening. Bytes remain recoverable and unchanged; repair requires explicit authorized action, not migration. No source blocker identified.

## Resources and limits

Consumed reviewer role, review skill/guide, AGENTS, canonical plan/brief, TDD skill/reference, test-value skill/examples, quality/comments/verification/design references, development quality guidance, author report, full patch and retained logs. Author resource consumption remains self-reported; application was assessed against sources.

Reused coordinator-attested six focal checks, full quality, locked ESLint and Knip PASS at `1261805`; final delta only registers existing commands in Linux/Windows CI. Exact-head native CI remains a delivery gate, not a source-review blocker. No execution, mutation, delegation or network access performed.

## Approved integration, pending refreshed CI

The current operator explicitly approves integration after the MEDIUM operational risk explanation ("Ok integra!"). Canonical plan records that decision; no historical plan migration or automatic repair is authorized. Current base is c4953e640f70e1eacae24317a8a2c37299bc1358, advanced through separately reviewed/integrated #125/#128. Normal branch merge preserves all #127 parser and regression bytes from the reviewed/native-verified candidate; focal parser/status/panel/guarded-writer checks PASS. Final head also includes this bounded decision record, not a would-be self-SHA. Fresh native exact-head CI must pass before normal expected-head PR135 merge. Final actual head, CI, tested tree and merge observation will be retained as an external PR receipt, without recursive record commits. Private one-shot coordination metadata remains untracked and unpublished.
