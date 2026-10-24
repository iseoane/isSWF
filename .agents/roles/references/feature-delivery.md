# Default feature-to-PR workflow

This is the coordinator's workflow contract, not a new dispatcher or persistent service. Use the existing plan, briefs, callers, host tools and delivery records. The coordinator owns continuity while the session and capabilities remain available; a helper's completion is not a reason to wait for another operator prompt.

## Select the current request

A trusted operator request to start or implement a feature, or approval of a clearly presented feature-to-PR assignment, selects this default in a prepared project:

**Define the outcome, implement, check, review as required, correct, commit, push the feature branch, create or update its PR, verify required CI, and deliver the PR for a human integration decision.**

Do not require the operator to append commit, push and PR instructions to that feature start. Record the current request as the authorization source and translate its bounded scope into the effective brief and supported callers' actual grants. Configuration and this document supply the workflow meaning, not permission on their own. Preserve the assigned actor, model/effort, access and cumulative cost/attempt limits; a per-call grant does not reset the assignment's budget.

A request to discuss, investigate, prepare a plan, draft PR text or work locally is not a feature start. An issue type, readiness label, saved setup, memory or agent report is not a current operator instruction. Explicit read-only, local-only, no-commit or no-publication limits override the default. Apply it to a bug or another assignment only when the trusted request selects the same delivery workflow. If the intended operation is genuinely ambiguous, clarify that operation once, while continuing independently authorized preparation.

This policy is prospective. Installing or editing it does not retroactively authorize publishing pending work, changing old grants or resuming existing attempts.

## Start from a prepared setup

Setup resolves the stable prerequisites before normal feature execution: selected runtime and host/executor, model/effort and subscription/cost boundaries, finite execution/correction budgets, private stores and supported isolation, exclusive workspace policy, relevant checks, and the delivery repository/remote/base/feature-branch policy. In GitHub mode, the default delivery is a branch PR, not a direct push to the integration branch. Preserve explicitly chosen local delivery and project restrictions rather than silently switching tracking or destination.

Do not insert a fresh setup interview or generic execution-approval gate before every feature. Reuse verified choices and current evidence. If a required stable choice was never settled, reconcile setup and expose that real gap instead of calling setup complete. Legacy projects without these choices need a one-time reconciliation, not guessed values or a second active state root.

Preflight remains mandatory where the caller requires it. Expired credentials, an unavailable model, unknown actor state, exhausted capacity, a dirty/conflicting checkout or a damaged pin can arise after setup. Retain the safe refusal and reconcile within the grant; do not invent readiness or bypass a runtime guard to maintain flow.

## Record the actual reason to wait

Use the existing plan states; do not add a second status store.

| Condition | Recorded state and next action |
| --- | --- |
| Product meaning, scope, acceptance criterion, setup choice or uncovered permission needs a person | `awaiting-human`. Record the exact question, affected step, evidence/options, and the answer or grant needed to resume. A definition decision does not require an implementation or delivery artifact first. |
| A technical fact can be investigated within the grant | Continue grounding or implementation; do not turn an investigable fact into a question for the operator. |
| A runtime failure, unavailable resource, unresolved actor state, integration dependency or queued CI prevents progress | `blocked` with the technical cause and exit condition, or retain the appropriate active/review state while observing. Continue independent authorized work. Do not classify waiting alone as a human decision. |
| A check or review demonstrates a defect within the accepted scope | Correct it within the remaining budget, then repeat affected checks and required independent review against the new candidate. Escalate only a real product, permission, capacity or evidence gap. |
| The verified PR is delivered and integration is the next decision | `awaiting-human`, naming the observed PR URL, exact head/base, checks/review, residual risk and integration decision requested. |

For a human wait, put the question in the existing brief or coordinator record and the plan's blocker/next step. In GitHub tracking, use `ready-for-human` only if an existing applicable label-edit grant covers it; a label is not execution status. A technical outage does not authorize a new destination, model, actor, retry budget or installation. When only a person can resolve it, name that specific decision and move the affected work to `awaiting-human` rather than asking for generic approval to continue.

## Drive the work through delivery

1. Ground the desired behavior and prepare a bounded brief. Investigate technical uncertainty and ask only necessary product questions. Select diagnosis, planning, TDD, E2E, security and deeper review proportionately, not as a mandatory pipeline.
2. Resolve exclusive ownership and the configured workspace/base. Assign each actor only its supported operations and current finite grant. The coordinator normally owns Git publication; a sandbox worker or text-only role does not gain Git history, network tools or publication capability from this default.
3. Consume results when available, inspect the actual candidate and effects, run relevant checks, obtain required independent judgment, and address findings within scope. Preparation, a successful process and a passing model response are not delivery. Reconcile cessation and partial work before replacement, preserving cumulative actor budgets.
4. Retain the exact candidate and checks. Create authorized checkpoints on the feature branch, push without force, and use [isswf-pr](../../skills/isswf-pr/SKILL.md) for the scoped PR with mandatory risk and verification evidence. A delivery helper may remain prepare-only; the coordinator consumes its result and performs the covered next step rather than pausing for another publication permission.
5. Read back repository, target base, actual head, URL and state after remote writes. Observe required CI on the exact head, diagnose relevant failures and repeat affected checks after changes. Preserve uncertain external outcomes and reconcile before retrying. Do not claim a published PR or green CI from a draft, a local path or an earlier head.
6. Deliver the verified PR and record the concrete human integration decision. Keep technical closure, PR publication, product acceptance and integration distinct. A PR that still has a required technical blocker is not ready merely because it exists.

## Stop before integrating into main

The default ends at the PR, not at integration. Do not merge, squash, rebase into the integration branch, push directly to it, arm auto-merge or a merge queue, or treat passing CI as human acceptance. Release publication, deployment, privileged setting changes and destructive actions are outside this default too.

A separate explicit human decision for the particular integration and candidate is required before taking an integration action. Preserve server-enforced protections and exact-head checks; setup preferences or a prior feature start cannot replace that decision.

Closing a session, a tool interruption or a reboot does not imply completion or automatic recovery. Resume through the existing reconciliation rules and retained records. The coordinator remains responsible for the next bounded action; it does not promise execution while its session is absent.
