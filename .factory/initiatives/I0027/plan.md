# I0027: Windows portability of failing regression tests

Type: bug

## Objective and authority

Make the thirteen regression tests reported in #152-#164 pass on native Windows without elevation while preserving their Linux guarantees. Operator requested triage on 2026-11-03 ("Haz el triage"); this plan records triage only and authorizes no implementation, commits beyond these records, or publication by itself.

## Triage summary

Observed on Windows 11 Pro 10.0.26300, Node.js 26.12.1, LF clone at 7721bc6. Probable cause groups (inferences until reproduced): A path containment or separator comparison (#153, #157-#162); B unprivileged Windows filesystem operations (#152 fsync, #164 symlink); C file mode (#163); D undiagnosed (#154-#156). Related earlier issues #83 (grant must be external), #84 (CRLF checkout), #85 (directory fsync EPERM) and #86 (symlink fixtures) share these classes but cover different tests and code, so they are related, not duplicates. Draft PR #87 (I0009/J007, feature/native-windows-factory, 329 commits behind main at triage) changes Windows path boundaries, LF provenance and directory durability and may already address groups A and B; every job first checks it. Not filed yet: the local check-quality frontmatter failure under core.autocrlf=true, already covered by #84.

## J001

- Status: pending
- Objective: Make tests/audit-archive.mjs pass on Windows without elevation, preserving its Linux guarantees (#152; group B: directory fsync EPERM; related #85).
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None; triaged ready-for-agent.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/audit-archive.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- None.

## J002

- Status: pending
- Objective: Make tests/issue-intake.mjs pass on Windows without elevation, preserving its Linux guarantees (#153; group A: path separator in expected brief path).
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None; triaged ready-for-agent.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/issue-intake.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- None.

## J003

- Status: pending
- Objective: Make tests/planner-task.mjs pass on Windows without elevation, preserving its Linux guarantees (#154; group D: undiagnosed http400 fetch count; same message as #155).
- Depends on: None
- Brief: [brief-r1.md](jobs/J003/brief-r1.md)
- Blocker: None; triaged ready-for-agent.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/planner-task.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- None.

## J004

- Status: pending
- Objective: Make tests/reviewer-task.mjs pass on Windows without elevation, preserving its Linux guarantees (#155; group D: undiagnosed http400 fetch count; same message as #154).
- Depends on: None
- Brief: [brief-r1.md](jobs/J004/brief-r1.md)
- Blocker: None; triaged ready-for-agent.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/reviewer-task.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- None.

## J005

- Status: pending
- Objective: Make tests/release-package.mjs pass on Windows without elevation, preserving its Linux guarantees (#156; group D: undiagnosed strict equality).
- Depends on: None
- Brief: [brief-r1.md](jobs/J005/brief-r1.md)
- Blocker: None; triaged ready-for-agent.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/release-package.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- None.

## J006

- Status: pending
- Objective: Make tests/researcher-quota-fallback.mjs pass on Windows without elevation, preserving its Linux guarantees (#157; group A: grant-must-be-external; related #83).
- Depends on: None
- Brief: [brief-r1.md](jobs/J006/brief-r1.md)
- Blocker: None; triaged ready-for-agent.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/researcher-quota-fallback.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- None.

## J007

- Status: pending
- Objective: Make tests/researcher-session-affinity.mjs pass on Windows without elevation, preserving its Linux guarantees (#158; group A: capacity-scope-must-be-separate).
- Depends on: None
- Brief: [brief-r1.md](jobs/J007/brief-r1.md)
- Blocker: None; triaged ready-for-agent.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/researcher-session-affinity.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- None.

## J008

- Status: pending
- Objective: Make tests/review-panel-capacity.mjs pass on Windows without elevation, preserving its Linux guarantees (#159; group A: capacity-scope-must-be-separate).
- Depends on: None
- Brief: [brief-r1.md](jobs/J008/brief-r1.md)
- Blocker: None; triaged ready-for-agent.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/review-panel-capacity.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- None.

## J009

- Status: pending
- Objective: Make tests/worker-capacity-api.mjs pass on Windows without elevation, preserving its Linux guarantees (#160; group A: capacity-scope-must-be-separate).
- Depends on: None
- Brief: [brief-r1.md](jobs/J009/brief-r1.md)
- Blocker: None; triaged ready-for-agent.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/worker-capacity-api.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- None.

## J010

- Status: pending
- Objective: Make tests/worker-capacity.mjs pass on Windows without elevation, preserving its Linux guarantees (#161; group A: runs store must be outside project and source trees).
- Depends on: None
- Brief: [brief-r1.md](jobs/J010/brief-r1.md)
- Blocker: None; triaged ready-for-agent.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/worker-capacity.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- None.

## J011

- Status: pending
- Objective: Make tests/worker-dependencies.mjs pass on Windows without elevation, preserving its Linux guarantees (#162; group A: runs store must be outside project and source trees).
- Depends on: None
- Brief: [brief-r1.md](jobs/J011/brief-r1.md)
- Blocker: None; triaged ready-for-agent.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/worker-dependencies.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- None.

## J012

- Status: pending
- Objective: Make tests/successor-model-config.mjs pass on Windows without elevation, preserving its Linux guarantees (#163; group C: candidate tree and permissions mismatch).
- Depends on: None
- Brief: [brief-r1.md](jobs/J012/brief-r1.md)
- Blocker: None; triaged ready-for-agent.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/successor-model-config.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- None.

## J013

- Status: pending
- Objective: Make tests/reviewer-original-evidence.mjs pass on Windows without elevation, preserving its Linux guarantees (#164; group B: symlink EPERM; related #86).
- Depends on: None
- Brief: [brief-r1.md](jobs/J013/brief-r1.md)
- Blocker: None; triaged ready-for-agent.
- Next step: Reproduce on current main, check whether draft PR #87 already fixes the cause, then diagnose with isswf-debug and repair with a regression test.

### Acceptance

- node tests/reviewer-original-evidence.mjs exits 0 on Windows 11 in an unprivileged terminal.
- The same test still exits 0 on Linux CI.
- node tools/check-quality.mjs no longer reports this test as failing on Windows.

### Evidence

- None.

