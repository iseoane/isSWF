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

- Status: in-review
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

- Status: pending
- Objective: Resume safely after results and interruptions: Resume only the current assignment and candidate without duplicated work or expanded authority.
- Depends on: J002
- Brief: [brief-r1.md](jobs/J003/brief-r1.md)
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

- Status: pending
- Objective: Verify and document the complete flow: Retain exact-candidate independent review and equivalent host/platform evidence for the complete responsive coordination journey.
- Depends on: J003
- Brief: [brief-r1.md](jobs/J004/brief-r1.md)
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
