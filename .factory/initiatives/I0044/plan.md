# I0044: Publish patch release v1.8.4

Type: maintenance

Operator explicitly requests patch release, then administrative publication, then J030 analysis, then J029 analysis, all documented and pushed. Release authority covers new GitHub tag/release/assets, not installation/npm/pin changes or cleanup. Release-source integration remains a separate decision unless a verified LOW-risk repository-specific integration grant applies.

## J001

- Status: in-progress
- Objective: Publish v1.8.4 from reviewed committed source and exact-main native CI artifacts.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None for bounded release preparation; source review, exact-head/main CI and archive inspection remain gates.
- Next step: Dispatch one native worker for aligned version literals and committed-source local quality, then independent exact-candidate review and coordinator-owned PR/CI/release. Calls0/6, reviews0/3, corrections0/2, max20min/call. After publication, retain administrative receipts and analyze J030 then J029 without implementation/model probes; publish curated findings.

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
