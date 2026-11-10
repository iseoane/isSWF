# I0043: Publish patch release v1.8.3

Type: maintenance

Trusted current operator requests administrative closure then a patch release, followed by I0042 then I0009/J030. This explicitly authorizes release preparation, source feature PR/CI, publication of new v1.8.3 tag/GitHub release and verified native assets. Integration uses normal protected PR route under current release request and existing LOW-risk permission; no bypass, force, npm publication, installation, consumer update, deletion or cleanup. Latest observed release v1.8.2; source version1.8.2 at9ecbed1caa7d999dfe6599c9abe00cbd63fbbf78. Preserve existing tags/runtime and pending I0042/J030 evidence.

## J001

- Status: completed
- Objective: Publish v1.8.3 from reviewed committed source with exact-main CI and independently inspected Linux/Windows native archives.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None for published v1.8.3; consumer installation/adoption and empirical adherence remain outside release completion.
- Next step: Publication verified; retain this one bounded record-only receipt without changing tag/source/artifacts. Continue I0042 next, then I0009/J030, reconciling pinned inputs, native tool capabilities, budgets and pending incident evidence. Release worker40e761d2 and reviewer f040e564 terminal complete; calls spent2/6, reviews1/3, corrections0/2. No cleanup, installation or consumer migration.

### Acceptance

- All current version owners equal1.8.3 without historical/version-pin rewrites; source reviewed and required exact-head CI pass before integration.
- Exact-main Quality passes, both native packages and matching reports come from that same source/run and share pinned Bun compiler.
- Inspect actual archive inventory, receipts/source hashes, target/version/compiler, platform/host/isolation evidence and exact checksums; never infer archive correctness from green CI alone.
- New v1.8.3 release/tag points at approved source; draft assets read back before publishing, remote digests verified; no existing release/tag overwrite or consumer installation.

### Evidence

- Current explicit operator release request; project-only release skill and procedure read. Latest release v1.8.2 at1d02e2658157fae67c9b3eac0546225698c27bb2 observed through gh release view.
- Administrative PR258 merged384d41a8bf06d9edb1d436eb293b262713953a57 after exact8c25adc499bebcdac83fb7abf04a420a04b5d6d2 Quality42899844232 SUCCESS3/3. I0041 completed; I0042 preparation retained; J030 unique branch25282b36be2098e7472c89572aa609f3f131df81 and private evidence preserved.
- Release source PR259 head3d18dd165c6f82382f64f5808a0519a9519b3a3e: full local portable quality PASS on committed source, independent Standards/Spec PASS in V001, exact-head Quality42901353041 SUCCESS3/3; protected merge e4bd1f2d935bc7f46620e1500d7f065fb2d5c808. Exact-main Quality42902085126 SUCCESS3/3, native package and evidence artifacts downloaded from that run only.
- Inspected both actual tarballs:148 safe entries each,132 receipt inventory files, full verifyRelease source/blob hashes PASS, version1.8.3, revision/methodologySha e4bd1f2d935bc7f46620e1500d7f065fb2d5c808, common Bun1.4.3 and runtimeId2258084f3cfe6f3764f2566c0f66ee86e6669aa9ea729f5a4f0ff13e548280b9. Linux artifactIde5844476456f35de6569214921d3dfdbaebf40033a8c3ce69413e4ff4504b315; Windows artifactId0a9d50cf5c565e6eeb5ffee9fcb73ff2c1ebb339b47f71db42f2f6f4fa50f52b. Matched platform/host/source-isolation reports PASS; actual runner steps include synthetic delegation and Linux sandbox checks, not live-model certification.
- Published https://github.com/iseoane/isSWF/releases/tag/v1.8.3 at2026-11-10T21:14:30Z. Tag read back e4bd1f2d935bc7f46620e1500d7f065fb2d5c808. Draft source/four assets checked before publication, then downloaded published assets anew and sha256sum -c SHA256SUMS.txt PASS3/3. Full identities, sanitized reports and checksum manifest are release assets; local originals/inspection retained under ignored tooling/.local/release-v1.8.3. No existing release overwrite, npm publication, installation or consumer update.
