# I0067: Recovery beyond the current bounded cases

Type: enhancement

The operator created this initiative on 2026-11-27 ("prepara iniciativa para el recovery con el j012"). It takes the "Recovery" proposal from `docs/en/future-actions.md` (broader recovery across reboot, surviving processes and lost external responses, which needs its own design and evidence) and I0066 J012 (state migration phase in the journal), which moved here. Plan approval is preparation only; each job needs an explicit operator start. Every job is S or M.

## J001

- Status: in-progress
- Size: M
- Objective: A design note names, from the current code, which interruptions isSWF recovers from today and which it does not (reboot, a process that survives its session, a lost external response such as a pull request merge or a CI result), and proposes S or M jobs for the gaps worth closing, each with its evidence.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: Size M (research only). Ground the launcher journal and recovery in `tools/isswf.mjs`, `tools/state-migration.mjs`, `isswf-integrate` resume paths and dispatch notes; read `docs/durable-work.md`.

### Acceptance

- Each recovery path in the code is listed with what it covers and its test.
- Each uncovered interruption names a realistic trigger and its consequence today.
- The proposed jobs are ranked by impact and cost; the operator decides which to add.

### Evidence

- None.

## J002

- Status: in-progress
- Size: M
- Objective: A state migration records its phase in the journal, and recovery reads that phase instead of inferring it from directory names.
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None.
- Next step: Size M (phase recovery on two platforms). Ground the stage, retired and pending directories in `tools/state-migration.mjs` and the journal in `tools/isswf.mjs`. Moved from I0066 J012; its earlier brief is I0066 `jobs/J012/brief-r1.md`.

### Acceptance

- The journal records the phases staged, swapped, retired and done; recovery from each phase is tested.
- Existing interrupted-migration fixtures still recover.
- Works on Windows and Linux.

### Evidence

- None.
