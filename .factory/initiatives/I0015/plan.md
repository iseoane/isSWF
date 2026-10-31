# I0015: isSWF v1.6.0 release

Type: maintenance

## J001

- Status: completed
- Objective: Publish aligned isSWF v1.6.0 GitHub release with verified native Linux/Windows packages from exact approved main source.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None; reviewed source, exact-main native CI, archive inspections and remote publication/digest checks completed.
- Next step: Operator may explicitly adopt the release separately; no automatic installation, pin/model update, npm publication, cleanup or other job.

### Acceptance

- Versions aligned, exact source reviewed and CI verified; protected source integration only within applicable grant/policy.
- Both actual native archives/receipts/source hashes/compiler/report identities inspected and matched; sanitized provenance and SHA-256 assets verified remotely.
- No overwritten tags/assets, unrelated state changes, installations, migrations, new model selections or cleanup; limitations explicit.

### Evidence

- Current operator approved PR119 integration and release; PR119 integrated asfc8fe2c with approved unchanged tree.
- Latest observed releasev1.5.1; version1.6.0 selected for added optional evidence tools and methodology/config ownership improvements; initial tag/release collision check negative.
- Project-only release skill/procedure consumed. Existing native CI pins Bun1.4.3; no local compiler installation required.
- V001 reviewer21271601 Standards/Spec/aggregate PASS metadata586a2ae; publication source PR120 head6fbc496 CI41232621466 PASS3/3, expected-head protected LOW merge as maine9b4e86f28723c013d1edf8706066dd97becb5d9 (same head tree). Exact-main Quality41232911506 SUCCESS3/3 supplied both native archives/reports.
- Actual Linux/Windows archives: safe inventory inspected,118 payload files and106 current Git source entries per target verified; version1.6.0, source/methodologySHAe9b4e86, native targets/Bun1.4.3 and report artifact identities matched. Linux --version executed locally; Windows native execution CI-attributed. No all-platform/live-agent certification.
- Releasev1.6.0 PUBLISHED https://github.com/iseoane/isSWF/releases/tag/v1.6.0 at exacte9b4e86. Draft430133458 verified before publication; all4 remote asset digests matched local bytes and fresh redownload checksum validation PASS. See delivery.md and retained ignored release receipts; no installation/npm/pin/model/cleanup side effects.
