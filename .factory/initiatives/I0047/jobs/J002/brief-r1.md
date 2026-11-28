# Job brief J002 / r1

- Source: operator design conversation, Claude Code session 2026-11-11; plan [I0047](../../plan.md) J002.
- Authorization: preparation only. No start, commit, push or PR granted; requires explicit operator start.
- Objective and acceptance: as stated for J002 in the plan; sizing rule from the plan applies (one concern, reviewable in one sitting).
- Constraints: read-only over initiative records; no prompt/context cost; Linux and Windows, Pi and Claude Code parity scoped per job.
- Methodology considered: decided at start from job risk; isswf-writing for docs; review.md for verification selection.
- From J001 (research note and review V001): follow the research note recommendation and operator answers; wiring touches tools/factory-package.mjs and tools/build-release.mjs, which need a person's approval before integration.
- From J001 review V002: on `session_start`, rebuild the coordinator latch from `ctx.sessionManager.getBranch()` (current path only). Stored user messages hold the expanded `<skill name="isswf-coordinator"` block, not the raw `/skill:` text, so match that form or the `read` toolCall of the coordinator SKILL.md, or persist a marker with `pi.appendEntry`; test with entries in the stored form.
