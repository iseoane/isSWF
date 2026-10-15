**PRECALL v4: PASS** (static; no provider prompt, Python, writes, agents, installs, or network).

Snapshot v4 payload hashes match manifest (`aaecbc82…`, `e773c967…`); worker profile/base unchanged. Delta v3→v4 read directly, minimal:

- Shared `initializeNoProviderSession` (`refreshOnCreate: true, allowModelNetwork: false`) used by preflight and run; exact gpt-6-luna/high, no fallback, `sandbox_shell` only, `mcp__*` excluded, boolean `hasConfiguredAuth` only — no credential contents.
- SDK 1.2.0 confirms `allowModelNetwork` gates only create-time catalog refresh; with `false` the refresh is local, so the v3 auth-snapshot gap closes without suppressing the real prompt's provider network.
- Run-stage enum plus `providerPromptStarted`; sanitized catch emits no error, transcript, or raw output.

Evidence: v4 preflight PASS with `providerPromptStarted: false`, controls/post-canary/host-TCP preserved; initialized-no-provider shows `configuredAuth: true`, `providerRequest: false`; fresh v4 fixture exists with correct shape.

**Blockers: none.**

Prior v3 `--run-model` PARTIAL remains unresolved; this allows only ONE bounded corrected LunaHigh call, with no behavior or client-ready claim.
