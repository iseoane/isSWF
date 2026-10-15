**Verdict — base f787928. Take B's split (JSON holds route values; Markdown guide holds semantics), simplified to the parent's shape. A's table cannot pin whole-route overrides and per-attempt resolution without prose becoming a second authority; reject it as configuration.**

**Accepted shape** (no catalogue, no role IDs):

```json
{"schemaVersion":1,"roles":{
 "worker":[{"model":"openai-codex/gpt-6-luna","effort":"high"}],
 "researcher":[{"model":"opencode-go/glm-5.3-flash","effort":"high"},{"model":"openai-codex/gpt-6-luna","effort":"medium"}],
 "reviewer":[{"model":"openai-codex/gpt-6-luna","effort":"high"}],
 "additional-review":[{"model":"opencode-go/deepseek-v4.1-flash","effort":"max"}]}}
```

- A one-tuple array is the "no fallback" representation (worker); no special case.
- Drop `revision` (config Git SHA identifies content), `approvedDestinations` (the tuple is the destination), `subagent_type` (guide maps effort → `pstack:effort-*`).
- `subscription` only if the operator names a real alias; `opencode-go`/`openai-codex` are provider labels already in `model`, not accounts.
- No `defaults` key; guide states "no project default configured" while preserving spec precedence: job override → role → (absent) default.
- Config carries routes only — no credentials, availability, quota, or cost claims. Availability is per-attempt preflight evidence, not config state (rejects A's availability registry).

**Boundaries that hold:** The trusted grant remains the authority; config presence never self-grants. Unknown role, destination, effort, or incompatible combination blocks. Only exhausted quota/capacity or destination unavailability advance a route; test failure, findings, or bad output never do. A trusted whole-route override selects only already-approved destinations. Active or unknown prior writer blocks retry/fallback; no duplicate agent or grant. Attempts pin config path + Git SHA, resolved ordered route, selected destination, observed actual model/effort. `docs/templates/attempt.md` must gain those fields; today's requested/effective model+effort is insufficient identity.

**Contradictions to fix in scope:**

1. Coordinator SKILL §5 and `worker.md` §Dispatch configuration hardcode Luna/high as the worker destination — a second authority once config exists.
2. The researcher still lacks a configured route: durable-work, vision, and plan approve GLM/high → Luna/medium; the config is where that lands.
3. Coordinator reviewer examples (Luna/high, DeepSeek/max) match `reviewer`/`additional-review`, but must become pointers; the guide must forbid auto-selecting additional-review.
4. The five-file set omits `worker.md`, a conflicting source; add it, or state explicitly that profile files declare no routes.

**Minimal decisions before writer:**

1. Config path (recommend `.factory/models.json`, matching durable-55's `.factory/` space).
2. Role set vs spec profiles (coordinator, researcher, worker, reviewer, retrospective): routes only where approved; everything else blocks.
3. Whether a real subscription alias exists; omit the field otherwise.
4. Include `worker.md` in the change set.
5. Accept "no project default configured" as satisfying the spec's defaults/profile/exception precedence.
