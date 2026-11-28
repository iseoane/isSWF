# I0067: Recovery beyond the current bounded cases

Type: enhancement

The operator created this initiative on 2026-11-27 ("prepara iniciativa para el recovery con el j012"). It takes the "Recovery" proposal from `docs/en/future-actions.md` (broader recovery across reboot, surviving processes and lost external responses, which needs its own design and evidence) and I0066 J012 (state migration phase in the journal), which moved here. Plan approval is preparation only; each job needs an explicit operator start. Every job is S or M. On 2026-11-28 the operator accepted the J001 design note's recommendations: add P1 to P3 as J003 to J005, leave P4 to P6 for a later initiative, and decide D1 (no automatic lease reclaim) and D2 (no automatic push on an integrate rerun); P7 and D3 to D7 stay as recorded in the note.

## J001

- Status: completed
- Size: M
- Objective: A design note names, from the current code, which interruptions isSWF recovers from today and which it does not (reboot, a process that survives its session, a lost external response such as a pull request merge or a CI result), and proposes S or M jobs for the gaps worth closing, each with its evidence.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: None. Previously: Size M (research only). Ground the launcher journal and recovery in `tools/isswf.mjs`, `tools/state-migration.mjs`, `isswf-integrate` resume paths and dispatch notes; read `docs/durable-work.md`.

### Acceptance

- Each recovery path in the code is listed with what it covers and its test.
- Each uncovered interruption names a realistic trigger and its consequence today.
- The proposed jobs are ranked by impact and cost; the operator decides which to add.

### Evidence

- [Design note](jobs/J001/design-note.md) at 0fcb227d45a8493f2c0861d9d6a57a3d4a0e056e; review V001 (pass). The operator accepted its recommendations on 2026-11-28 (J003 to J005, D1 and D2 no).

## J002

- Status: completed
- Size: M
- Objective: A state migration records its phase in the journal, and recovery reads that phase instead of inferring it from directory names.
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None.
- Next step: None. Previously: Size M (phase recovery on two platforms). Ground the stage, retired and pending directories in `tools/state-migration.mjs` and the journal in `tools/isswf.mjs`. Moved from I0066 J012; its earlier brief is I0066 `jobs/J012/brief-r1.md`.

### Acceptance

- The journal records the phases staged, swapped, retired and done; recovery from each phase is tested.
- Existing interrupted-migration fixtures still recover.
- Works on Windows and Linux.

### Evidence

- Candidate efc648c931b4a2c1a1e285569afdaa087ab1707f; attempts A001, A002; reviews V001 (fail, corrected), V002 (pass), V003 (pass after the CI miss recorded in V003).

## J003

- Status: completed
- Size: S
- Objective: An interrupted `isswf exec` no longer leaves a lease that blocks recovery: the lease records the tool child, `exec` removes it after the child exits on Ctrl-C, and `inspect` and `recover` report a stale lease with its owner's ceased verdict instead of a bare blocker.
- Depends on: None
- Brief: [brief-r1.md](jobs/J003/brief-r1.md)
- Blocker: None.
- Next step: Design note P1 (U1, U2, U14). Ground in `tools/isswf.mjs:211-242` and `:399-420`; Windows also emits SIGBREAK and SIGHUP (review V001 F1).

### Acceptance

- The lease also names the child PID (it already names the tool); after SIGINT, SIGHUP or SIGBREAK reaches `exec`, the lease is removed once the child has exited, whatever the child's exit signal, on Windows and Linux.
- `inspect` shows each lease with the owner's ceased verdict and tolerates a damaged lease file; `recover` refuses a stale lease with a named reason.
- No lease is removed automatically (operator decision D1, 2026-11-28).

### Evidence

- Candidate 8b50c7f7bc8f588b1fb22cb78a6dad9679197343; attempts A001, A002; reviews V001 (fail, corrected), V002 (pass). The operator approved integrating the `.github/workflows/quality.yml` change on 2026-11-28.

## J004

- Status: pending
- Size: S
- Objective: The owner checks are tested for a reboot: a live PID with a different boot identity counts as ceased, and `recover` and `recover-state` proceed.
- Depends on: J002
- Brief: [brief-r1.md](jobs/J004/brief-r1.md)
- Blocker: None.
- Next step: Design note P2 (U3). Ground in `tools/isswf.mjs:133-168`; start after J002 merges, since it shares `tools/state-migration.mjs`.

### Acceptance

- A fixture with an alive PID and a changed boot identity makes `ceased` true on Linux and Windows.
- `recover` and `recover-state` proceed on such an owner; existing dead-PID fixtures still pass.

### Evidence

- None.

## J005

- Status: completed
- Size: S
- Objective: The documented integrate rerun outcomes are tested and visible: after a failed push or a failed cleanup, a rerun gives its named refusal or `already-closed`, `state` reports a local divergence, and each refusal names the exact manual step.
- Depends on: None
- Brief: [brief-r1.md](jobs/J005/brief-r1.md)
- Blocker: None.
- Next step: Design note P3 (U5, U6). Ground in `tools/isswf-integrate.mjs:96-196` and `tests/isswf-integrate.mjs:216-259`.

### Acceptance

- Tests cover a rerun after a failed push (`primary-diverged`) and after a failed worktree or branch removal (`already-closed`).
- `state` reports `merged` with a local-divergence reason when the local base is ahead of the remote.
- No automatic push is added (operator decision D2, 2026-11-28).

### Evidence

- Candidate f0bff297991223d7b76745ad4d53b3e7836ecab8; attempts A001, A002; reviews V001 (fail, corrected), V002 (pass).
