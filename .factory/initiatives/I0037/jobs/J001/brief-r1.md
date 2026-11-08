# Job brief J001 / r1

## Identity and authorization

- Source: operator `/project-release patch`, 2026-11-08.
- Authorization: version bump PR, merge after exact-head CI, tag v1.8.2 and GitHub release publication. Coordinator-owned; no worker dispatch.
- Target base: 5507debbcde9593e24fbfcfa1655d3131370c83e (main after #244).

## Objective

Publish v1.8.2 from verified native CI archives of the exact merge commit.

## Methodology considered

- verification-principles (acceptance needs evidence beyond tests: archive inspection and checksums): **selected**; evidence: verifyRelease, report matching, remote digest readback.
- isswf-writing (release notes are documentation): **selected**; evidence: notes follow the v1.8.1 structure, actual changes only.
- Other triggers do not apply.

## Steps

1. Release PR `chore: release v1.8.2`: `package.json` and `.claude-plugin/plugin.json` to 1.8.2, plus this I0037 record. Exact-head CI, merge.
2. Wait for `Quality` on the merge commit; download `native-package-*` and `platform-evidence-*` from that run only.
3. Inspect inventory (single `package` root, regular files, no traversal/private/project-release), `verifyRelease`, receipt vs reports, compiler parity, distinct artifact ids.
4. Rename outer archives `isswf-1.8.2-bun-{linux,windows}-x64.tgz` (bytes unchanged), write `isswf-1.8.2-evidence.json` and `SHA256SUMS.txt`.
5. Draft release at the merge commit, read back digests, publish, re-download and `sha256sum -c`.

## Exclusions

No npm, Pages, installation, consumer pin updates, or replacement of existing tags/releases.
