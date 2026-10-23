# I0006/J003: Validate published Bun workflows before stable promotion

## Objective and current authority

The operator requested actual README installation paths and real-flow tests toward a stable release. Update both README languages and test the published Linux x64 artifact in a disposable repository. Preserve the published candidate and previous attempts. Do not merge main, replace release assets, promote a failing candidate, install globally, change model routes or assume additional API-cost permission.

## Candidate and route

Published v1.1.0 binds source `62c52118cb0cf94951997b9b99896dd17478a85d`, Bun 1.4.3 and `bun-linux-x64`. Fresh GitHub assets passed their SHA256SUMS. The worker route is exactly `openai-codex/gpt-6-luna` at `high`, no fallback. Zero-provider-call preflight with existing Pi SDK 1.3.0 confirmed supported effort, configured auth and SDK OAuth subscription. No credential contents entered records or the test project.

One exclusive real-mode worker attempt was assigned to fix a two-argument sum in a scratch Git repository. The protected check and every nonmutable file were committed and fixed. Only sum.mjs was mutable. The normal installed init, retained pin, exec and isswf-job run/read/reconcile path was used with a 120-second outer deadline and retry disabled. That consumed attempt is retained and must not be reused, renamed or bypassed through another store.

## Observed blocker

Attempt BUN-REAL-A001 is terminal failure at setup with ResolveMessage. SDK initialization and provider prompt both remained false, toolCalls was zero. No real model-response or real worker boundary success is claimed.

A no-auth, no-network module-loading probe reproduces the failure. With the actual installed SDK, Node and the Bun interpreter load the SDK and typebox. The published executable and a separately compiled minimal Bun executable fail SDK/typebox resolution. Explicitly importing the SDK entry still fails at its chalk dependency. Compiling the minimal probe with packages=external does not repair it. This isolates a compiled-runtime module-resolution incompatibility, not a provider quota error or an isSWF-only dispatch transformation. Its precise upstream cause and safe remedy remain unproven.

Reproduction shape: createRequire(sdkPath + '/package.json'), require(sdkPath), require('typebox'), and import the absolute dist/index.js entry. Compare Node, Bun interpreter and a bun build --compile executable against the same installed package. Do not initialize credentials or sessions in this probe.

## Acceptance and remaining checks

- README.md and README.es.md name the published asset, private-repository access, checksum command, complete extracted package and actual Pi/Claude installation paths. They expose the current worker blocker.
- Resolve the compiled external-SDK loading failure with a regression that fails on the published artifact before claiming a fix. Do not silently substitute Node for the embedded worker runtime or mutate the existing SDK installation.
- After a repaired candidate and explicit fresh attempt admission, validate a real provider-driven worker change, attributed boundary_check, protected checks, file scope and native cessation. A successful host process alone is insufficient.
- Check retained runtime selection, status/panel and explicit migration/rollback with exact new artifacts where affected. Preserve old runtimes and attempt evidence.
- Claude requires its own host/model authorization and real execution evidence; Pi routing does not configure Claude. No Claude provider call was attempted here.
- Any changed runtime candidate needs applicable CI and exact-candidate independent review before a new release. Stable promotion remains blocked. Windows/macOS and signing are separate scopes, not implicitly passed.

## Evidence retention

Private evidence is retained under `/home/iseoane/.cache/isswf-stable-validation-au13Un`, with the repository-local pointer `tooling/.local/bun-release-delivery/stable-validation-root.txt`. It includes downloaded assets, preflight.json, request.json, committed scratch inputs, launch/read/reconcile records, immutable attempt files and no-network SDK probes for Node, interpreted Bun and minimal/published compiled Bun. These are not distribution inputs. Keep the attempt and scratch inputs; there is no automatic cleanup or replay.
