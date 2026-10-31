# I0020: Honest blocked host checks

Type: enhancement

## J001

- Status: completed
- Objective: Resolve #126: Report missing native host prerequisites as explicit BLOCKED with nonzero exit and keep unexecuted changed tests inconclusive, without weakening real failure gates.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None for source-verified scope; PR/native CI and integration are separate gates.
- Next step: Publish one final record head, verify exact-head native CI and integrate only within applicable risk/authority; retain final remote receipt on the PR.

### Acceptance

- An absent pi-subagents bundle or required host SDK/Claude executable is detected before host fixture/provider effects where applicable and produces structured BLOCKED with the missing prerequisite and nonzero exit. A present but broken dependency, invalid artifact, real assertion, spawn error or timeout remains a real failure, not automatically BLOCKED.
- Preserve the normal configured native test path and meaningful PASS/failure assertions; Pi-only mode must not demand an unused Claude binary. Supported explicit dependency paths are honored without automatic searching/fallback.
- Portable summary/runner reports BLOCKED distinctly when a check actually returns it and never labels an unexecuted native suite as verified. Dependency-free injected fixture checks are labelled as such, not live host evidence; BLOCKED cannot let required CI pass.
- Reviewer guidance makes changed but unexecuted required tests inconclusive unless sufficient exact-candidate execution evidence from supported CI/coordinator is supplied; optional unavailable checks do not become a universal block.
- Select focused TDD for executable classification: commit the discriminating test-only RED, then GREEN separately with full SHAs/commands/assertions. Include missing dependency, optional-unused dependency, broken existing dependency/real failure and passing-result controls; real native Linux/Windows suite evidence remains required final CI. No network/model calls needed for regression fixtures.

### Evidence

- Current operator explicitly requests all remaining ordered issues121,126,127,125,128. This unit only: 126. Bounded native preparation/implementation/checks/feature commits/push/PR/CI in iseoane/isSWF; integration only under applicable LOW-risk protected expected-head authorization. No other unit, direct-main push, bypass, installation, release, deployment or cleanup.
- Source base e9fde26615b806495abdc1dbea56f40ca69bed76; actual issue observation and affected files inspected.

## Source verification

Candidate f54621958055af4aa270c54de6578c087bff25cf; implementation and independent Standards/Spec review verified as retained in jobs/J001/delivery.md. TDD RED50f3d91102ae33af876fd777aa0cdc10d355aca0 replayed from its exact archive: exit1 vs expected2; GREENbea01c945eb375d950d8b9716436f37864231faf and corrected candidatef54621958055af4aa270c54de6578c087bff25cf injected regressions PASS. Coordinator full portable quality, locked ESLint/Knip, focal/docs/diff PASS on f546219; native Linux synthetic suite PASS using explicit already-installed pinned pi-subagents0.83.0 path (no install/provider call). Initial no-edit required-guide blocker, original missing-bundle BLOCKED and diagnostic packet/phrase failures are retained; compact equivalent review wording resolved packet compatibility without raising caps. No native Windows/live-model result claimed before final CI. Completed denotes source implementation/verification, not unobserved PR, CI or merge. Later results will be external PR receipts, not recursive record commits.
