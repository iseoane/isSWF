# I0057/J007 brief-r2: Generate attempt and review record skeletons from launch data and Git

## Identity and authorization

- Job and brief revision: I0057/J007, r2. r1 was the research ([A001](A001.md)).
- Request mode: feature-to-PR continuation of I0057, under the operator's standing grant. The merge needs the operator's approval, because the change touches `.agents/roles/*.md` and `tools/factory-package.mjs`.
- Operation ownership:
  - The worker edits the paths below, commits on the feature branch and writes `jobs/J007/A002.md`.
  - The coordinator owns the plan, this brief, the reviews, the push, the PR, CI and the merge.
- Profile: `.agents/roles/worker.md`.

## Objective

- Outcome: one command creates the job's next attempt or review record from the template with every mechanical field filled from the launch data and Git, and fills the changed paths and commits at completion. Semantic fields stay for the author.
- Size: M, from the plan (two related flows, attempt and review records, plus the launch identity).

## Coordinator decisions (from A001)

1. **Who and when.** The coordinator runs `next` before a launch to get the ID it names in the dispatch, and `create` right after the launch returns the run ID, so a refused dispatch leaves no orphan. `create` writes the file and does not commit it. The author (the worker for its attempt; the coordinator for researcher, planner and review records) fills the semantic fields and commits it. `complete` fills the Git-derived fields when the candidate is known.
2. **One model source.** The command takes the requested model and effort as arguments from the launch data and writes them backticked (`` `sonnet`/`medium` ``), because `parseModel` reads only backticked tokens (`tools/isswf-snapshot-core.mjs:84`). The second reviewer-model source in `tools/isswf-review-launch.mjs:59-70` is out of scope; the coordinator records it as a plan candidate.
3. **Template.** The attempt template gains `Candidate commit SHA` and `Branch` lines in its identity section, optional for the validator. The `Run:` lines of both templates become `- Run: claude agent=<id>`, with their guidance moved into each template's header note, so a filled line parses.
4. **Shared code.**
   - Export one record-name pattern and use it from `tools/isswf-record-check-core.mjs:8`, `tools/isswf-record-guard-core.mjs:10`, `tools/isswf-snapshot-core.mjs:157` and `tools/isswf-status.mjs:84`, without changing what each accepts unless a test shows the old difference was a bug; say what you found.
   - Make `checkReferences` in `tools/isswf-dispatch-guard-core.mjs` also return the base, unchanged otherwise.
   - Reuse the exclusive temp-plus-`link` create of `createPlanFile` (`tools/isswf-plan-edit.mjs:60-70`) by exporting or moving it, not by copying it. Leave `isswf/` and `isswf.mjs` alone.
   - Run Git through `runGit` (`tools/git-evidence.mjs:41-59`).
5. **Packaging.** Ship the new command with the factory, since the coordinator uses it in installed projects.

## Scope and acceptance

Included:

- **Command `tools/isswf-record-new.mjs`** with a core module with no Node imports where practical, JSON output and exit codes in the `tools/isswf-plan-edit.mjs` convention:
  - `next --project ABS --initiative I --job J --kind attempt|review` prints the next unused ID: the job-wide maximum plus one over the job directory in the working tree, the index and `HEAD`, and every local and remote-tracking branch (`git for-each-ref`, `git ls-tree`).
  - `create --project ABS --initiative I --job J --kind attempt|review --id A<nnn>|V<nnn> --role worker|reviewer|researcher|planner --brief <path> --checkpoint <40-hex> --base <40-hex> --model <m> --effort <e> [--run "<host> <key>=<id>"] [--round <n>] [--checkout ABS] [--branch <name>] [--candidate <40-hex>]`:
    - refuses when the ID is not the next unused one or the file exists (exclusive create), and when the job is not `in-progress` in the plan;
    - fills the job and record ID, review round when given, `Run:` when given, brief path, revision and checkpoint, plan path and revision (the checkpoint), profile path and its blob at the checkpoint, target base, checkout, branch, the selection file path and its blob at the checkpoint if tracked, requested model and effort, and the timestamp; for a review also the candidate and the `REVIEW.md` path and blob at the candidate;
    - leaves every semantic field as the template has it;
    - runs `checkRecord` on the result and reports its violations.
  - `complete --project ABS --initiative I --job J --record A<nnn>|V<nnn> --candidate <40-hex> [--run ...]` fills `Candidate commit SHA`, `Changed paths` (`git -c core.quotePath=false diff --name-only --no-renames -z base candidate`, record paths under `.factory/initiatives/` or `.isswf/initiatives/` listed separately) and the commit list (`git rev-list --reverse base..candidate`) into the resulting-artifacts field, and the `Run:` line if given. It refuses to overwrite a field that is no longer the template text.
- **Templates:** `.factory/templates/attempt.md` and `review.md` as in decision 3.
- **Methodology pointers, short:**
  - `.agents/skills/isswf-coordinator/SKILL.md`: run `next` before a launch and `create` after it; run `complete` with the candidate.
  - `.agents/roles/worker.md`: complete the skeleton the coordinator created instead of copying the template, keeping the "next unused, never overwrite" rule.
  - `.agents/roles/reviewer.md`: no change unless a line contradicts this flow; say so.
  - `docs/durable-work.md`: the record-creation paragraph points to the command.
- **Docs:** `docs/{en,es}/operations.md` describe the command; `docs/{en,es}/architecture.md` list the new files.
- **Packaging:** the command and its core in `tools/factory-package.mjs` and, if needed, `tools/build-release.mjs`; Knip entries; `tools/check-quality.mjs` runs the new test.
- **Tests:** `tests/isswf-record-new.mjs`, with real Git in temporary repositories:
  - `next` across the working tree, the index, another local branch and a remote-tracking branch;
  - `create` for an attempt and a review, the filled fields, backticked model, a `Run:` line that `parseRunLine` accepts, and a clean `checkRecord`;
  - refusals: an ID that is not next, an existing file, a job that is not `in-progress`, a non-40-hex SHA;
  - `complete`: changed paths with a non-ASCII name and a rename, record paths listed separately, commits in order, and the refusal to overwrite an author-edited field;
  - the shared record-name pattern from each of its four users;
  - the dispatch-guard parser returning the base.

Exclusions:

- The reviewer handoff and its diff file (J002); the session handoff; `tools/isswf-review-launch.mjs`.
- `.agents/hosts/**`, `.github/workflows/**`, existing records and `.factory/models.json`.
- Never stage the untracked `.agents/skills/project-release/`.

Acceptance (plan J007):

1. The command creates the job's next unused `A<nnn>.md` or `V<nnn>.md` from the template, with the record ID, review round, `Run:` line, brief path, revision and checkpoint SHA, base SHA, checkout, branch and requested model filled from the supplied launch data and Git; semantic fields stay for the author.
2. At completion, the changed paths and commits `base..candidate` are filled from Git.
3. An existing record ID is never reused; on a conflict the command refuses.

Checks (the worker runs them and reports the exact commands and results):

- Focused tests: `node tests/isswf-record-new.mjs .`, plus `isswf-record-check`, `isswf-record-guard`, `initiative-snapshot`, `initiative-status`, `isswf-dispatch-guard`, `isswf-plan-edit`, `package-metadata`, `release-package`, `host-portability` and any test the change touches.
- `node tooling/quality/check-docs.mjs`, `git diff --check`, `node tools/check-quality.mjs`, and local ESLint and Knip.
- Use node, not python, for any scripting.

Methodology:

- isswf-tdd: selected for every behaviour above. Use test-only RED commits, then GREEN commits, and confirm each RED fails on the intended assertion.
- isswf-writing: selected for the docs and the methodology pointers. Load it before editing them.

Required references (read each in full and report consumption honestly):

- `AGENTS.md`, `REVIEW.md`, `GLOSSARY.md`, `.agents/roles/worker.md`, `.agents/hosts/claude-code.md`.
- `.agents/skills/isswf-tdd/SKILL.md`, `.agents/skills/isswf-writing/SKILL.md`, `.agents/roles/references/code-quality.md`.
- `docs/en/development.md` "Quality checks", `docs/durable-work.md`.
- `jobs/J007/A001.md`, and the plan's J006 and J008 sections.

## Independent review

- Required: yes, Standards and Spec, with a lens on ID uniqueness, overwrite refusal and path portability on Windows.
- Reviewer: `isswf:isswf-reviewer`, with the selection file's model and effort, unbound, given the exact diff file.

## Inputs and bases

- Target base: e48b86ef17642ac886f21b5aff37ff38a8925545 (main after the J009 merge).
- Document-input checkpoint: the commit that adds this brief.
- Plan: `.factory/initiatives/I0057/plan.md`, job J007.

## Dependencies, ownership and budget

- J006 and J009 are merged. J005 waits for this job, because both touch the packaging and operations docs.
- Checkout: the shared-sequential primary checkout, branch `feat/i0057-j007-record-new`, one writer.
- Budget: 1 worker, with the selection file's model and effort. Up to 3 review rounds and 2 correction cycles. No automatic retries.
