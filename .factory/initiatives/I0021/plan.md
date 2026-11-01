# I0021: Canonical plan validation parity

Type: enhancement

## J001

- Status: completed
- Objective: Resolve #127: Reject unsupported manual plan types and structurally empty completed evidence consistently with generated canonical plans, keeping invalid records explicit and readonly.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None for source-verified scope; PR/native CI and integration are separate gates.
- Next step: Verify refreshed exact-head native CI, then perform the explicitly approved MEDIUM-risk normal expected-head PR135 merge; retain final result externally on the PR.

### Acceptance

- Supported manual/generated canonical types and existing statuses, dependencies and brief references still work; unsupported/missing/ambiguous type is diagnosed explicitly, not silently accepted.
- Completed jobs need structurally nonempty evidence beyond the canonical None. sentinel; pending jobs may have empty evidence. A nonempty list is not proof of accepted outcome or execution. Apply consistent generated/manual invariants without creating an output that the reader rejects.
- Reader/status/panel consumers expose malformed records as invalid/unknown rather than pretending completion or silently dropping them; protected plan bytes remain unchanged. Existing guarded publication/checkpoint and single-state-root behavior remain intact.
- Focused behavioral TDD: retain test-only RED and separate GREEN commits with command/assertion and full SHAs for unsupported type/completed-empty acceptance, valid controls and readonly-consumer diagnostics. Use real current consumer seams, no speculative broad parser rewrite.
- Verify relevant Linux/Windows native tests through existing CI, Pi/Claude share this parser without unnecessary live calls; preserve compatibility limits explicitly. Read actual /home/iseoane/.agents/skills/test-value/SKILL.md and references/decision-examples.md, plus TDD skill/reference. Run focal tests first; coordinator full suite and locked analysis before independent review.

### Evidence

- Current operator explicitly requests all remaining ordered issues121,126,127,125,128. This unit only: 127. Bounded native preparation/implementation/checks/feature commits/push/PR/CI in iseoane/isSWF; integration only under applicable LOW-risk protected expected-head authorization. No other unit, direct-main push, bypass, installation, release, deployment or cleanup.
- Source base 0fbfb376902c7bc02728190599877e2e11a3b58d; actual issue observation and affected files inspected.

## Source verification

Candidate 176bfbf545121d7697d4d536436013c6fc4c4fb0; implementation and independent Standards/Spec review verified as retained in jobs/J001/delivery.md. Coordinator replayed exact original RED858ac2aeee5046c4e762f8d538f2b674260c37bb: missing expected exception. Worker GREEN74a89e2 and additional coordinator test-only sentinelRED957cfd529d7ceb6cda5fdb4907a0a3a637ac32e2 -> GREEN1261805142632362660a9fce123a73009b83aae9 cover wrapped None./whitespace. Six focal reader/writer/admission tests, full portable quality, locked ESLint/Knip and diff PASS on1261805; final delta only registers existing tests in native CI. No historical file changes or live model calls. Completed denotes source implementation/verification, not unobserved PR, CI or merge. Later results will be external PR receipts, not recursive record commits.

## Explicit MEDIUM-risk integration decision

After the coordinator explained that stricter validation can make an entire malformed pinned plan unavailable, including another selected job, the current operator explicitly replied "Ok integra!". This grants integration of #127/PR135 with that disclosed MEDIUM risk, conditional on fresh final-head checks. It is not LOW-risk standing permission, a migration/record-repair grant, direct-main push, bypass, release or installation.

The feature branch was updated by normal merge from current main c4953e640f70e1eacae24317a8a2c37299bc1358. Coordinator verified the parser is byte-identical to independently reviewed176bfbf and all three affected regression files byte-identical to previously native-CI-verifiedc29898f. Both parser-reader CI steps and the independently integrated exact-byte fixture step remain present. Focal parser/status/panel/guarded-writer suites PASS on the combined source. Prior document/source checkpoints, earlier FAIL results and MEDIUM classification stay unchanged. New final-head CI is mandatory before integration; no new reviewer/model call is needed for this unchanged-source applicability plus record-only grant delta.
