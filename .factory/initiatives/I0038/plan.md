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

- Status: completed
- Objective: Map where installed isSWF versions live and how the running version is identified, per host (Pi, Claude Code) and OS (Linux, Windows), native and legacy paths.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None; Windows observations remain explicitly unverified.
- Next step: Implement bounded J002 advisory from verified loaded/local identities; resolve J003 host-owned retention constraints separately.

### Acceptance

- For each host and OS: the location of installed and retained versions, how to read the running version and the latest installed version without provider calls, and which removals the host's own manager supports.
- Each claim cites a code path, official host documentation or an observed local listing; unverified Windows facts are marked unverified.
- A recommendation of what isSWF may safely delete itself versus delegate to the host manager.

### Evidence

- Coordinator A002 records all host/version questions with code/official sources, Linux observations and explicit Windows unknowns; researcher A001 unavailable-tools result preserved.

## J002

- Status: in-progress
- Objective: The coordinator notifies once per session when a newer isSWF version is installed than the one running, without changing anything.
- Depends on: J001
- Brief: [brief-r2.md](jobs/J002/brief-r2.md)
- Blocker: None for bounded advisory work.
- Next step: Worker implements J002 with unknown/unsupported cases explicit.

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

## Grounding reconciliation and J002 grant

Researcher3b450d07-299b-4928-b94c-25d2e27ef4e8 terminal complete, A001 BLOCKED missing Git tools, no conclusions. Coordinator independently investigated without extra researcher call; A002 records source-backed answers and unsupported retention guarantee. J001 source-grounding complete with Windows unknowns explicitly permitted by acceptance. Initial assumption of common old-version directories disproved: Pi in-place manager and Claude aging require host-specific refusal; do not implement broad deletion. J002 is independent, read-only advisory. J003 previous-version retention has unresolved feasibility, not permission to silently narrow.

J002 finite grant: one worker + up to two correction continuations, three independent reviews (six calls max), sequential checkout, 25min per actor. Approved worker gpt-6-luna high, reviewer gpt-6.1-sol medium; no paid API/install/update/delete or new model probes. Coordinator owns publication, LOW expected-head integration after exact gates. Writing + security + verification selected; design principles selected for loaded/installed identity contract. Existing static checks do not prove live host parity; combined independent semantic review. No TDD for wording-only change unless a real executable behavioral seam is selected and RED/GREEN budgeted before code. Source checkout must remain distinct from installed release. Current implementation target reconciles #222 merge before writer starts.

Plan parser correction: initial J001 completion receipt omitted the required Evidence heading; status returned unknown and completion was not accepted. Fixed heading and revalidated before dispatch; no worker started from invalid plan.

## J002 first attempt reconciliation

Workerf1394e99-0ecb-4e87-b58d-546088d5f24c reports BLOCKED with no implementation: mutable on-disk manifest/registration is not frozen loaded resource identity. A001 retained, no claim of version comparison. Its report timestamp conflicts with actual session date; rely on native terminal/status evidence, not reported date. The missing identity is a technical design fact, not a question for operator by default.

Reclassify implementation approach before next call: investigate explicit version/provenance carried in the loaded coordinator skill text (release-time stamped/literal identity with consistency check), captured on first activation, versus rereading mutable current package.json. This could supply the missing input under existing supported skill loading without new host APIs or callbacks. It is a proposed technical route, not verified support; validate against actual Pi/Claude skill contracts and package receipt/source-byte guarantees before editing. Preserve source-checkout unknown treatment and no live model claims. Do not build runtime dispatcher, cache scanner or session store to simulate it. If infeasible, return exact contradiction and no writer implementation. Same accepted objective remains; no product narrowing.

Allocate worker continuation1/2 within J002's existing budget to resolve this concrete technical seam and implement only if source-backed. No extra actor, provider call/install or budget reset; independent reviews0/3. Frozen plan after this checkpoint. Prior attempt incomplete remains visible.
