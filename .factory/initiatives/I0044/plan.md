# I0044: Publish patch release v1.8.4

Type: maintenance

Operator explicitly requests patch release, then administrative publication, then J030 analysis, then J029 analysis, all documented and pushed. Release authority covers new GitHub tag/release/assets, not installation/npm/pin changes or cleanup. Release-source integration remains a separate decision unless a verified LOW-risk repository-specific integration grant applies.

## J001

- Status: completed
- Objective: Publish v1.8.4 from reviewed committed source and exact-main native CI artifacts.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None for published v1.8.4; consumer adoption and unresolved J030/J029 acceptance are separate.
- Next step: Publish this bounded administrative receipt and curated J030 then J029 analysis under current operator grant. No source/tag/assets mutation, installation, cleanup or automatic implementation. Release calls2/6 reviews1/3 corrections0/2; native actors terminal complete, no additional analysis actor/model pair used.

### Acceptance

- Package/plugin/coordinator release literals align at1.8.4, old versions and release assets preserved.
- Exact source receives required independent review and CI before integration; exact-main CI supplies Linux/Windows packages and matching evidence.
- Actual archives inspected for safe inventory, full receipt/source hashes, version/source/target/compiler/runtime identities and private-material exclusion.
- New draft target/assets read back before publication; published assets re-downloaded and checksums verified. No installation, npm publication, migration or cleanup.

### Evidence

- Latest published release v1.8.3 verified; no v1.8.4 remote tag found at preflight. Main b8fea8daac933598b59597200e66db39f993c5f0 includes PR261 after CI3/3 and explicit merge approval.
- Unique local I0042 receipt28eea80 retained, normally merged with origin/main into708bf54a7f669027e71f56a10206e388e72109af; no reset/rebase or cleanup. Release branch release/v1.8.4. Administrative publication follows release as requested; receipt ancestry preservation is not an extra administrative delivery.
- Project release skill/procedure, installation/development/review/durable-work and feature-delivery/PR resources consumed by coordinator. Native worker/reviewer mappings already verified; current single-writer development authorization retained, no actual setup mutation. 78GiB available on repository filesystem, bounded release artifacts approximately2GiB budget; preserve unique evidence.

- Operator additionally authorizes tests needed for the subsequent analyses. Select bounded relevant local/mechanical/synthetic tests and preserve outcomes; no inferred installation, private-data access, paid provider calls or expanded actor budget. Distinguish analysis experiments from implementation and do not run destructive owner-loss probes against actual work.

- Committed release-source f82e427 changes exactly three version literals. Full node tools/check-quality.mjs PASS on that committed revision; local separate native-host CI check NOT_RUN. Worker A001 and exact independent V001 Standards/Spec/aggregate PASS0findings, patch2057bytes SHA256d013c20ab2a796b78205e80de27060cf67b059d26d7d59d48815238e78817a42.
- Published/read back OPEN PR262 https://github.com/iseoane/isSWF/pull/262 exactf82e427 targeting mainb8fea8d; exact English risk/body/head observed, LOW metadata risk distinct from underlying previously integrated MEDIUM policy. Last run42912380757 in_progress; no green CI, merge or release claim.

- PR262 exactf82e427 Quality42912380757 SUCCESS3/3. Normal protected LOW metadata-risk integration with expected-head guard, MERGED ba4993b003b6f58c489858466bb4500a56a626c9. Fresh exact-main Quality42971013320 SUCCESS3/3; both archives and all platform/host/source-isolation reports from that same run.
- Actual archives inspected148 safe entries each,132 receipt files, full verifyRelease source/blob hashes PASS. Both1.8.4/Bun1.4.3/source+methodologyba4993b; shared runtimeId97910694afaf818a4fa2da15d75538bad3300cfe20f9ba6cb785623b2b5a8795. Linux artifactIde207eb76165c53c2af828b1dd289208bb1ebb2006ceeb2c7249bfa1b93d69d62, Windowsfce98fe0f6f3827a1994f07a8abc71062fec8b7d7da879d3f8fddd7eeb415b52. No native live-provider/general migration claim.
- Published https://github.com/iseoane/isSWF/releases/tag/v1.8.4 after draft target/four asset digest readback; tag exactba4993b. Re-downloaded published assets, SHA256SUMS PASS3/3: Linuxfa6a296e680601afc3fc2bb366d8716b9c246c270cb8bb95c3edbc9fb2973fa3, Windows9e2d1b222c48470c0663117f482478fd8cc8ef93a3eb498b91231eef67549f6b, evidence9709602edf69ab45b1152eca00e82ad5e95030f180dd5d1bea9fc49bba483cf0. Originals/sanitized evidence retained ignored tooling/.local/release-v1.8.4. Earlier pending statements remain historical only.
