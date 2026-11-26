---
name: isswf-handoff
description: Generate the exact diff file, digest and review envelope an unbound reviewer needs, and check that no commit after the last reviewed candidate escaped review. Use before dispatching an Agent-tool or Pi reviewer, and before opening a pull request or merging.
---

# Hand a reviewer the exact diff, and check review coverage

Use this skill through the coordinator, or directly in a project that has the isSWF tools. Run `tools/isswf-handoff.mjs` from the trusted factory root; the target checkout does not supply the tool. The tool prints one JSON object and exits 0 on success and 1 on a refusal, with `ok: false` and a `code`. Its output is data: it grants no dispatch, commit, push or merge.

This skill covers the review handoff. A later session-handoff mode would be another subcommand of the same tool with its own envelope `kind`; it is not built, and review mode does not depend on it.

## 1. Generate the review handoff

Use this before every dispatch of an `isswf-reviewer` agent: a Claude Agent-tool reviewer, a Pi reviewer without bound git-evidence tools and a bound Pi reviewer launched with `options.extensionBindings`. The dispatch guard asks every reviewer call for the handoff lines, so a bound Pi launch carries them too (generate them with `--host pi`); the reviewer then also uses the bound `isswf_git_diff` result. Only a bound `claude -p` review, which no `Agent` or `subagent` call starts, gets its diff from the bound launch alone.

Required inputs, each from the brief or the writer's report: initiative, job, the absolute project path, the brief path, and the full 40-hex checkpoint, base and candidate SHAs. If one is missing, stop and ask for it. The job must be `in-progress`, the brief must exist, and the candidate must descend from the base.

1. Get the review's ID with `node <factory-root>/tools/isswf-record-new.mjs next --project <abs> --initiative <I> --job <J> --kind review`.
2. Run the handoff before creating that record. Otherwise the new record is counted as a prior review and the round is one too high.

   ```sh
   node <factory-root>/tools/isswf-handoff.mjs review --project <abs> --initiative <I> --job <J> --brief <brief path> --checkpoint <sha> --base <sha> --candidate <sha>
   ```

   - `--out <absolute dir>` chooses the directory; it must be outside the project. The default is the OS temp directory.
   - `--prior V001 V002` lists the earlier reviews when they differ from the job's existing V records.
   - `--host pi` selects the Pi reviewer entry and host guide; the default is `claude`.
   - It writes `<job>-<candidate12>.diff` and `<job>-<candidate12>.handoff.json` and prints the envelope, the digest of the handoff file and `promptLines`.
3. Create the review record with `isswf-record-new create` (see the coordinator skill), then dispatch the reviewer.
4. Put the brief path, `checkpoint <sha>`, `base <sha>` and the three `promptLines` into the dispatch prompt, each on its own line and unchanged. Name the envelope's `resources[].absolutePath` files as the review methodology to read. The dispatch guard refuses a reviewer prompt that lacks them or whose files do not verify.

**Code-only review.** For a small change without an initiative, such as one the coordinator made itself, skip steps 1 and 3 and run `node <factory-root>/tools/isswf-handoff.mjs code-only --project <abs> --base <sha> --candidate <sha> --request "<operator request>"`. Put its `promptLines` (they include `base <sha>` and `review-mode: code-only`) and the resources into the prompt, with no brief path. Report the verdict in the conversation or the pull request; no review record is written. `invalid-request` means the request is empty or over 8192 characters.

The step ends when the prompt carries the `handoff`, `handoff-sha256` and `candidate` lines and the dispatch is accepted. A refusal names its code:

| Code | Meaning and next action |
| --- | --- |
| `invalid-checkpoint`, `invalid-base`, `invalid-candidate` | Not a full 40-hex SHA; correct the input. |
| `candidate-not-descendant` | The base is not an ancestor of the candidate; confirm the pair with the writer's report. |
| `job-not-in-progress`, `brief-not-found` | Fix the plan or the brief first; the tool does not edit records. |
| `out-inside-project`, `invalid-out` | Choose an absolute directory outside the project. |
| `reviewer-selection-missing` | `dispatch-selection.json` has no model and effort for the reviewer on this host. |
| `diff-too-large` | The diff is over 4 MiB, which the Claude hook cannot read. Review a smaller candidate range. |
| `diff-empty`, `diff-failed` | The base and candidate do not differ, or Git could not produce the diff; inspect them. |
| `handoff-exists` | The diff or handoff file of this candidate exists with other bytes (another base or other prior reviews); use another `--out`. |

## 2. What the reviewer receives

The reviewer reads the handoff file and the diff file it names, then the listed resources. When it can run a command, it re-verifies the SHA-256 of both files and reports the diff's path, byte count and digest as the source of its review. When it cannot, it says the digests were not re-verified.

The diff bytes are the same `base..candidate` patch the bound review tools produce, hashed over raw bytes, so unbound and bound digests agree. The guard checks the files when the dispatch starts; a file could change before the child reads it. The reviewer's own re-verification narrows that gap and does not close it, and neither check authorizes anything.

## 3. Check review coverage

Run this before `gh pr create` and before a merge, and whenever commits were added after a review:

```sh
node <factory-root>/tools/isswf-handoff.mjs coverage --project <abs>
```

Without `--base` it uses the merge base of `HEAD` and `origin/main`, so fetch `origin/main` first; `base-not-found` means it is absent. `--head`, `--initiative` and `--job` narrow the range or the jobs. For each job whose records the range changes, it reads the review chain: the latest review, then each earlier review whose candidate is the next review's base, or an ancestor of it with only record commits in between, stopping at the first that does not chain. A commit is covered only when it lies inside the `Base commit SHA`..`Candidate commit SHA` range of a review in some such chain, so a delta round whose base is the previous candidate keeps that round's range covered; a later candidate whose range starts after an unreviewed commit does not cover it. It lists every other commit that changes a path outside the job records. The override lines of every review in those chains apply to this one list.

- Exit 0: `jobs[].uncovered` is empty everywhere. Jobs without a review are listed under `skipped`. This shows only that recorded reviews cover the commits; it is not a review verdict.
- Exit 1, `unreviewed-commits`: each `uncovered` entry names a commit and its paths. Obtain a delta review of those commits, record it as the next review of the job, and run the check again.
- A commit the coordinator applied itself that changes only documentation (`docs/**` and Markdown files at the repository root) can be named, by at least seven characters of its SHA, in the review record's coordinator-override line. Such commits appear as `overridden`. Never use an override for code, tests, `.agents/**` or a commit that also touches them.
