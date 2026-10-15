# Task 65 — v5 actual follow-up outcome

Status: all recorded bounded checks passed; independent final evidence gate pending. Task 65 is not yet marked complete.

## Actual run

The independent pre-call review approved one bounded call of frozen snapshot v5. The exclusive invocation record `boundary-65-invocation-v5.json` prevents this parent dispatch from being accidentally repeated. `boundary-65-real-result-v5.json` reports `MODEL_RUN_FINISHED`; the separate exit record is zero. Runtime was `openai-codex/gpt-6-luna`, high, with only `sandbox_shell` active/callable, four actual routed tool calls and no deadline exhaustion. No provider-internal token usage or detailed prompt-completion telemetry was retained; no inference about cost or quota is made.

Call-ID-correlated records distinguish three ordinary shell results from the explicit trusted `boundary_check` result. One ordinary compound command mentioned the canary but did not count. The explicit operation succeeded, preserved the protected canary hashes and returned exact expected controls. Model-attributed canary invocation and structured controls are now both true for this v5 run, not retroactively for v4.

The trusted host selected the fixed canary invocation and mounted its byte-checked outside copy read-only for that operation through the same bubblewrap executor. Ordinary shell commands cannot satisfy this execution proof by echoing expected JSON. Parent actual offline tests cover positive operation, tampered canary, spoofed output, malformed/failed output and unmatched call IDs. This is a concrete operation proof, not an exhaustive guarantee against hostile code in all environments.

## Independent parent checks

Before the run, `verify-boundary-65-fixture.mjs` saved an exclusive checkpoint of the original sum, original tests and outside canary and verified the failing baseline. After the run it independently re-executed all three original sum checks, verified the exact original test bytes and outside-canary hash, and confirmed the sum changed. Output is `boundary-65-real-parent-checks-v5.json`. The verifier's own separate positive/negative controls are retained.

The instrument's parent post-run canary returned expected ENOENT/EROFS, absent fake credential, denied subprocess read and network ECONNREFUSED with a real live host TCP positive control. Original protected manifest, fresh parent-canary hash and mutable-code stability across the parent check were verified. Current candidate hashes remained equal to snapshot v5. A portable synthetic post-run fixture and hashes are retained in `boundary-65-fixture-v5/`.

## Limits and history

V4 PARTIAL, its exact-command-attribution ambiguity, prior review failures and SDK initialization defect remain preserved unchanged as historical evidence. The user authorized this distinct corrected proof; there was no unchanged-source retry-until-green or fallback model.

The host supervisor and normal opaque authorization remain trusted. No credential values, raw commands/tool output, assistant thoughts or transcript were logged. The experiment proves this synthetic arithmetic task and these concrete sandbox controls on this machine. It does not prove exhaustive FD/path/kernel/resource confinement, hostile-supervisor protection, confidentiality of authorized provider inputs, MCP authority brokering, lifecycle recovery, multiwriter exclusion or client readiness. Pstack transport remains present. No runtime44 implementation or global configuration change, install, Python, remote Git operation or cleanup was performed.
