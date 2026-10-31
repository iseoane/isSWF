# J033: Configuration ownership decision pending

Supersedes brief-r1 for next step only; no author dispatched. Planner4754c6c9 consumed the one read-only planner allocation and returned a proposal, not implementation or operator acceptance. It read the pinned r1 at370c0d3 using coordinator-verified exact working bytes. Full result remains in host artifact4754c6c9-80c1-40ab-81a4-6c69a506e598_isswf-planner_output.md; no planner-authored repository artifact is claimed.

## Findings and scope reassessment

Actual consumers require retaining legacy route bytes: tools/isswf-job.mjs:223–228 and task callers read pinned configurations/digests; tools/isswf.mjs:274–307 still initializes them; package allowlists retain them. Native Pi already uses .pi/settings.json; Claude uses its supported native mechanisms, not Pi provider IDs. Globally worded docs/model-routing.md opening, docs/durable-work.md Model routing and source-activation/initializer wording obscure these boundaries. Initial delete-or-sync assumption is unsafe. Planner recommends correcting current/native ownership and legacy-only scope with deterministic actual-host/compatibility evidence, not merely regex wording checks or a new config engine.

## Awaiting-human product decision

Question: does 'one configuration point' mean (A) one editable native authority per host — .pi/settings.json for Pi, supported Claude-native configuration for Claude, explicitly no competing models.json for ordinary work — or (B) one physical isSWF configuration containing both host selections, with derived guarded application to native host configuration?

A is the smallest recommended repair and adds no shared schema/apply engine, but is not one cross-host physical file. B is a broader product requirement requiring schema, supported adapters and drift/missing behavior, without inventing unsupported Claude effort fields. Existing approved models/efforts stay unchanged either way. Resume condition: operator selects ownership outcome; coordinator adopts and prepares exact author scope/checkpoint within remaining finite allocation. No implementation or extra planner call while unresolved.

## Record placement

Operator questioned why independent work was appended to I0009. Coordinator acknowledged config unification is an independent outcome and should have its own initiative rather than treating I0009 as a permanent umbrella. Existing original checkpoint path remains valid; no files moved, history rewritten or IDs silently reassigned. Reconcile chosen initiative ownership before writer dispatch, retaining this proposal/input provenance and without spending another planner call.

Future evidence UI and all other pending jobs remain outside scope. Current remaining allocation one author and up to two reviews, not yet consumed; no host/global config mutation, installation, migration, cleanup or extra provider calls.
