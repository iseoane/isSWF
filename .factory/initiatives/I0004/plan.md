# I0004: Pi and Claude Code portability

Type: enhancement

This coordinator-owned plan records reported progress, not execution permission or process liveness.

## J001

- Status: completed
- Objective: Deliver a shared factory methodology with Pi integration preserved and Claude Code integration prepared
- Depends on: None
- Brief: [brief-r2.md](jobs/J001/brief-r2.md) (pending until prepared)
- Blocker: None for the accepted bounded source delivery: V004 Standards PASS and Spec PASS; A003 live Claude fixture passed and operator requested merge. Historical partial/FAIL/INCONCLUSIVE outcomes remain unchanged. Exact final-head CI and guarded merge/main verification remain separate publication gates.
- Next step: Publish retained closure evidence, require exact final-head CI, then guarded merge into main and verify merge commit/main CI. No broader host, client or runtime guarantee follows.

### Acceptance

- Shared methodology does not require Pi-specific tool names; host integration states actual supported capabilities.
- Existing Pi activation and native execution retain pinned-input, route, isolation and recovery protections.
- Claude Code installation artifacts and delegation guidance follow official docs and do not imply Pi-equivalent sandbox or recovery.
- Portable checks cover deterministic installation, conflict refusal and preservation of unrelated configuration.
- A reproducible Claude Code validation procedure separates static checks from unrun model execution; independent review assesses the exact candidate.

### Evidence

- Operator conversation 2026-10-21: Pues haciendo uso de la factoría y del coordinador adelante con ello
- docs/activacion-por-proyecto.md
- docs/model-routing.md
- tools/factory-package.mjs
- .factory/initiatives/I0004/jobs/J001/A001.md
- .factory/initiatives/I0004/jobs/J001/V001.md
- Native source candidate: 2ce728c1bbc45a2dd4f11e6dd790aef9e1218587
- Coverage correction: b98bf57
- https://github.com/iseoane/isSWF/pull/81
- https://github.com/iseoane/isSWF/actions/runs/39585007640 (success at exact head 057614f6953cf276bd9815bd82ea5b1c811ada4d)
- .factory/initiatives/I0004/jobs/J001/V002.md
- .factory/initiatives/I0004/jobs/J002/A003.md
- Operator: Pues adelante con la pr y hazla merge
- .factory/initiatives/I0004/jobs/J001/V003.md
- .factory/initiatives/I0004/jobs/J001/V004.md
- Source closure candidate: 8a1256ba87419a361129b8821d8884e54ccc345a

## J002

- Status: completed
- Objective: Validate the prepared Claude Code integration in an authorized real Claude Code environment
- Depends on: J001
- Brief: [brief-r1.md](jobs/J002/brief-r1.md) (pending until prepared)
- Blocker: None for the explicitly accepted bounded A003 functional validation. Per-agent effort/model observation and simplified handoff limitations remain; no Pi-equivalent or client certification.
- Next step: Preserve accepted A001-A003 records and limitations; source closure and merge remain J001.

### Acceptance

- Discover coordinator skills and assigned agents using the prepared installation.
- Complete one bounded implementation and independent review without claiming unverified recovery or isolation.
- Retain actual runtime version, candidate identity, observations and remaining limitations.

### Evidence

- .factory/initiatives/I0004/jobs/J002/A001.md
- .factory/initiatives/I0004/jobs/J002/A002.md
- .factory/initiatives/I0004/jobs/J002/A003.md
- Operator: Ok (fresh finite A003 validation authority, not product acceptance)
- Operator: Pues adelante con la pr y hazla merge (after successful A003 and disclosed limits)
