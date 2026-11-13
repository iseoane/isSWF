# I0051: Apply agent-writing practice to the factory's Markdown

Type: enhancement

Source: operator request in a Claude Code session, 2026-11-13, after reviewing that session: apply `isswf-writing` (agent documents) to the factory's own agent-facing Markdown, not to `docs/`, and use the operator's personal `doctor-md-skill` and `doctor-md-agents` skills for empirical evidence. Those two skills are operator-invoked only and stay outside this repository. Scope: `.agents/**/*.md` (skills and their references, roles and role references, host guides), the Claude plugin entries `skills/*/SKILL.md` and agent definitions `agents/*.md`, the repository's `AGENTS.md` and `REVIEW.md`, and the project-only `project-release` skill (`.claude/skills/`, `.pi/skills/`). Excluded: `docs/`, README and GLOSSARY (human-facing), and the historical `.pi/agents/` launch files. Every job is S or M; L is split before start. Plan approval is preparation only; each job needs an explicit operator start.

## J001

- Size: S
- Status: pending
- Objective: Audit the in-scope agent-facing Markdown against isswf-writing's agent-document criteria, read-only, and record the findings.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: Awaiting explicit operator start.
- Next step: Operator starts J001.

### Acceptance

- One read-only reviewer per area (skills with their references and plugin entries; roles, role references and agent definitions; host guides; repository instructions `AGENTS.md`, `REVIEW.md` and `project-release`) applies isswf-writing with references/agent-documents.md and a static walkthrough of ordinary, conditional and missing-input requests.
- Findings name path, line, criterion, likelihood and impact, and mark contradictions and duplicated rules across files; no file is edited.
- The coordinator records the consolidated findings in the job evidence, attributed to each reviewer.

## J002

- Size: S
- Status: pending
- Objective: Gather empirical evidence of which factory instructions fail in practice, using the operator's doctor skills on recent sessions.
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: Awaiting explicit operator start; the operator runs the doctor skills, which the coordinator cannot invoke.
- Next step: Operator starts J002; the coordinator then gives the exact commands and arguments to run.

### Acceptance

- The operator runs `doctor-md-skill` and `doctor-md-agents` with the arguments the coordinator proposes; the coordinator records only their verdicts and cited rules, not transcripts or private content.
- Each empirical finding is cross-referenced with J001 findings (confirmed, new, or not observed).

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
