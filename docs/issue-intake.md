# Prepare and reconcile an issue

This guide describes `tools/isswf-intake.mjs`, not the retired Python/SQLite intake prototype. The coordinator supplies an authorised observation, a curated proposal, and a separate trusted grant. No model or remote request is made by this tool.

<a id="preparacion-nativa-de-una-issue"></a>

## Prepare an issue natively

From an authorized source checkout, the coordinator uses `tools/isswf-intake.mjs`; the Markdown resource package does not contain this executable. This path requires neither an external dispatcher, Python, SQLite, a model, nor a worker. It receives a GitHub observation obtained through an authorized read, a trusted external prepare-only grant, and a coordinator-curated proposal. It does not query GitHub or interpret labels as permissions. A clear proposal keeps `questions: []`; a pending decision remains a question rather than an invented answer.

```sh
node tools/isswf-intake.mjs prepare --project /absolute/project --repository owner/repo --issue 21 --source /absolute/observation.json --grant /trusted/outside-project/prepare.json --proposal /absolute/proposal.json
node tools/isswf-intake.mjs read --project /absolute/project --repository owner/repo --issue 21
```

The observation contains `{ observedAt, issue }`; `issue` preserves the `number`, `title`, `body`, `state`, `url`, `labels` (objects containing `name`), and `updatedAt` fields from `gh issue view`. The grant contains exactly `version: 1`, `project` (the absolute canonical Git root), `repository`, `issue`, `reference`, and `permissions: ["prepare"]`. Its provenance must correspond to an actual operator decision. A file outside the project does not authenticate that decision by itself: this tool validates bindings and shape, not an authorization service. The proposal contains `objective`, `scope`, `exclusions`, `acceptance`, `questions`, `nextStep`, and `targetBase` (the full SHA of an existing commit). The four lists are arrays of text. A proposal without questions requires observable acceptance criteria.

The canonical repository/issue identity derives a readable ID with prefix `S01-<issue-number>-` and a full hash, unique within the project. Preparation writes only the selected state directory's `jobs/<ID>/brief-r1.md` and `intake.json`; this is a Git-visible local change, not permission to commit or execute. Markdown is the authoritative brief. The record binds its bytes, source, proposal, grant, and base. An exclusive directory claim prevents two preparations of the same source. `intake.json`, published by exclusive link after file synchronization, also signals complete publication; there is no third marker. Partial or corrupt publication blocks without automatic repair or overwrite.

Repeating identical preparation returns `reused` and preserves the same bytes. The fingerprint includes title, body hash, sorted labels, state, and `updatedAt`; it excludes observation time. Any difference in those fields, the grant, or the proposal conservatively blocks with `reconciliation-required`. Preparation does not decide whether a difference is harmless or publish another revision. The coordinator may explicitly use `reconcile`; a claim is not deleted to bypass a blocker.

`read` creates no directories, updates no records, and makes no network calls. It may receive `--source` and `--grant` to compare a supplied observation and authorization. Without them it shows only the last observation and marks authorization as not rechecked. Even with them, freshness belongs to the supplied observation, not a live GitHub query. The summary preserves questions and blockers but always declares `executionAuthorized: false`. Only subsequent delegation with its own grant and Git inputs could consume the reviewed, committed brief. The source-only legacy triage skill uses a different proposal contract; do not pass its old JSON to this caller.

## Explicit native reconciliation

`reconcile` receives the same inputs as `prepare`, plus `--revision N` and `--reconciliation /trusted/outside-project/reconcile.json`. The external attestation contains exactly `version: 1`, `project`, `repository`, `issue`, `reference`, `reason`, `permissions: ["reconcile"]`, `revision`, and `expected: { recordSha256, briefSha256 }`. The hashes identify the intact record and brief at N−1. Provenance must be an actual operator decision, not issue text or a self-authorizing file.

Revision 1 preserves `intake.json` and `brief-r1.md`. Each subsequent revision publishes `brief-rN.md` and then `intake-rN.json` without modifying earlier files. The record binds its predecessor and attestation. An identical repeat reuses that revision; different inputs, a stale predecessor, an occupied claim, or partial publication block without automatic cleanup. The claim is cooperative within the same store, not a guarantee against external writers.

`read` still selects r1 by default; `--revision N` explicitly selects another revision. There is no pointer to "latest". For initiatives, an `isswf-plan.mjs` proposal may set `briefRevision: N` for that job; omission preserves r1. Revising the plan requires its own Git checkpoint and permission. Status reads the revision pinned in the plan rather than adopting the newest one. This reconciliation does not itself resolve duplicates.

## Link a duplicate request

After checking the evidence, the coordinator may run `link-duplicate` on an existing intake with `--revision N` and `--duplicate /trusted/outside-project/decision.json`. The external decision contains exactly `version: 1`, `project`, `permissions: ["link-duplicate"]`, `reference`, `reason`, `evidence: [{ reference, observation }]`, `source`, and `target`. Both references contain `identity`, `revision`, `recordSha256`, and `briefSha256`. Identity contains `repository` and `issue`; an initiative job also includes `initiative`, `jobId`, and `type`. The decision must genuinely come from the operator; neither the file nor its evidence authenticates itself.

The target must be another existing intake, not already linked as a duplicate, with exact revision and hashes. Titles are not compared and the latest revision is not selected automatically. One immutable `duplicate.json` is published beside the source intake under its existing cooperative claim. Repeating the same decision reuses the link; a different decision blocks. All prior briefs and intakes are preserved. An altered or unavailable target makes the link unknown, not current proof.

`read` shows `duplicate-linked`; `prepare` and `reconcile` return that disposition without creating another revision. Status exposes the link without changing the plan-owned job status. The coordinator must not dispatch another implementation of the duplicate. The link grants no permissions, cancels no existing processes, and does not replace runtime admission or its grants. It is not a global cross-initiative census, semantic duplicate detector, or proof that no other writers exist. Source and target require prior preparation; linking them creates no new brief.

## Initiative-scoped issue jobs

For new initiative jobs, pass `--initiative I0042 --job J001 --type enhancement` to both native issue `prepare` and `read`. The canonical initiative plan must already name the job. The brief and intake binding then live under `<state>/initiatives/I0042/jobs/J001/`, and the initial brief includes bounded read-only discovery for lint, tests, build, dead code and duplication. `configured-unverified` means evidence of configuration only; `not-detected` includes recommendations and is neither PASS nor proof that no custom check exists. The legacy no-initiative CLI remains available for existing records. Do not prepare the same logical issue again under a new initiative merely to bypass an existing record or a reconciliation block. This command still needs a real authorized GitHub observation; local requests use a curated template brief without inventing remote issues.

## State and checks

`tools/project-state.mjs` selects `.isswf/` for explicitly initialised new projects and `.factory/` for existing legacy source projects. Both active directories are refused. Read [installation](installation.md) before migration; the issue tool does not migrate state.

Run `node tests/issue-intake.mjs .` for portable prepare/read/reconcile/duplicate controls. These tests use supplied observations and grants; they do not prove live GitHub access or authorise dispatch.
