# I0022: Shared exact-byte Git fixtures

Type: enhancement

## J001

- Status: completed
- Objective: Resolve #125: Consolidate the duplicated no-EOL-conversion fixture policy so CRLF/BOM/binary committed bytes remain exact under core.autocrlf=true.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None for source-verified scope; PR/native CI and integration are separate gates.
- Next step: Publish one final record head, verify exact-head native CI and integrate only within applicable risk/authority; retain final remote receipt on the PR.

### Acceptance

- Replace the existing duplicated fixture no-EOL policy with a shared bounded helper that preserves the same effective semantics; keep exact bytes for CRLF/BOM/binary/empty files under inherited core.autocrlf=true without changing unrelated user/project settings.
- Only intended Git fixture invocations get the helper policy; non-Git commands retain exact args. Preserve executable mode and expected failure controls where selected consumers use them; existing committed-vs-working-tree and integrity/refusal behavior remains intact.
- Use actual Git blobs, not just command-array assertions, for focused helper correctness; run migrated pure CLI/MCP and Pi SDK fixtures with plain and inherited autocrlf=true. Native Windows/Linux existing matrix must exercise affected consumers and helper regression.
- This is an equivalent extraction of already working local fixes: no fabricated import-error or retrospective behavioral RED is required. Establish before/after byte evidence and targeted helper checks. If a genuinely new behavioral fix is needed, identify it and use a meaningful regression before that fix.
- Required test-value is /home/iseoane/.agents/skills/test-value/SKILL.md plus references/decision-examples.md; worker/Pi, quality/comments/verification apply. Return concise application and execution evidence, no claimed live model behavior.

### Evidence

- Current operator explicitly requests all remaining ordered issues121,126,127,125,128. This unit only: 125. Bounded native preparation/implementation/checks/feature commits/push/PR/CI in iseoane/isSWF; integration only under applicable LOW-risk protected expected-head authorization. No other unit, direct-main push, bypass, installation, release, deployment or cleanup.
- Source base 0fbfb376902c7bc02728190599877e2e11a3b58d; actual issue observation and affected files inspected.

## Source verification

Candidate 4523259af9a94193fd41f843c09539e61a4b41fc; implementation and independent Standards/Spec review verified as retained in jobs/J001/delivery.md. Author baseline and after CLI/MCP/Pi SDK fixtures passed plain and inherited core.autocrlf=true. Final independent source PASS on4523259af9a94193fd41f843c09539e61a4b41fc; original9a915ea review FAIL unused import remains retained, import removed mechanically. Coordinator-owned exact standalone host gate: full portable quality, locked ESLint/Knip and diff PASS (exit0). Earlier linked-worktree full runs failed unchanged .git/objects assumptions; not relabelled passing or fixed by unrelated runtime edits. Equivalent extraction, no fabricated behavioral RED; no live provider/Windows claim before final CI. Completed denotes source implementation/verification, not unobserved PR, CI or merge. Later results will be external PR receipts, not recursive record commits.
