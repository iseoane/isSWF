# I0024: Asynchronous coordination and available conversation

Type: enhancement

## Objective and boundaries

Keep the coordinator available to the operator while agents, CI or other long operations are pending, without unnecessary model consumption or weakened authorization and verification. Scope includes native Pi and Claude Code on Linux and Windows, nonblocking delegation/waits, safe resumption, interruption recovery and truthful activity reporting. Exclude another dispatcher, a permanent service, unlimited parallelism, a second state store or expanded integration/publication/installation permissions.

## Provenance and authority

Recovered from the actual isSWF Pi conversation dated 2026-11-01, session `01a1936b-7639-777e-852b-401b5d6ddec8`, following the operator question “Como mejoramos la isswf para que el coordinador no se quede esperando todo de forma sincronía?”. The final four-job proposal was titled “Iniciativa: coordinación asíncrona y conversación disponible”. The prior assistant explicitly reported that it had saved neither files nor Engram memory. Engram observation 4285 corroborates the responsiveness preference, but is not the full plan or execution authority. This is an English transcription of that proposal into canonical records, not a claim that it was already implemented or approved for execution.

Initial registration was prepare-only. Superseding current operator instruction: “Coordinador una vez que esté registrado, atacalo, si se puede paralelizar hazlo, y ya sabes riesgos bajos integralo sin preguntar”. This explicitly starts I0024 through implementation, checks, independent review, coordinator-owned feature commits/push/PR and exact-head CI in iseoane/isSWF targeting main. Normal protected expected-head integration is authorized only for independently assessed LOW risk with required review/CI passing; MEDIUM/HIGH/unknown risk remains awaiting-human. No direct-main push, bypass, release, installation, deployment or cleanup.

Finite cumulative assignment ceiling: two initial read-only researchers (Pi and Claude seams, gpt-6-luna/high, <=10 minutes each); up to two initial implementation workers (gpt-6-luna/high, <=25 minutes each) and one correction continuation per worker <=10 minutes; up to two independent reviews total on the integrated functional candidate (gpt-6.1-sol/medium, <=15 minutes each). At most two concurrent readers or one writer; no nested delegation, automatic retries, model substitution or paid API use. Use existing Codex subscription route; availability is observed registry/configuration, not a quota guarantee. No budget reset on resumption. Initial local preflight reports no active native runs, four approved roles loaded and exact models available. No disposable checkout needed for read-only parallel grounding. Shared plan/brief ownership stays coordinator-only; freeze before writer launch. This initiative remains separate from any patch release.

## J001

- Status: blocked
- Objective: Verify capabilities and reproduce blocking: Inspect coordinator and both native hosts; reproduce a slow task blocking conversation and select the minimum functional unit.
- Depends on: None
- Brief: [brief-r2.md](jobs/J001/brief-r2.md)
- Blocker: Full live responsiveness reproduction on Claude and Windows is unavailable here; static evidence and Linux Pi dispatch/completion are not equivalent acceptance.
- Next step: Within the current explicit start, verify current host capabilities and agree the minimum functional unit before writer dispatch.

### Acceptance

- Inspect agent, review, CI and publication waits; distinguish host limitations from avoidable flow decisions.
- Retain a bounded reproduction with a slow task and an operator question, identifying actual host/version and observer.
- Record mechanisms, limits and minimum alternatives for Pi and Claude Code on Linux and Windows; unsupported capabilities remain explicit blockers.
- Select a small complete unit, expected benefit versus model/check/CI cost and finite budgets before any writer dispatch.

### Evidence

- Recovered conversation proposal only; no job dispatched, reproduction run, implementation or acceptance evidence.

## J002

- Status: blocked
- Objective: Deliver nonblocking dispatch and waits: Deliver a complete native flow in which the operator can converse while long agent work or CI is pending.
- Depends on: None
- Brief: [brief-r2.md](jobs/J002/brief-r2.md)
- Blocker: Prior dependency and current host/OS feasibility must close with retained evidence before dispatch.
- Next step: Within the current explicit start, consume J001 evidence, reconcile feasibility and budgets, then execute only the authorized scope.

### Acceptance

- Dispatch long tasks asynchronously through supported native mechanisms; report actual launch and expected result, then return the turn.
- Replace blocking CI watches with supported completion notification or a bounded deferred check; no continuous polling, active wait loop or model calls merely to wait.
- Keep short synchronous operations when proportionate; prefer canonical instructions and existing mechanisms, adding code only for demonstrated capability gaps.
- Demonstrate conversation during agent work and CI waits for both hosts and affected operating systems; missing capability blocks the affected outcome.

### Evidence

- Recovered conversation proposal only; no job dispatched, reproduction run, implementation or acceptance evidence.

## J003

- Status: blocked
- Objective: Resume safely after results and interruptions: Resume only the current assignment and candidate without duplicated work or expanded authority.
- Depends on: J002
- Brief: [brief-r2.md](jobs/J003/brief-r2.md)
- Blocker: Prior dependency and current host/OS feasibility must close with retained evidence before dispatch.
- Next step: Within the current explicit start, consume J002 evidence, reconcile feasibility and budgets, then execute only the authorized scope.

### Acceptance

- Bind results to assignment, actor and candidate identities; duplicate, late or stale results trigger reconciliation, not actions.
- Resumption preserves permissions, evidence and cumulative actor/correction/cost budgets; no automatic retries or budget resets.
- Reconcile operator changes and cancellation through supported host mechanisms before continuing affected work; unknown actor state prevents replacement.
- Recover after interruption without duplicate dispatch or remote actions, using minimal existing canonical records rather than another state store.

### Evidence

- Recovered conversation proposal only; no job dispatched, reproduction run, implementation or acceptance evidence.

## J004

- Status: in-progress
- Objective: Verify and document the complete flow: Retain exact-candidate independent review and equivalent host/platform evidence for the complete responsive coordination journey.
- Depends on: J003
- Brief: [brief-r3.md](jobs/J004/brief-r3.md)
- Blocker: Prior dependency and current host/OS feasibility must close with retained evidence before dispatch.
- Next step: Within the current explicit start, consume J003 evidence, reconcile feasibility and budgets, then execute only the authorized scope.

### Acceptance

- Exercise conversation during agent and CI waits, duplicate/stale results, candidate changes, cancellation and interrupted recovery.
- Verify that waiting itself causes no periodic model calls, continuous polling or active-turn requirement; distinguish static walkthroughs, fixtures and live observations.
- Obtain independent Standards and Spec review of the exact retained candidate; preserve adverse/inconclusive findings and rerun affected checks after changes.
- Update canonical agent resources and affected English/Spain-Spanish guides together; report executing, waiting, blocked and finished accurately, never claiming undispatched work is running.
- Retain equivalent Pi/Claude Code and Linux/Windows evidence for accepted outcomes; disclose capability gaps without claiming full acceptance.

### Evidence

- Recovered conversation proposal only; no job dispatched, reproduction run, implementation or acceptance evidence.

## Grounding and bounded re-plan

Two read-only native researchers completed in async workflow 85c95ead-02d8-4491-b681-2065c625c54b (Pi child 9c7c758f-f581-40a7-b7ae-7774c6016351; Claude child 1ee32c4c-9465-4b5e-b4d5-b335a76d7811). Coordinator consumed both full returned artifacts. Researchers wrote no files; resource consumption is self-reported. Pi source/docs confirm native async dispatch, completion notifications and retained identities. The current Pi host guide explicitly recommends normal foreground async:false. Claude researcher lacked command tools, so coordinator ran local claude --version/--help: 2.1.312; help documents background sessions, which do not alone establish Agent subagent background behavior. Coordinator fetched official https://code.claude.com/docs/en/sub-agents.md, specifically Run subagents in foreground or background and Resume subagents: background concurrent work and completion notifications are documented, subject to effective version/configuration/permissions; this is upstream documentation, not a live local Claude or Windows proof. No Claude model called.

Initial assumption: all phases must wait for complete J001 live reproduction. Observed: independent shared instruction correction is possible now, but full live acceptance is not. Re-plan before writer start: J002 has no closure dependency on J001 and may implement the already-grounded instruction outcome, including safe-resumption instructions from J003 in the same coherent candidate to avoid overlapping shared writers. J001 and all original live/OS criteria remain blocked/pending; no acceptance is removed or waived. J003/J004 consume the source candidate and cannot claim full technical closure without their required evidence. This is a single pre-writer scope reconciliation, not a budget reset or permission for a new notifier/dispatcher.

Implementation seam: canonical coordinator responsiveness and identity/authority rules; Pi native async/output/stop/resume distinctions; Claude capability-conditioned native background guidance without invented APIs; bounded non-model CI observation and exact-head validation; existing host contract tests and affected bilingual guides. Prefer instructions to code: no runtime capability gap demonstrated, no scheduler/store/adapter justified. Benefit: removes an avoidable foreground-default instruction without extra actors merely to wait. Costs: one initial worker <=25min and required independent review, focused static checks; full live-host verification remains separate visible evidence need.

## Source candidate (not full initiative acceptance)

Worker run d5ac8093-7644-401a-8fcf-b82ce1fa7f45 completed and bound report consumed, candidate a98cb508fcf8c183c194cd724fb663bf95fc651d. Seven functional files implement responsive coordination instructions and static assertions; author focused checks pass. Original live acceptance gaps remain: conversation during Pi agent/CI waits; cancellation/recovery; live Claude native Agent behavior and Windows equivalence. No closure or LOW-risk integration claim. J002 source review in progress does not satisfy these criteria. Budget consumed: two researchers, one initial worker; zero corrective continuations, zero reviewers before next dispatch. Pre-existing .pi/subagents is untracked and preserved.

## Independent R1 and correction boundary

Independent reviewer f29bd1ed-1fe9-4237-9e0f-19d9f528d34e completed; coordinator consumed full report and retained it unchanged as jobs/J002/V001.md (reviewer-authored native output, coordinator transcription). Exact reviewed candidate c1d93cc3a04d5b9d945a8c5b193aac51edc41cc6, verified patch digest c61230170aa65169f1c073cd6299fcb223ca3a953dcf341db6f3c8e0d40960f5. Source Standards INCONCLUSIVE, Spec FAIL, aggregate FAIL; full initiative BLOCKED, risk MEDIUM. Findings: missing Pi live-steer/eligible-resume branch, missing explicit author consumption/application evidence for human-documents/code-quality/comments, and original missing live/OS evidence. Suggest consolidate generic CI rules and correct stale foreground navigation. Removed continuity sentence is retained adequately by the linked feature-delivery contract; no demonstrated regression there.

Coordinator exact-head c1d93cc bounded gates finished: portable quality, locked ESLint, Knip and diff all exit0; logs tooling/.local/i0024/{quality,eslint,knip,diff}.log and gates.status. These are source/static/artifact checks, not missing live acceptance. Correction allocation: resume same original worker once <=10min, bundle R1 findings, truthfully distinguish previous versus newly consumed methodology, retain live blockers. One independent review round consumed; one remains. No integration permitted while R1 fail/MEDIUM or original full acceptance blockers persist.

## Corrected source disposition and current blockers

Same author completed its single corrective continuation31006c61-d15e-473f-9767-6ba6632b8f3f, candidate e3e557145521079486e4095a5ab8bad42a7961e5. Correction adds Pi live-steer versus eligible-ceased-resume branches, static assertions, canonical generic CI links and accurate native delegation navigation. Initial required human-documents/code-quality/comments reads were omitted; author truthfully disclosed this, consumed them during correction and mapped current application. Initial deviation is preserved, not retroactively cured.

Final independent reviewer e22f56d0-7cad-4ada-8349-7e8f72223080 assessed exact e3e5571 against57439126: source Standards PASS, Spec PASS, aggregate PASS; full initiative INCONCLUSIVE/BLOCKED, risk MEDIUM. Full report retained unchanged in jobs/J002/V002.md by coordinator after consuming reviewer output. R1 remains adverse in V001. Coordinator full gates on exact e3 source all exit0: portable quality, locked ESLint, Knip and diff, logs tooling/.local/i0024/correction. No live-host acceptance is implied.

All original live acceptance gates remain: Pi operator conversation while agent and CI work pending, cancellation/interruption/recovery and stale/duplicate/candidate-change observations, real Claude native Agent background completion/results with verified effective permissions, equivalent Windows outcomes. No appropriately verified live Claude or Windows host is available through this Pi session; installation, host switching, alternate dispatcher or extra model calls are not authorized substitutes. Current Pi native async dispatch, notifications and one same-context resume were observed during actual work, but are not a controlled full operator-conversation/CI/recovery probe. Keep J001-J004 blocked for their unmet criteria. J002/J003 source instructions are verified, not full functional acceptance.

Budget consumed: two researchers, one initial worker, its one correction and both independent review rounds. No reviewers remain under the current finite ceiling. One second initial worker allowance is unused, but cannot supply missing Claude/Windows host capability or reset review budget. No active model writer/reviewer remains after final completion. Next authorized action is coordinator-owned draft PR publication and exact-head CI observation; no integration under current MEDIUM classification and unresolved acceptance. Reopen execution only for a concrete supported live probe within remaining authority; do not ask for generic approval or relabel this as LOW. No release, deployment, installation or cleanup.

## Staged integration and verification continuation

Current operator explicitly selected integration because complete live tests are scheduled later in J004; that concrete MEDIUM-risk decision supersedes the earlier LOW-only integration restriction for PR138, not for other work. PR138 merged normally with expected-head d85cbb7a4ecd85980d10ec508ef3c0a22ecb923a as main7b6828cddaa7a8d1b5f04b31151d953195a0b06e. Exact-head CI41291801696 SUCCESS3/3. Six Linux/Windows reports inspected PASS on synthetic09fea087 (parents57439126,d85cbb7), tree43c989f9609e7cc249567ec569781dcef8e309b0 equal head and actual merge. External durable receipt https://github.com/iseoane/isSWF/pull/138#issuecomment-6555985862 records these later observations without rewriting reviewed source. Full acceptance is not inferred.

Current explicit continuation: “Coordinador continuas con el resto de la iniciativa?”. Continue J003 verification and J004 journeys; their evidence may be collected together after the integrated instruction baseline, while original closure criteria remain unchanged. Earlier r1 prepare-only brief text is historical; r2 below supplies current scope and budget. This continuation does not reset consumed actors or reviews. One unused second initial worker (luna/high <=25min) is allocated verification-only; no production/test/CI code changes or new review calls. It can run existing offline native checks, audit actual prior session observations and report the smallest unsupported journey. No child network/model calls, paid API, nested delegation, host switching or installations. Coordinator owns records and future feature-branch publication. Current native tool status reports no active actors; checkout is tracked-clean except private .pi/subagents. Available disk4.3GiB /tmp,84GiB source volume; verification fixture budget512MiB, one copy, no automatic deletion.

Current evidence boundary: tests/host-native-delegation.mjs invokes real Pi SDK/extension with a loopback synthetic provider, explicit async:false and synthetic foreground cancellation; it does not cover background conversation, live Claude or Windows execution. Its locked dependency subagent bundle is absent here, but installed pi-subagents bundle is present and may be explicitly supplied via supported ISSWF_PI_SUBAGENTS override after verifying version0.83.0; missing/broken prerequisites must remain BLOCKED/FAIL. No installation inferred. Previously retained actual native async run/completion/resume and operator question while reviewer running may supply narrow opportunistic Pi observations, not all recovery/CI criteria. Worker must attribute what can actually be verified; not invent controlled reproduction or retain private transcripts. Full accepted Claude-native/Windows/live journey remains blocked until the actual corresponding supported host is available. Do not spend a model call to wait or invent a substitute dispatcher.

## Verification run and exact remaining blocker

Second initial worker6e4016b6 completed, full bound report consumed; curated J004/A001.md records actual existing-suite result. Pi Linux SDK1.4.0/subagents0.83.0 PASS11/11 offline cases,16 synthetic requests,0 real-provider requests inside the fixture, single attempt. Static portability PASS. No source/test/settings changes. Native fixture confirms foreground synthetic cancellation/refusal and bound evidence, not missing background/live cross-host acceptance.

Original full criteria remain unfulfilled. Current assignment model budget is exhausted: two initial workers consumed, first-worker correction consumed, two researchers and two reviews consumed. No new dispatch or review without a concrete additional allowance. Current host lacks a supported native Claude Agent session interface and Windows execution access; installed Claude executable/help and CI discovery are not substitutes. Ask only for supported actual host access and finite remaining native-probe/review capacity; do not ask for generic continuation or pretend another existing synchronous fixture will fill those gaps. Source unit remains integrated via PR138; whole initiative not accepted. No automatic retries, host replacement, installation or source changes.

## Environment-independent temporary probes

Operator explicitly forbids permanent E2E tests tied to this workstation and authorizes temporary verification instead. No environment-bound test or CI dependency has been added. Coordinator located and authenticated the existing Omarchy noVNC console, reached the real Windows desktop and observed PowerShell read-only OS/prerequisite output. See J004/A002.md for actual results, initial failed/inconclusive driver observations and scope. This supersedes earlier unverified claims that Windows itself was inaccessible: the guest is reachable; node/npm/git/pi/claude did not resolve on its current PATH. No installation, credential retention, Docker escalation or VM configuration change. No additional model actor dispatched.

Current blocker is concrete: explicit permission for temporary guest-tool download/setup and finite additional native live-probe capacity, not 'no Windows host'. Existing CI native Windows evidence remains distinct from the VM and live conversation/recovery tests. Keep original full acceptance open. Local Claude executable availability is confirmed, but actual task dispatch must still follow approved native host/model/permission and remaining budget contracts.

## Linux-first live verification grant

Operator approved temporary setup and finite additional calls, then explicitly replaced Windows preparation with Linux-first Pi/Claude verification and stated final Windows testing will be done personally on a separate native Windows machine. Do not prepare/install/start/stop this local VM. No permanent environment-bound E2E tests. Original Windows criteria remain operator-owned/pending, not passed or waived.

Additional finite allowance, distinct from exhausted initial budget: two native Pi probe calls <=10min each (the second may be the same probe's supported eligible-context resume, not an extra reset); one actual native Claude coordinator context and one native subagent <=10min each; one independent final reviewer <=15min. At most two concurrent readers, no writer; no source/test/config changes, installs, copied credentials, paid API route, retries or nested Pi agents. Approved Pi probe model luna/high and reviewer sol/medium; actual model/effort preflight remains required. Claude uses actual supported native host/approved model/effort, not a Pi provider replacement. Before current dispatch none of the additional calls consumed. Current trusted explicit instruction to continue reiterated by operator after coordinator delay; act now, do not merely acknowledge.

First Pi probe: real native async read-only task on integrated source7b6828c and current record checkpoint. Validate actual assignment/run/candidate and request one genuine supervisor decision confirming the expected source/input identity before completing read-only checks. This is a bounded host communication/steering/resumption journey, not an artificial sleep, repeated model waiting call or real cancellation of unsafe work. Parent will answer via supported native supervisor route, reconcile duplicate/stale notification metadata without dispatch/publication, and record actual evidence honestly. No claim of crash recovery, exactly-once or OS containment. Second Pi call only after terminal state/eligible-context validation within remaining total grant.

## Linux native results awaiting final independent assessment

All approved Linux probes completed; coordinator consumed both full Pi reports and real native Claude metadata/result timeline, retained J004/A003.md. Pi native async/supervisor identity and actual same-context eligible resume observed; controlled stale metadata rejected without mutation. Live steer only queued, not claimed consumed. Native Claude parentopus5.5 responded at17:22:09.755 while childsonnet5.5 remained active until17:22:22.173; host completion22.227, parent final consumed33.489. Requested effortlow/medium remains declared, not runtime telemetry. Intentional driver exit143 after successful final result is retained, not masked.

No permanent E2E/source/CI/host config changes. Native CLI test exercises real Linux background/read-only Agent and actual streaming operator interaction, not a substituted Pi provider. J004/A003 records initial evidence limits and private local retention without private thinking/credentials. Two Pi probes and native Claude parent+child additional allowance consumed; one final reviewer<=15min remains before next dispatch. Existing source candidate unchanged and source R2PASS remains separate.

Still not proved: real duplicate/late callback races, changed-source race, live cancellation/interruption/crash recovery, applied live Pi steer and controlled full Pi operator/CI journey. Windows is now explicitly operator-owned at their other native machine, with no local VM work. These criteria are not waived or marked completed. Final review must distinguish limited Linux observations from full I0024 acceptance. No new probe or review beyond final single allowance.
