# I0025: Token consumption observability

Type: research

## Objective and authority

Produce a reproducible local consumption report that identifies useful improvement targets without claiming unavailable precision.

Operator confirmed the three-work assignment in the current Pi session. This initiative is **prepare-only**: local investigation, brief and plan; no implementation, model experiments, installations, external export, remote issues/PRs or integration. Coordinator owns records. Source baseline `a8461287c370908b2983b90322ec1d7f6bef4de6`. Related work: I0008 introduced reusable skills, not consumption measurement; I0024 removes model calls merely to wait, not general token attribution. No matching token initiative found in current canonical plan inventory.

## Grounding and adopted design

Coordinator consumed the complete read-only planner proposal from native run `0a518746-16f1-4361-94e2-719f726a95ce`; tool status reports complete/process-terminal observed, sol/low. One shared <=10min planning allowance consumed; zero retries or implementation actors. The role wrote no repository files; coordinator adopted the conclusions here. Resources consumed are self-reported, not independently traced. Proposal: `/tmp/isswf-token-planning-proposal.md` (private temporary handoff, not a required public dependency).

Initial assumption: new collection machinery might be needed. Observed: installed Pi/subagents already exposes structured cost summaries; scope, missingness and identity reconciliation are the main design risks. Existing normalized zeros do not establish provider-reported zero. No numeric baseline or measured savings was established. Claude token schema/child inclusion and live Windows parity remain unverified.

Source map at the examined base: `tools/project-state.mjs:1–17` state selection; `tools/isswf-plan.mjs:44–91` local-only dependencies; `tools/isswf-status.mjs:44–99` bounded curated metadata; `tools/project-quality.mjs:11–36` deterministic inventory; `tests/host-native-delegation.mjs:56–69` synthetic usage only; I0024 `jobs/J004/A003.md` live lifecycle evidence, not a numeric baseline. Installed Pi1.4.0 `pi-ai/dist/types.d.ts:285–305` defines categories/subsets; subagents0.83.0 `src/slash/subagent-cost.js` and `docs/extension-api.md` expose existing summaries. Installed files are mutable Linux-local evidence, not source pins or cross-platform proof. Reopen actual source/version at implementation start.

### Analysis continuation: practical comparison, including Claude

Current operator request (2026-11-02): advance the analysis, especially Claude, and prioritize useful metrics for detecting consumption changes rather than precise billing. This authorizes local research and record updates only; no implementation, host configuration, private-session inspection, model calls or remote publication. Baseline for this continuation: `08abd1c`. Coordinator performed this research directly; no additional planning actor was launched. The earlier statement that Claude semantics were unverified remains historical; the documentation investigation below reduces that uncertainty but is not a live measurement.

#### Observed sources and confidence

| Surface | Available signal and scope | Evidence and limitation |
| --- | --- | --- |
| Pi/subagents `collectSubagentCost(ctx, state)` | Branch-scoped parent usage, child rows and aggregate; input/output/cacheRead/cacheWrite/cost/turns, unresolved async children | Reopened installed `pi-subagents/src/slash/subagent-cost.js:125–239`; it reads the current branch, deduplicates children by run/session identity and resolves async receipts. Source inspection only, not measured data. Missing fields can normalize to zero: retain availability separately. |
| Claude interactive usage screen | Session token/model/cache statistics; convenient manual before/after receipt | Official costs guide currently names `/usage`; older versions may expose `/cost`. Verify the installed command rather than hard-code either spelling. No live interactive screen inspected. Plan-limit percentages and dollar estimates are not token counters. |
| Claude headless/Agent SDK result | `modelUsage` per-model whole-tree counters and `total_cost_usd` estimate; result `usage` covers the main loop, excluding subagents | Official Agent SDK cost-tracking guide explicitly distinguishes these scopes. Use the whole-tree model summary when available, not `usage` alone. SDK documentation is not proof of the exact installed CLI event schema. |
| Claude interactive OpenTelemetry metrics | `claude_code.token.usage`, partitioned by input/output/cacheRead/cacheCreation and model; native telemetry covers API requests and supports source/agent dimensions | Official monitoring guide; optional local metrics-only capture is a future alternative for interactive work, not enabled here. Validate actual child inclusion and process scope on the installed version. Delta/cumulative temporality and restarts must be explicit. |
| Claude status line | Context occupancy/latest-response counters, cache diagnostics and estimated cost | Official status-line guide explicitly describes context counts as the latest API response, not cumulative session token consumption. Do not sum refreshes or treat occupancy as total work. Not the primary consumption source. |

Local non-provider observations: `claude --version` returned `2.1.312`; `claude --help` exposes `--output-format` and resume options. These commands establish CLI availability, not live counter correctness. No auth files, raw transcripts or global settings were read. Current online documentation is mutable and may describe behavior beyond this installed release; pin actual version and supplied counter schema before implementation.

Sources inspected on 2026-11-02:
- [Claude Code costs](https://code.claude.com/docs/en/costs).
- [Agent SDK cost tracking](https://platform.claude.com/docs/en/agent-sdk/cost-tracking), especially token scope, subagents and streaming/resumed totals.
- [Claude Code monitoring](https://code.claude.com/docs/en/monitoring-usage), especially token counter, content gates and metric temporality.
- [Claude Code status line](https://code.claude.com/docs/en/statusline), especially context-window fields and Windows configuration.

#### Minimum useful metrics

Produce one small local table per comparison, retaining host/version, model/effort, task/outcome, measurement scope and coverage alongside:

1. **Processed tokens:** input + output + cache read + cache write, only when the source establishes disjoint categories. For documented Claude counters, input excludes cache reads/writes. Keep all four components visible. This counts repeated processing, not unique text or subscription quota.
2. **Tokens per accepted outcome:** all in-scope work, including failed attempts, reviews and corrections, divided by accepted outcomes. With no accepted outcomes, report consumption and failure, but no efficiency ratio.
3. **Request/turn count and rework:** report separately according to source semantics; a host turn is not necessarily one API request. Retry/correction counts are useful coarse explanations, not a prerequisite for a first total.
4. **Cache-read share:** cache read / (input + cache read + cache write), when all inputs are known and disjoint. A reduction in fresh input with unchanged processed tokens is a cache improvement, not a reduction in total tokens.
5. **Duration and quality guard:** elapsed work time, checks/acceptance and corrections. Lower tokens with worse correctness or unfinished work is not an accepted improvement.

Optional list-price cost is a separate, dated weighted indicator, useful when model mix changes; never label it billed spend. Subscription-window percentages are too coarse and confounded by other work to be the primary metric. Exact per-file, per-skill or reasoning attribution is not required to deliver these metrics.

#### Before/after protocol for I0026

- Compare within the same host, model/effort, task class, acceptance checks and actor scope first. Record the version, candidate, cache condition and start/end boundaries. Pi-versus-Claude universal-token rankings are not the objective.
- Prefer bounded functional tasks or small batches with comparable outcomes. Use ordinary authorized work, not artificial paid calls. A single matched pair is a preliminary signal; accumulate more comparable samples and show individual values plus median/range before claiming a repeatable gain. Historical unmatched tasks remain descriptive, not causal evidence.
- For a known cumulative source, compute end minus start per stable session/model/category; replace repeated snapshots, do not add them. A reset starts a new segment. A resumed session may restore prior totals, which must not be counted twice. Unknown reset or actor coverage makes the affected comparison partial/inconclusive.
- For independent Claude process trees, use each tree's final supported whole-tree summary once. Do not add native child rows already included in it. Separately launched `claude -p` actors require their own receipt and explicit linkage; they are not assumed included in another process's totals. Missing final results remain missing, not zero.
- Report reduction as `100 * (before - after) / before` for the same metric and matched scope, only with a positive known baseline. Label it exploratory when sample size is small. Unknown categories permit a labelled partial subtotal only if the same categories and coverage are used on both sides; do not relabel it whole-workflow savings.
- If optimization changes the measurement scope, model, cache condition or quality, expose that change rather than silently crediting it as instruction efficiency. I0025 supplies the receipts; I0026 selects and evaluates actual interventions.

#### Proportional implementation recommendation

First deliver offline normalization/comparison of explicitly supplied sanitized native summaries for **both hosts**, with manual entry of a native summary allowed and provenance marked manual. This removes the need for a new collector before useful comparisons exist. Exact role attribution is optional enrichment, not a gate for an otherwise scoped total. An unavailable host counter blocks only its full-scope claim, not a correctly labelled partial receipt.

For ordinary Claude interactive use, start with a supplied native usage receipt; for already-authorized headless work, prefer its existing final whole-tree summary. If interactive repetition makes manual capture impractical, investigate opt-in, process-local, metrics-only console telemetry: no daemon, remote endpoint, traces or events by default. Before enabling it, verify the installed version, bounded output/flush behavior, allowlisted identities, child inclusion and delta/cumulative semantics; native metrics may contain account/session/resource identifiers and must be sanitized before retention. Do not capture whole stream-json output because it can contain prompts and tool payloads. No settings changes or collection are part of this analysis.

Linux evidence here is documentation and installed-source/help inspection; Windows native counter observations remain pending. Offline arithmetic and comparison can share portable fixtures, but a documented Windows shell example is not a passed native Windows collection test. Missing native validation does not require perfect accounting before the offline unit can be useful; it remains explicit in supported-scope claims.

Initial assumption versus result: Pi has existing usage summaries, not an isSWF measurement methodology already implemented. Claude also has native usage surfaces; we do not need a second accounting system. The remaining work is a small common receipt/comparison format and version-specific confirmation of totals, not exhaustive attribution infrastructure. No baseline numbers or savings were measured in this continuation.

### Ordered functional units (proposed, not started; refined by the analysis continuation)

1. **One reproducible offline receipt:** explicitly supplied sanitized summary → bounded report with counters, scope, availability and provenance. Include implementation, fixtures and affected bilingual usage docs in one candidate. Known totals, unknown/malformed/oversized input and sensitive-field exclusion must be checked. No private-store discovery.
2. **One accepted-outcome baseline:** after unit 1 integration, map coordinator/children/reviews/retries/resumes with explicit identities; replace cumulative snapshots rather than adding them, deduplicate terminal updates and report unmatched actors. Check missing children, interruption and resume. Retain correctness-checked real baseline with accepted-outcome identity and coverage. A synthetic fixture validates aggregation, not actual consumption.
3. **Supported host/platform collection:** reuse native Pi summaries and the Claude surfaces identified above; confirm installed schemas before claiming native integration. Unit 1 accepts supplied summaries from both hosts without waiting for automatic collection. Exercise portable fixtures and authorized native observations on Linux/Windows separately. Partial Pi evidence does not close full-host acceptance.

### Operator clarifications: attribution and measurement overhead

- Prefer an individual row for the coordinator and every agent/subagent when native identities and counters permit it, plus a reconciled whole-work total. Per-actor attribution is a desired output, not merely a role-level grouping. Unavailable attribution remains explicitly unknown/unattributed; never derive invented child shares or add child counters to an already inclusive parent total. Show attribution coverage.
- Collection, normalization, aggregation and comparison must use native counters and deterministic code, not agents or model calls. No model invocation to obtain, extract, estimate or interpret counters in the measurement path. Engineering agents used in a separately authorized implementation are distinct from recurring measurement overhead.
- Cache read measures provider context reuse; cache write prepares reuse and uncached input is separate. Show all three, the cache-read share defined above and processed tokens per accepted outcome together. High cache reuse alone does not establish reduced total consumption, code reuse or knowledge sharing between agents.
- Apply these requirements across the three proposed units: supplied per-actor summaries in unit 1, real attribution/coverage in unit 2, and native host/platform capability confirmation in unit 3. No new slice is required for these clarifications.

### Signal, privacy and overhead contract

- Questions: which roles/models/jobs and retries dominate reported consumption; what fraction is attributable and what is unknown? Resource-level/context-repetition estimates remain labelled estimates.
- Report dimensions: bounded host, role, model, state and provenance; opaque initiative/job/run/outcome correlations are controlled row fields, not unbounded metric labels. Requested and observed model/effort stay separate.
- Counters: input/output/cache read/cache write in tokens; reasoning and native total are non-additive reconciliation fields unless inspected provider semantics establish otherwise. Never combine Pi all-entry totals and branch-scoped subagent totals without proving disjoint populations.
- Availability: provider-reported, host-normalized, derived, estimated or unknown per field. Coverage = measured actors / explicitly expected actors and known counters / eligible slots; unknown population means unknown coverage.
- Default implementation envelope: explicit inputs <=1MiB total, <=100 attempts, <=4KiB normalized row, <=64KiB report; reject overflow, never silently truncate. Reconfirm feasibility at start. No collector daemon, background timer, exporter, queues, retries or dashboard.
- Exclude prompts, reasoning text, tool payloads, credentials, arbitrary errors and private session paths. Normalize before retention. No new raw retention; curated evidence follows durable-work retention and requires authorized cleanup, not automatic deletion. Local only.
- Sink failure visibly fails report creation, not the underlying work’s product acceptance. No alerts required for this local report. Optional money estimates need dated price provenance and do not measure subscription billing.

Minimum baseline unblock: admissible retained sanitized summary or explicitly authorized collection through already-supported native summary interface, with known actor scope and outcome acceptance. No artificial provider calls to generate data.

## J001

- Status: in-progress
- Objective: Deliver slice 1: bounded offline Pi/Claude consumption receipts and matched comparison, with available individual attribution and no model calls in the measurement path.
- Depends on: None
- Brief: [brief-r3.md](jobs/J001/brief-r3.md)
- Blocker: No implementation dispatched at preparation. Native collection and real baseline remain outside this unit; no I0024 completion dependency.
- Next step: Under current explicit coordinator start, dispatch one bounded native worker after checkpointing r3; verify stopped candidate, independent combined review and feature PR/CI. Five steps only; no automatic collection or direct-main integration.

### Acceptance

- Inventory actual Pi and Claude native usage fields and accessible read-only interfaces on Linux and Windows; distinguish documented, fixture-tested and live-observed capabilities.
- Report input/output/cache/reasoning counters only with explicit provider semantics; missing values remain unknown, not zero. Avoid summing overlapping total and category counters.
- Correlate initiative, job, role, model, call, retry and resume through explicit available identities; include coordinator and children without double counting. Unmatched work remains unattributed.
- Show observed versus estimated versus unknown amounts, coverage denominators and provenance; context repetition and per-resource attribution are estimates unless directly exposed.
- Allowlisted local data only: no prompt bodies, reasoning text, tool payloads, secrets or raw session copies. Bound samples, cardinality, retained bytes, retention and sink-failure behavior before implementation.
- Deliver a small correctness-checked baseline for I0026 using existing retained summaries or explicitly authorized sanitized inputs; no paid or artificial model calls merely to measure. Optional money estimates require dated prices and never imply subscription billing.
- Verify aggregation with known totals, retries, interrupted/partial runs, missing fields, duplicate events and changed candidates; equivalent supported host/platform outcomes or explicit capability blockers.

### Evidence

- Prepare-only operator request in current session; current-source investigation, not a measured consumption baseline or savings claim.
- jobs/J001/brief-r1.md (original preparation, retained unchanged).
- jobs/J001/brief-r2.md (analysis and practical-metrics objective).
- jobs/J001/brief-r3.md (current explicit slice-1 start, finite budget, five steps and acceptance).
