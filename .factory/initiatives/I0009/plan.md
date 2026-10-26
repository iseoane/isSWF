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
- Blocker: Independent semantic assessment and exact-head CI pending; first-plan publication separately fails as issue #85
- Next step: Review the retained boundary correction; do not expand implementation into #85 or claim complete Windows agent execution

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
