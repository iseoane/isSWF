# J032: Observable methodology application — detailed brief (slice 1)

Supersedes brief-r2 (same scope, expanded). brief-r1 remains the target outcome. **Status: prepared, NOT started.** No worker may be dispatched until the operator explicitly starts J032. A worker launched on 2026-10-31 without that start was stopped by the coordinator before producing any commit or change; it consumed no allocation of this brief.

## 1. Assignment

- Initiative/job: I0009 / J032. Operator-selected order: J023 (completed) → J032 → J028–J031.
- Base: `origin/main` `135d0fbc97d3b9421a3945f365b3ca8b3451e8c2` (PR117 merge). Empty branch `feat/j032-method-evidence` exists at that base; no commits.
- Factory root and target: `/home/iseoane/Work/isSWF`.
- Delivery scope once started: feature-to-PR (explicit-file commits, branch push, PR, exact-head CI). Integration into `main` needs separate operator approval.
- Operator decisions already taken: (a) red commits allowed on feature branches, integrated with merge commits (2026-10-31). Reference application is part of this unit (2026-10-31).

## 2. Observable outcome

After this unit, for a task where the brief selects methods or requires references, the operator and coordinator can tell apart, from durable records rather than the author's word:

1. what was **assigned** (brief),
2. what was **consumed** — and whether that is **observed** (host trace) or **self-reported**,
3. what was **applied** — with evidence a reviewer can check in Git or in the diff,
4. what was **independently assessed** (reviewer verdict on that evidence).

## 3. What already exists (reuse; do not rebuild)

| Owner | Already provides |
| --- | --- |
| `.factory/templates/job-brief.md:26` | Brief lists selected methods and the observable evidence each needs. |
| `.agents/skills/isswf-coordinator/SKILL.md` §4–5 | Resolve resource paths, supply them, require consumption acknowledgement; selection ≠ consumption. |
| `.agents/roles/worker.md` § Return (line ~38) | Report consumed vs missing resources; per-method evidence with observer/command/result/provenance; disclose deviations; no retrospective red-first claims. |
| `.factory/templates/attempt.md` | "Method application report" field. |
| `.agents/roles/references/review.md` § Required methodology, § Selected-method evidence | Missing required procedure ⇒ Standards inconclusive, aggregate cannot pass; disclosure is not a waiver. |
| `.factory/templates/review.md:18` | Selected-method evidence assessment field. |
| `tests/worker-methodology.mjs`, `tests/host-portability.mjs:96,147` | Static guards for "selection alone is not evidence/consumption". |

These rules worked in J023: reviewers marked missing RED as FAIL (V006) or INCONCLUSIVE (V007), and workers disclosed unread references.

## 4. Observed gaps (evidence: J023 V006–V010, brief-r16, brief-r20)

| # | Gap | Evidence |
| --- | --- | --- |
| G1 | Application evidence is self-reported and not retained. | Every correction RED in J023 was worker-reported; V007, V008, V010 state reviewers could not verify them. Coordinator could re-verify only because a mutation harness/log happened to survive in the scratchpad. |
| G2 | Evidence exists only in the final report, so interruption loses it. | Claude-route worker stopped at commit: RED for `eb3aea3`/`950aa22` unrecoverable (V009-2). |
| G3 | Reference application is invisible. | Workers reported reading design-principles, code-quality, comments; no report linked any to the diff. Reviewers judged comments ad hoc (V007 F4, V008) without a contract. |
| G4 | Consumption is always self-report, even when a trace exists. | Coordinator verified actual MCP tool use for V009 from the `claude -p` stream-json; the contract never names this as observed evidence. |

## 5. Contract changes (methodology; no runtime machinery)

### 5.1 Red commits for selected TDD (closes G1, G2 for TDD)

- When the brief selects TDD, for each new behavioral contract the author commits **the failing test alone** before the production change. Commit message records the exact command and the failing assertion (file:line, message).
- The next commit contains the change that makes it pass. Do not squash the pair before review.
- Failure must be behavioral: a missing import, syntax error or setup crash is not RED (consistent with existing tdd.md).
- A reviewer verifies by running the named command at the RED commit (must fail with that assertion) and at the GREEN commit (must pass). A reviewer without execution tools records the claim as "not re-run" and relies on CI or coordinator re-run.
- When no honest red can exist (pure refactor, equivalent change, wording-only contract), the author declares a deviation with reason and consequence. Disclosure is not a waiver; the reviewer judges it.
- Integration keeps the pair via merge commit (operator decision (a)). Note `git bisect skip` for red commits in the TDD reference.

### 5.2 Retained substitute evidence

- When sensitivity/mutation evidence substitutes for missing RED (as in brief-r16/r20), the harness and run log are committed under `tests/` evidence or retained under ignored `tooling/.local/<job>/` with their path recorded in the attempt/review record — never only in a scratch directory. The record names the archived commit and includes an unmutated baseline run.

### 5.3 Observed vs self-reported consumption (closes G4)

- Coordinator SKILL and both host guides: when the host exposes a trace of the child's tool calls (Claude subagent/`claude -p` stream; Pi session record), the coordinator **may** check required-resource reads against it and record each as **observed** or **self-reported**. Absence of a trace leaves consumption self-reported; it is not a failure by itself.
- Record only the resulting list (resource → observed/self-reported), not the transcript. No mandatory transcript retention, no secrets.
- A trace proves a file was read, not that it was understood or applied.

### 5.4 Reference application map (closes G3)

- Only for engineering references the brief marks **required for this task**. Optional references need no entry.
- Author reports, per required reference: `reference → concrete application (path:line or commit)` or `not applicable / deliberately not applied → reason`.
- Reviewer assesses each entry against the actual diff under Standards, with one of three outcomes:
  - **observed in candidate** — the application is visible where claimed;
  - **claimed, not visible** — reported as such; becomes a finding only if the diff shows a concrete violation of that reference;
  - **not applicable accepted** — reviewer agrees with the reason.
- Not a checklist, not per-line justification, no new rubric: the reference's own content defines what application means.

## 6. Files in scope

- `.agents/skills/isswf-tdd/SKILL.md`, `.agents/roles/references/tdd.md` (5.1, bisect note)
- `.agents/roles/worker.md` § Return (5.1, 5.2, 5.4)
- `.agents/roles/references/review.md` § Selected-method evidence and new reference-application outcomes (5.1–5.4)
- `.agents/skills/isswf-coordinator/SKILL.md` §3–6 (5.3, brief must name required references)
- `.agents/hosts/claude-code.md`, `.agents/hosts/pi.md` (5.3: what trace each host exposes; state unknowns honestly)
- `.factory/templates/job-brief.md`, `attempt.md`, `review.md` (fields for red commits, consumption status, reference map/outcomes)
- `tests/worker-methodology.mjs`, `tests/host-portability.mjs` (static assertions)
- Optional small checker (6.1). EN/ES user guides only where user-visible text describes TDD/review evidence (check `docs/en|es`); keep mirrors equivalent. `GLOSSARY.md`/`GLOSSARY.es.md` only if a new term is introduced (e.g. "red commit"); no persisted key renames.

### 6.1 Optional red-commit checker

Build only if ≤ ~150 lines: given `<red> <green> <command>`, it runs the command at both commits in a disposable worktree/clone outside the repo and reports `RED confirmed`, `not red` (already passes) or `not green`. Deterministic temp-repo fixture with positive case and negative controls (fix-before-test; red already passing; non-behavioral crash reported as not RED). Add to `tools/check-quality.mjs` and, since it spawns Git, to the native platforms matrix in `.github/workflows/quality.yml`. If larger, document a manual reviewer procedure instead and record the deviation.

## 7. Acceptance criteria

1. Each owner in §6 states the new contract; static tests assert the key phrases and that no owner calls a self-report "observed".
2. Templates carry: red/green commit pair per TDD contract; consumption status per required resource; reference map entries and the three reviewer outcomes.
3. A fixture brief + attempt + review example (test fixture, not a live record) demonstrates: one TDD red/green pair, one declared no-red deviation, one consumption observed and one self-reported, one reference observed / one claimed-not-visible / one not-applicable.
4. False self-report control: a report claiming "read and applied" with no visible application yields "claimed, not visible", never a pass of that entry.
5. Missing required resource still makes Standards inconclusive (existing rule preserved; test asserts it).
6. If 6.1 is built: positive and all negative controls pass on Linux and native Windows CI.
7. No universal TDD/E2E, no new dispatcher, no compliance store, no mandatory transcript retention.
8. Dogfooding: this unit's own new contracts follow 5.1 (red commits present and verifiable in the PR), and its report includes a reference map for the required references in §9.

## 8. Verification

- Combined review: semantic (contract coherence across owners, proportionality, honesty of wording) + mechanical (static tests, docs check, red-commit verification by re-running commands at each red/green commit — coordinator re-runs before review and records results).
- Checks: `node tools/check-quality.mjs`, `node tooling/quality/check-docs.mjs`, ESLint and Knip per AGENTS.md, `git diff --check`, new tests; exact-head CI Linux + Windows.
- Live agent adherence is not certified by static checks; first real use is the next unit that selects TDD.

## 9. Required resources

Author: `.agents/roles/worker.md`, `.agents/hosts/claude-code.md`, `.agents/hosts/pi.md`, `.agents/skills/isswf-tdd/SKILL.md` + `.agents/roles/references/tdd.md`, `.agents/roles/references/review.md`, `.agents/skills/isswf-coordinator/SKILL.md`, `.agents/roles/references/design-principles.md`, `code-quality.md`, `comments.md`, `verification-principles.md`, `.agents/skills/isswf-writing/SKILL.md` + `references/agent-documents.md` (+ `human-documents.md` if user guides change), `GLOSSARY.md`, `docs/en/development.md` § Quality checks.
Required references for the reference map: design-principles (owner boundaries, no second policy), comments, code-quality, writing/agent-documents.
Reviewer: `.agents/roles/reviewer.md`, `isswf-review` SKILL, `review.md`, `verification-principles.md`, this brief, brief-r1.

## 10. Allocation (applies only after explicit start)

- Author: one Claude `isswf-worker`, `sonnet`/`medium`, branch `feat/j032-method-evidence`, explicit-file commits, never staging `.factory/initiatives/**`; Bash writes allowed if Write gets a classifier no-verdict. Report progress incrementally (red commits make interruption survivable).
- Review: up to two `isswf-reviewer` `opus`/`medium` rounds on coordinator patch + SHA-256, verifying red commits through Git history and coordinator re-runs.
- Corrections inside the started unit proceed without re-asking (operator standing instruction). Push/PR/CI by coordinator; integration on operator approval.
- No Pi or live model calls beyond these agents; no installs, network or global config.

## 11. Risks and limits

- Red commits add noise to `git bisect`; mitigated by merge-commit integration and documented `bisect skip`.
- Host traces differ by host/version and may be unavailable; "self-reported" remains a legitimate outcome.
- Reference maps can become boilerplate; reviewers should flag entries that cite locations without real application.
- Wording-heavy changes have weak RED; expect declared deviations for pure prose.

## 12. Next boundary

Operator explicitly starts J032 → coordinator dispatches the author per §10.
