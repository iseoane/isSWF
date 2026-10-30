# I0012: Coordination reliability patch release

## Objective and authorization

Operator explicitly requests a release of current work. Prepare and publish next GitHub patch release v1.5.1 after source/version/package/independent review and exact-source CI gates. No npm publication, installation, project-pin update, host setting change, Pages dispatch or unrelated fixes. Use existing release builder and real Windows/Linux x64 archive scope matching v1.5.0; investigate current artifact creation rather than invent reports. The prior direct-main exception concerned I0011 and is not a standing delivery policy; use a feature branch/PR for release-version source changes and existing LOW-risk integration scope only if applicable exact-candidate gates pass. No force/protection bypass or replacing existing release/tag. At most two independent review rounds; ask before third.

Type: maintenance

## J001

- Status: ready
- Objective: Prepare and verify v1.5.1 source and real native release artifacts, then publish under explicit release grant.
- Depends on: None
- Brief: [brief-r2.md](jobs/J001/brief-r2.md)
- Blocker: none for source preparation; exact review/CI and actual merged-source packages pending.
- Next step: Review source candidate, deliver version/source-only release skill and minimal CI package retention through protected PR, then inspect exact-main Windows/Linux archives for authorized publication.

### Acceptance

- Core/Pi package/plugin version aligned1.5.1, no existing pins or releases changed.
- Actual Windows/Linux x64 archives built from exact committed release source, inspected/receipt-verified and checksummed with honest compiler/native execution limits.
- Exact source reviewed/CI verified before release publication; notes explain seven coordination corrections, state/setup adoption, host capability limits and no automatic installation.
- Remote release/tag/assets read back and SHA verified; no claim native Windows legacy mutation/isolation equivalence or live-model journeys.

### Evidence

- Latest publishedv1.5.0; clean source628edc1e5e886629d33348df6eb7ee317df880cd and Quality41045598877 SUCCESS. Native shell Bun absent; Debian WSL existing Bun1.4.4/Node24.22.1/npm11.19.1, while Quality pins Bun1.4.3. Both previous native tgz assets required, not just reports. Worker stopped after aligned version edits and local notes, no artifact constructed. Coordinator inspected current matrix: tests/platform-package already builds/packs/native-validates with pinned Bun1.4.3 on both targets. Retain those success-only tgz outputs rather than install another local compiler. User additionally selected reusable source-project release skill; brief-r2 owns expanded acceptance and gates.
