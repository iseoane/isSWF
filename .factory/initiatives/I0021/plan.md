# I0021: Canonical plan validation parity

Type: enhancement

## J001

- Status: in-progress
- Objective: Resolve #127: Reject unsupported manual plan types and structurally empty completed evidence consistently with generated canonical plans, keeping invalid records explicit and readonly.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None for the bounded next step; unsupported capability remains an explicit limit.
- Next step: One sequential native worker, relevant local checks, independent review, final-head PR CI and permitted integration.

### Acceptance

- Supported manual/generated canonical types and existing statuses, dependencies and brief references still work; unsupported/missing/ambiguous type is diagnosed explicitly, not silently accepted.
- Completed jobs need structurally nonempty evidence beyond the canonical None. sentinel; pending jobs may have empty evidence. A nonempty list is not proof of accepted outcome or execution. Apply consistent generated/manual invariants without creating an output that the reader rejects.
- Reader/status/panel consumers expose malformed records as invalid/unknown rather than pretending completion or silently dropping them; protected plan bytes remain unchanged. Existing guarded publication/checkpoint and single-state-root behavior remain intact.
- Focused behavioral TDD: retain test-only RED and separate GREEN commits with command/assertion and full SHAs for unsupported type/completed-empty acceptance, valid controls and readonly-consumer diagnostics. Use real current consumer seams, no speculative broad parser rewrite.
- Verify relevant Linux/Windows native tests through existing CI, Pi/Claude share this parser without unnecessary live calls; preserve compatibility limits explicitly. Read actual /home/iseoane/.agents/skills/test-value/SKILL.md and references/decision-examples.md, plus TDD skill/reference. Run focal tests first; coordinator full suite and locked analysis before independent review.

### Evidence

- Current operator explicitly requests all remaining ordered issues121,126,127,125,128. This unit only: 127. Bounded native preparation/implementation/checks/feature commits/push/PR/CI in iseoane/isSWF; integration only under applicable LOW-risk protected expected-head authorization. No other unit, direct-main push, bypass, installation, release, deployment or cleanup.
- Source base 0fbfb376902c7bc02728190599877e2e11a3b58d; actual issue observation and affected files inspected.
