# I0001 / J006 / r6

## Result and authority

Publish the controlled machine-restart case and its verified conservative recovery result. This is evidence delivery, not a new execution. The operator authorized the first offline worker, then explicitly authorized a separate second synthetic experiment after the first failed before reboot. The second performed the single physical restart, which the operator confirmed. Both worker admissions are consumed. No further worker, reboot, repair, replay or replacement is authorized.

Delivery base: `cd9d7254055a532a215013f641c64c6a822641d9`. PR75 delivered the reviewer’s optional original-evidence access with independent source review and exact PR CI39428842854 and main CI39428978673 success. This unit changes no production runtime. It uses that delivered access to check the original persistent case, not a copied fixture.

## Immutable case inputs

- Case: `I0001/J006/restart-case-v2`, attempt `I0001-J006-restart-v2-A001`.
- Original input: `de455c78ea4cb9efa4754e088c7e2548f325e446`.
- Original runtime/target baseline: `0848d97304695e7cf1c334e159751e3a5afd9b93`.
- Recorded preparation source: `53cea8cdb86ba92dca2614af2b14a6e6c41e4aaa`. Delivery does not rewrite that history.
- Verifier’s approved executable-consumer source: `33103a97937ff7b5a8d843681af81364edbdb3fb`. Exact ten runtime blob hashes derive from that retained Git commit. The worker/recovery sources are unchanged at this delivery base.

## Acceptance

1. Distinguish the failed first case from the actual second restart. Retain both outcomes, explicit additional-case authority and consumed cumulative budgets. A failed case is not silently retried.
2. Check the actual current kernel boot differs from the original before snapshot. Preserve and compare the four immutable metadata records and the complete 41-file workspace tree, including content, sizes and executable bits. Against the original Git baseline, only the allowed `result.txt` partial differs.
3. Revalidate original input/model/brief/runtime bindings and approved executable consumers before invoking the fixed normal read/reconcile entry. The actual read reports unknown child boot identity; reconcile blocks uncertain cessation, requires review and permits no retry. No model invocation marker, replacement or repair is introduced.
4. The independent review runtime must execute the read-only verifier against the trusted original fixture with explicit tree and source-object pins. Evidence stays private except the curated safe output and exact source-review report. Require independent Standards and Spec results and exact new PR/main CI before technical delivery.

## Scope and exclusions

This case directly exercises OPS-05 and OPS-06 preservation, revalidation and refusal under uncertain process identity, with SEC-03’s assigned offline/read-only capability boundary. OPS-03 chat-close behavior and OPS-04 ambiguous remote-effect reconciliation retain their separate historical evidence for J008. This case does not itself prove them, successful worker execution, automatic continuation, external-effect settlement, authentication of arbitrary archives or full-v1 acceptance. Operator acceptance remains separate.

## Source and checks

- `restart-case-v1.json` and `restart-case-v2.json`: original safe outcomes and budgets.
- `verify-restart.mjs`: original-fixture validation and fixed read/reconcile. No SDK/auth loading, task launch, publication or reboot.
- `tools/native-recovery.mjs`, `tools/worker-lifecycle.mjs` and the normal `tools/isswf-job.mjs` read/reconcile branch: existing conservative interpretation, unchanged from the approved runtime source.
- `original-access-verification.json` and `docs/review-original-evidence.md`: delivered access safeguards and independent prerequisite report.

Run the verifier only against the original operator-owned persistent directory. Run syntax, public quality, ESLint and Knip. Review the complete evidence-delivery unit with exact current assignment/authorization fields and actual original-fixture observations. No repeated physical experiment or synthetic replacement is needed.
