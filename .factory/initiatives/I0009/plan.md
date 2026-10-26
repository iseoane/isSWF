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
