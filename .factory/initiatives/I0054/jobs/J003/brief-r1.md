# I0054/J003 r1: Resume after the usage window resets (prepared, not started)

Grounding (2026-11-13): `$.session.usage()` returns `rateLimits` with `kind` (`five_hour`, `seven_day`, ...), `percentUsed` and optional `resetsAt` (ISO). No hook reports a quota stop, so the pane's existing 60 s fallback timer checks the threshold (90%). `$.clock.after` schedules within the session; `$.prompt.submit({ text })` sends the resume prompt. "Work in progress" = an initiative touched or pinned in this session with a job `in-progress` in the snapshot. The resume prompt is data for the coordinator, not a grant: it asks to reconcile state (isswf-status, open PRs) first.
Limits: session-only; a missing `resetsAt` schedules nothing and says so in the pane.
Checks: `claude plugin test` with a mocked clock and usage, check-docs, Linux+Windows CI; bound review.
