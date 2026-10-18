# Delivery summary

## Work and candidate

- Job: I0001/J011, brief `brief-r5.md` revision 5.
- Target codebase base: 88f45625551af9b5bad282b6a5f7a5123052960a.
- Candidate: frozen documentation cut `.audit/native-101-snapshot-v1/manifest.json`; final commit and CI are identified by its published PR.
- Work status: ready for operator acceptance only after independent review and CI gates.
- Authorization: operator conversation “Pues vamos a acabar con el Job!”. Existing real-call grants are consumed; this cut adds none.

## What changed and why

The coordinator can invoke the factory's own researcher, implementation worker, reviewer, planner and diagnostician without installing or dispatching through Pstack. Each executable uses its pinned inputs and explicit bounded grant. Stale coordinator instructions now point to those shipped paths instead of treating planner and diagnosis as unsupported roles.

## Visual summary

| Role or handoff | Observed behavior | Evidence |
| --- | --- | --- |
| Researcher | Real GLM/high response, HTTP 200, one request, expected facts verified | `.audit/fallback-66-session-live-proof.json` |
| Implementation | Real native worker changed only the assigned source and passed protected checks | `.audit/native-coordinator-44-real.json` |
| Independent review | Real native reviewer returned HTTP 200 once; report remained aggregate inconclusive, not PASS | J011 plan result digest and `V001.md` |
| Diagnosis to planner | Real sandbox observations entered diagnostic prompt; its result was pinned into planner input; both HTTP 200 once | `A005.md`, `V005.md` |

## Scope

- Included: executable role capability, own instructions, bounded authority, durable result evidence and direct coordinator routing.
- Excluded: a daemon, global scheduler, autonomous merges, one all-role chain with a PASS review, arbitrary model-authored shell, implicit provider grants and full v1 acceptance.

## Checks and results

Existing role portable tests and retained actual sandbox/SDK synthetic controls passed in their source deliveries. Real runs above demonstrate the stated boundaries only, not universal runtime security. Current documentation candidate must pass portable quality and worker-methodology checks, independent review, exact-head PR CI and postmerge main CI before technical closure. No new real call is part of those checks.

## Problems and resolution

Coordinator guidance still described other roles as lacking native adapters after planner and diagnosis had shipped. The guidance now selects the existing direct callers. Older guide statements claiming no real reviewer/planner invocation are replaced with observed results and limits. An autonomous coordinator was not an acceptance requirement and is not added as a blocker.

## Independent review

The exact current snapshot requires a separate readonly review before publication. Historical real reviewer transport succeeded, but its inconclusive Standards/Spec aggregate is not reused as approval of this documentation candidate. The published PR identifies the current review and candidate.

## Closure and acceptance

- Technical closure: subject to the current independent review and CI gates; capability and real controlled-case evidence are listed above.
- Operator product acceptance: pending. Decide whether these bounded native paths meet J011 without requiring external launchers. Accepting J011 does not accept the whole factory or a provisional planner proposal.
- Publication state: pending at preparation; verify the final PR URL/state rather than inferring it from this card.

## Integration risk and recovery

Only instructions and records change. Revert the documentation commit if routing guidance is incorrect; existing executable grants and private attempt stores remain authoritative. Historical records are not rewritten. The current development session still uses an external advisory-agent launcher for independent source review; the delivered native callers do not require it.

## Blockers and next action

After technical gates, demonstrate the five direct role entry points and the retained diagnostic-to-planner result, then request operator acceptance of J011. For detailed pending-job planner optimization, supply its missing pinned briefs/specification in a separately scoped assignment. Never repeat consumed invocations.
