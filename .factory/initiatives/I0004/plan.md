# I0004: Pi and Claude Code portability

Type: enhancement

This coordinator-owned plan records reported progress, not execution permission or process liveness.

## J001

- Status: blocked
- Objective: Deliver a shared factory methodology with Pi integration preserved and Claude Code integration prepared
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md) (pending until prepared)
- Blocker: Native dispatch requires committed job/brief, explicit local checkpoint permission and finite model-call authority/account coverage. No .pi/settings.json is present in this checkout. No provider invocation is authorized by a plan record.
- Next step: Finalize grounding and brief; obtain only missing checkpoint/provider scope before native dispatch. Do not substitute Pstack or coordinator implementation.

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

## J002

- Status: pending
- Objective: Validate the prepared Claude Code integration in an authorized real Claude Code environment
- Depends on: J001
- Brief: [brief-r1.md](jobs/J002/brief-r1.md) (pending until prepared)
- Blocker: Requires J001 candidate and separately confirmed Claude Code authentication/account coverage and execution authority.
- Next step: Use the validation procedure after J001; no Claude model prompts or global installation now.

### Acceptance

- Discover coordinator skills and assigned agents using the prepared installation.
- Complete one bounded implementation and independent review without claiming unverified recovery or isolation.
- Retain actual runtime version, candidate identity, observations and remaining limitations.

### Evidence

- None.
