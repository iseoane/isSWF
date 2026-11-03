# J006 / r5 — Evidence-backed design for observed Claude metric snapshots

## State and objective

**Design proposal, not implementation authority.** The operator explicitly requested researcher-first code and official-documentation analysis, followed by design before implementation. Research R001 is complete; no writer, reviewer, runtime experiment or package operation has been selected. The previous patch/review extensions remain stopped and spent.

Preserve the original purpose: automatically acquire useful native numeric consumption evidence after explicit project setup, without pasted counters/results or model calls in the collection path. The supported minimum is an **observed-series snapshot**, not a guaranteed whole-process/session/workflow total or an arbitrary temporal window. If whole-work completeness or capture of plain `claude` outside the selected entry is mandatory, this proposal does not satisfy it: keep that outcome blocked rather than redefine or certify it silently.

Target `/home/iseoane/Work/isSWF`, branch `feat/i0025-auto-claude-capture`; source candidate remains `cafe6859159d576c1950b225b2e02e92985228fa`. This document changes no runtime bytes. Supersede r4's proposed common launched-process interpretation, not prior evidence, original exclusions or operator authority.

## Grounding and uncertainty

Researcher `cf176611-83fd-41cf-821e-4dcf84dac15d` returned complete, findings-only R001 on codebase `afe1b2efbdc57b0970e4648a5054fd094c330cb6` and document checkpoint `a945ffa876ca8e84e9e100f193f9ec4779d79d1a`. Coordinator retained that report; the researcher wrote no repository files or tests. Resource consumption is self-reported. Eight official source snapshots are pinned by URL/time/bytes/SHA256 in ignored `tooling/.local/i0025-claude-research-r001/sources/manifest.json`; R001 cites their relevant sections.

Coordinator reopened the implementation and primary source sections after the report:
- Claude monitoring, Token counter and Cost counter: input/output/cacheRead/cacheCreation are separate category attributes; native dimensions also include effort/skill/plugin and other attribution. Model/source/category are a reporting projection, **not the full native identity**.
- OTel data model, Metric identity: resource, instrumentation scope, metric properties and complete attribute set define native streams; individual points carry timestamps. SDK Start timestamps says cumulative continuity is per series, with synchronous starts at first measurement (that SDK section is Development). Neither establishes synchronized starts across categories.
- Current `normalizeClaudeOtel` requires near-equal starts, then invents a maximum-start segment. This creates order dependence and does not fix the retained1ms discrepancy. No new threshold is justified.
- Current collector drops point dimensions before constructing identity; distinct native attribute series can collide in the visible source/model/category projection. Its1-second exports and1MiB lifetime ingress cap can also invalidate a normal long session.

These are source/document facts plus static inferences, not new native execution. R001's whole-process completeness concern is adopted as a limit on claims, not as evidence that every observed category value is unusable. Observed arithmetic is useful when explicitly labelled and never promoted to workflow completeness.

## Selected minimal architecture

`explicit setup/readiness → ordinary selected Claude launch → native metrics-only local receiver → bounded per-series latest snapshot → snapshot-specific report/comparison`

No daemon, global alias/hook/registration, extra model/agent extraction, raw transcript/event/trace parser or generic telemetry framework. Plain `claude` outside the selected launch remains unchanged and uncollected. Keep existing Pi and explicit Claude SDK/result window contracts intact; do not force snapshots into their `mode: window`, actor-count or accepted-outcome completeness semantics.

### 1. Identity and data ownership

- The launcher owns one local capture ID, receiver and native child. This ID identifies the capture, not a native session or measurement interval.
- Native series identity incorporates canonical validated resource, instrumentation scope, supported metric properties and **complete point attributes**, using opaque digests before retention. Expose only controlled category/source and bounded model labels. Never persist resource/account/email/session/prompt/tool payloads; an opaque identity is not permission to echo arbitrary attributes.
- Retain each observed series' actual start, end, value and opaque identity. Different categories may have different starts and ends. No tolerance, min/max intersection or fabricated common interval.
- Full native identity and cross-capture comparison identity are distinct. Two series with different skill/effort/resource attributes must not overwrite each other merely because their visible category/source/model match. Unknown/overflow/unsupported native dimensions produce explicit partial/unsupported status, not silent completeness.

### 2. Cumulative update rules

For one native series: replace a later cumulative value; never add repeated exports. An identical repeated observation is idempotent. A conflicting equal timestamp, regression, changed start/reset or unsupported segment transition invalidates that capture's continuity visibly; do not silently combine segments. Missing observations remain unknown. Define these rules over validated series keys and actual timestamps so input order cannot affect acceptance or numeric output.

A changed start is meaningful **within one series**; unlike starts across different category series are not themselves resets. Preserve raw numeric evidence only in the sanitized receipt, not raw OTLP transport bodies.

### 3. Reporting and comparison contract

Use a snapshot-specific envelope/view rather than weakening existing actor/window normalization:
- Report observed category/source/model values with references to their individual opaque series and intervals. Native identity may differ across two launches without making semantically matched category comparison impossible.
- A sum of admissible disjoint observed category values may be shown only as **observed subtotal**, with its exact scope/knownness. It is not the process/session/workflow total. The11/7/5/3 fixture may yield observed subtotal26 while total coverage remains unknown.
- Do not count category rows as agents, infer individual agent identities, populate absent categories with zero, claim accepted outcomes automatically, or calculate a complete workflow efficiency/savings ratio from unknown coverage.
- Compare snapshots only under explicit compatible host/version/model/source/category/task/knownness metadata. Label differences exploratory and coverage-limited. Native capture/series IDs and timestamps stay provenance, not equality requirements between independent launches; unmatched dimensions remain incomparable rather than guessed.
- Preserve strict provenance-specific schemas and unknown-field refusal. No arbitrary `source`, `segment` or future snapshot metadata on manual/Pi/result rows.

### 4. Resource and lifecycle limits

Keep per-request ingress<=1MiB, bounded concurrent requests, <=100 live series, bounded rows and <=64KiB sanitized output; retain the existing1MiB destination storage ceiling without automatic eviction/cleanup. These bound memory/disk. **Do not use a cumulative lifetime ingress-byte counter to expire otherwise bounded long sessions.** Release transport buffers after each bounded request and retain only latest series state. Keep deterministic overflow/failure status.

Use the native documented production cadence (currently60seconds) unless evidence justifies another bounded choice; a1-second test setting is not the production default. No new collector polling/model turns. Shutdown/cancel/flush is finite; child exit and capture status are separate. A clean child exit does not prove a final export arrived. Empty/partial/no-final-export states are not complete zero-token work. Preserve successful observed data or explicit failure status without asserting crash recovery or descendant cessation.

### 5. Setup, executable and policy readiness

Explicit project opt-in and a trusted native executable/ordinary launch recipe remain one-time setup choices. Preserve unrelated settings and native arguments/stdio/permissions/auth. Development/native fixtures use the pinned existing binary, never wrappers or package acquisition. No global migration or silent activation.

Managed-policy compatibility is a **readiness gate**: permission and supported effective destination/exporter compatibility must be established for the target environment before instrumentation is enabled. A warning or self-written `verified` flag is not technical evidence. If no supported safe inspection/authoritative compatibility evidence is available, report blocked/unknown and do not start instrumentation; ordinary uninstrumented Claude may remain available. Do not read secrets, change/bypass managed policy or claim all native telemetry is local. The receiver itself is loopback-only, which is a different claim.

The supported Linux and Windows executable/stdio mechanisms must be verified through controlled portable fixtures, with genuine native evidence labelled separately. Actual Windows native journeys remain deferred by the operator; Linux/native/synthetic success does not prove Windows, interactive TTY or actual child coverage.

## One bounded functional outcome and decisive checks

A future authorized implementation is one unit: setup-selected automatic **observed-series capture and snapshot comparison**, with source/tests/required EN/ES guidance and honest readiness. Not a sequence of layers or an automatic retry pipeline. No engineering budget is authorized by this design document.

Before claiming that unit verified:
1. The recorded1ms pair and every relevant category permutation retain actual separate intervals, give identical observed arithmetic/status and never fabricate a common window. Retain a deterministic fixture of the original failure; do not overwrite it with the next successful run.
2. Distinct native point dimensions and instrumentation scopes stay distinct even under the same visible category/source/model. Reordered equivalent attributes retain one identity; malformed/duplicate/compound/scalar/provenance cases remain fail-closed.
3. Repeated exports are idempotent/replacing; true same-series reset/order/value conflicts fail visibly; missing categories remain unknown. No false full totals or category-as-actor coverage.
4. Independent matched snapshots compare without identical native IDs; unsupported/unmatched scope stays explicit. Existing Pi and explicit result/window tests remain unchanged or have demonstrated preservation.
5. Repeated bounded exports can exceed1MiB cumulatively without growing retained state or expiring collection. Per-request/cardinality/storage overflow, authentication, sink conflict, no-opt-in, stdio, failed spawn, cancellation and missing final export have deterministic checks.
6. The implemented entry itself is exercised with actual installed Claude and controlled local synthetic replies; native counters, receipt and snapshot report are tied to the exact candidate. No model/provider call merely to manufacture real consumption. Locked lint/Knip and final committed-source portable checks run against that candidate; required host/platform evidence remains separate.

**Stop once**, without another automatic patch cycle, if the chosen native source cannot provide usable bounded observed snapshots, identity/continuity cannot be established, policy permission/effective export cannot be verified safely, ordinary-use launch/flush is unsupported, or the required outcome is actually whole-process/plain-launch completeness. Return the exact blocker and preserved candidate; do not widen scope, add traces/daemons/global overrides, enlarge arbitrary tolerances or repeatedly ask for micro-extensions.

## Preserved adverse evidence and next boundary

V001–V005 source verdicts remain adverse on their original candidates. Historical unauthorized mise/npx acquisition attempts, prohibited cleanup and unknown global/cache effects remain unreconciled; no research/design file repairs them. Latest source full-quality observation remains timeout124, separate nativeHostDelegation NOT_RUN, with earlier successes and failures attributed to their exact candidates. The operator's researcher-first instruction authorized analysis/design only, not implementation, installation, activation, publication as complete or integration.

Next boundary: present this design and its observed-only scope/compatibility gates to the operator. Resolve any genuine product requirement for complete workflow totals explicitly; do not silently narrow it. Implementation stays stopped until a concrete bounded start and executable readiness conditions are established.
