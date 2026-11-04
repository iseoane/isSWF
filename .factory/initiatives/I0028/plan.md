# I0028: Git worktree checkout support

Type: bug

## Objective and authority

Make factory tools that read the source repository's Git object store work from linked Git worktrees, which the project setup recommends for parallel work. Operator requested opening and triaging the report on 2026-11-03 ("Abre la del wt y triage"); this plan records triage only and authorizes no implementation by itself.

## Triage summary

Reported in #173 while working on I0027. Observed on Windows from a linked worktree: `tests/reviewer-original-evidence.mjs` fails with `ENOENT ... realpath '<checkout>/.git/objects'` at `tools/diagnostic-probes.mjs:29`, while the same commit passes from a normal clone. Probable cause (inference until reproduced on Linux): `tools/diagnostic-probes.mjs:9` hard-codes `../.git/objects` instead of resolving the common Git directory. No duplicate found (#89 concerns binding an agent to a prepared worktree, a different behavior). Other tools may share the assumption; the job checks for it.

## J001

- Status: completed
- Objective: Resolve the source object store correctly from a linked Git worktree (#173).
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: Reproduce from a linked worktree on Linux, search tools for other hard-coded .git paths, then fix with a regression test that runs from a worktree.

### Acceptance

- node tests/reviewer-original-evidence.mjs exits 0 when run from a linked Git worktree.
- The same test still exits 0 from a normal clone on Linux and Windows.
- A regression test fails if the object store path is resolved without the common Git directory.

### Evidence

- Windows 11 clean no-hardlink clone with #179/#180/#173 patches: node tools/check-quality.mjs PASS; node tests/release-package.mjs PASS; tests/reviewer-original-evidence.mjs PASS from a linked worktree; tests/source-objects-path.mjs RED before, GREEN after
- Integrated in main; main CI green at e2d3421 (2026-11-04); linked issues closed.

## J002

- Status: completed
- Objective: Refuse explicitly when the source object store cannot be resolved at import of diagnostic-probes (#188).
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None.
- Next step: Reproduce ENOTDIR and lowercase-drive gitdir cases on Windows, then add the refusal and edge-case tests.

### Acceptance

- A non-ENOENT error resolving .git (for example ENOTDIR or EACCES) yields a named refusal or the default path, not a raw fs error at import.
- Tests cover relative gitdir, CRLF .git file and missing commondir.
- Drive-letter case of gitdir on Windows does not falsely refuse a legitimate linked worktree, verified by a check.

### Evidence

- PR #191 merged: fallback to refused default path, win32 drive-letter normalization; independent review approved
