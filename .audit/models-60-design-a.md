# Model routing design — centralized contract

**Status:** design only; not an implementation or runtime guarantee. Recommend one project-owned, human-readable route table as the canonical configuration. It avoids multiplying model parameters across tools and fits the Markdown-first, manually coordinated system that exists today.

## Format options

| Option | Benefit | Cost / risk |
| --- | --- | --- |
| Markdown tables (recommended) | Readable and reviewable with no parser or new tool; coordinator can apply the contract manually now. | Requires disciplined edits and explicit validation; not machine-enforced. |
| YAML/JSON | Easier for a future runtime to parse and validate structurally. | Adds schema/parser/runtime obligations before automation exists; less readable and risks implying enforcement that is absent. |

Keep the route itself in one central table, not copied into each profile or dispatch. Profile names select rows; the brief can replace a whole row's ordered route for one job. No credentials, quota estimates, or provider-internal claims belong here.

## Recommended route shape

Each row is `role | ordered destinations`. A destination records `provider/model`, `effort`, and a project-local subscription/account label when needed to distinguish authorized subscriptions. The label identifies the selected account, not credentials. Keep a small adjacent availability/compatibility registry of approved `provider/model + effort` pairs and their observed availability status; validate the chosen destination before dispatch. Record only observed metadata (for example, checked/unknown, compatible/incompatible, timestamp/source), not undocumented provider internals or invented remaining quota.

| Role | Ordered route currently grounded |
| --- | --- |
| researcher | `opencode-go/glm-5.3-flash @ high` → `openai-codex/gpt-6-luna @ medium` |
| worker / implementation | `openai-codex/gpt-6-luna @ high`; no fallback approved here |
| reviewer | Optional distinct route: `opencode-go/deepseek-v4.1-flash @ max`; do not enable by default or infer a fallback |
| other profiles | No route specified by this decision; block dispatch until explicitly approved/configured |

The researcher alternate is approved subject to future validation, not proven available. Do not infer additional destinations or subscription labels. Validate model existence/access and effort compatibility before dispatch; incompatibility or unknown availability blocks rather than silently lowering effort or switching route.

**Resolution and attempt rule:** project defaults → selected profile route → explicit per-job route override (replace the whole ordered route, never merge fields). Before an attempt starts, resolve and record the effective ordered route and selected destination with model, provider, effort, subscription label if applicable, and configuration revision. Pin those values to that attempt. A later default edit affects only new attempts; an active attempt retains its pinned effective route. A quota/unavailability response may advance only to the next approved destination, recording the observed reason. Failed tests or bad output never trigger provider fallback. If the chain is exhausted, block. Before replacement/retry, confirm the old writer stopped, reconcile partial work, and confirm the replacement fits the total authorized grant; unknown state blocks and must not create duplicate agents. Never report remaining subscription quota unless the provider actually exposes and the coordinator observes it.

This is a policy for the current manual coordinator, not automatic routing. No new tool, CLI, Python, network lookup, or runtime is needed to use the table as a design; actual availability checks remain a prerequisite to any dispatch. The existing coordinator flow already requires checking destination/effort and reconciling writers and total grants.

## Grounding and open questions

- `docs/spec-v1.md:184-213,227-233` requires ordered per-profile routes, whole-route override precedence, preflight compatibility, non-test-triggered fallback, and visible effective configuration; `:297` requires confirmed writer stop before fallback.
- `docs/vision.md:109-117` asks for initial and fallback model+effort across providers/subscriptions; only the researcher route is specifically approved there (`:89`).
- `docs/plan-v1.md:72-74,93-100,162-166` says current profiles are manual, fallback is future work, and real compatibility/defaults remain to validate.
- `docs/durable-work.md:44` records the researcher route agreement and explicitly says it does not validate/configure/run it.
- `.agents/roles/researcher.md:13,31`; `.agents/roles/worker.md:15,42`; `.agents/roles/reviewer.md:14`; `.agents/skills/isswf-coordinator/SKILL.md:59,76` ground declared-vs-observed routing and current manual preflight/reconciliation.

**Unknowns (not blockers to this design):** physical config path/format acceptance; which subscription labels/accesses are available; current live model availability and supported efforts; whether reviewer distinct route should be enabled; approved fallbacks for worker and other roles. Resolve these before configuration or dispatch, without inventing approvals. No remaining-quota API/visibility is established.