# Job brief J001 / r1

## Identity and authorization

- Job: I0046 J001, brief r1. Coordinator-assigned actor ID: A001 (do not reuse).
- Source: operator design conversation (Claude Code session, 2026-11-11) and explicit start "Sí, J001" (2026-11-12).
- Request mode: local-only. Writes allowed only under `/home/iseoane/.claude/dev-mods/d9c79ff9-7b95-4990-86f7-d89f71286d91/isswf-pane/`. No writes to the isSWF repository, `.factory/` or `.isswf/`. No commit, push, PR, installs or network.
- Role: isswf-worker; profile `/home/iseoane/Work/isSWF/.agents/roles/worker.md` (trusted factory root `/home/iseoane/Work/isSWF`).

## Objective

Write a host-independent Node.js ES module that reads an isSWF project's initiative records and returns one JSON snapshot, plus a CLI wrapper and fixture tests.

## Scope and acceptance

- Files: `/home/iseoane/.claude/dev-mods/d9c79ff9-7b95-4990-86f7-d89f71286d91/isswf-pane/lib/snapshot.mjs` (pure reader, Node built-ins only, no Claude/Pi API), `/home/iseoane/.claude/dev-mods/d9c79ff9-7b95-4990-86f7-d89f71286d91/isswf-pane/bin/snapshot.mjs` (CLI: `--project <abs path>` prints JSON), `/home/iseoane/.claude/dev-mods/d9c79ff9-7b95-4990-86f7-d89f71286d91/isswf-pane/test/snapshot.test.mjs` (node:test), `/home/iseoane/.claude/dev-mods/d9c79ff9-7b95-4990-86f7-d89f71286d91/isswf-pane/test/fixtures/` (copies of real records).
- State dir: `.isswf/initiatives` if present, else `.factory/initiatives`; both present = error. Read only.
- Snapshot `{ version: 1, project, stateDir, initiatives: [...], unopened: [...] }`. Exclude initiatives whose jobs are all `completed`. Unopened = every job `pending` with no A/V records; list only `{ id, title }`.
- Initiative: id, title (from `# Ixxxx: Title`), type, jobs. Job: id, status, objective, dependsOn, issue/PR numbers when stated in delivery.md or plan Evidence/Next step (`issue #N`, `PR #N`, `PRN`, `issueN`), rounds.
- Rounds: from `brief-rN.md` files (round N per brief revision). Each `A00N.md` / `V00N.md` is one actor entry: kind attempt (worker) or review; role, model, effort and verdict parsed only from explicit text (e.g. `PASS`, `FAIL`, `changes requested`, `Observer:`, model names); otherwise `"unknown"`. Attribute to a round only if the record says it; else the latest round. Verdict values: passed, changes-requested, running, unknown.
- Never infer values; unknown is explicit. Malformed plan → initiative entry with `status: "unparsed"`, not a crash. Bounded reads (skip files > 1 MB).
- Tests: fixtures built by copying I0045 (completed, must be excluded) and one real initiative with A/V records, plus a synthetic in-progress initiative and a synthetic unopened one; assert exclusion, unopened listing, rounds, verdict parsing, unknowns, both-dirs error. Run `node --test /home/iseoane/.claude/dev-mods/d9c79ff9-7b95-4990-86f7-d89f71286d91/isswf-pane/test`.
- Also run the CLI against `/home/iseoane/Work/isSWF` and report a short excerpt.

## Methodology

- Selected: isswf-tdd not selected (new isolated prototype; tests written alongside). Verification: mechanical/empirical by coordinator rerun. No independent review (low risk, outside product).

## Execution

- Model/effort: inherited from coordinator session (stated limitation: effort not observed).
- Budget: 1 worker run, max 1 correction cycle. Stop and report if blocked.
- Return: changed paths, test command and result, CLI excerpt, unknowns/limits, resources actually read.
