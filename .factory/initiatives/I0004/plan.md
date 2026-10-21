# I0004: Pi and Claude Code portability

Type: enhancement

This coordinator-owned plan records reported progress, not execution permission or process liveness.

## J001

- Status: in-review
- Objective: Deliver a shared factory methodology with Pi integration preserved and Claude Code integration prepared
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md) (pending until prepared)
- Blocker: Native worker retained partial outcome on new-directory scope. Independent V001: Standards PASS, Spec FAIL and medium integration risk. Coverage finding corrected by coordinator; affected exact-candidate review remains pending. Claude live validation is J002; low-risk-only merge condition not met.
- Next step: Publish a draft PR with candidate checks and preserved V001; obtain an explicitly scoped follow-up review before source closure. Do not merge or replay consumed worker/reviewer calls.

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
