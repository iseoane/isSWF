# I0028: Git worktree checkout support

Type: bug

## Objective and authority

Make factory tools that read the source repository's Git object store work from linked Git worktrees, which the project setup recommends for parallel work. Operator requested opening and triaging the report on 2026-11-03 ("Abre la del wt y triage"); this plan records triage only and authorizes no implementation by itself.

## Triage summary

Reported in #173 while working on I0027. Observed on Windows from a linked worktree: `tests/reviewer-original-evidence.mjs` fails with `ENOENT ... realpath '<checkout>/.git/objects'` at `tools/diagnostic-probes.mjs:29`, while the same commit passes from a normal clone. Probable cause (inference until reproduced on Linux): `tools/diagnostic-probes.mjs:9` hard-codes `../.git/objects` instead of resolving the common Git directory. No duplicate found (#89 concerns binding an agent to a prepared worktree, a different behavior). Other tools may share the assumption; the job checks for it.

## J001

- Status: pending
- Objective: Resolve the source object store correctly from a linked Git worktree (#173).
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None; triaged ready-for-agent.
- Next step: Reproduce from a linked worktree on Linux, search tools for other hard-coded .git paths, then fix with a regression test that runs from a worktree.

### Acceptance

- node tests/reviewer-original-evidence.mjs exits 0 when run from a linked Git worktree.
- The same test still exits 0 from a normal clone on Linux and Windows.
- A regression test fails if the object store path is resolved without the common Git directory.

### Evidence

- None.
