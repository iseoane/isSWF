# I0039: Exact-diff review prerequisite

Type: enhancement

## J001

- Status: in-review
- Objective: Require exact candidate diff evidence before completing an unbound Claude Code review (#247).
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: Dispatch the bounded worker; coordinator owns review, publication and exact-head CI.

### Acceptance

- Missing exact diff yields an inconclusive/blocked review, never a complete pass/fail based only on the working tree.
- Supplied diff evidence names exact base/candidate and is recorded as consumed.
- Coordinator handoff and completion checks preserve existing bound Pi/Claude mechanisms.

### Evidence

- Coordinator observed #247 as the sole open needs-triage issue; #222 is ready-for-agent and #219 ready-for-human. No remote labels changed.
- Related #237 is closed; its fix documents supplied exact diff but does not provide the missing explicit completion gate. No existing #247 intake found.
- Reading map at 29bf90d4d8dbb953c6a26c6019d2b7d0959af55c: .agents/hosts/claude-code.md:67 (existing supplied-diff rule); .agents/roles/reviewer.md:11 (identity inputs); .factory/templates/review.md:9-20 (identity without required diff-source field).
- Quality inventory: lint (ESLint), tests (tools/check-quality.mjs), build (tools/build-release.mjs), dead code (tooling/quality/knip.json) configured, not run; dedicated duplication detector not verified. Recommend focused instruction-contract checks and docs validation; static checks do not prove live model refusal.
- Methodology considered: writing selected for agent instructions; verification principles selected for negative/positive evidence; debug selected for bounded reproduction before correction; security selected for review trust boundary; TDD deferred until a useful behavioral seam is identified. No E2E journey selected: actual native reviewer interaction is a separate empirical check, not supplied by source assertions.

## Execution authorization

Operator current request: "haz el 247 y luego sacame una lista de iniciativas e issues sin completar con una leve descripcion". This selects implementation/checks/review/corrections, commits, feature-branch push and PR/CI in iseoane/isSWF; no release or installation. The immutable intake brief remains prepare-only historical evidence; this coordinator-owned section is the current execution supplement. Base: 29bf90d4d8dbb953c6a26c6019d2b7d0959af55c. Branch: fix/247-exact-diff-review.

Budget: one initial worker, up to two correction continuations and three independent review rounds (maximum six calls total), no nested delegation/model substitution/paid API/installations. Worker openai-codex/gpt-6-luna high; reviewer openai-codex/gpt-6.1-sol medium, project overrides verified in current native tool. One sequential writer in this checkout, no concurrent coordinator edits while it writes. Each actor: 25-minute task bound; report and stop if exceeded, no automatic restart.

Observed scope versus proposal: existing Claude host rule already requires supplied diff; missing fail-closed completion wording and evidence field justify one small methodology/template unit. No new exporter or runtime dispatcher. Supported path: Claude Agent-tool uses supplied diff; bound Claude and Pi use existing bound tools. Native Linux/Windows have the same Markdown contract; static fixtures are not live model execution or OS isolation. Minimum outcome is explicit fail-closed methodology and checked handoff requirements; any live-provider gap must be reported, not disguised as enforcement.

Verification: combined independent semantic review plus focused contract/docs checks. Existing static tests may check instruction presence, not model adherence, so semantic review is required. Negative/positive controls should distinguish missing versus supplied diff and preserve bound paths; avoid claiming behavioral TDD for wording-only changes. TDD not selected: instruction-first change has no honest runtime RED; consequence is no empirical claim of model refusal. Debug selected for inspecting the reported missing-evidence fallback and discriminating it from #237. Writing selected for canonical agent-facing wording; security selected for evidence trust-boundary fail-closed reasoning; verification principles selected for candidate-bound positive/negative evidence. Worker must read their canonical skills/references, report consumed/missing (self-report unless trace checked), concrete path/line application and deviations. E2E not selected: no application journey; no new model calls solely to test instructions. No new data contract/module boundary: design principles not selected. No retries/migrations/parallelism: execution principles not selected.

Worker scope: relevant shared reviewer/coordinator/host guidance, review template and focused existing tests; bilingual guides only if user guides change. Read docs/en/development.md Quality checks. Preserve immutable brief/intake and this plan; return report through bound output, do not write shared records. Worker may create test/code commits on this feature branch but no push, PR or merge. Coordinator retains publication ownership. Required report: changed files, checks/candidate, initial observation versus fix, negative/positive evidence and limitations, consumed resource/application map.

## Coordinator reconciliation before review round 1

Worker 421fe8ab-a322-49f3-8bbb-ae419b5f25f0 complete; process terminal observed through native status. A001 output consumed. Its printed candidate hash contains a transcription typo: actual git-verified full candidate is b28c2f64f6a324c15176733e7db910a23d535c5f; the report is retained unchanged with this correction. Coordinator inspected exact five-file delta and reran worker-methodology, check-docs and diff whitespace checks: PASS. Static wording checks only; no live Claude refusal evidence claimed. Review mode combined semantic/static; missing live model proof is explicit, not silently equated with runtime enforcement. REVIEW.md confirmed absent.

Review round 1, no prior review IDs. Budget consumed: one worker; reviewer call 1 allocated now, maximum three review rounds and two correction continuations total. Reviewer must independently assess the exact bound diff, required-method evidence/deviations and LOW/MEDIUM/HIGH risk. Stop at sufficient scoped evidence; no additional runtime architecture or model probes. Operator explicitly confirmed LOW-risk integration after exact-head gates, and queued subsequent assignments #222 -> I0038 -> I0009/J030; these do not overlap this writer/reviewer. No release grant.
