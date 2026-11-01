# Default feature-to-PR workflow

This is the coordinator's workflow contract, not a new dispatcher or persistent service. Use the existing plan, briefs, callers, host tools and delivery records. The coordinator owns continuity while the session and capabilities remain available; a helper's completion is not a reason to wait for another operator prompt.

## Select the current request

A trusted operator request to start or implement a feature selects this default in a prepared project:

**Define the outcome, implement, check, review as required, correct, commit, push the feature branch, create or update its PR, verify required CI, and deliver the PR for a human integration decision.**

Before each new dispatch, verify and record the current trusted start instruction and its bounded action scope. A design-option choice, brief approval, or approval that does not clearly say to start execution is preparation only; do not dispatch a new actor. Keep the job prepared, not started in its existing blocker/next-step fields, and state the exact missing start instruction. If approval is genuinely ambiguous, clarify whether to start and wait before dispatch. Preparation and approval do not become dispatch evidence merely by being recorded.

An explicit start such as “implement this feature” selects the bounded workflow above; do not ask again for commit, push or PR permission already covered by that start. A continuation or correction within an already explicitly authorized assignment does not need a redundant start prompt; retain its original bounded grant and cumulative budgets. Explicit prepare-only, read-only, local-only or other narrower limits still prevail.

Record the trusted current request as the authorization source and translate its bounded scope into the effective brief and supported callers' actual grants. Configuration and this document supply the workflow meaning, not permission on their own. Preserve the assigned actor, model/effort, access and cumulative cost/attempt limits; a per-call grant does not reset the assignment's budget. A record describes preparation until a dispatch tool reports that dispatch occurred; do not infer actor liveness or dispatch from text or plan status.

Before dispatch, materialize finite totals in the brief: the default ceiling is **two independent review rounds per functional unit total, including the initial review**, and **one correction cycle total**. The first review's findings are bundled into that cycle; after correcting them, repeat only affected checks and the required independent review. This ceiling is not a requirement to perform two reviews when one is sufficient, and does not add actors, time, cost, permissions or retries. Explicit tighter grants take precedence, including zero; a combined multi-unit assignment may impose a lower cumulative ceiling. Record each actor/call and remaining budget before dispatch and on resume; never reset spent budget. A technical failure consumes the applicable call/attempt budget and blocks or waits for recovery within the remaining grant; it does not authorize a replacement actor or retry.

A request to discuss, investigate, prepare a plan, draft PR text or work locally is not a feature start. An issue type, readiness label, saved setup, memory or agent report is not a current operator instruction. Explicit read-only, local-only, no-commit or no-publication limits override the default. Apply it to a bug or another assignment only when the trusted request selects the same delivery workflow. If the intended operation is genuinely ambiguous, clarify that operation once, while continuing independently authorized preparation.

This policy is prospective. Installing or editing it does not retroactively authorize publishing pending work, changing old grants or resuming existing attempts.

## Start from a prepared setup

Setup resolves the stable prerequisites before normal feature execution: actual host and supported delegation, model/effort and subscription/cost boundaries, finite execution/correction budgets, exclusive workspace policy, relevant checks, and the delivery repository/remote/base/feature-branch policy. Host-native work uses the host's permissions and sessions; a factory runtime pin, private execution store or custom isolation backend is not a prerequisite. Those remain requirements only for an explicitly selected legacy executor assignment. In GitHub mode, the default delivery is a branch PR, not a direct push to the integration branch. Preserve explicitly chosen local delivery and project restrictions rather than silently switching tracking or destination.

Do not insert a fresh setup interview or generic execution-approval gate before every feature. Reuse verified choices and current evidence. If a required stable choice was never settled, reconcile setup and expose that real gap instead of calling setup complete. Legacy projects without these choices need a one-time reconciliation, not guessed values or a second active state root.

Preflight remains mandatory where the caller requires it. Expired credentials, an unavailable model, unknown actor state, exhausted capacity, a dirty/conflicting checkout or a damaged pin can arise after setup. Retain the safe refusal and reconcile within the grant; do not invent readiness or bypass a runtime guard to maintain flow.

## Record the actual reason to wait

Use the existing plan states; do not add a second status store.

| Condition | Recorded state and next action |
| --- | --- |
| Product meaning, scope, acceptance criterion, setup choice or uncovered permission needs a person | `awaiting-human`. Record the exact question, affected step, evidence/options, and the answer or grant needed to resume. A definition decision does not require an implementation or delivery artifact first. |
| A technical fact can be investigated within the grant | Continue grounding or implementation; do not turn an investigable fact into a question for the operator. |
| A runtime failure, unavailable resource, unresolved actor state, integration dependency or queued CI prevents progress | `blocked` with the technical cause and exit condition, or retain the appropriate active/review state while observing. Continue independent authorized work. Do not classify waiting alone as a human decision. |
| A check or review demonstrates a defect within the accepted scope | Continue the bounded correction cycle without routine operator reconfirmation: bundle in-scope findings from the first review, correct them, rerun affected checks and obtain affected required independent review on the new candidate. Preserve all prior verdicts. Stop with the exact blocker if the correction/review budget is exhausted, findings exceed granted scope, a product decision or permission is needed, or capacity is unavailable; do not exceed actor, time or cost limits. |
| The verified PR is delivered and integration is the next decision | `awaiting-human`, naming the observed PR URL, exact head/base, checks/review, residual risk and integration decision requested. |

For a human wait, put the question in the existing brief or coordinator record and the plan's blocker/next step. In GitHub tracking, use `ready-for-human` only if an existing applicable label-edit grant covers it; a label is not execution status. A technical outage does not authorize a new destination, model, actor, retry budget or installation. When only a person can resolve it, name that specific decision and move the affected work to `awaiting-human` rather than asking for generic approval to continue.

## Drive the work through delivery

1. Ground the desired behavior and prepare a bounded brief. Investigate technical uncertainty and ask only necessary product questions. Select diagnosis, planning, TDD, E2E, security and deeper review proportionately, not as a mandatory pipeline.
2. Resolve exclusive ownership and the configured workspace/base. Assign each actor only its supported operations and current finite grant. The coordinator normally owns Git publication; a sandbox worker or text-only role does not gain Git history, network tools or publication capability from this default.
3. Keep the operator conversation available while long work runs: dispatch through a verified native background mechanism, report actual run identity and expected result, then return control. Consume completion/results against the current assignment, actor and candidate before dependent actions. Duplicate, stale or late notices trigger reconciliation only, never duplicate dispatch or publication. Report executing, waiting, blocked and finished truthfully; a launch receipt is not a finished result. Short synchronous work remains proportionate. Before resumption reconcile candidate, permissions, evidence and cumulative budgets; unknown writer state blocks replacement. Cancellation is not proof of cessation; do not promise exactly-once execution or crash recovery. Inspect the actual candidate and effects, run relevant checks, obtain required independent judgment, and address findings within scope. Preparation, a successful process and a passing model response are not delivery. Reconcile cessation and partial work before replacement, preserving cumulative actor budgets.
4. Retain the exact candidate and checks. Create authorized checkpoints on the feature branch, push without force, and use [isswf-pr](../../skills/isswf-pr/SKILL.md) for the scoped PR with mandatory risk and verification evidence. A delivery helper may remain prepare-only; the coordinator consumes its result and performs the covered next step rather than pausing for another publication permission.
5. Read back repository, target base, actual head, URL and state after remote writes. For long CI, use a verified native completion event or one bounded deferred read-only check; if neither is available, report pending/manual revisit. Never use continuous watch, sleep, active polling or model calls just to wait. Observe required CI on the exact head, diagnose relevant failures and repeat affected checks after changes. Preserve uncertain external outcomes and reconcile before retrying. Do not claim a published PR or green CI from a draft, a local path or an earlier head.
6. Deliver the verified PR and record the concrete human integration decision. Keep technical closure, PR publication, product acceptance and integration distinct. A PR that still has a required technical blocker is not ready merely because it exists.

## Stop before integrating into main

The default ends at the PR, not at integration. Do not merge, squash, rebase into the integration branch, push directly to it, arm auto-merge or a merge queue, or treat passing CI as human acceptance. Release publication, deployment, privileged setting changes and destructive actions are outside this default too.

A separate explicit human decision for the particular integration and candidate is required before taking an integration action. Preserve server-enforced protections and exact-head checks; setup preferences or a prior feature start cannot replace that decision.

Closing a session, a tool interruption or a reboot does not imply completion or automatic recovery. Resume through the existing reconciliation rules and retained records. The coordinator remains responsible for the next bounded action; it does not promise execution while its session is absent.
