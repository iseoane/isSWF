# I0057/J002 brief-r2: Generated reviewer handoff (isswf-handoff, review mode) and the unreviewed-commit check

## Identity and authorization

- Job and brief revision: I0057/J002, r2. r1 was the research ([A001](A001.md)).
- Request mode: feature-to-PR continuation of I0057, under the operator's standing grant. The operator approved the merge in advance on 2026-11-15; the change touches grant and authority code (the dispatch guard), packaging and `.agents/hosts/**`.
- Operation ownership:
  - The worker edits the paths below, commits on the feature branch and completes its attempt record `jobs/J002/A002.md`, whose skeleton the coordinator creates with `tools/isswf-record-new.mjs`.
  - The coordinator owns the plan, this brief, the reviews, the push, the PR, CI and the merge.
- Profile: `.agents/roles/worker.md`.

## Objective

- Outcome:
  - A distributed skill `isswf-handoff`, backed by a tool, generates the unbound reviewer handoff with the exact diff file, its byte count and SHA-256, and the review resources.
  - The dispatch guard refuses a reviewer dispatch without a handoff that verifies.
  - A check finds non-record commits after the last reviewed candidate that no later review or recorded override covers.
- Size: M, from the plan.

## Coordinator decisions (from A001)

1. **Tool.** `tools/isswf-handoff.mjs`, with a core module that has no Node imports where practical, JSON output and exit codes in the `tools/isswf-plan-edit.mjs` convention. Subcommands:
   - `review --project ABS --initiative I --job J --brief <path> --checkpoint <40-hex> --base <40-hex> --candidate <40-hex> [--prior V<nnn>...] [--out DIR]` writes two files, `<job>-<candidate12>.diff` and `<job>-<candidate12>.handoff.json`, outside the repository. The default directory is the OS temp directory; `--out` must also be outside the project. It prints the envelope.
     - The diff uses the bound argv of `tools/git-evidence.mjs:199` (`--no-color --no-ext-diff --no-textconv --binary --full-index --attr-source=<candidate>`).
     - Its digest is the SHA-256 of the raw bytes, computed as in `tools/git-evidence-invoke.mjs:113-135` (`patchSha256`, `patchBytes`), so that unbound and bound digests match. Reuse that code; do not copy it.
     - The envelope, `isswf.handoff/1`, holds:
       - base, candidate, diff path, argv, bytes and SHA-256;
       - brief path, revision and blob at the checkpoint;
       - the `REVIEW.md` path and blob at the candidate, or absent;
       - the round and prior review IDs, from the job's V records, reusing `nextRecordId` and `priorReviews`;
       - the reviewer model and effort from `.factory/dispatch-selection.json` (or `.isswf/`), the same source the guard uses;
       - the required review resources (profile, isswf-review skill, review references, host guide) with their blobs at the checkpoint.
     - It refuses a non-40-hex SHA, a candidate that is not a descendant of the base, a missing brief (reuse `requireBrief`), a job that is not `in-progress`, and an `--out` inside the project.
   - `coverage --project ABS [--initiative I --job J] [--base <rev>] [--head <rev>]` is the unreviewed-commit check (decision 4).
2. **Guard extension (authority code).** For reviewer dispatches only (`subagent_type` ending in `isswf-reviewer`), `tools/isswf-dispatch-guard-core.mjs` also requires these in the prompt:
   - `handoff <absolute path>`, `handoff-sha256 <64-hex>` and `candidate <40-hex>`;
   - the existing `checkpoint` and `base`.

   It reads the handoff, verifies its SHA-256, then verifies the diff file's SHA-256 and bytes against the envelope. It also checks that the envelope's base, candidate and brief equal the prompt's. Otherwise it refuses, naming what failed.
   - Hash in the core with a pure-JavaScript SHA-256, or through an `io.sha256` capability on both hosts (`hooks/register.tsx:512-525`, `tools/isswf-dispatch-guard-pi-extension.mjs:17-22`). Say which you chose and why.
   - Hash raw bytes. If a host's read returns decoded text, say what that means for a diff that is not valid UTF-8, and refuse rather than accept a wrong digest.
   - Worker, planner and researcher dispatches are unchanged.
   - The reviewer itself re-verifies the digest when it can, which narrows the gap between the guard's check and the child's read; state that limit.
3. **Skill.**
   - `.agents/skills/isswf-handoff/SKILL.md` (`name: isswf-handoff`) describes review mode: when to run it, the call order (`isswf-record-new next` and `create` for the V record, then `isswf-handoff review`, then the dispatch with the handoff lines) and what the reviewer receives.
   - Its thin Claude entry is `skills/isswf-handoff/SKILL.md`; its Pi entry is the `package.json` `pi.skills` list.
   - Say where a later session-handoff mode would plug in, without building it.
   - Read Matt Pocock's `handoff` and `claude-handoff` skills (`mattpocock/skills`) only as reference, if you can fetch them. Do not copy them, and say whether you read them.
4. **Unreviewed-commit check.** `coverage` defaults to `--base $(git merge-base origin/main HEAD)` and `--head HEAD`, and covers every job whose V records exist in that range or whose records the range changes. For each such job:
   - It takes the latest V record's `Candidate commit SHA` and lists the later commits with their paths.
   - It subtracts record paths, using one shared classifier exported from the record tools. Do not add a third copy.
   - It fails when a non-record path remains that no later V record's candidate covers. The exception is a commit named in a V record's coordinator-override line that touches only documentation (`docs/**` and `*.md` outside `.agents/**`).
   - Cases:
     - PR322: in a fixture with the same shape, the commits that changed `tests/state-interruption.mjs` after the reviewed candidate must fail.
     - The I0057 J007 `d6b9844` override and records-only commits must pass.
   - Where it runs:
     - this repository's `tools/check-quality.mjs`, which CI runs (`fetch-depth: 0`);
     - the coordinator skill, which runs it before `gh pr create` and before a merge.

   Do not edit `.github/workflows/**`.
5. **Pointers.**
   - **Coordinator skill:** the reviewer-handoff and pre-delivery rules become pointers to the skill, the tool and the check.
   - **`.agents/hosts/claude-code.md`:** in its child-context table and handoff lines, keep the host mechanics and point to the tool.
   - **`.agents/hosts/pi.md`:** the same for its external-route lines.
   - **No links to `docs/**`** from packaged files, because `docs/` is not packaged (I0057 J005). Name sections in plain text instead.

## Scope and acceptance

Included:

- **The tool and its core:** `tools/isswf-handoff.mjs` and its core module; `tests/isswf-handoff.mjs` with real Git in temporary repositories.
- **The guard extension:** in `tools/isswf-dispatch-guard-core.mjs`, the Claude hook and the Pi extension, with tests in `tests/isswf-dispatch-guard.mjs` and the hooks tests.
- **The skill:** `.agents/skills/isswf-handoff/SKILL.md`, `skills/isswf-handoff/SKILL.md`, and their entries in `.claude-plugin/plugin.json`, `package.json` (`files` and `pi.skills`), `tools/factory-package.mjs` (`taskSkills` and `taskPayloadPaths`, if it is a task skill), the `tools/build-release.mjs` inventory and the per-skill loop in `tests/host-portability.mjs`.
- **This repository's checks:** `tools/check-quality.mjs` runs the new test and `coverage`; Knip entries.
- **Docs:** `docs/{en,es}/operations.md` (the handoff and the coverage check) and `docs/{en,es}/architecture.md`; `GLOSSARY.md` and `GLOSSARY.es.md` if a new term is introduced.

Exclusions:

- The session-handoff mode.
- `tools/isswf-review-launch.mjs` and the bound review path, except reusing their diff and digest code.
- `.github/workflows/**`, existing records and `.factory/models.json`.
- Never stage the untracked `.agents/skills/project-release/`.

Acceptance (plan J002):

1. An unbound reviewer handoff is produced by a tool that emits the exact `base..candidate` diff file, its byte count and SHA-256, and the required review resources. A review cannot be dispatched without them: the guard refuses, on Claude Code and Pi.
2. Delivery detects commits that change non-record paths after the last reviewed candidate without a recorded delta review, before `gh pr create` and in this repository's CI.
3. The matching coordinator and host-guide rules are reduced to pointers to the tool and the check.

Checks (the worker runs them, at the final code or docs commit, and states that commit for each):

- **Focused tests:** `node tests/isswf-handoff.mjs .`, `isswf-dispatch-guard`, `isswf-compaction`, `isswf-record-new`, `isswf-record-check`, `isswf-record-guard`, `package-metadata`, `release-package`, `host-portability`, `worker-methodology`, `claude plugin test .` (the 36 known Windows path-mock failures stay as they are), and `claude plugin validate .`.
- **`coverage` on this repository:** at the final head, against `origin/main`, with its output.
- **Hygiene:** `node tooling/quality/check-docs.mjs`, `git diff --check`, and local ESLint and Knip. Do not run the full `node tools/check-quality.mjs`; the coordinator runs it.
- Use node, not python, for any scripting.

Methodology:

- isswf-tdd: selected for every behaviour above. Use test-only RED commits that fail on a behavioural assertion: for a new module, start from a stub that exports empty functions, not a missing file (I0057 J005 V001 S3). Then add GREEN commits, and confirm each RED fails on the intended assertion.
- isswf-writing: selected for the skill, the docs and the pointers. Load it before editing them.
- isswf-security: selected for the guard extension (authority code: path handling, hashing, refusal on doubt). Load it and apply its trust-boundary checks.

Required references (read each in full and report consumption honestly):

- `AGENTS.md`, `REVIEW.md`, `GLOSSARY.md`, `.agents/roles/worker.md`, `.agents/hosts/claude-code.md`, `.agents/hosts/pi.md`.
- `.agents/skills/isswf-tdd/SKILL.md`, `.agents/skills/isswf-writing/SKILL.md`, `.agents/skills/isswf-security/SKILL.md`, `.agents/roles/references/code-quality.md`.
- `.agents/roles/reviewer.md`, `.agents/roles/references/review.md`, `.agents/roles/references/review-convergence.md`, `.agents/skills/isswf-review/SKILL.md`: the contents the handoff must carry.
- `docs/en/development.md` "Quality checks", `docs/durable-work.md`.
- `jobs/J002/A001.md`, and the plan's J004, J005 and J007 sections.

## Independent review

- Required: yes, Standards and Spec, plus a security lens on the guard (bypass by prompt shape, path traversal, hash of decoded text, refusal on doubt).
- Reviewer: `isswf:isswf-reviewer`, with the selection file's model and effort, unbound, given the exact diff file. Where possible, the coordinator produces it with the new tool.

## Inputs and bases

- Target base: 5479950724929fc47fd5847add0470e306eafe8f (main after the J005 merge).
- Document-input checkpoint: the commit that adds this brief.
- Plan: `.factory/initiatives/I0057/plan.md`, job J002.

## Dependencies, ownership and budget

- J004, J005 and J007 are merged.
- Checkout: the shared-sequential primary checkout, branch `feat/i0057-j002-handoff`, one writer.
- Budget: 1 worker, with the selection file's model and effort. Up to 3 review rounds and 2 correction cycles. No automatic retries.
