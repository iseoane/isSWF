# I0015: isSWF v1.6.0 release

Type: maintenance

## J001

- Status: in-progress
- Objective: Publish aligned isSWF v1.6.0 GitHub release with verified native Linux/Windows packages from exact approved main source.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None for preparation; source review/CI, exact-main artifacts and verified draft are publication gates.
- Next step: Coordinator prepares two-manifest version delta, independent review and protected source PR/CI, then exact-main native artifacts and verified GitHub release; no installation or npm publication.

### Acceptance

- Versions aligned, exact source reviewed and CI verified; protected source integration only within applicable grant/policy.
- Both actual native archives/receipts/source hashes/compiler/report identities inspected and matched; sanitized provenance and SHA-256 assets verified remotely.
- No overwritten tags/assets, unrelated state changes, installations, migrations, new model selections or cleanup; limitations explicit.

### Evidence

- Current operator approved PR119 integration and release; PR119 integrated asfc8fe2c with approved unchanged tree.
- Latest observed releasev1.5.1; version1.6.0 selected for added optional evidence tools and methodology/config ownership improvements; initial tag/release collision check negative.
- Project-only release skill/procedure consumed. Existing native CI pins Bun1.4.3; no local compiler installation required.
