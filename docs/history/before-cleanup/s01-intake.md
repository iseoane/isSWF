# S01. Prepare an issue and view it in the panel

This document preserves the historical U1/U2 contract and evidence. The following native cut prepares and rereads a local brief; it does not complete all of S01 or replace the historical panel. Overall status and verified capabilities are recorded in the [current plan](plan-v1.md), not in U1/U2's original limitations. The [spec](spec-v1.md) remains unchanged.

<a id="preparacion-nativa-de-una-issue"></a>

## Prepare an issue natively

From an authorized source checkout, the coordinator uses `tools/isswf-intake.mjs`; the Markdown resource package does not contain this executable. This path requires neither Pstack, Python, SQLite, a model, nor a worker. It receives a GitHub observation obtained through an authorized read, a trusted external prepare-only grant, and a coordinator-curated proposal. It does not query GitHub or interpret labels as permissions. A clear proposal keeps `questions: []`; a pending decision remains a question rather than an invented answer.

```sh
node tools/isswf-intake.mjs prepare --project /absolute/project --repository owner/repo --issue 21 --source /absolute/observation.json --grant /trusted/outside-project/prepare.json --proposal /absolute/proposal.json
node tools/isswf-intake.mjs read --project /absolute/project --repository owner/repo --issue 21
```

The observation contains `{ observedAt, issue }`; `issue` preserves the `number`, `title`, `body`, `state`, `url`, `labels` (objects containing `name`), and `updatedAt` fields from `gh issue view`. The grant contains exactly `version: 1`, `project` (the absolute canonical Git root), `repository`, `issue`, `reference`, and `permissions: ["prepare"]`. Its provenance must correspond to an actual operator decision. A file outside the project does not authenticate that decision by itself: this tool validates bindings and shape, not an authorization service. The proposal contains `objective`, `scope`, `exclusions`, `acceptance`, `questions`, `nextStep`, and `targetBase` (the full SHA of an existing commit). The four lists are arrays of text. A proposal without questions requires observable acceptance criteria.

The canonical repository/issue identity derives a readable ID with prefix `S01-<issue-number>-` and a full hash, unique within the project. Preparation writes only `.factory/jobs/<ID>/brief-r1.md` and `intake.json`; this is a Git-visible local change, not permission to commit or execute. Markdown is the authoritative brief. The record binds its bytes, source, proposal, grant, and base. An exclusive directory claim prevents two preparations of the same source. `intake.json`, published by exclusive link after file synchronization, also signals complete publication; there is no third marker. Partial or corrupt publication blocks without automatic repair or overwrite.

Repeating identical preparation returns `reused` and preserves the same bytes. The fingerprint includes title, body hash, sorted labels, state, and `updatedAt`; it excludes observation time. Any difference in those fields, the grant, or the proposal conservatively blocks with `reconciliation-required`. Preparation does not decide whether a difference is harmless or publish another revision. The coordinator may explicitly use `reconcile`; a claim is not deleted to bypass a blocker.

`read` creates no directories, updates no records, and makes no network calls. It may receive `--source` and `--grant` to compare a supplied observation and authorization. Without them it shows only the last observation and marks authorization as not rechecked. Even with them, freshness belongs to the supplied observation, not a live GitHub query. The summary preserves questions and blockers but always declares `executionAuthorized: false`. Only subsequent delegation with its own grant and Git inputs could consume the reviewed, committed brief. This cut does not change the historical U1/U2 JSON or commands used by `isswf-triage`.

## Explicit native reconciliation

`reconcile` receives the same inputs as `prepare`, plus `--revision N` and `--reconciliation /trusted/outside-project/reconcile.json`. The external attestation contains exactly `version: 1`, `project`, `repository`, `issue`, `reference`, `reason`, `permissions: ["reconcile"]`, `revision`, and `expected: { recordSha256, briefSha256 }`. The hashes identify the intact record and brief at N−1. Provenance must be an actual operator decision, not issue text or a self-authorizing file.

Revision 1 preserves `intake.json` and `brief-r1.md`. Each subsequent revision publishes `brief-rN.md` and then `intake-rN.json` without modifying earlier files. The record binds its predecessor and attestation. An identical repeat reuses that revision; different inputs, a stale predecessor, an occupied claim, or partial publication block without automatic cleanup. The claim is cooperative within the same store, not a guarantee against external writers.

`read` still selects r1 by default; `--revision N` explicitly selects another revision. There is no pointer to "latest". For initiatives, an `isswf-plan.mjs` proposal may set `briefRevision: N` for that job; omission preserves r1. Revising the plan requires its own Git checkpoint and permission. Status reads the revision pinned in the plan rather than adopting the newest one. This reconciliation alone does not resolve duplicates or complete S01.

## Link a duplicate request

After checking the evidence, the coordinator may run `link-duplicate` on an existing intake with `--revision N` and `--duplicate /trusted/outside-project/decision.json`. The external decision contains exactly `version: 1`, `project`, `permissions: ["link-duplicate"]`, `reference`, `reason`, `evidence: [{ reference, observation }]`, `source`, and `target`. Both references contain `identity`, `revision`, `recordSha256`, and `briefSha256`. Identity contains `repository` and `issue`; an initiative job also includes `initiative`, `jobId`, and `type`. The decision must genuinely come from the operator; neither the file nor its evidence authenticates itself.

The target must be another existing intake, not already linked as a duplicate, with exact revision and hashes. Titles are not compared and the latest revision is not selected automatically. One immutable `duplicate.json` is published beside the source intake under its existing cooperative claim. Repeating the same decision reuses the link; a different decision blocks. All prior briefs and intakes are preserved. An altered or unavailable target makes the link unknown, not current proof.

`read` shows `duplicate-linked`; `prepare` and `reconcile` return that disposition without creating another revision. Status exposes the link without changing the plan-owned job status. The coordinator must not dispatch another implementation of the duplicate. The link grants no permissions, cancels no existing processes, and does not replace runtime admission or its grants. It is not a global cross-initiative census, semantic duplicate detector, or proof that no other writers exist. Source and target require prior preparation; linking them creates no new brief.

## Historical contract and complete S01 objective

## Operator experience

The operator records the repository and authorizes issue preparation. The coordinator applies triage, returns a concise record, and makes the same information available in the local panel.

Fictitious example: "Prepare issue 17: show the last-update date." If objective and acceptance are clear, the coordinator does not start an interview. If the meaning of "updated" is undecided, it asks that question and keeps the record pending. Neither case starts implementation.

The record shows category, preparation state, objective, acceptance, proposed handling and reason, risks, dependencies, and next step. The panel also shows when the issue was read and when the job was updated. It does not claim GitHub or the code remain unchanged since then.

`ready-for-agent` means preparation allows the indicated next step, such as grounding. It does not mean grounding is complete, code execution is authorized, or S02 capabilities are available. In S01, execution is displayed as "unavailable in this version".

## Responsibilities

- The operator records trusted authorization and resolves product decisions or permission expansions.
- The coordinator applies the triage skill and requests job changes within that authorization. A permanent triage agent is unnecessary.
- The skill defines what to check and return. It neither writes the record directly nor derives permissions from external labels.
- A small local support layer validates identity, authorization, and expected revision and preserves the job. It is the sole operational writer. It does not launch workers in S01.
- The panel and conversational summary read a view of the same record. They keep no separate editable state.

GitHub reads reuse `gh` when authorization and configured access exist. S01 does not install labels, comment on issues, or publish briefs by default. Reading an issue authorizes no remote effect. Without an authorized repository, use fictitious fixtures only for development and checks, never to claim real integration is validated.

## Triage skill

The [triage skill](../.agents/skills/isswf-triage/SKILL.md) produces clear proposals or proposals awaiting decisions and reconciles operator-recorded answers. It was tested by explicit loading in fresh agents and actual CLI recording. U2 preserves `needs-info` and answers; it blocks their reuse when source or authorization changes. That broader reconciliation belongs to U3. The following procedures also include still-pending capabilities of complete S01. Global Pi settings were not changed.

The trigger is preparing or reconciling an authorized intake. Inputs include the job reference, external source and observed revision, authorization, and relevant prior decisions. Output proposes category, preparation state with reasons, brief, evidence, uncertainties, and next step. Configuration is not repeated as an unstructured parameter bag in every call.

The procedure adapts its checks:

- A clear issue keeps the short path and observable acceptance.
- A necessary product uncertainty becomes `needs-info` or `ready-for-human` with an explicit decision and owner.
- An investigable technical unknown proposes grounding. Do not ask the operator for facts that can be checked within authorized scope.
- A bug distinguishes expected behavior, reported symptom, observed reproduction, and hypotheses. Preparing it does not require attempting reproduction without verified capabilities.
- A duplicate or already-solved request needs references and sufficient evidence. Matching titles are insufficient.

Preliminary code checks use only authorized, verified capabilities. Without them, the result says "not checked" and proposes subsequent grounding. It does not invent whether a capability exists. TDD, interviews, researchers, and specialized reviews are not universal steps.

Categories and preparation states come from the spec. `ready-for-human` includes its reason. A duplicate, already-present, or discarded result retains evidence and stops recommending implementation without conflating that result with integrated code delivery. GitHub labels are external mappings awaiting review, not another state machine.

## Records and revisions

U1 keeps a structured SQLite snapshot per revision, including the brief as JSON fields in that same revision. The parent accepted this representation clarification after independent review: methodology remains Markdown, without another editable active brief. Publishing the snapshot and its history uses a transaction; queries open the database read-only and create no absent state.

The record contains:

| Group | Contents |
| --- | --- |
| Identity | Stable local ID, canonical repository, and issue number. |
| Source | Revision or fingerprint of the observed content, observation date, and evidence references. |
| Authority | Reference to a trusted operator decision, scope, and permitted effects. Never secrets. |
| Revision | Local revision number, change date and actor, and recoverable prior content. |
| Preparation | Category, preparation state, reason, proposed handling, and next step. |
| Brief | Objective, scope, exclusions, acceptance, repository, known base, and context. |
| Conditions | Risks, dependencies with exit conditions, uncertainties, and pending decisions. |
| Intended plan | Checks, necessary reviews and reasons, intended configuration, limits, and checkpoint cadence. |

An unexamined base is unknown. Unresolved configuration, limits, and checkpoints are pending, not effective. Before any future delegation, S02 must resolve and pin those inputs, authorization, and instructions. Triage does not fabricate them to fill a template.

Agents return proposals. The support layer records a change only with current authorization and a matching expected revision. Publication preserves brief, preparation state, and revision together. A failure leaves the previous valid revision visible or returns an explicit error, never a mixture of new content and old state.

Rereading the same source returns the same job. Without material changes it creates no revision. If the issue changes, compare it with the authorized brief instead of silently replacing scope. Retain a materially different proposal as pending reconciliation. Reject stale updates and let the coordinator reread. Changing scope or permissions requires a new trusted decision before using the expansion.

History does not depend on the project already being in Git. The first implementation must demonstrate source uniqueness, preservation of the prior revision, and conflict refusal. Atomic replacement and revision checks alone do not establish writer exclusion.

## Panel and conversation

The minimum panel contains a job list and record details, not a permission editor or execution buttons. It may show reports as text or restricted Markdown. It accepts no issue-supplied HTML, scripts, remote resources, or arbitrary path reads. Links are restricted to allowed destinations.

Access is local and read-only. Do not expose the repository root through a static server that reveals configuration or private data. The implementation must define host, endpoints, origin controls, and published fields. Do not assume localhost alone resolves security.

Every query returns revision and date alongside state. The coordinator's summary uses that same query. If panel and conversation read at different times, they show their revisions and ages; equality is required only for the same snapshot. An outage or invalid data produces an unavailable notice, not inferred progress or a stale record presented as current.

Visual proposal, not an application screenshot:

```text
Issue 17 · feature · ready-for-agent
Objective: show when the state changed
Next step: ground current behavior
Pending decisions: none
Local revision: 2 · issue read 4 min ago · record updated 1 min ago
Execution: unavailable in S01
```

## Small functional units

Each unit covers input, decision, preservation, and observation. Do not split the work into storage first, API second, and interface last. Minimum security exists from U1, not only in the final unit.

| Unit | Visible result | Check and commit point |
| --- | --- | --- |
| U1. Prepare a clear issue | With recorded authorization, the skill produces a retained record that panel and coordinator can query. | Clear fixture, refusal without authorization, observable acceptance, no implementation started, and comparison of the same snapshot. Commit after verified behavior and independent review. |
| U2. Resolve insufficient information | An ambiguous issue shows the pending decision; an authorized answer updates the same job and revision. | Do not ask humans for investigable facts, invent data, or execute code. Check out-of-scope answers and duplicate results with and without evidence. Commit with those cases. |
| U3. Reconcile a reread | Rereading or updating the issue creates no duplicate jobs and does not overwrite a current decision. | Same unchanged source, modified source, revised authorization, stale update, and failed publication. Preserve history and show the current revision. Commit with evidence of these outcomes. |
| U4. Check real intake and exposure | An authorized repository supplies a real issue whose record can be observed without revealing private data. | Review hostile text, labels claiming to grant permission, published fields, local access, read errors, and age. Without authorized GitHub access, this unit is blocked, not replaced by a fixture PASS. Commit and demonstrate when requirements are met. |

A draft S01 PR is proposed after the first verifiable commit, only when a repository and publication permission exist. It may group these units if still reviewable. If it grows, split by observable outcome; do not chain dependent PRs without expanding the v1 contract. Checkpoints preserve partial progress and identify it as such.

## Evidence required to close S01

The units demonstrate the plan's six scenarios and assigned TRI, OPS, and SEC criteria. The independent reviewer checks objective, decisions, authorization, idempotency, visibility, and data exposure. It also checks that skill and record responsibilities are clear and corrections are verified.

The demonstration includes an authorized real issue, clear and ambiguous records, evidence for claimed duplicates or existing behavior, rereading without duplication, external content unable to expand permissions, and panel and summary of the same snapshot. Fixtures and review of this document do not establish working S01 behavior.

This cut does not deliver fallback, chat-independent workers, client-code execution, a worker PR, Engram, A2A, restart recovery, or parallelism. S01 prepares those assignments; S02 still depends on verified capabilities and boundaries.

## Design choice and review

[Authoritative document](https://github.com/iseoane/isSWF/blob/7678f6476501c410245d0056a1e1c5e262ff8c21/.audit/s01-candidate-a.md) and [record with versioned brief](https://github.com/iseoane/isSWF/blob/7678f6476501c410245d0056a1e1c5e262ff8c21/.audit/s01-candidate-b.md) were compared. The [independent comparison](https://github.com/iseoane/isSWF/blob/7678f6476501c410245d0056a1e1c5e262ff8c21/.audit/s01-design-comparison.md) recommends B as the base. A contributes joint reading and rejection of invalid data. The brief is included in the same revision to avoid coordinated publication of two artifacts. In U1 its fields are structured JSON, not a separate Markdown body. Git as the only history for a workspace without a repository and a complete supervisor for this slice were rejected.

The [independent contract review](https://github.com/iseoane/isSWF/blob/7678f6476501c410245d0056a1e1c5e262ff8c21/.audit/s01-design-review.md) found no design blockers. U1 uses standard Python and SQLite with no framework or new dependencies. The [implemented-candidate review](https://github.com/iseoane/isSWF/blob/7678f6476501c410245d0056a1e1c5e262ff8c21/.audit/u1-final-review.md) found no blockers for that unit. Thirteen tests and the path from a skill-generated proposal through CLI, HTTP, and a real browser were checked. The [U1](u1-usage.md) and [U2](u2-usage.md) guides support reproduction. U2 adds pending decisions, trusted answers, and retriage without automatic readiness. [31 tests](https://github.com/iseoane/isSWF/blob/7678f6476501c410245d0056a1e1c5e262ff8c21/.audit/u2-final-archive.log), [96 structural variants](https://github.com/iseoane/isSWF/blob/7678f6476501c410245d0056a1e1c5e262ff8c21/.audit/u2-variants-final.json), and a real CLI/HTTP/browser path with fresh-agent proposals were checked. The [U2 evidence](https://github.com/iseoane/isSWF/blob/7678f6476501c410245d0056a1e1c5e262ff8c21/.audit/u2-live.json) establishes neither workers, real GitHub access, nor universally true evidence. Before U3, project startup, including Engram and Codegraph, must be defined and tested. This first cut does not mark S01 criteria or checkboxes complete.

## Initiative-scoped issue jobs

For new initiative jobs, pass `--initiative I0042 --job J001 --type enhancement` to both native issue `prepare` and `read`. The canonical initiative plan must already name the job. The brief and intake binding then live under `.factory/initiatives/I0042/jobs/J001/`, and the initial brief includes bounded read-only discovery for lint, tests, build, dead code and duplication. `configured-unverified` means evidence of configuration only; `not-detected` includes recommendations and is neither PASS nor proof that no custom check exists. The legacy no-initiative CLI remains available for existing records. Do not prepare the same logical issue again under a new initiative merely to bypass an existing record or a reconciliation block. This command still needs a real authorized GitHub observation; local requests use a curated template brief without inventing remote issues.
