# I0038: Version notice, confirmed update and safe cleanup of old isSWF versions

Type: enhancement

## Objective and authority

The operator learns when a newer isSWF version is installed, updates through `isswf-setup` with confirmation, and old versions that nothing uses are removed on update instead of accumulating. Operator request 2026-11-08 ("Ok gran propuesta!") accepting the proposal: coordinator notice without changes, setup update with confirmation, and cleanup limited to unused versions. Preparation only: no job starts without an explicit operator start.

## Decisions

- confirmed by operator: never update a project silently; the coordinator only notifies (`AGENTS.md`: an update must not silently change a project's pin, model choices or active work).
- confirmed by operator: `isswf-setup` updates only after confirmation and only without active jobs; it removes versions no known project uses, always keeping the immediately previous one, and shows the list before deleting.
- assumption: projects set up before the usage registry exists are unknown; the first cleanup treats them as in use or asks.
- Grounding finding (coordinator, 2026-11-08): two version locations exist. The native path runs the Pi package / Claude plugin installed by the host manager (per user, not per project); the legacy CLI runtime uses the private store `~/.local/share/isswf` with a per-project pin (`docs/installation.md:88`, `:178`). Where old native versions live per host and OS is not yet established, so J001 grounds it before any deletion design.
- Supersedes the retention item in `docs/en/future-actions.md` "Maintenance" (removed).

## J001

- Status: in-progress
- Objective: Map where installed isSWF versions live and how the running version is identified, per host (Pi, Claude Code) and OS (Linux, Windows), native and legacy paths.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None for read-only grounding.
- Next step: Dispatch read-only researcher; consume results before designing version notice/update/cleanup.

### Acceptance

- For each host and OS: the location of installed and retained versions, how to read the running version and the latest installed version without provider calls, and which removals the host's own manager supports.
- Each claim cites a code path, official host documentation or an observed local listing; unverified Windows facts are marked unverified.
- A recommendation of what isSWF may safely delete itself versus delegate to the host manager.

## J002

- Status: pending
- Objective: The coordinator notifies once per session when a newer isSWF version is installed than the one running, without changing anything.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: Depends on J001.
- Next step: Refine the brief from J001 findings.

### Acceptance

- At its first activation in a session, the coordinator reports in one line the running and the newest installed version when they differ, and suggests `isswf-setup`; nothing is updated or deleted.
- No provider or network call; a missing or unreadable version source is reported as unknown, never as up to date.
- Works for Pi and Claude Code on Linux and Windows, with shared evidence where the behavior is shared.

## J003

- Status: pending
- Objective: `isswf-setup` updates with confirmation and removes only versions that no known project uses, keeping the immediately previous one.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J003/brief-r1.md)
- Blocker: Depends on J001.
- Next step: Refine the brief from J001 findings.

### Acceptance

- Update is proposed, not applied, while any job is in progress; with no active jobs it applies only after operator confirmation.
- A usage registry records which project uses which version; setup refreshes it on every run.
- Cleanup lists candidate versions and deletes only after confirmation, never the running, a registered-in-use or the immediately previous version; unknown projects block or ask.
- Deletion uses the host manager where it owns the version; isSWF deletes only what it installed itself.
- Tests cover a version in use, the previous version, an unknown project and a refused confirmation, on Linux and Windows CI.

## Current execution grant and J001 handoff

Operator current explicit start: after #247 and #222, implement I0038, then I0009/J030. #247 integrated807ee2782141eaf543a0ce6b9941b7577880f8d6. #222 PR249 headf60960f058b700c9d92ce286c8a6ac18ca1f639d independently PASS/LOW, exact-head CI42685652831 in progress. J001 read-only grounding is independent safe preparation while that technical wait runs; no installation/update/removal or version feature writer starts before reconciliation.

This execution supplement supersedes historical prepare-only authority in J001 brief-r1, without changing its source questions/acceptance. Actual current base807ee2782141eaf543a0ce6b9941b7577880f8d6; branch feat/i0038-version-maintenance. Target/trusted factory /home/iseoane/Work/isSWF. Researcher uses approved openai-codex/gpt-6-luna high, current project override; one read-only researcher call, 25-minute bound, no nested delegation/provider probes/installations/mutations/remote machine access/secrets. Official public documentation and local host code/listings only; do not read auth/settings secrets or transcripts. Return durable A001 report via bound output. Remaining writers/reviews need per-unit finite allocation at dispatch, no implicit retries or unlimited actors. Verification-principles selected: cite code/path/current host/version or official source; mark Linux observation versus Windows verified/unverified. Researcher profile selected; no design yet. Any unavailable route remains an explicit unknown, not guessed safe deletion.

Compact #222 handoff: canonical I0040 plan/brief and V001/V002 retained in PR249. Candidate63ba4c71dbe5bfc317df22841486e80b1d5e6df3 reviewed, final publication headf60960f058b700c9d92ce286c8a6ac18ca1f639d record-only delta. Budgets spent worker1+correction1/2, reviews2/3; no active actors. F001 resolved, Windows real-host proof deferred by explicit operator, CI does not replace live proof. Next read-only CI observation on researcher completion; merge #249 only if all exact-head gates pass, then reconcile local branch with integration before I0038 writers. No global cleanup/install/release grant. Existing I0038 per-operation update/deletion confirmations remain binding.
