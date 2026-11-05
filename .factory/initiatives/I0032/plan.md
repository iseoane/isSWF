# I0032: Claude Code initiative status mod

Type: enhancement

## Objective and authority

Give the operator a Claude Code mod, shown beside the chat, with collapsible sections for open initiatives, their slices, and the agent, model, consumption and skills/references of active slices. It is a presentation layer over existing shared data (`isswf-status`, plan and job records) plus local host traces, so a later Pi extension can reuse the same data. Operator request 2026-11-05; interview completed 2026-11-05. This plan records preparation only.

## Decisions

- confirmed by operator: initiatives are grouped from plan state. Pending means every slice is `pending`. Fully `completed` initiatives are hidden. Others are shown as open.
- confirmed by operator: the initiative the coordinator is working on in the current session is shown as "in progress" at the top. The mod derives it from the session's own activity (latest tool use on `<state>/initiatives/<ID>/`, or a dispatched brief of that initiative). The operator can override it manually in the mod.
- confirmed by operator: initiatives, slices and slice details are collapsible; the session initiative is expanded by default.
- confirmed by operator: active slice details come from the local Claude subagent transcript while it runs (observed: model, tokens, files read), and from the job's `attempt.md` after it closes. The coordinator writes the summary there, including a new consumption field.
- confirmed by operator: the cheapest agentic option is preferred; the mod itself makes no model calls.
- confirmed by operator: `isswf-panel` stays until a Pi extension provides an equivalent view; its removal is a separate future initiative.
- confirmed by operator: the mod starts as source-checkout only; packaging into the `isswf` Claude plugin is a later slice, once the operator is satisfied with the design.
- assumption: an observed-vs-reported distinction is shown for detail data (transcript = observed, `attempt.md` = reported), consistent with the worker report contract.
- assumption: visual design is iterated with the operator during J001; acceptance for layout is operator acceptance, not a fixed spec.

## J001

- Status: pending
- Objective: Source-checkout mod listing open initiatives and slices from plan state, with the session initiative on top and collapsible sections.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: Awaiting an explicit operator start instruction; preparation only.
- Next step: Operator starts implementation; load the plugin-authoring skill for the mod mechanics.

### Acceptance

- The mod lists initiatives from the project's one active state directory using `isswf-status` data, hides fully completed ones, and separates pending from open.
- The session initiative is derived from session activity, shown on top and expanded; a manual override exists.
- Initiatives, slices and details are collapsible.
- It works on Windows and Linux, makes no model calls and writes no state records.
- It loads only in this source checkout, not in installed releases.

### Evidence

- None.

## J002

- Status: pending
- Objective: Show live agent, model, tokens and skills/references read for active slices from local Claude subagent transcripts.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J002/brief-r1.md) (pending until prepared)
- Blocker: Depends on J001.
- Next step: Prepare the brief after J001 settles the mod structure.

### Acceptance

- For a running subagent tied to a slice, the mod shows agent, observed model, token consumption and skills/references read, labelled as observed.
- Missing or unreadable transcripts show as unavailable, never as zero or inferred.

### Evidence

- None.

## J003

- Status: pending
- Objective: Persist slice agent, model, consumption and skills/references in attempt.md and show them for closed slices.
- Depends on: None
- Brief: [brief-r1.md](jobs/J003/brief-r1.md) (pending until prepared)
- Blocker: Awaiting J001 start.
- Next step: Prepare the brief.

### Acceptance

- `.factory/templates/attempt.md` gains a consumption field; the coordinator guidance records it with the existing skills, references and model fields when a slice closes.
- The mod reads these fields for closed slices of open initiatives and labels them as reported.
- Pi and Claude coordinators can fill the same fields.

### Evidence

- None.

## J004

- Status: pending
- Objective: Package the mod into the isswf Claude plugin once the operator accepts its design.
- Depends on: J001, J002, J003
- Brief: [brief-r1.md](jobs/J004/brief-r1.md) (pending until prepared)
- Blocker: Awaiting operator design acceptance.
- Next step: Prepare the brief after acceptance.

### Acceptance

- The mod ships with the Claude plugin, is covered by package and host-portability tests on Windows and Linux, and is documented in English and Spanish guides.

### Evidence

- None.

## Future work (not planned)

- Pi extension with an equivalent view over the same data.
- Remove `isswf-panel` after the Pi extension exists.
- Live "agent active" indicator distinct from plan `in-progress`.
