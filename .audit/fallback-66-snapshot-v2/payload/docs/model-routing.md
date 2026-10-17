# Model routing

`.factory/models.json` is the canonical source for configured role routes. The coordinator applies the general rules below. The text-only researcher caller implements the bounded path described at the end; this guide and route membership are not authorization grants.

## Before dispatch

Read the whole configuration from the pinned input checkpoint and record its path and full input Git SHA in the attempt. Resolve the complete ordered route, then validate that the role exists and every tuple is permitted by the trusted grant. An unknown role blocks unless the trusted grant explicitly supplies an approved whole-route override; that override cannot widen the grant. Do not preflight runtime availability or effort compatibility for alternate tuples. Before using a selected tuple, confirm its runtime support, requested-effort support, and current availability from runtime evidence. A confirmed unavailable or quota-exhausted tuple may advance only under the transition rules below. Unknown availability or failed compatibility checks block use of that tuple rather than silently substituting a model. The current Pstack transport adapter remains available; this does not guarantee future transport compatibility or availability.

Resolve one complete ordered route, without merging tuple fields across destinations. Precedence is an explicit whole-route job override, then the configured role route, then a project default if one exists. No project default is configured. An unknown role blocks unless the trusted job grant explicitly supplies a complete approved route override. An override cannot widen that grant. Configuration membership does not authorize an actor, additional worker, review, cost, or action.

The route values are only those in `.factory/models.json`. A one-entry array has no alternate. An additional-review route is used only when the job explicitly assigns that role; it is never an automatic fallback. Record the ordered route and selected destination in the attempt. Record requested and observed actual model and effort metadata, availability and effort evidence, and each route transition with its reason. Record an account or subscription alias only when the operator supplied a real alias; provider names are not account aliases.

## Route transitions and replacement

Advance only to the next tuple in route order when the selected destination is confirmed unavailable or its quota/capacity is exhausted. Before using that next tuple, confirm the prior writer stopped and reconcile its identity, task, ownership, partial work, and total actor grant. Then verify the next tuple is approved by the trusted grant and currently supported, effort-compatible, and available. Unknown availability, unsupported or incompatible effort, unknown identity or state, an active writer, or an unresolved grant blocks at that tuple; do not skip ahead. An exhausted route blocks. Test failures, review findings, poor output, and unfavorable results are not routing failures and must not trigger another model. Do not infer compatibility, availability, quota, or actual model identity from configuration values. Route membership does not authorize another actor, and isolation or reported completion does not prove a process stopped.

A changed configuration or default affects future attempts only. Preserve each attempt's pinned configuration path, full input Git SHA, resolved ordered route, selected destination, observed actual metadata, and transition reasons. Do not resolve an existing attempt against the latest configuration. Do not embed a would-be commit SHA in the artifact whose commit it would identify.

## Dispatch a text-only researcher

Use `tools/researcher-task.mjs` only for research over an explicitly supplied, pinned source bundle. This caller has no tools, sessions, extensions, discovery, or target writes. It does not replace research that needs interactive code navigation or network access. The worker's Luna/high route and normal job runner remain unchanged.

Commit a research job with `version: 1`, `logicalJobRef`, `briefPath`, `sources` (target Git paths), `targetRepo`, `targetBase`, `sdkPath`, and `models: {sha, path, sha256}`. The brief is read at the document input checkpoint; target sources are read at the separate target base. The pinned model document supplies the complete researcher route. Live defaults do not alter it.

The operator-owned grant must be outside both repositories, the runtime source, and the private store. It binds `version: 1`, `role: "researcher"`, `logicalJobRef`, `grantRef`, canonical `project`, `inputSha`, `jobPath`, `jobSha256`, `targetRepo`, `targetBase`, `store`, exact `callerSha256`, and the complete `approvedRoute`. Require explicit integers for `totalAttempts`, `retryBudget`, `deadlineMs`, `outputBytes`, and `maxOutputTokens`; there are no defaults. It must allow the result artifact, explicitly allow provider calls, prohibit additional API costs, approve `temporaryUnavailableStatuses: [503]`, and supply an opaque host `authPath` plus the approved SDK entry digest `sdkEntrySha256`. The JSON flags are `allowResultArtifact: true`, `allowProviderCalls: true`, and `apiCostsAllowed: false`. Unconfirmed subscription use blocks. The SDK confirms subscription status only for supported OAuth providers, not for API-key plans such as OpenCode Go. For those plans, a trusted grant must separately supply `subscriptionAttestations: [{provider, coversCallsWithoutAdditionalApiCost: true, reference}]` after the operator confirms the configured account's coverage. An actual operator-supplied `accountAlias` is optional; provider names are not invented account aliases. Claims and outcomes label this evidence as an operator attestation, not SDK verification. Missing or uncertain coverage still blocks. Paid API ceilings are not implemented.

Invoke the reviewed caller only under that concrete grant:

```sh
node /absolute/fixed-isSWF/tools/researcher-task.mjs \
  --project /absolute/project --input-sha FULL_SHA --job research/job.json \
  --grant-file /absolute/operator/research-grant.json \
  --store /absolute/private-research-store --mode real
```

The store must already exist outside the repositories. A write-once logical-job directory prevents replay after any result or interruption. Each numbered claim is synced before the call and consumes the cumulative total across retries and destinations. A missing result never releases a claim. This caller does not recover or automatically resume research calls; stop and inspect its records. The result contains the findings, pinned route, selected tuples, attempt counts, and transition reasons.

One HTTP request is allowed per SDK attempt, with SDK retries disabled and SSE transport selected. A 503 permits only the explicitly budgeted retries, then the next approved tuple after the previous stream ends. A 429, unknown error, unfinished stream, unsupported effort, missing auth, test failure, or poor findings cannot trigger fallback. Deadline expiry consumes the uncertain invocation and blocks continuation.

Automatic quota classification is not implemented. A trusted grant may supply `authoritativeQuotaEvidence: [{tuple: {model, effort}, confirmedExhausted: true, reference}]` for an exact approved tuple. This records operator-supplied evidence and consumes a conservative attempt slot without sending that tuple a request. It is not a claim that the SDK detected quota exhaustion. Without such evidence, 429 stays unknown.

Run `node .audit/verify-fallback-66.mjs .` for the same caller's injected-SDK controls. They make no provider calls and prove neither live route availability nor actual fallback integration. No real #66 invocation has been authorized or demonstrated.
