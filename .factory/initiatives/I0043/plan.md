# I0043: Publish patch release v1.8.3

Type: maintenance

Trusted current operator requests administrative closure then a patch release, followed by I0042 then I0009/J030. This explicitly authorizes release preparation, source feature PR/CI, publication of new v1.8.3 tag/GitHub release and verified native assets. Integration uses normal protected PR route under current release request and existing LOW-risk permission; no bypass, force, npm publication, installation, consumer update, deletion or cleanup. Latest observed release v1.8.2; source version1.8.2 at9ecbed1caa7d999dfe6599c9abe00cbd63fbbf78. Preserve existing tags/runtime and pending I0042/J030 evidence.

## J001

- Status: pending
- Objective: Publish v1.8.3 from reviewed committed source with exact-main CI and independently inspected Linux/Windows native archives.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: Administrative closure PR must integrate before version PR; new version/tag collision and native exact-source evidence must be checked.
- Next step: Finish closure PR, prepare version-only change (package/plugin and required coordinator loaded-version literal), perform affected local quality and independent exact-candidate review, source PR/CI/merge, then exact-main native artifacts, inventory/receipt/report/checksum inspection, draft/readback/publication/readback. Keep I0042 and J030 pending until release delivery.

### Acceptance

- All current version owners equal1.8.3 without historical/version-pin rewrites; source reviewed and required exact-head CI pass before integration.
- Exact-main Quality passes, both native packages and matching reports come from that same source/run and share pinned Bun compiler.
- Inspect actual archive inventory, receipts/source hashes, target/version/compiler, platform/host/isolation evidence and exact checksums; never infer archive correctness from green CI alone.
- New v1.8.3 release/tag points at approved source; draft assets read back before publishing, remote digests verified; no existing release/tag overwrite or consumer installation.

### Evidence

- Current explicit operator release request; project-only release skill and procedure read. Latest release v1.8.2 at1d02e2658157fae67c9b3eac0546225698c27bb2 observed through gh release view.
- Available disk approximately79GiB on checkout volume and7.6GiB in temporary filesystem; use ignored tooling/.local/release-v1.8.3 for retained downloads, no duplicate per-actor builds.
