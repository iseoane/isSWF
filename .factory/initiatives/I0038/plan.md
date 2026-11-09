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

- Status: in-review
- Objective: The coordinator notifies once per session when a newer isSWF version is installed than the one running, without changing anything.
- Depends on: J001
- Brief: [brief-r4.md](jobs/J002/brief-r4.md)
- Blocker: None for explicitly approved fresh worker; repository tool preflight required before edits.
- Next step: Fresh worker implements r4 informational semantics after read/bash preflight; independent review3, with expressly approved review4 available if needed.

### Acceptance

- At its first activation in a session, the coordinator reports in one line the running and the newest host-visible user/current-project installed version when they differ, and suggests `isswf-setup`; nothing is updated or deleted.
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

## J002 candidate and review round 1

Worker continuation3eff876e-2e1d-4624-9e61-6aea7a42037e terminal complete observed; A002 consumed fully. Candidate6a21db64b2d5631375e80a7372d3375ae393d6fe carries loaded skill version literal1.8.2 plus manager-root provenance checks and instruction-only advisory. No live host compliance claimed. Coordinator confirmed installed/source package number1.8.2 on explicit user discussion; subsequent "nO'" reply has unclear referent, no inferred product change or stop; clarification pending, do not use it to change accepted version/source semantics.

Worker selected TDD for cheap metadata/source invariant only, RED72a1c3f65500f6931e7076235a3fce42c2c44706 tests-only; GREEN6a21db64b2d5631375e80a7372d3375ae393d6fe changes coordinator skill only. Coordinator replayed host-portability from exact archived RED: exit1 expected Coordinator skill must carry its release version in loaded text; exact GREEN overlay (sole delta skill) PASS. Fixture retained /tmp/isswf-j002-red-green-I52NqF, logs retained; source commit identities reconstruct it. Worker release-package RED/GREEN and full quality evidence attributed, not coordinator rerun. Coordinator current focused/docs/whitespace PASS. No runtime newer/same/older tests claimed; these are semantic instruction walkthroughs.

Allocate combined independent semantic/static review1/3, no prior J002 reviews, REVIEW.md absent. Specific risks: literal maintenance/release coupling, manager Git/root provenance, first-load text versus reread, configured inventory versus installed release, once/session marker under compaction and unknown source handling. Static tests prove metadata/receipt invariant only; do not equate it to actual host/model adherence. Reviewer must decide whether accepted advisory is genuinely supported or merely always-unknown. Budget one worker + continuation1/2, review1/3 allocated, no active writer; freeze plan until review stops. No publication until required judgment/gates pass.

## J002 V001 adverse result and bounded product question

Reviewer9b7d21da-2915-4620-b1bf-0b07c7f29cc3 terminal complete observed; full V001 consumed. Standards FAIL, Spec FAIL, risk MEDIUM, introduced blocking F001/F002. F001 accepted technical fix: managed Git root/package number do not prove release provenance; require supported local release evidence or unknown for both running/candidate. F002 accepted: pi list inventories current user/project, not other projects' local installations; cannot claim global newest installed from visible subset. No new call dispatched; budget worker1+continuation1/2, review1/3, remaining continuation1 and reviews2. No active actors. REVIEW.md discrepancy: reviewer found readable file contrary to coordinator's earlier absence; inspect actual current file before next review, preserve finding provenance.

Exact product question: Should the advisory compare only host-visible user/current-project installations (recommended bounded option), or all installations across projects on this machine (requires explicit project inventory/registry with unknown-project treatment, not arbitrary disk scanning)? Resume condition: explicit choice recorded, refine accepted scope/brief revision before last worker continuation; never silently narrow global newest claim. J003 registry/host-retention feasibility remains open independently; no update/delete done. Prior user ambiguous nO remains uninterpreted, not a permission change. Candidate not publishable as J002 complete.

## Accepted J002 inventory scope revision

Current operator "si" explicitly accepts coordinator recommendation to compare only installations visible to the host/user/current project, without machine-wide scanning. Material J002 acceptance revision: advisory says newest within that bounded inventory, never global newest installed. Source provenance separation remains binding. Preserve all prior FAIL/BLOCKED records; this decision does not resolve findings by itself. Brief-r3 supersedes r2 for final worker continuation2/2; review1/3 consumed, two independent reviews remain. No new actors, retries or budget reset. REVIEW.md read in full by coordinator at current checkout: person-required paths include host boundaries and packaging code. Current J002 repair must stay in skill/tests and records; if it touches listed paths record person gate rather than infer LOW merge permission overrides it. Prior source-root absence statements remain historical errors, not current evidence.

## A003 partial candidate reconciliation

Continuatione917e7c5-d4d7-4a6c-9d4f-d06d07bc9aff terminal complete observed. A003 consumed fully: BLOCKED, no final commit/checks from continuation; uncommitted skill wording retained and inspected by coordinator. F001/F002 addressed only as author claim, not closed. Coordinator focused host-portability/docs/whitespace PASS on partial wording. No new implementation edits by coordinator. Archive this partial candidate and perform committed-source packaging checks plus independent delta review within remaining review budget, not a replacement worker or extra correction. Last worker continuation2/2 consumed; reviews1/3 consumed, round2 allocated. No active writer.

Known review focus: trusted verifier bootstrap and return types (verifyPackage returns root path, not version object); source-activation receipt vs full release receipt; retained loaded text vs current receipt identity; bounded inventory and unknown fallbacks. No new supported route may be invented. V001 adverse verdicts remain until independently resolved. If blocking findings remain after this review, exhausted correction budget requires a concrete operator decision before further edits/calls; do not substitute coordinator implementation or reset counts.

## V002 result and required reconsideration

Reviewerabda8f7f-4dca-4bdd-abfe-6407588380d5 terminal complete observed; V002 fully consumed. Standards/Spec FAIL, MEDIUM risk. F002 RESOLVED against approved bounded inventory; F001 OPEN/CHANGED: verifyPackage returns path and its source-integrity receipt has no release version, so source-materialization alternative is not the advertised release-verification route. F003 information: independently trusted verifier bootstrap not established for ordinary host installations. Full quality PASS does not close semantic failure. V001 FAIL, A003 BLOCKED retained. Budgets spent worker1+continuations2/2, reviews2/3, one review remains; no active actors. No further correction/call authorized automatically.

Decision package: recommendation is an explicitly informational installed-package version advisory (including manager-installed Git packages), not certification of published-release identity. Preserve source-checkout exclusion, loaded-text capture, bounded manager inventory, unknown inputs, no candidate execution/install/update/delete; distinguish trusted managed installation metadata from publication authenticity rather than equate the two. This changes accepted provenance interpretation and requires operator decision; not yet adopted. Alternative retain full-release-only support, explicitly unknown for ordinary Git/source resources, with independently trusted verifier route still to ground. Ask whether to select informational installed-package semantics and allow exactly one extra correction continuation (25min) plus the remaining independent review; preserve cumulative counts, no reset. No new helper/runtime architecture proposed, no publication while failed.

## Explicit extra cycle and informational version decision

Current operator "adelante!" approves the immediately preceding decision package: informational version of the package installed by the host manager, including managed Git installations, not certification that a version is a published release. Development/source overrides remain excluded; no execution of package code or receipt verifier for advisory. Visible host/user/current-project inventory only. This supersedes full-release receipt provenance as a prerequisite for this advisory, not any release/install/authority contract elsewhere. Publication/authenticity must not be claimed from manager metadata. Loaded-version capture, missing/ambiguous=>unknown and no mutation/network/provider remain binding.

Exactly one additional correction continuation3 authorized,25min, same existing worker context/model gpt-6-luna high; remaining independent review3/3 available,25min gpt-6.1-sol medium. Cumulative worker initial1 + continuations2 already spent, reviews2 spent; no reset, no extra actors/nested delegates/installations/paid calls. Prior F001 open/V001,V002 FAIL/A003 BLOCKED remain history until new candidate verdict. Replan bounded wording/test repair only; fourth material acceptance revision not permitted without reconsideration. This decision resolves the explicit source versus installed-package scope, does not authorize runtime scanners/host wrappers.

## A004 unavailable-tool execution boundary

Run54b51aae-da27-49e0-800a-b6657bd11ce7 terminal complete observed. Full A004 consumed: no repository tools/access, required resources not read, no commands/changes; informational revision r4 not implemented. Native run state is complete but task outcome BLOCKED, not successful implementation. Current git status confirms only A004 report untracked, no source edits after34570998bb97dc272d3acbbebde5527e058c0044. Prior A003/FAILs retained; A004's stale uncommitted-work recollection superseded by coordinator's current clean-source observation. Cause of unavailable child tools not established; do not label harness root cause without trace evidence.

Cumulative correction extensions spent3 (original2 plus explicit additional1); reviews2/3 spent, one remaining. No active actors. No automatic resume/replacement, no alternate launcher or coordinator implementation bypass. Request specific extension: one fresh isswf-worker execution using approved existing native mechanism/model, preflight actual read/bash tool mapping first,25min max; remaining independent review unchanged. Preserve installed-package semantics user already approved; no repeated product question needed. Technical blockage does not authorize publication or merge of failed candidate.

## Explicit fresh-worker and extra-review extension

Current operator: "si, y otra ronda extra que creo que vas a necesitar por el cambio de enfoque." Approves one FRESH isswf-worker call after A004 no-tool result and adds one review round, total4 (2 consumed,2 remaining). Preserve initial worker1+continuations3 consumed, including failed/unavailable A004; fresh worker is one additional actor/call, not a reset. No further correction actor/call granted implicitly. Fresh worker25min gpt-6-luna high, reviews25min gpt-6.1-sol medium; no paid APIs/model substitutions/nested delegation/installations. Existing informational host-visible package semantics of brief-r4 remain approved, not a new product question.

Zero-model native agent get confirmed project profile .agents/hosts/pi/agents/isswf-worker.md resolves read,bash,edit,write and gpt-6-luna/high. This is declared mapping, not proof of child runtime availability; fresh worker must first perform actual read of canonical role and bash pwd/git status, report immediately if missing, no unsupported launcher substitution. Previous no-tool cause remains unconfirmed. No active actors at this checkpoint, checkout clean before coordinator receipt. Inputs freeze after checkpoint. Required reports A005, then review V003 on exact retained candidate; V004 available for affected extra judgment but no automatic correction beyond current fresh actor.

## A005 complete and review3 allocation

Fresh workerc32d3bbd-010a-4b32-a91c-94fe10c3a9df terminal complete observed. Full A005 consumed: actual read/bash preflight passed; one skill wording repair uncommitted. Coordinator inspected exact diff and reran host-portability/docs/whitespace PASS. Worker full quality ran while source uncommitted, so committed-source artifact portion tested previous HEAD, not new skill; coordinator commits new candidate then reruns full suite before claiming exact-candidate packaging PASS. No false retroactive worker/trace claim: A005 consumption is author self-report, not independently host-trace verified.

Revised informational semantics remove receipt/helper bootstrap and no longer claim publication authenticity, preserve root/actual installed identity and source overrides; loaded literal and bounded inventory/unknown remain. V001/V002 FAIL and A003/A004 BLOCKED preserved; F001 still awaits independent disposition. REVIEW.md present and applied. Round3/4 allocated, no other calls; worker initial1+continuations3+fresh1 consumed, no active writers. Review4 remains only if affected additional judgment is useful; no new correction actor automatically granted. No publication before judgment/gates.
