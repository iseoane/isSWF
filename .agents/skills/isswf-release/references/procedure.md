# isSWF release procedure

This is a source-project procedure. Read [technical installation/build contracts](../../../../docs/installation.md), [development/publication checks](../../../../docs/en/development.md), [review guidance](../../../roles/references/review.md) and [durable records](../../../../docs/durable-work.md) before their corresponding operation. Use actual current code where these contracts describe historical paths. These references own runtime semantics; do not copy them into release notes.

## Resolve the candidate

Inspect Git status, canonical remote/main, latest release/tag and actual manifest owners. Current version owners are `package.json` and `.claude-plugin/plugin.json`; confirm against `tools/build-release.mjs` before editing. Choose a new semantic version appropriate to the changes and keep the previous runtime available. Do not broadly replace historical examples, checkpoints or project pins. Record authorization and grants in the existing single state's canonical initiative/brief before native delegation.

Use a feature PR and exact-head CI unless the operator explicitly selects another current source-delivery boundary. A prior direct-main exception is not a standing rule. Merge authorization and release authorization are distinct. A synthetic PR commit with a matching tree is useful source evidence but is not the actual merged source identity for a new release: obtain fresh exact-main packages and reports before tagging that main commit.

## Prefer the existing native CI artifacts

`.github/workflows/quality.yml` runs `tests/platform-package.mjs` on native Ubuntu/Windows x64 with the same pinned Bun compiler. The test builds committed HEAD, verifies the receipt, npm-packs, installs offline in a temporary consumer, verifies the installed artifact identity and exercises version, usage refusal, read-only CLI, Unicode/space paths and worktrees. Host discovery, synthetic native delegation and source-isolation tests run separately; inspect their actual reports and limitations. No real model journey is established by these tests.

After all required jobs succeed, download both `native-package-ubuntu-latest` and `native-package-windows-latest`, and their matching `platform-evidence-*` artifacts from the exact same run. Do not use another run's tarball with current reports. The archive-retention step must run only after successful validation; retain only the top-level packed `.tgz`, not the temporary consumer/store or full workspace. Package outputs may consume about 1 GiB per native build as a conservative allowance; check actual available space and sizes rather than claiming this estimate was measured.

Inspect existing CI artifacts first; missing local Bun is not permission to install or silently change the CI compiler. A separately authorized local build must use the existing builder, a full committed SHA, an absent output outside the repository and one consistent exact engine version. Cross-compilation is not native execution; disclose target downloads and request uncovered installation/network permissions before them. Do not normalize production files to hide known CRLF failures.

## Inspect before publishing

For each downloaded tarball:

1. List entries and reject unexpected roots, path traversal, symlinks and private/development material. Preserve the entire `package` root; do not distribute only the executable.
2. Extract in a fresh bounded external directory. Use `tools/release-source.mjs::verifyRelease()` to verify full inventory/source/blob hashes, version and source revision. Confirm `methodologySha` is the intended source, target OS/architecture correct, compiler equal on both platforms, shared runtime identity and distinct target artifact identities as appropriate.
3. Match the corresponding platform report's revision/version/artifactId. Inspect host, native-delegation and source-isolation evidence. Keep static, synthetic, actual host discovery and live-model evidence separate. Verify the project-only release skill is not accidentally packaged; preserve the factory package allowlists.
4. Compute SHA-256 of the exact archives intended for upload. Give them unambiguous version/target names, e.g. `isswf-VERSION-bun-linux-x64.tgz` and `isswf-VERSION-bun-windows-x64.tgz`. Renaming the outer archive must not change its bytes.
5. Sanitize public reports for private absolute paths without removing actual result/source/artifact identity or limitations. Preserve original reports privately. Include a checksum manifest for public assets and concise provenance/review evidence. Never include credentials or raw private transcripts.

A local Windows process can inspect both inventories/receipts but cannot claim to have executed the Linux binary. Rely on the actual native CI report for that execution and explicitly identify the observer.

## Publish and verify

Draft notes from actual changes since the last tag. Describe adoption without automatic installation: explicit setup reconciliation for saved project instructions, separate package updates/pin migration, unchanged model choices/grants and remaining host/legacy limitations. Do not imply npm availability or all-platform/live-model acceptance from a version or green CI.

Create a new tag at the exact approved source and a new draft GitHub release; refuse existing-tag/release ambiguity. Upload verified archives and evidence, read back target/tag/asset names/digests and draft state, then publish within the current grant. Compare remote SHA-256 digests or re-download into a fresh path; finish only after the published release and all required assets match. Checksums are integrity evidence, not publisher signatures.

A source revert does not withdraw already downloaded artifacts or undo a publication. Any deletion/replacement needs its own authorization and retention analysis. Keep existing releases, build evidence and unique work; release work does not authorize cleanup, installation, Pages deployment or new provider calls.
