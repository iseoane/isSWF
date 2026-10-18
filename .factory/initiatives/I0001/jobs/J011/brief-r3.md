# I0001 / J011 / r3

## Objective

Provide an own planner proposal caller using the existing shared SDK backend, pinned own planner methods and committed document inputs. It returns a proposal for coordinator assessment, never edits/adopts the canonical plan.

## Inputs and authority

Operator explicitly requested continuing J011. Source base 9f05413816005a9eab7959ccc02efdc7e646bba6. Only offline implementation and synthetic transport verification are authorized; no real planner/provider call. A new planner configuration entry uses Luna/high, with no alternate, without changing existing role routes. Configuration is not a provider grant or billing attestation.

## Acceptance for this cut

- Native prepare/run/read pins full input SHA distinct from target base, brief and selected spec/grounding at that checkpoint, own planner methods and routing config.
- External assignment grant binds role, project/store/job/input/target/coordinator/planner/caller/backend/SDK and budgets. One attempt, zero retries/fallback, finite deadline/output/token limits and no extra API cost.
- Exclusive private attempt records retain evidence, binding, synced invocation intent, and proposal/result. Partial records are unknown, never automatically replayed.
- No tools, commands, workspace inspection or canonical-plan mutation by the model. Complete output is proposal-complete, not adopted, verified or accepted.
- Public offline tests cover exact pinned contents despite dirty files, missing/oversized inputs before writes, grant/route/budget denial, private records, one-fetch/deadline/replay/output failure, and unchanged canonical plan. Actual installed SDK synthetic OAuth/SSE and empty auth controls remain network-free.

## Limits

No real planner invocation, diagnosis probes, full native role coverage or full J011 completion claim. Text output is a proposal, not a validated canonical job plan. Actor identities and subscription evidence remain externally attested; existing reviewer grants cannot be reused.

## Checks and integration

Public planner regression in portable CI, installed SDK synthetic tests, unchanged reviewer tests/source, quality, ESLint and Knip; one independent review and English PR with exact-head CI before authorized merge.
