# I0001 / J013 / r2

## Result and authority

Deliver a reproducible, metadata-only audit inventory and an actionable preserve-all retention decision. Operator requested the remaining v1 jobs and separately authorized the completed bounded disk cleanup. That cleanup is not agreement to a broader retention policy.

Base: `63e2145d4a0692a18087345f2bc013071ab6374e`. Keep prior A001 and all historical paths unchanged. This unit owns the job-local inventory/reproduction test, curated summary, delivery card and canonical progress. No production runtime, cleanup engine or new mandatory CI dependency.

## Current grounding

- `docs/durable-work.md`, Proposed audit retention policy: proposal, not adopted policy; preserve current evidence/history, curate new job receipts, keep raw/private development records local, separate authorization before retirement.
- `tools/factory-package.mjs`, `payloadPaths`, package verification and `installTools`: explicit resource/planning-tool closures exclude audit, test and development payloads. Existing public installation checks verify the actual installed closure.
- `tools/check-quality.mjs`, `tooling/quality/eslint.config.mjs`, `tooling/quality/knip.json`: active source checks and explicit analysis scope. A literal-reference census is not a complete dynamic dependency proof.
- J013/A001: prior aggregate inventory explicitly left per-artifact roles and reproduction dependencies unknown. New inventory retains that uncertainty for each path rather than guessing deletability from filenames.

## Acceptance and decision boundary

1. Inventory each tracked/nonignored-untracked/ignored audit path with tracking class, size and tracked mode/blob where available. Do not open audit payloads or follow them for classification.
2. Map observed literal references from bounded regular tracked text consumers to exact artifact paths. List unresolved references and skipped consumers. Do not label unmatched files unused or disposable.
3. Verify the scanner with synthetic tracked/untracked evidence, an unresolved reference, a payload-read guard and unchanged evidence. Preserve every real artifact.
4. Distinguish durable published receipts, raw/private local records, reproducibility bundles and CI outputs as policy categories. Unknown individual roles/dependencies stay explicit and preserved.
5. Give the operator a concrete policy choice: preserve every existing path/history through v1, keep new raw/private material local, publish only reviewed curated job evidence, retain structural distribution exclusions, and require a separately scoped verified retirement decision later. No cleanup authority or client-ready security claim follows.

Criteria: SEC-04 and the explicit pre-v1 audit-retention gate. Metadata and allowlists do not constitute secret scanning. The required operator agreement is pending, not inferred from technical tests, earlier cleanup or a passing review.

## Verification and delivery

Run the job-local `inventory.test.mjs`; run `inventory.mjs` at the repository root and retain the full path census locally, not as a tracked audit bulk dump. Record exact source hashes, source base, counts, reference limitations and actual checks in the curated receipt. Run aggregate quality, ESLint and Knip. Before publication, supply the complete functional unit and relevant distribution/policy source to one independent native reviewer, then require exact PR/main CI success. Do not repeat review merely because operator agreement remains pending.

## Exclusions

No mass classification by extension, deletion, relocation, archive movement, history rewrite, global configuration, client material, installations, Python or another status store. Technical delivery may be awaiting human agreement; only the operator accepts policy and whole v1.
