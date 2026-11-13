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
- Status: pending
- Objective: Turn the J001 and J002 evidence into prioritized correction jobs by area.
- Depends on: J001, J002
- Brief: [brief-r1.md](jobs/J003/brief-r1.md)
- Blocker: Awaiting J001, J002 and explicit operator start.
- Next step: Operator starts J003 after J001 and J002.

### Acceptance

- New S/M correction jobs are added to this plan, each with its files, findings, likelihood-based priority and planned review; extremely unlikely, low-impact findings are recorded as known limits.
- Corrections preserve meaning, canonical homes, persisted names and Pi/Claude parity; tests that assert edited text are listed per job.
- The operator approves the job list before any correction starts.
