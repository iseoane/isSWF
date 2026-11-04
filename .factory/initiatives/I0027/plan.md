# I0027: Windows portability of failing regression tests

Type: bug

## Objective and authority

Make the thirteen regression tests reported in #152-#164 pass on native Windows without elevation while preserving their Linux guarantees. Operator requested triage on 2026-11-03 ("Haz el triage"); this plan records triage only and authorizes no implementation, commits beyond these records, or publication by itself.

## Triage summary

Observed on Windows 11 Pro 10.0.26300, Node.js 26.12.1, LF clone at 7721bc6. Probable cause groups (inferences until reproduced): A path containment or separator comparison (#153, #157-#162); B unprivileged Windows filesystem operations (#152 fsync, #164 symlink); C file mode (#163); D undiagnosed (#154-#156). Related earlier issues #83 (grant must be external), #84 (CRLF checkout), #85 (directory fsync EPERM) and #86 (symlink fixtures) share these classes but cover different tests and code, so they are related, not duplicates. Draft PR #87 (I0009/J007, feature/native-windows-factory, 329 commits behind main at triage) changes Windows path boundaries, LF provenance and directory durability and may already address groups A and B; every job first checks it. Not filed yet: the local check-quality frontmatter failure under core.autocrlf=true, already covered by #84.

## J001

- Status: completed
- Objective: Make tests/audit-archive.mjs pass on Windows without elevation, preserving its Linux guarantees (#152; group B: directory fsync EPERM; related #85).
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/audit-archive.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- PR #170 (047d0a6) directory fsync
- PR #171 (3e3b90f) Windows permission model; test passes on Windows
- Integrated in main; main CI green at e2d3421 (2026-11-04); linked issues closed.

## J002

- Status: completed
- Objective: Make tests/issue-intake.mjs pass on Windows without elevation, preserving its Linux guarantees (#153; group A: path separator in expected brief path).
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/issue-intake.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- PR #169 (7171230) separator-agnostic assertion; test passes on Windows
- Integrated in main; main CI green at e2d3421 (2026-11-04); linked issues closed.

## J003

- Status: completed
- Objective: Make tests/planner-task.mjs pass on Windows without elevation, preserving its Linux guarantees (#154; group D: undiagnosed http400 fetch count; same message as #155).
- Depends on: None
- Brief: [brief-r1.md](jobs/J003/brief-r1.md)
- Blocker: None.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/planner-task.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- PR #169 (7171230) basename(p.dir); test passes on Windows
- Integrated in main; main CI green at e2d3421 (2026-11-04); linked issues closed.

## J004

- Status: completed
- Objective: Make tests/reviewer-task.mjs pass on Windows without elevation, preserving its Linux guarantees (#155; group D: undiagnosed http400 fetch count; same message as #154).
- Depends on: J014
- Brief: [brief-r1.md](jobs/J004/brief-r1.md)
- Blocker: None.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/reviewer-task.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- PR #178 (7f43305) batched pinned git reads; test passes on Windows from a normal clone
- Integrated in main; main CI green at e2d3421 (2026-11-04); linked issues closed.

## J005

- Status: completed
- Objective: Make tests/release-package.mjs pass on Windows without elevation, preserving its Linux guarantees (#156; group D: undiagnosed strict equality).
- Depends on: J015
- Brief: [brief-r1.md](jobs/J005/brief-r1.md)
- Blocker: None.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/release-package.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- tests/release-package.mjs PASS on Windows 11 after J015 (#179)
- Integrated in main; main CI green at e2d3421 (2026-11-04); linked issues closed.

## J006

- Status: completed
- Objective: Make tests/researcher-quota-fallback.mjs pass on Windows without elevation, preserving its Linux guarantees (#157; group A: grant-must-be-external; related #83).
- Depends on: None
- Brief: [brief-r1.md](jobs/J006/brief-r1.md)
- Blocker: None.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/researcher-quota-fallback.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- PR #169 (7171230) containment
- PR #170 (047d0a6) directory fsync; test passes on Windows
- Integrated in main; main CI green at e2d3421 (2026-11-04); linked issues closed.

## J007

- Status: completed
- Objective: Make tests/researcher-session-affinity.mjs pass on Windows without elevation, preserving its Linux guarantees (#158; group A: capacity-scope-must-be-separate).
- Depends on: None
- Brief: [brief-r1.md](jobs/J007/brief-r1.md)
- Blocker: None.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/researcher-session-affinity.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- PR #169 (7171230) containment
- PR #170 (047d0a6) directory fsync; test passes on Windows
- Integrated in main; main CI green at e2d3421 (2026-11-04); linked issues closed.

## J008

- Status: completed
- Objective: Make tests/review-panel-capacity.mjs pass on Windows without elevation, preserving its Linux guarantees (#159; group A: capacity-scope-must-be-separate).
- Depends on: J014
- Brief: [brief-r1.md](jobs/J008/brief-r1.md)
- Blocker: None.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/review-panel-capacity.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- PR #178 (7f43305) batched pinned git reads; test passes on Windows from a normal clone
- Integrated in main; main CI green at e2d3421 (2026-11-04); linked issues closed.

## J009

- Status: completed
- Objective: Make tests/worker-capacity-api.mjs pass on Windows without elevation, preserving its Linux guarantees (#160; group A: capacity-scope-must-be-separate).
- Depends on: None
- Brief: [brief-r1.md](jobs/J009/brief-r1.md)
- Blocker: None.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/worker-capacity-api.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- PR #169 (7171230) containment
- PR #170 (047d0a6) directory fsync; test passes on Windows
- Integrated in main; main CI green at e2d3421 (2026-11-04); linked issues closed.

## J010

- Status: completed
- Objective: Make tests/worker-capacity.mjs pass on Windows without elevation, preserving its Linux guarantees (#161; group A: runs store must be outside project and source trees).
- Depends on: None
- Brief: [brief-r1.md](jobs/J010/brief-r1.md)
- Blocker: None.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/worker-capacity.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- PR #169 (7171230) containment and fault hook
- PR #170 (047d0a6) directory fsync; test passes on Windows
- Integrated in main; main CI green at e2d3421 (2026-11-04); linked issues closed.

## J011

- Status: completed
- Objective: Make tests/worker-dependencies.mjs pass on Windows without elevation, preserving its Linux guarantees (#162; group A: runs store must be outside project and source trees).
- Depends on: None
- Brief: [brief-r1.md](jobs/J011/brief-r1.md)
- Blocker: None.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/worker-dependencies.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- PR #169 (7171230) separator-agnostic assertions; test passes on Windows
- Integrated in main; main CI green at e2d3421 (2026-11-04); linked issues closed.

## J012

- Status: completed
- Objective: Make tests/successor-model-config.mjs pass on Windows without elevation, preserving its Linux guarantees (#163; group C: candidate tree and permissions mismatch).
- Depends on: None
- Brief: [brief-r1.md](jobs/J012/brief-r1.md)
- Blocker: None.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/successor-model-config.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- PR #171 (3e3b90f) Windows permission model; test passes on Windows
- Integrated in main; main CI green at e2d3421 (2026-11-04); linked issues closed.

## J013

- Status: completed
- Objective: Make tests/reviewer-original-evidence.mjs pass on Windows without elevation, preserving its Linux guarantees (#164; group B: symlink EPERM; related #86).
- Depends on: None
- Brief: [brief-r1.md](jobs/J013/brief-r1.md)
- Blocker: None.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/reviewer-original-evidence.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- PR #172 (63c4952) directory junction fixture; test passes on Windows from a normal clone
- Integrated in main; main CI green at e2d3421 (2026-11-04); linked issues closed.

## J014

- Status: completed
- Objective: Keep reviewer, planner and diagnostic preparation within their deadlines on Windows by reducing per-file git process starts (#176).
- Depends on: None
- Brief: [brief-r1.md](jobs/J014/brief-r1.md)
- Blocker: None.
- Next step: Measure with isswf-performance, batch tree and blob reads with one ls-tree -r and one cat-file --batch per checkpoint, add a regression bounding git process starts, then reassess test timeouts.

### Acceptance

- node tests/reviewer-task.mjs, tests/review-panel-capacity.mjs and tests/release-package.mjs exit 0 on Windows 11 in an unprivileged terminal.
- Prepared bundles stay byte-identical and refusal behavior is unchanged on Linux and Windows.
- A regression test bounds the number of git process starts per prepared bundle.

### Evidence

- PR #178 (7f43305) batched pinned git reads and literal pathspecs; reviewer-task and review-panel-capacity pass on Windows
- Integrated in main; main CI green at e2d3421 (2026-11-04); linked issues closed.

## J015

- Status: completed
- Objective: Make owner and process identity checks work on Windows or refuse explicitly, without weakening Linux checks (#179).
- Depends on: None
- Brief: [brief-r1.md](jobs/J015/brief-r1.md)
- Blocker: None.
- Next step: Map every /proc identity read (isswf, native-recovery, worker-lifecycle, release-package test), decide equivalent Windows identity or explicit refusal per caller, then implement with tests.

### Acceptance

- node tests/release-package.mjs exits 0 on Windows 11 in an unprivileged terminal.
- Linux owner and process identity checks are unchanged.
- Windows either supplies an equivalent identity (process ID, start time, boot time) or refuses with an explicit documented unsupported message.

### Evidence

- Windows 11 clean no-hardlink clone with #179/#180/#173 patches: node tools/check-quality.mjs PASS; node tests/release-package.mjs PASS
- Integrated in main; main CI green at e2d3421 (2026-11-04); linked issues closed.

## J016

- Status: completed
- Objective: Make the token-native-auto-pi async-completion wait deadline-based so loaded runners do not fail it spuriously (#185).
- Depends on: None
- Brief: [brief-r1.md](jobs/J016/brief-r1.md)
- Blocker: None.
- Next step: Replace the 100 x 5 ms poll with a deadline-based wait and add a case proving a missing event still fails.

### Acceptance

- tests/token-native-auto-pi.mjs waits for async-complete with a time deadline (not a fixed iteration count) and still fails when the event is absent.
- The test passes on Windows 11 while another quality suite runs in parallel.

### Evidence

- PR #190 merged: deadline-based 25 ms polling; 60/60 Windows passes

## J017

- Status: completed
- Objective: Scope the check-quality per-test timeout so only slow tests or Windows get 300 s (#186).
- Depends on: None
- Brief: [brief-r1.md](jobs/J017/brief-r1.md)
- Blocker: None.
- Next step: Measure per-test durations on Windows and Linux, then apply a per-test or platform-scoped timeout in check-quality.

### Acceptance

- tools/check-quality.mjs keeps a short default per-test timeout and applies the longer one only to named slow tests or win32.
- node tools/check-quality.mjs passes on Windows 11 and Linux CI.

### Evidence

- PR #192 merged: 300 s timeout on win32 only, 60 s elsewhere
