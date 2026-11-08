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

- Status: pending
- Objective: Map where installed isSWF versions live and how the running version is identified, per host (Pi, Claude Code) and OS (Linux, Windows), native and legacy paths.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: Awaiting an explicit operator start instruction.
- Next step: Operator start decision.

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
