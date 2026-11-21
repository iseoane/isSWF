# Attempt report

> Link the brief, plan and earlier reports for scope, authorization, budgets, identities and limits that are unchanged; record here only what this step changed, observed or decided. Restate a fact only when this record must stand alone for an independent reader or a recovery, and then say which source it comes from. Always fill the identity, base/candidate and pinned-input fields below with exact values, never a link in their place. Write each `Run:` line as plain text without backticks, one per host launch, as docs/durable-work.md defines under Record the launch identity, and delete the line when the ID is unknown. Fill `Review round` only for a correction after a review of the same brief, with that brief's next round (its first review is round 1); otherwise delete the line.

## Identity and pinned inputs

- Job ID and attempt ID:
- Review round:
- Run: claude agent=<id>
- Reported status:
- Report timestamp and timezone:
- Brief path, revision, and input checkpoint (full Git SHA):
- Initiative spec path and revision, if used:
- Plan path and revision, if used:
- Profile path and revision, if available:
- Skills and revisions, if available:
- Method application report: `<for each selected method, state applied/not applied and identify observed evidence; distinguish reading/receipt from application. Cite observer, command/action and result, exact candidate/base and attempt or artifact path when applicable. For each selected TDD behavioral contract, record the full commit IDs of the test-only RED commit and the subsequent GREEN commit, the exact command and the failing assertion (path:line/message); reviewer/coordinator reruns the named command at both commits. A syntax/setup failure is not RED. If an honest RED is impossible, disclose the requirement, reason, and consequence; disclosure does not waive a required method or criterion. Do not claim a retrospective red-first cycle. For TDD, justify each new test in one line: the mistake it catches and why no existing test does. State explicitly when no method was selected>`.
- Retained substitute evidence, when sensitivity/mutation results substitute for missing RED: `<retain the harness and run log in committed tests/ evidence or ignored tooling/.local/<job>/, never only disposable scratch space; link both paths in this attempt/review record, name the archived commit and an unmutated baseline run, injected change and result. Retrospective evidence is not red-first proof>`.
- Required-resource consumption: `<resource → consumed/missing → observed (host trace) or self-reported; a trace proves a read, not understanding or application. Name unreadable required resources explicitly>`.
- Required-reference application map: `<for each required engineering reference, reference → concrete application in candidate (path/line or commit), or not applicable / deliberately not applied → reason. Do not list optional references merely to satisfy a checklist>`.
- Target codebase base (full Git SHA):
- Trusted authorization reference (operator conversation or record ID, or external path; if tracked in Git, full Git SHA):
- Exclusive checkout or worktree:
- Branch:
- Candidate commit SHA:
- Model configuration path and input Git SHA (full SHA):
- Resolved ordered route and selected destination:

## Execution

- Requested model and effort:
- Observed actual model and effort metadata:
- Availability and effort-support evidence:
- Route transitions and reason for each transition:
- Account or subscription alias, only if supplied by the operator:
- Start and end timestamps, if known:
- Status evidence and source:
- Reported status is not proof of process state or liveness.
- Process state, only if directly checked, with time and evidence:

## Technical result

- Outcome: complete, partial, blocked, failed, or cancelled (one value):
- Summary of work and unresolved decisions:
- Changed paths:
- Checks run and observed results: `<each check with its command, result and wall-clock time. A check not run or skipped gives only its reason, never an outcome word ("pass", "fail", "exit N").>`
- Required red/green commit pairs and reviewer reproduction command/results (if TDD selected):
- Deviations from required procedure and consequence: `<your own departures from this assignment's procedure, or None.>`
- Process deviations observed: `<self-reported, not observed evidence. None., or one entry per deviation: a written rule that was not followed, or mechanical data copied by hand that could have been derived, by another actor (the coordinator's handoff included) or by you. Your own departures from this assignment's procedure belong only in the field above; never list one incident in both fields.>`
- Resulting artifact paths and checkpoint or commit references:
- Risks, limits, and next action:

## Product acceptance

- Status at return: pending.
- Current operator decision and evidence: recorded by the coordinator in the canonical plan at <path/recordID>.

The worker reports the technical result and does not accept its own work. The coordinator records the operator's product-acceptance decision and evidence in the canonical plan. The worker-owned attempt report remains unchanged.
