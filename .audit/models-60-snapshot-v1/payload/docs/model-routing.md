# Model routing

`.factory/models.json` is the canonical source for configured role routes. This guide defines how a coordinator interprets it manually; it is not a resolver, runtime contract, or authorization grant.

## Before dispatch

Read the whole configuration from the pinned input checkpoint. Record its path and full input Git SHA in the attempt. Check that the selected role exists, every destination and effort is supported by the current runtime, and each tuple is permitted by the trusted grant. Confirm availability and effort support from current runtime evidence before dispatch. If any check is unknown or fails, block dispatch rather than silently substituting a model. The current Pstack transport adapter remains available; this does not guarantee future transport compatibility or availability.

Resolve one complete ordered route, without merging tuple fields across destinations. Precedence is an explicit whole-route job override, then the configured role route, then a project default if one exists. No project default is configured. An unknown role blocks unless the trusted job grant explicitly supplies a complete approved route override. An override cannot widen that grant. Configuration membership does not authorize an actor, additional worker, review, cost, or action.

The route values are only those in `.factory/models.json`. A one-entry array has no alternate. An additional-review route is used only when the job explicitly assigns that role; it is never an automatic fallback. Record the ordered route and selected destination in the attempt. Record requested and observed actual model and effort metadata, availability and effort evidence, and each route transition with its reason. Record an account or subscription alias only when the operator supplied a real alias; provider names are not account aliases.

## Route transitions and replacement

Advance to the next approved tuple only when the selected destination is unavailable or its quota/capacity is exhausted. Test failures, review findings, poor output, or an unfavorable result are not routing failures and must not trigger a retry on another model. Do not infer compatibility, availability, quota, or actual model identity from configuration values.

Before replacing or retrying a writer, reconcile its identity, task, ownership, live state, partial work, and the total actor grant using available tools and records. Unknown identity or state, an active writer, or an unresolved grant blocks replacement. Route membership does not authorize another actor. Do not infer that isolation or a reported completion proves a process stopped.

A changed configuration or default affects future attempts only. Preserve each attempt's pinned configuration path, full input Git SHA, resolved ordered route, selected destination, observed actual metadata, and transition reasons. Do not resolve an existing attempt against the latest configuration. Do not embed a would-be commit SHA in the artifact whose commit it would identify.
