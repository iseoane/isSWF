# I0037: isSWF v1.8.1 and v1.8.2 releases

Type: maintenance

## Objective and authority

Publish patch release v1.8.2 from `main` through the project-only release skill, and record the v1.8.1 release that was published earlier on 2026-11-08 without a canonical record. Operator requests 2026-11-08: "si es de riesgo bajo integra, y luego saca release patch" (v1.8.1) and `/project-release patch` (v1.8.2), which grant the release PR, its merge after exact-head CI, tag creation and GitHub release publication. No npm, Pages, installation or consumer project update.

## Decisions

- confirmed by operator: patch version 1.8.2 (changes since v1.8.1 are methodology text only, I0036).
- Source delivery: release PR touching only the version owners plus this record; release source is the merge commit on `main` and its `Quality` run.

## J001

- Status: completed
- Objective: Publish v1.8.2 with verified native archives and record v1.8.1.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: None; v1.8.2 published.

### Acceptance

- Package and Claude plugin versions are 1.8.2 at the tagged source.
- Both native archives come from the `Quality` run on the exact tagged `main` commit, pass inventory inspection and `verifyRelease`, and match their platform reports.
- Release v1.8.2 is published with the archives, evidence JSON and `SHA256SUMS.txt`; a fresh download passes `sha256sum -c`.
- The v1.8.1 publication evidence is recorded.

### Evidence

- v1.8.1 (published before this record): release PR #241, source `e6a7773c8b83ce4edb64bf3c59f0082dab383f9a`, Quality run 42514044509, Bun 1.4.3. Inventory single `package` root, regular files only; `verifyRelease` passed on both; shared runtime `bbed99d2…`; artifact ids linux `7d1ecdf5…`, windows `36ed75d5…` match their platform reports; host and source-isolation PASS on both. SHA-256: linux `bed01abd4ffa4d5ed8a52778899f945b339bcc64398d7667433b340d88671d3b`, windows `46d8bf945a01deebd985dd923725a35807718e7e6c6e45bf99f095360bb3b7da`, evidence `4aa829295e5c554510e88e7ea84a14319205c6b48fb5744fb53c6f173ccd0cbf`. Draft readback then publish; fresh download `sha256sum -c` OK. Deviation: the procedure was followed from `.claude/skills/project-release` read manually, without this canonical record at the time.
- v1.8.2: release PR #245 (exact-head CI pass), source `1d02e2658157fae67c9b3eac0546225698c27bb2`, Quality run 42517754893 success, Bun 1.4.3. Inventory single `package` root, regular files only, no traversal, private material or project-release skill; `verifyRelease` passed on both; shared runtime `cff41ad8…`; artifact ids linux `4b09a4b7…`, windows `f9a8f7c2…` match their platform reports; host and source-isolation PASS on both. SHA-256: linux `5b17272615fb8f29b2563348bfb7f6dbaf832b5670ccc7d82860aa18edf8fe5a`, windows `d89f2a1c823d502c78aa8e9fba1f1ca6f7f55312937907e46c878fd29786a09b`, evidence `2a320af6597671c09c1b853fa303a047e2605347c22a1a1be07e31efd34ead33`. Draft readback, then published as Latest at https://github.com/iseoane/isSWF/releases/tag/v1.8.2; fresh download `sha256sum -c` OK.
- Review limits carried into the release: #243 and the 8acc411..752d4ed delta of #244 were checked by the coordinator only.
