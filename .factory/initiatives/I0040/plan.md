# I0040: Corrections to running delegated coordinators

Type: enhancement

## J001

- Status: in-progress
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
