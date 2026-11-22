# I0056: State migration recovery coverage gaps

Type: enhancement

Limits the operator accepted when closing I0009/J029 on 2026-11-14, plus one release-build defect found by its Windows CI.

## J001

- Status: completed
- Objective: Exercise actual interrupted-owner recovery through the compiled Bun artifact, and an interruption inside claim retirement (clearClaim), on Linux and Windows.
- Depends on: None
- Brief: [brief-r2.md](jobs/J001/brief-r2.md)
- Blocker: None.
- Next step: None.

### Acceptance

- Interrupted recovery through the installed compiled Bun executable at the same three moveState boundaries, or an explicit evidence-backed reason it cannot be exercised.
- Interruption after complete.json and inside clearClaim (a retained `.isswf-transition-retired-*` directory) has documented, tested recovery or refusal behavior.
- No production test hook; strict owner identity unchanged.

### Evidence

- 2026-11-14: tests/state-interruption.mjs covers only the Node release launcher; Bun cannot load the `node --import` preload. V002 findings J029-R3-04 and J029-R3-06.
- 2026-11-22: research r1 found no pause seam in the compiled Bun binary without a production hook; brief r2 covers Bun through the same interrupted states. Merged in PR #390 (65579bf5) after V001 pass (F1 wording fixed by the coordinator, docs-only override); CI ran the Bun branch: PASS on Linux and Windows.

## J002

- Status: completed
- Objective: tools/build-release.mjs accepts a release output on a different Windows drive from the source.
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- A source on one drive and an output on another builds; output inside the source still refuses.

### Evidence

- 2026-11-14 PR322 Windows CI: source D:\a\isSWF\isSWF and output under C:\Users\...\Temp failed "The source repository and release output must be separate trees". path.win32.relative returns an absolute path across drives, which isWithin treats as inside (tools/build-release.mjs:16).
- 2026-11-22: merged in PR #389 (c3c9fb67) after V001 pass; the duplicate helper in tools/factory-package.mjs was merged into one shared isWithin. CI success on Linux and Windows.

## Close

- Closed 2026-11-22. J001 merged in #390, J002 in #389.
- Full check: `node tools/check-quality.mjs` exit 0 in 1120 s at 65579bf5f140db701f13f0345b9f6d24c6882d58.
- Known limits carried forward:
  - J001: the literal mid-migration pause runs only on the Node launcher; Bun is tested through constructed interrupted states, and its executable is the build output, not an installed copy. `.pending-*` and `.isswf-transition-stage-*` leftovers are not tested; automatic removal of retired claims is an open product decision.
  - J002: no live two-drive build; covered through `path.win32` semantics.
