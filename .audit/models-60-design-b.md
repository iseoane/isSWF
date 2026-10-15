# Model routing design proposal

**Decision:** use a small, versioned project JSON file as the sole machine-readable authority, with one Markdown guide defining semantics and examples. Do not use a pure Markdown table as configuration. A table is useful for documentation, but cannot cleanly express per-role ordered routes, approved destinations, bounded overrides, and attempt snapshots without conventions or duplicated state. This is a proposal, not a parser, runtime, tool, or proof of automatic routing.

## Shape

Propose `.factory/models.json` (location remains a design choice under the spec) with only three concepts:

```json
{
  "revision": 1,
  "approvedDestinations": {
    "glm-research": { "provider": "opencode-go", "model": "glm-5.3-flash", "effort": "high", "subscription": "opencode-go" },
    "luna-research-fallback": { "provider": "openai-codex", "model": "gpt-6-luna", "effort": "medium", "subscription": "openai-codex" },
    "luna-implement": { "provider": "openai-codex", "model": "gpt-6-luna", "effort": "high", "subscription": "openai-codex" },
    "deepseek-review": { "provider": "opencode-go", "model": "deepseek-v4.1-flash", "effort": "max", "subscription": "opencode-go" }
  },
  "roles": {
    "researcher": ["glm-research", "luna-research-fallback"],
    "implementer": ["luna-implement"],
    "additional-review": ["deepseek-review"]
  }
}
```

The destination catalogue is the project’s approved set, not proof of provider availability or account access. Keep credentials out. A trusted operator grant bounds which subscription/provider and exact destination tuples may be used; a per-job override may select only destinations within that grant and replaces the role route as a whole. It cannot add destinations, change effort, widen permissions, or authorize extra costs. Unknown roles, destinations, providers, effort compatibility, or fallback conditions block for an explicit decision—never invent a route or cost. Additional review is an explicitly authorized review assignment, not a semantic fallback. Defaults affect new attempts only.

The Markdown guide owns the interpretation: precedence, grant checks, compatibility validation, eligible fallback reasons (quota exhausted or compatible destination unavailable), bounded retries, reconciliation, and operator-facing block reasons. It must say that test failures, review findings, and bad output never trigger provider fallback. Keep rationale and provider caveats there; do not mirror route values in prose or a second table.

At attempt start, pin the exact config revision/content identity and resolved role route. Record requested destination, each attempted destination and observed reason, effective destination, plus provider/model/effort actually reported by execution. Preserve that evidence on resume; a changed default creates a new attempt and cannot rewrite history. Before fallback or retry, reconcile prior writer identity and effects. If it may still write or its state is unknown, stop and reconcile; do not start a second writer or duplicate effects.

## Grounding and acceptance fixtures

- **Sources:** `docs/spec-v1.md#L184-L235` (effective precedence, fallback, MOD-01–07); `docs/vision.md#L89-L90`, `#L117-L121` (approved researcher routes and configurable subscriptions); `docs/plan-v1.md#L72-L74`, `#L91-L100` (S02/S03 boundary and controlled quota simulation); `docs/durable-work.md#L42-L44` (researcher route agreement); `.agents/roles/worker.md#L40-L43` (current dispatch route is instruction, not runtime proof). Reopen these anchors before implementation.
- Fixture: researcher resolves GLM 5.3 Flash/high, then only on simulated quota/unavailability the approved Luna/medium fallback; implementation resolves Luna/high; an authorized additional review resolves DeepSeek 4.1 Flash/max and is never selected as fallback.
- Fixture: a bounded user override selects an approved route; an unapproved destination/provider/effort or unknown role blocks. No API-billed or unapproved destination is inferred.
- Fixture: simulated quota/unavailability advances; test failure does not. An incompatible fallback blocks. Never exhaust a real quota.
- Fixture: defaults change after attempt creation; the old attempt retains its pinned revision and actual metadata, while a new attempt resolves the new default.
- Fixture: previous writer is active or uncertain; fallback/retry blocks until reconciled, with no duplicate writer or effect.
- Verify recorded actual metadata against a controlled execution result. Until a runtime demonstrates these fixtures, describe routing as configured design—not automatic behavior.
