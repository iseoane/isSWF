# I0056: State migration recovery coverage gaps

Type: enhancement

Limits the operator accepted when closing I0009/J029 on 2026-11-14, plus one release-build defect found by its Windows CI.

## J001

- Status: pending
- Objective: Exercise actual interrupted-owner recovery through the compiled Bun artifact, and an interruption inside claim retirement (clearClaim), on Linux and Windows.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Research a pause seam usable with the compiled Bun executable without adding a production test hook; reuse tests/state-interruption.mjs for the clearClaim boundary.

### Acceptance

- Interrupted recovery through the installed compiled Bun executable at the same three moveState boundaries, or an explicit evidence-backed reason it cannot be exercised.
- Interruption after complete.json and inside clearClaim (a retained `.isswf-transition-retired-*` directory) has documented, tested recovery or refusal behavior.
- No production test hook; strict owner identity unchanged.

### Evidence

- 2026-11-14: tests/state-interruption.mjs covers only the Node release launcher; Bun cannot load the `node --import` preload. V002 findings J029-R3-04 and J029-R3-06.

## J002

- Status: in-progress
- Objective: tools/build-release.mjs accepts a release output on a different Windows drive from the source.
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None.
- Next step: Fix isWithin for cross-drive paths with a focused regression test.

### Acceptance

- A source on one drive and an output on another builds; output inside the source still refuses.

### Evidence

- 2026-11-14 PR322 Windows CI: source D:\a\isSWF\isSWF and output under C:\Users\...\Temp failed "The source repository and release output must be separate trees". path.win32.relative returns an absolute path across drives, which isWithin treats as inside (tools/build-release.mjs:16).
