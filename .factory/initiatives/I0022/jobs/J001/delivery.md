# #125: source delivery

## What changed and why

Consolidate the duplicated no-EOL-conversion fixture policy so CRLF/BOM/binary committed bytes remain exact under core.autocrlf=true.

## Scope

The three affected exact-byte fixture consumers tests/git-content.mjs, tests/git-evidence-pi.mjs and tests/git-evidence-mcp.mjs; one small test-support helper and focused helper regression/native CI registration as needed. No repository-wide Git test migration.; Preserve existing caller-specific cwd, timeout/error/status checks and exact-byte/digest/no-write/refusal assertions. Non-Git subprocesses must not receive Git configuration arguments. Use already installed locked dependencies, never install.

## Checks and results

Base 0fbfb376902c7bc02728190599877e2e11a3b58d; document input 7fc966c76c6c3ce18fc692233b7f07000b288fbb; source-reviewed candidate 4523259af9a94193fd41f843c09539e61a4b41fc. Author baseline and after CLI/MCP/Pi SDK fixtures passed plain and inherited core.autocrlf=true. Final independent source PASS on4523259af9a94193fd41f843c09539e61a4b41fc; original9a915ea review FAIL unused import remains retained, import removed mechanically. Coordinator-owned exact standalone host gate: full portable quality, locked ESLint/Knip and diff PASS (exit0). Earlier linked-worktree full runs failed unchanged .git/objects assumptions; not relabelled passing or fixed by unrelated runtime edits. Equivalent extraction, no fabricated behavioral RED; no live provider/Windows claim before final CI. Final exact-head native PR CI remains pending.

## Independent review

Independent Standards/Spec/aggregate PASS as attributed below; exact identities and limitations retained. This is not operator acceptance, live host behavior or integration authority. No source changes follow this report-only checkpoint.

## Integration risk and recovery

LOW, bounded test-only extraction. A wrong fixture policy could convert committed bytes and invalidate review-evidence tests. The exact existing overrides, unchanged caller controls/non-Git branch, independently specified actual blob assertions, retained integrity/refusal checks and independent review constrain that risk. No product policy, Git settings or runtime dependency changed. Final native Linux/Windows CI remains required for platform behavior. Detect through byte/digest assertions and source-controlled helper; revert the helper/migrations if necessary. Revert cannot undo prior misleading evidence decisions; live behavior and rollback are not certified.

## Closure and acceptance

Source verification complete. Final-head PR/native CI and integration remain separate gates; merge only under applicable explicit LOW-risk approval through normal protected expected-head path. No direct-main push, bypass, installation, release or cleanup. Final observations will be retained externally on the PR to avoid receipt/source CI loops.

## Blockers and next action

Publish final head and verify native CI. No active writer/reviewer or unrelated canonical changes included. Missing capability and evidence stay explicit.

## Author handoff — coordinator transcription

# #125 / I0022 J001 handoff

**Result: complete.** Exclusive checkout `/home/iseoane/Work/isSWF-worktrees/issue-125-exact-git-fixtures`; starting/document HEAD `7fc966c76c6c3ce18fc692233b7f07000b288fbb` (records-only; code base `0fbfb376902c7bc02728190599877e2e11a3b58d`). Functional commit: `9a915ea800052fc307909659250632ec2893e1ff` (`test: share exact-byte Git fixture policy`). No push/PR. No files staged after commit. Only remaining untracked paths are pre-existing linked dependencies `tooling/host-tests/node_modules` and `tooling/quality/node_modules`; left untouched.

## Changes and application

- Added `tests/support/git-fixture.mjs`, the shared bounded `gitFixtureArgs` policy, preserving the three per-command `-c` overrides (`core.autocrlf=false`, `core.eol=lf`, `core.safecrlf=false`) and caller args without mutating them.
- Migrated only Git calls in `tests/git-content.mjs`, `tests/git-evidence-mcp.mjs`, and Git-only branch in `tests/git-evidence-pi.mjs`. Each consumer's cwd, timeout, encoding, maxBuffer, status/error assertions remain at call sites; Pi's non-Git subprocesses receive unchanged args.
- Added `tests/git-fixture-helper.mjs` checking actual index and committed blobs for CRLF (10 bytes), BOM+CRLF (6), binary (5), and empty (0), under child-process inherited `core.autocrlf=true`. Registered in `.github/workflows/quality.yml` and `tools/check-quality.mjs`.
- No product evidence behavior, dependencies, user/project/global Git settings changed. Quality/comments application: local helper, consumer-owned options/error semantics retained, no narrating comments or speculative abstractions added.

## Evidence and commands

- **Baseline before extraction**, from scripts read directly from `HEAD` with `git show HEAD:<test> | node --input-type=module - .`: `tests/git-content.mjs`, `tests/git-evidence-mcp.mjs`, `tests/git-evidence-pi.mjs` all passed both plain and with inherited config `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.autocrlf GIT_CONFIG_VALUE_0=true`. CLI reports exact committed-byte and empty/absent checks; MCP/Pi report committed content incl. BOM/CRLF/binary and their existing integrity/refusal checks.
- **After extraction, before commit**: `node tests/git-fixture-helper.mjs .` passed; then `node tests/git-content.mjs .`, `node tests/git-evidence-mcp.mjs .`, `node tests/git-evidence-pi.mjs .` passed. Repeated all four with inherited `core.autocrlf=true`; all passed. Also `node tests/git-evidence.mjs .` passed plain and with inherited true. Runtime: Node `v26.8.1`, Pi SDK `1.4.0`, Git `2.56.0`, Linux.
- `node --check` on helper, migrated tests and quality runner passed; `git diff --cached --check` passed before commit; post-commit `git diff --cached --exit-code` passed. A grep confirmed no duplicated `noEolConversion` or policy list remains under `tests`.
- No full suite run (coordinator owns it); no local Windows run. Workflow platform job registers affected checks in existing Ubuntu/Windows matrix with inherited `core.autocrlf=true`.

## Method/resources, limits, residual risks

Equivalent extraction; deliberately no fabricated behavioral RED. The before/after test evidence is baseline direct executions and post-change runs; helper independently checks actual Git index/commit blob bytes. Required test-value skill and `references/decision-examples.md`, shared worker role, Pi worker profile/host guide, code-quality/comments and verification-principles were read and applied. Exact `verification.md` path was absent; used the canonical available `.agents/roles/references/verification-principles.md` instead. Host trace unavailable; consumption is self-reported. Test-value decision: extend existing real consumer coverage and add the cheapest focused actual-blob regression for shared policy, rather than brittle source/argv-only assertions. No selected TDD method; no behavior fix required. Quality matrix should exercise Windows/Linux, but that remains CI evidence pending. Independent review and full-suite validation remain coordinator actions. Residual risk: platform-specific Git behavior awaits that matrix; no product-policy or live host/model behavior is claimed.



## Independent handoff — coordinator transcription

# Independent #125 round2 review

**Standards: pass. Spec: pass. Aggregate: pass — scoped source review only.**

Base: `0fbfb376902c7bc02728190599877e2e11a3b58d`  
Input: `7fc966c76c6c3ce18fc692233b7f07000b288fbb`  
Candidate: `4523259af9a94193fd41f843c09539e61a4b41fc`  
Coordinator-attested final patch SHA256: `23de0fd8d31c3d9bd220f35b8fd10a8f38a9aa0d662f34dd297720464c5d15b2`.

**Correction:** `tests/git-fixture-helper.mjs:3` removes unused `readFile`; remaining imports are used. This resolves the demonstrated lint violation without behavioral change. No new source blockers.

Preserve `/tmp/isswf-review-125-first.md`: candidate `9a915ea800052fc307909659250632ec2893e1ff` **failed**, solely for that import. Reuse its unchanged extraction/byte-protection conclusions and author-reported Linux before/after CLI/MCP/Pi results, plain and inherited autocrlf=true; these are not newly executed checks.

Inspected corrected regression, shared helper and relevant retained patch. Command-local overrides remain exact; consumer options, Pi non-Git arguments and integrity/refusal protections remain preserved. Actual index/committed-blob assertions protect CRLF/BOM/binary/empty bytes, rather than merely helper formatting.

Consumed reviewer role, complete review skill/guide, quality/comments/verification/design references, test-value skill/examples, AGENTS, development quality guidance, clone I0022 plan/brief, author report and prior review. Required procedure coverage complete. Application remains observed; author resource consumption is self-reported.

**Execution remains pending:** previous full checks FAILED on linked-worktree `.git/objects` assumptions; not relabeled passing. Coordinator-owned standalone portable/locked-analysis gate follows this response; native final-head CI follows later. Technical delivery requires both passing. Remaining consequence risk is platform-specific byte conversion or integration failure, potentially invalidating fixture evidence. No independent hash computation, command execution, edits, installs or live-provider certification claimed.

## Earlier independent verdict retained, not relabelled

# Independent #125/I0022 review

**Standards: fail. Spec: pass (scoped source review). Aggregate: fail.**

Base: `0fbfb376902c7bc02728190599877e2e11a3b58d`  
Input: `7fc966c76c6c3ce18fc692233b7f07000b288fbb`  
Candidate: `9a915ea800052fc307909659250632ec2893e1ff`

Used coordinator-attested identity and patch provenance; no independently computed hash claimed. Reviewed full patch, helper, regression, three consumers, quality runner and workflow. Initiative additions are coordinator input.

## Finding

**Blocking — `tests/git-fixture-helper.mjs:3`: unused `readFile` import.** It is never referenced, violating `no-unused-vars: error` in `tooling/quality/eslint.config.mjs`. Consequently, the configured lint gate cannot pass this candidate. High confidence from static inspection, not an executed ESLint result. Remove the unused import and run the configured lint command.

## Specification and application

The extraction preserves the exact three command-local configuration overrides and caller argument ordering. All three consumers retain cwd, timeout, buffering, encoding and error/status controls; Pi’s non-Git branch remains unchanged. No executable-mode or product-policy change, persistent Git configuration write, dependency change or broader migration appears.

The regression compares actual index and committed blobs against independently specified CRLF, BOM, binary and empty buffers. Inherited autocrlf=true is imposed during staging/commit. Existing committed-versus-working-tree, integrity and refusal assertions remain intact. Native Ubuntu/Windows registration covers helper and consumers.

Quality/reuse, comments and verification application are **observed in candidate**, subject to the lint defect. Test-value application is **observed**: real blob assertions complement retained integration coverage. No behavioral TDD was selected; accepting equivalent-refactor baseline/after evidence without fabricated RED is appropriate.

## Evidence and limits

Consumed reviewer role, complete review skill/guide, quality/comments/verification and design references, test-value skill/examples, AGENTS, development quality guidance, plan, brief and author report. No required reviewer procedure missing. Author consumption is self-reported, not trace-verified.

Reused author-reported Linux baseline/after CLI/MCP/Pi executions, plain and inherited autocrlf=true; did not rerun commands. Current `quality.log` instead records a failed portable run: `ENOTDIR` resolving worktree `.git/objects`; status file contains `1`. Baseline attribution is unproven. ESLint/Knip logs were absent when read.

Full validation and final-head native CI remain coordinator gates. Windows-specific Git behavior is not established by static inspection or Linux evidence. No live provider/model certification is claimed.
