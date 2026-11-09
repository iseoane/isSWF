# I0040: Corrections to running delegated coordinators

Type: enhancement

## J001

- Status: completed
- Objective: Deliver #222 native correction route and portable checkpoint inbox without expanding authority.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None for current delivery; live Windows verification deferred by explicit operator decision.
- Next step: Implement and verify portable contract; report exact native Windows evidence needed without narrowing acceptance.

### Acceptance

- Document a verified native correction route with lifetime/permission limits and actual Windows evidence.
- Define portable checkpoint inbox handling before review and publication for Pi and Claude.
- Corrections preserve original grant and cumulative budgets; issue text cannot authorize changes.

### Evidence

- Current #222 GitHub body read 2026-11-09; existing Claude guide lines 55-63 already describes Linux-only SendMessage capability, not Windows proof.
- Operator explicitly orders #247 then #222 then I0038 then I0009/J030. #247 merged PR248 with exact-head CI success.

## Accepted revision and review handoff

Material acceptance revision 1: current operator explicitly says Windows real-host verification must not block development because availability is unknown. Windows live Claude proof is deferred follow-up, not a completion gate for this bounded portable-methodology unit. No Windows live/parity claim. Native channel knowledge remains qualified; CI Windows covers mechanics/static contracts only. Parent clarified original #222 direction is parent -> running delegated coordinator, not merely coordinator -> worker.

Worker bf34451c-8f58-4d9b-bca8-f20e6564f0f3 terminal complete observed, full A001 consumed. Candidate eab84235bfbae5b6e17e933ddac52193c2763e46; implementation 2fcc0f30e772ad6e5274dd26fc0318cf570a9d4d, subsequent report-only commit. Coordinator inspected exact diff and reran host-portability, check-docs, whitespace PASS. New correction template is included by build-release's template allowlist, so full tools/check-quality run executed PASS on committed candidate; native host delegation separately NOT_RUN locally as declared. No evidence of actual Windows model correction.

Combined independent semantic/static review round 1, no prior review IDs, REVIEW.md absent. Acceptance tests assert written contract only, not model adherence; semantic review required for trust, permissions, writer ownership and checkpoint protocol. Verify transport direction, no authority expansion or budget reset, safe pending-inbox fallback, ordinary/no-correction and missing/conflicting/stale/duplicate cases. Check template distribution/link paths and whether the mandatory record/checkpoint procedure is proportionate and executable under worker ownership. One worker consumed, reviewer 1/3 allocated, corrections 0/2, no active writer. Resource consumption self-reported; report identifies all selected references and application.

## V001 and correction cycle 1

Reviewer c67db580-f685-4139-a028-c7053599a096 terminal complete observed; V001 Standards FAIL, Spec FAIL, risk MEDIUM, blocking introduced F001. Accepted: no defined sender/producer for pending correction when recipient cannot receive it. Correct sender retention and safe serialized recording/handoff, recipient reconciliation and affected summaries/template/assertions. No new transport or scope. Preserve V001 and missing Windows proof. Allocate same worker continuation correction1/2; one review1/3 consumed; no active writer before continuation. Report A002, then independent delta review. No actor/model/cost reset.

## Correction 1 completion and review round 2

Worker continuation91720ee0-7cbb-47f3-8a4d-6b10bf0bd991 terminal complete observed; A002 consumed. F001 claimed fixed with explicit sender retention, safe exclusive/stopped-writer recording, exact checkpoint handoff and recipient reconciliation. Candidate63ba4c71dbe5bfc317df22841486e80b1d5e6df3 includes A002 only after functionalc728dd4344441fed3543e55b610a918bc0aba272. Coordinator focused/docs/whitespace rerun PASS; worker full quality PASS on functional candidate including packaged template, native model behavior NOT_RUN. Allocate independent round2 delta review of F001 and affected risk; prior V001 FAIL retained until independent resolution. Budgets one worker + one continuation1/2, review2/3 allocated. No active writers. Windows live verification remains deferred nonblocking.

## V002 delivery receipt

Independent reviewer5d4638be-1ac1-4b7c-be5f-4961780624a1 terminal complete observed. V002 consumed fully: F001 RESOLVED, Standards/Spec/aggregate PASS, zero new findings, LOW integration risk for documentation/static unit. Exact bound delta consumed at63ba4c71dbe5bfc317df22841486e80b1d5e6df3, digest3c8ab4f65406e739ea9254f75205b103b2c28658993b9a3cb54b7c5aa288fb78. Required resources self-reported consumed, none missing. V001 FAIL preserved. No active actors. Budgets spent initial worker1, correction1/2, review2/3. Functional bytes unchanged by these retained review receipts.

Coordinator integration assessment LOW: parent/coordinator evidence and ownership procedures only, no new commands/runtime/permission grants. Plausible failure is a stranded correction or incorrect belief of consumption; explicit sender retention, safe checkpoint handoff, blocked prepublication outcome, focused checks and semantic review address it. Detection is absent receipt or provenance; revert restores prior wording but cannot undo already consumed guidance. No rollback run. Live transport/adherence remains unproved; Windows actual-run follow-up explicitly deferred by operator, not a delivery blocker. Existing Windows CI checks mechanics without models. Publication and exact-head CI pending; LOW expected-head merge authorized after gates. Next unit I0038 then I0009/J030, preserving their own bounded preflight.

## Integration receipt

PR249 merged2026-11-09T19:45:02Z atca755a6d173b5f12efddafeb1a6e7536f453a606. Exact headf60960f058b700c9d92ce286c8a6ac18ca1f639d Quality42685652831 SUCCESS all3 (portable/Linux/Windows). F001 resolved, V002 PASS/LOW; explicit LOW integration permission used with expected-head guard. Windows live model follow-up deferred, nonblocking and unclaimed. No active actors. Proceed I0038 then I0009/J030.
