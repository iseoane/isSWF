---
name: project-release
description: "Trigger: release, publish a version, emitir una release. Prepare and verify this repository's GitHub release and native artifacts."
disable-model-invocation: true
---

# Release this repository

## Activation Contract

Use only for an explicit isSWF repository release request. For preparation-only requests, stop before remote writes. This project-only skill is not a consumer installation procedure.

## Hard Rules

- Establish current publication authority; this skill, a past release and saved configuration grant none.
- Keep package/core/plugin versions aligned. Build committed source, never infer publication from a manifest.
- Preserve old tags, assets, installed pins, model choices and unique evidence. Never force or overwrite to fix a collision.
- Do not install compilers, publish npm, deploy Pages or update consumer projects as a release side effect.
- Require exact-candidate review, CI and inspected actual archives; green badges or platform reports alone are insufficient.
- Some CI steps (`tests/source-host-isolation.mjs` and `tests/host-prerequisites.mjs`) are not part of `tools/check-quality.mjs`. Run them locally with `node tooling/quality/host-checks.mjs`; a `SKIPPED` line is not a pass, and a green local run does not replace exact-head CI.

## Decision Gates

| Evidence | Action |
| --- | --- |
| Existing release/tag collision | Reconcile identity; stop before changing it. |
| Local compiler absent or mismatched | Use verified native CI packages with the pinned common compiler; otherwise report the exact missing capability. |
| Failed checks, missing archive or stale source | Block publication; preserve the failure. |
| Verified candidate without an explicit publication grant | Stop before tag or draft; report the candidate state and the exact grant needed. |
| Verified candidate and actual publication grant | Publish new tag/release and checksum-verified assets; read them back. |

## Execution Steps

1. Read [the release procedure](references/procedure.md), its required canonical contracts and the project's setup/active brief. Inspect current main, versions, tags and release state.
2. Prepare bounded version/notes changes and a canonical brief. Choose source delivery under current authority; the default is a reviewed feature PR, not a remembered direct-main exception.
3. Verify the exact retained candidate and affected deltas. Retain adverse verdicts. Before publication require successful CI on the actual release source.
4. Obtain both native packages and reports from that exact source. Inspect archive inventory, receipts, embedded source, version, compiler, target and checksums. Name missing native/live coverage honestly.
5. Create a new draft release/tag only under authorization; upload the exact verified files and checksums, then publish after draft readback. Re-download or compare remote digests. Report failure or drift without blind replacement.

## Output Contract

Return version, tag/source SHA, release URL/state, artifact identities/checksums, exact CI/review evidence, adoption steps and limitations. Distinguish built, verified, draft and published. Do not claim installation or live-model acceptance.

## References

- [Release procedure and artifact checklist](references/procedure.md): every step from candidate resolution to published-asset readback.
- [Coordinator](../../../.agents/skills/isswf-coordinator/SKILL.md): recording the brief and grants, and any native delegation in step 2.
