# I0001 / J009 / r2

## Objective

Extend the delivered readonly panel with one project landing page listing initiatives and navigation into and back from each initiative Kanban. Do not require a server per initiative.

## Inputs and authority

Operator explicitly requested continuing J009 after approving project-wide initiative navigation. Source base e2cf2c01033a5197e0dfdb844b7e7b4095d781d8. Parent implements local/offline tests. No new model/provider grant, dependency installation, global service or runtime mutation.

## Acceptance for this cut

- One foreground project-scoped loopback server opens a landing page with canonical initiative labels, declared progress and blockers, and links to each Kanban.
- Navigating to an initiative preserves existing job details and evidence cards; a visible link returns to the initiative list.
- Discovery is bounded and restricted to safe canonical initiative directories. Missing, invalid and unsafe records remain explicit, not silently interpreted as completed or empty progress.
- Initiative selection never chooses another project or serves arbitrary files. Existing Host, Origin, GET-only, escape and response-size boundaries remain.
- Actual HTTP tests cover two initiatives, navigation, invalid input, unsafe/missing records, escaping and unchanged project bytes. Inspect the actual page in Chromium.

## Limits

Readonly reported-record view only. No accept/edit/dispatch/model/GitHub endpoints, runtime liveness, automatic dependency satisfaction or full J009 completion. Existing accepted jobs and first-cut evidence remain unchanged.

## Checks and integration

Public regressions, portable quality, ESLint and Knip; one independent final review, English PR, exact-head CI green before authorized guarded merge.
