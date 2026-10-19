# J013 audit retention decision

## What changed and why

A job-local scanner now records every audit path's metadata and observed literal consumers. Unknown roles and reproduction dependencies remain explicit. No existing evidence is deleted or moved. A small synthetic fixture verifies the scanner without reading audit payloads.

## Visual summary

```text
existing tracked evidence/history → keep
existing untracked or ignored evidence → keep local
new reviewed delivery/review summary → owning job
raw transport, fixtures, private archives → local
unknown role/dependency → preserve, never infer unused
future retirement → separate authorization + preserved-byte proof
```

## Checks and results

From the repository root, run `node .factory/initiatives/I0001/jobs/J013/inventory.test.mjs` for the guarded synthetic case. Run `node .factory/initiatives/I0001/jobs/J013/inventory.mjs` to print a current metadata census. The full census remains local because it includes development/private artifact names; the curated `retention-verification.json` records its identity, counts and limits without publishing raw payloads.

The inventory matches literal references, not arbitrary dynamic reads. A missing match is not permission to remove a file. Distribution remains governed by the existing explicit resource and six-tool allowlists; aggregate quality includes the actual installation check.

## Independent review

Native independent review: Standards PASS and Spec PASS for the bounded source unit at `8e9608bb31c6ee3491ae31171240adbbb5337bfc`. The exact report is retained in `retention-verification.json`. Runtime-observed fixture and installed-distribution probes passed. This does not agree the policy or accept J013/v1.

## Scope

This is an inventory and conservative proposal, not a secret scanner, cleanup service, automatic classifier or new runtime dependency. Earlier snapshots and unknown reproduction dependencies remain unchanged. The separately completed disk cleanup does not adopt this policy.

## Integration risk and recovery

The scanner reads Git metadata and bounded tracked consumer text; it does not read audit payloads. Its output can expose local artifact names, so review any proposed publication separately. No real artifact is removed, no index or history rewritten, and no existing evidence link intentionally changed.

## Closure and acceptance

The requested decision is: **approve preservation of all existing audit paths and Git history through v1; keep new raw/private records local and publish only reviewed curated job evidence; preserve existing distribution exclusions; require separately authorized proof before any later retirement.** Unknown per-artifact roles and reproduction dependencies remain preserved, not silently certified or waived for deletion.

This decision does not authorize cleanup, publication of private archives, client deployment or whole-v1 acceptance. Policy agreement remains pending until the operator explicitly responds.

## Blockers and next action

Complete source review and exact PR/main CI. Then obtain the single policy decision above. There is no need to choose files for deletion to approve the preserve-all scope.
