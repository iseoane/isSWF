# I0009: Windows initialization compatibility

Type: bug

This coordinator-owned plan records local progress, not execution permission or process liveness.

## J001

- Status: in-review
- Objective: Repair Windows init EPERM without regressing Linux initialization or weakening file-sync failures and process-identity recovery guards
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: Compiled Bun Windows/Linux artifact validation and independent assessment remain pending; native Windows worker lifecycle/isolation is not implemented by this unit.
- Next step: Review the retained local candidate, run the native compiled-artifact matrix, and separately scope Windows worker execution support.

### Acceptance

- Native Windows and Linux initialize and repeat initialization without changing pins or models
- Live, malformed and inaccessible process identity cannot authorize recovery
- File sync failures remain fatal; Linux directory fsync and legacy identity remain intact
- CI includes native Node initialization and compiled-package init coverage on both systems
- Documentation distinguishes initialization from full worker and migration/recovery support

### Evidence

- jobs/J001/brief-r1.md
- tests/init-platform.mjs
- tests/platform-package.mjs
- Native Windows Node initialization regression: PASS
- Linux/WSL Node initialization regression: PASS
- Linux/WSL tests/release-package.mjs: PASS
- Documentation structure and bilingual links: PASS
- Windows regression additionally covers PID reuse and CIM failure blocking; Linux covers directory-sync failure propagation
- Normalized standalone Linux full-suite attempt: FAIL in tests/reviewer-task.mjs:265, expected response-complete but observed blocked; cause not established
- Whole-checkout portable suite on the Windows-mounted tree: FAIL at existing CRLF-sensitive skill-frontmatter assertion; not a passing suite

## J002

- Status: in-review
- Objective: Repair issue #83 by accepting canonical external plan grants on native Windows without weakening internal-path rejection on Linux
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: Independent semantic assessment and exact-head CI pending; correction retained in source commit 8ea8d2adc978aace0a17fc517b79d04a94ed2440
- Next step: Review the committed boundary correction; #85's subsequently authorized local repair is tracked in J004, not a complete Windows agent-execution claim

### Acceptance

- External siblings pass authority validation on Windows and Linux
- Internal/root grants and aliases resolving inside the project remain rejected
- Exercise the pinned-launcher journey and retain any subsequent independent failure

### Evidence

- https://github.com/iseoane/isSWF/issues/83
- jobs/J002/brief-r1.md
- tests/plan-grant-boundary.mjs: Windows RED before fix, Windows/Linux PASS afterward
- Linux tests/initiative-plan.mjs: PASS
- https://github.com/iseoane/isSWF/issues/85

## J003

- Status: in-review
- Objective: Repair issue #84 with a repository-owned LF checkout policy preserving exact runtime integrity on Windows and Linux
- Depends on: None
- Brief: [brief-r1.md](jobs/J003/brief-r1.md)
- Blocker: Independent assessment and exact-head CI pending; no native Windows Bun artifact or live-agent validation
- Next step: Review the retained checkout policy and candidate evidence; preserve existing user working copies and raw executable digest checks

### Acceptance

- Clean Windows and Linux text checkouts remain byte-identical to Git with autocrlf true or false
- Binary bytes remain unchanged
- Native public worker-route admission reaches its intended no-SDK guard while invalid routes refuse without claims
- Host static checks pass on a fresh candidate and migration guidance preserves user work

### Evidence

- https://github.com/iseoane/isSWF/issues/84
- jobs/J003/brief-r1.md
- tests/checkout-line-endings.mjs: Windows RED before policy, Windows/Linux PASS afterward
- Clean candidate native Windows/Linux host-portability and worker-route-admission: PASS
- Linux release-package regression: PASS
- Full-suite WSL run on retained candidate: FAIL with 60-second reviewer-task subprocess timeout; not a green suite
- Later full Linux regression on native Linux filesystem: PASS on candidate 30e303fd928d639074d2505785f7d31052982ea9 containing J004; previous failure retained, no cause attribution

## J004

- Status: in-review
- Objective: Repair issue #85 first-plan Windows publication using platform directory-sync policy and truthful interrupted-claim handling, then run regression
- Depends on: J002
- Brief: [brief-r1.md](jobs/J004/brief-r1.md)
- Blocker: Independent assessment/CI and Windows Bun validation pending; subsequent #86 repair and Bubblewrap verification are tracked in J005
- Next step: Review #85 source commit 5a59fff5e09225851f9a88eba2823775ba5160dc; retain distinctions between Linux isolation, native Windows focal checks and complete agent readiness

### Acceptance

- Native Windows and Linux publish/repeat the first plan through the pinned launcher
- Regular-file sync errors remain fatal and Linux directory flush remains mandatory
- Pre/post-publication failures preserve claims and available bytes, report publication stage and block automatic retry/no-op success
- Installed tools retain a complete import closure and native job pins include the new transitive platform primitive
- Run regression after focal checks and report independent deficiencies without automatically correcting them

### Evidence

- https://github.com/iseoane/isSWF/issues/85
- jobs/J004/brief-r1.md
- tests/plan-publication.mjs: Windows RED before repair; Windows/Linux PASS afterward
- Native Windows Node pinned init/first-plan/repeat, boundaries, checkout, host-static and worker-route checks: PASS
- Full Linux node tools/check-quality.mjs: PASS on retained candidate 30e303fd928d639074d2505785f7d31052982ea9
- Linux Bun packed executable regression: PASS; isolated synthetic worker SKIP because Bubblewrap unavailable
- Native Windows factory-tools-install and initiative-plan: FAIL at unchanged directory-symlink fixture creation with EPERM; not application unsafe-path acceptance
- https://github.com/iseoane/isSWF/issues/86
- Source commit 8ea8d2adc978aace0a17fc517b79d04a94ed2440 preserves #83/#84; #85 was subsequently committed as 5a59fff5e09225851f9a88eba2823775ba5160dc under explicit operator authorization, without push

## J005

- Status: in-review
- Objective: Correct #86's Windows directory-alias fixtures and resolve the missing Linux Bubblewrap verification prerequisite
- Depends on: J004
- Brief: [brief-r1.md](jobs/J005/brief-r1.md)
- Blocker: Independent review and exact-head remote CI pending; native Windows Bun and complete worker isolation remain outside verified results
- Next step: Review the local fixture correction; preserve Linux sandbox PASS and native Windows targeted PASS as distinct evidence; no issue closure or push selected

### Acceptance

- Use Windows junction fixtures without elevation, while retaining actual Linux directory-symlink coverage
- Assert directory aliases exist, application refusal occurs, and aliased target data is unchanged
- Include both suites in the existing native Linux/Windows CI matrix
- Verify canonical /usr/bin/bwrap and run actual previously skipped Linux sandbox checks without changing the runtime's executable identity controls

### Evidence

- https://github.com/iseoane/isSWF/issues/86
- Native Windows pre-repair EPERM fixture failures retained with J004
- Clean runtime/test candidate 4e8e88b03349fecbde345c96936edfead802a576: native Windows factory-tools-install and initiative-plan PASS
- Same candidate on native Linux filesystem: full portable quality PASS with ISSWF_TEST_BUN_WORKER=1; Bun compiled synthetic isolated task PASS
- Explicit node tests/diagnostic-probes.mjs . --sandbox: PASS including host positive control and actual namespace/network/read-only boundaries
- Operator installed Debian Bubblewrap 0.12.0-1~deb13u1 interactively; /usr/bin/bwrap and namespace smoke verified; no runtime pin bypass or privilege escalation by the assistant
- Direct factory-tools-install run from the older unnormalized working checkout fails exact LF/CRLF byte comparison before the alias check; preserved as checkout limitation, not represented as green
- Local CI matrix wiring added after the retained runtime/test candidate; remote CI not run
