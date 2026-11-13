# I0051: Apply agent-writing practice to the factory's Markdown

Type: enhancement

Source: operator request in a Claude Code session, 2026-11-13, after reviewing that session: apply `isswf-writing` (agent documents) to the factory's own agent-facing Markdown, not to `docs/`, and use the operator's personal `doctor-md-skill` and `doctor-md-agents` skills for empirical evidence. Those two skills are operator-invoked only and stay outside this repository. Scope: `.agents/**/*.md` (skills and their references, roles and role references, host guides), the Claude plugin entries `skills/*/SKILL.md` and agent definitions `agents/*.md`, the repository's `AGENTS.md` and `REVIEW.md`, and the project-only `project-release` skill (`.claude/skills/`, `.pi/skills/`). Excluded: `docs/`, README and GLOSSARY (human-facing), and the historical `.pi/agents/` launch files. Every job is S or M; L is split before start. Plan approval is preparation only; each job needs an explicit operator start.

## J001

- Size: S
- Status: completed
- Objective: Audit the in-scope agent-facing Markdown against isswf-writing's agent-document criteria, read-only, and record the findings.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: None. Findings feed J003.

### Acceptance

- One read-only reviewer per area (skills with their references and plugin entries; roles, role references and agent definitions; host guides; repository instructions `AGENTS.md`, `REVIEW.md` and `project-release`) applies isswf-writing with references/agent-documents.md and a static walkthrough of ordinary, conditional and missing-input requests.
- Findings name path, line, criterion, likelihood and impact, and mark contradictions and duplicated rules across files; no file is edited.
- The coordinator records the consolidated findings in the job evidence, attributed to each reviewer.

### Evidence

- Four native isswf-reviewer audits (model inherited, read-only, committed files at df5f66b; findings transcribed by the coordinator, self-reported reads): skills 16 findings (3 blocking: isswf-setup host-native path reaches only legacy-scoped procedures and has no report state; Claude setup wrapper routes to the legacy install path; Claude wrapper descriptions drop or change activation triggers), roles 18, host guides 20, repository instructions 15; none blocking outside skills.
- Cross-area pattern: the same rule copied in several files with drifting wording (workspace policy, exact-diff rule, pre-dispatch paragraph, Engram/Codegraph policy, checkpoint pinning, TDD commit rule).
- Limits: two reviewers did not read review-convergence.md in full (formally incomplete; no effect on a document audit). Full reports are in the coordinator session; J003 carries the selected findings into correction jobs.

## J002

- Size: S
- Status: completed
- Objective: Gather empirical evidence of which factory instructions fail in practice, using the operator's doctor skills on recent sessions.
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None.
- Next step: None. Findings feed J003.

### Acceptance

- The operator runs `doctor-md-skill` and `doctor-md-agents` with the arguments the coordinator proposes; the coordinator records only their verdicts and cited rules, not transcripts or private content.
- Each empirical finding is cross-referenced with J001 findings (confirmed, new, or not observed).

### Evidence

- doctor-md-skill (operator-invoked, this repository, project skills; 11 of 12 sampled sessions scored, this session excluded; machine-session flags overridden by operator decision as false positives from coordinator skill injection): overall 0.91, efficiency 0.83, coverage 1.0, code quality from 1 session only. Findings: Pi coordinator sessions read many full methodology files serially (3 sessions at 0.4); Pi sessions lost tools mid-work (4 sessions); coordinator did not engage on first request once (claude-e33d9593). Proposals: read references on demand; add "coordinator"/"coordinador" to the coordinator description.
- doctor-md-agents (grade, repo, global and repo files, 14-day corrections): 50 rules, 5,756 tokens per prompt; 42 rules (3,754 tokens) without evidence in 19 judged sessions; 6 correction candidates, none reaching 2 occurrences; 0 unverified findings. Improve: AGENTS.md check commands (full suite listed before its condition; correction d9c79ff9), #58 contradiction with the coordinator trigger, duplicated Engram paragraph, oversized global walky-talky rule (operator's personal file, outside this repository).
- Cross-reference with J001: confirmed (AGENTS.md contradiction and duplication, coordinator length); new (Pi tool loss, first-request activation); not observed (most host and role findings, which the sample could not exercise).

## J003

- Size: S
- Status: completed
- Objective: Turn the J001 and J002 evidence into prioritized correction jobs by area.
- Depends on: J001, J002
- Brief: [brief-r1.md](jobs/J003/brief-r1.md)
- Blocker: None.
- Next step: None. Operator approved J004-J011 on 2026-11-13 ("Adelante").

### Acceptance

- New S/M correction jobs are added to this plan, each with its files, findings, likelihood-based priority and planned review; extremely unlikely, low-impact findings are recorded as known limits.
- Corrections preserve meaning, canonical homes, persisted names and Pi/Claude parity; tests that assert edited text are listed per job.
- The operator approves the job list before any correction starts.

### Evidence

- Correction jobs J004-J011 drafted from J001 and J002 evidence, in priority order (blocking skill findings first). Each job: one worker (host-native Agent, bypass permission mode), focused checks, one independent semantic review with isswf-writing, plus the tests listed.
- Known limits (not corrected): PowerShell 5.1 encoding note; headless `Write(path)` host detail; inline jq filter in the reverse contract; `.factory/templates` root not named; `diagnostician` lacks the `isswf-` prefix (the naming rule covers skills); consistent restatements of the second-failed-fix and do-one-by-hand rules; shared tdd/debug/review/retrospective boilerplate; release-skill bare "release" trigger with model invocation disabled; Pi frontmatter `disable-model-invocation` unverified; `.factory/project-setup.md` hardcoded in this repository's generated block; the operator's Codex `~/.codex/AGENTS.md` (Collie-managed, outside the factory).

## J004

- Size: M
- Status: completed
- Objective: Make isswf-setup's host-native path complete and route the Claude setup entry to it.
- Depends on: J003
- Brief: [brief-r1.md](jobs/J004/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- The normal host-native path contains (or links within the normal path) the worktree policy, tracking and Git-ignore check, readiness and the `configured`/`partial`/`blocked` report; all legacy material sits under one explicit legacy heading; state paths use the selected state directory.
- `skills/isswf-setup/SKILL.md` uses the shared description and routes to host-native setup unless the operator explicitly selects a legacy runtime installation.
- The telemetry opt-in states its dirty-state rule once; maintainer-only rules are reworded in place as rules for developing isSWF itself (moving them to AGENTS.md or development.md is handed to J006, coordinator decision 2026-11-13 after review R1); the Engram/Codegraph template keeps a single summary line.
- Tests: host-portability, worktree-location, host-discovery (CI), release-package; check-docs.

### Evidence

- Worker A001 (native isswf-worker, model inherited): commit e40cde6; check-docs, host-portability, worktree-location, release-package pass (coordinator rerun); host-discovery left to CI.
- Review R1 (native isswf-reviewer, model inherited, diff eb38579..e40cde6 supplied inline): verdict as reported: "Aggregate: inconclusive. Standards passes. Spec is inconclusive only because the "maintainer-only rules" acceptance clause wasn't met as the plan words it". Findings: 1 blocking (acceptance clause 3b unmet and unrecorded), 1 suggestion (legacy template source).
- Coordinator decision (not a verdict change): clause 3b amended above, moving the relocation of maintainer-only rules to J006; suggestion applied (templates come from the pinned source in legacy mode). No re-review: the amendment changes no candidate text, and the applied fix is one parenthetical.

## J005

- Size: S
- Status: completed
- Objective: Make every Claude plugin skill entry carry its shared skill's activation description.
- Depends on: J003
- Brief: [brief-r1.md](jobs/J005/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- Each `skills/*/SKILL.md` description equals its shared `.agents/skills/*/SKILL.md` description byte for byte; the coordinator description names the operator's address words ("coordinator", "coordinador").
- A focused test fails when a wrapper description differs from its shared skill (negative control recorded).
- Tests: the new check, host-portability, release-package; check-docs.

### Evidence

- Worker A001 (native isswf-worker, model inherited): commit 7e7cdf7; 7 of 17 wrapper descriptions aligned; new tests/skill-wrapper-descriptions.mjs wired into check-quality and quality.yml; negative controls (altered description, wrapper without counterpart) fail as expected (worker-reported).
- Coordinator checks: new test PASS, host-portability ok, check-docs PASS on 7e7cdf7; release-package pass on 610da8d (no source difference from 7e7cdf7 outside plan records).
- Review R1 (native isswf-reviewer, model inherited, diff 18df593..7e7cdf7 supplied inline): verdict as reported: "Aggregate verdict: inconclusive. Standards passes. Spec passes on content but stays inconclusive because the release-package test ... has no observed run on 7e7cdf7." That gap is closed by the release-package run above; no candidate change.
- Known limits: YAML block-scalar descriptions (`>`/`|`) would compare by indicator only; a missing description could match a body line; shared skills without a wrapper are not detected. All very unlikely today (17 = 17, single-line descriptions).
- Integration needs a person's approval (`.github/workflows/quality.yml` changed, REVIEW.md).

## J006

- Size: M
- Status: completed
- Objective: Make the repository instructions short, consistent and actionable.
- Depends on: J003
- Brief: [brief-r1.md](jobs/J006/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- AGENTS.md: delegation rule conditioned on the coordinator trigger; one Engram/Codegraph copy; check commands state the focused-first condition before the commands; delegation, verification and role-selection restatements reduced to pointers; a path for requests with no initiative; operator-only and filler lines removed; rules for developing isSWF itself that isswf-setup states in place (handed over from J004) stay in the distributed skill, because they guard every setup target including this repository and a test asserts them (coordinator decision 2026-11-13). Token cost reported before and after.
- REVIEW.md: the wording-finding cap excludes changes whose objective is documentation or instructions; the person-approval list names feature-delivery.md and project-release.
- project-release: a stop row for a verified candidate without a publication grant; the Windows extraction note inside the extraction step; each reference paired with its operation; the local host-checks command named.
- Tests: documentation, host-portability, platform-package; check-docs.

### Evidence

- Worker A001 (native isswf-worker, model inherited): commit fc71374; AGENTS.md about 3,328 -> 2,749 tokens (chars/4); generated coordinator block byte-identical; check-docs, documentation, host-portability pass (coordinator rerun); platform-package pass on e36c8ef.
- Review R1 (native isswf-reviewer, model inherited, diff 3d32535..fc71374 supplied inline): verdict as reported: "Aggregate: pass. Standards pass, Spec pass. Two minor suggestions, neither blocking." Both applied in e36c8ef (restored "shared behavior needs shared evidence, not unnecessary duplicate model calls" and "permission ... and never resume work by themselves").
- Under the new REVIEW.md, `.claude/skills/project-release/**` needs a person's approval at integration.

## J007

- Size: M
- Status: completed
- Objective: Make the coordinator skill findable and single-sourced.
- Depends on: J003
- Brief: [brief-r1.md](jobs/J007/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- The long reclassification paragraph is split into labelled subsections with the condition first (reclassify, size and split, churn checkpoint, cross-host feasibility).
- The version advisory moves to a coordinator reference with a one-line first-activation trigger; references are read on demand per stage; command safety for host inventories is stated once.
- The five quality areas are named or linked; the interview trigger keeps one home; state-directory, Brief-ready and Status terms are unified; howto drops its hard-coded direct-use list.
- Tests: worker-methodology, worker-method-evidence, host-portability, release-package; check-docs.

### Evidence

- Worker A001 (native isswf-worker, model inherited, two rounds): commit 8db0655; coordinator paragraph split into five subsections, version advisory moved to references/version-advisory.md (added to build-release, factory-package and the release-package list after the worker found the packaging gap), read-on-demand rule, terms unified, howto list removed; host-portability assertion updated to `<selected-state>/project-setup.md` (coordinator decision).
- Coordinator checks on 8db0655: release-package and worker-capacity pass.
- Review R1 (native isswf-reviewer, model inherited, diff 3ac72bb..8db0655 without J006 paths): verdict as reported: "I recommend pass for I0051 J007 R1: both axes pass and none of the findings blocks." Applied S1 (reread after compaction) and S2 (howto matches "for any subject"); S3 partly: advisory duplicate trimmed, the interview-row double link kept because host-portability asserts it.
- Integration needs a person's approval (tools/build-release.mjs, tools/factory-package.mjs).

## J008

- Size: M
- Status: in-review
- Objective: Make the review chain usable for every review shape and single-sourced.
- Depends on: J003
- Brief: [brief-r1.md](jobs/J008/brief-r1.md)
- Blocker: None.
- Next step: Review R1 of 3b42626.

### Acceptance

- reviewer.md: model and effort are reported values, not start conditions; a document-audit branch (commit and paths, no diff) exists; the snapshot digest has a path when the reviewer cannot compute it; `inconclusive` is the only axis outcome term.
- `agents/isswf-reviewer.md` and reviewer.md require review-convergence.md; isswf-review points to the canonical findings format (severity, likelihood, origin); the exact-diff rule keeps one home with pointers elsewhere.
- Tests: reviewer-task, review-guidance, claude-reviewer-tools, host-portability; check-docs.

## J009

- Size: M
- Status: in-progress
- Objective: Make the worker and the other role profiles consistent and single-sourced.
- Depends on: J003
- Brief: [brief-r1.md](jobs/J009/brief-r1.md)
- Blocker: None.
- Next step: Worker implements J009.

### Acceptance

- worker.md: start inputs split into blocking and inspectable; an explicit exception for the attempt-record path; steps 2 and 5 split into one rule per bullet; the TDD commit rule and mutation-evidence retention point to their canonical homes.
- Role references point to the coordinator trigger table instead of restating triggers; checkpoint pinning has one canonical paragraph and delivery uses the same conditional wording; delivery's duplicate text removed; researcher coordinator actions moved; memory-save permission stated for planner and researcher; diagnostician and retrospective say how they are dispatched.
- Tests: worker-methodology, worker-method-evidence, planner-task, diagnostic-task, host-portability, release-package; check-docs.

## J010

- Size: M
- Status: pending
- Objective: Make the host guides single-sourced, complete for bound reviews and equal for Pi and Claude.
- Depends on: J003
- Brief: [brief-r1.md](jobs/J010/brief-r1.md)
- Blocker: None.
- Next step: Runs after the previous correction job, one writer at a time, on feat/i0051-factory-md-writing.

### Acceptance

- A shared host-neutral bound-review reference holds the binding namespaces and candidate-bound checks; both host guides link to it with a read-when line.
- The Claude bound review launches with stream-json, records the `Run:` session id and observes tool calls; the Claude content `outputBytes` limit is stated; a linked worktree has a next step; a missing approved effort has a path.
- Pre-dispatch and workspace-policy text reduced to pointers; child acknowledgement and post-launch return of control stated for both hosts; host-capability claims tagged observed or documented; the Pi review uses the approved selection; the reverse contract opens with its trigger; a Claude plugin-loaded check added; Pi tool-loss recovery stated.
- Tests: host-portability, j030-reverse-protocol, worker-method-evidence, worker-methodology, release-package; check-docs.

## J011

- Size: S
- Status: pending
- Objective: Give triage, interview and writing explicit inputs and consistent walkthroughs.
- Depends on: J003
- Brief: [brief-r1.md](jobs/J011/brief-r1.md)
- Blocker: None.
- Next step: Runs after the previous correction job, one writer at a time, on feat/i0051-factory-md-writing.

### Acceptance

- isswf-triage lists required inputs (factory root, operator decision, query access, initiative/job) with a stop when one is missing, and uses factory-root paths.
- isswf-interview uses the project's glossary files and returns the outcome to the coordinator when no plan exists.
- isswf-writing names the same walkthrough set as agent-documents.md.
- Tests: host-discovery (CI), host-portability, release-package; check-docs.
