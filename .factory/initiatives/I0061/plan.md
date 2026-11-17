# I0061: Project verification

Type: enhancement

## J001

- Status: pending
- Size: M (skill and runner)
- Objective: A skill decides which checks a target project needs and writes them to a project verification file that a factory runner executes deterministically.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Research: study the existing setup quality areas and design the file format; operator review before a brief.

### Acceptance

- A versioned verification file lists each check's command, platforms and cost class, written by the skill and approved by the operator.
- A factory runner executes it identically on Linux and Windows and prints a per-check result usable as I0058 J001's verification stamp.

### Evidence

- 2026-11-17: operator proposal after reviewing the Claude Code team's verification practices; the operator asked that the skill not depend only on the user remembering to run it.

## J002

- Status: pending
- Size: S (one flow)
- Objective: The verification file is refreshed by mechanical triggers, not by memory.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J002/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Prepare a brief after J001.

### Acceptance

- The file stores hashes of the manifests it was derived from; when one changes the runner reports stale, and brief preparation and the commit gate require a refresh.
- A CI failure that the local run did not report is recorded as a miss that requires a refresh.

### Evidence

- None.

## J003

- Status: pending
- Size: M (recipe and runner)
- Objective: A change is verified by running it, through a declared recipe rather than model judgment.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J003/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Research which project types to support first.

### Acceptance

- The verification file can declare a run recipe: start, readiness probe, smoke steps with expected output, stop.
- The runner executes the recipe and stamps the result; the model only writes and maintains the recipe.

### Evidence

- None.

## J004

- Status: pending
- Size: M (research)
- Objective: Reviewer and check quality are measured against the defects that mattered.
- Depends on: None
- Brief: [brief-r1.md](jobs/J004/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Research only; decide later whether this extends retrospective or becomes its own skill.

### Acceptance

- A study proposes how to track misses (reverts, CI-only failures, later bug reports), incident-based evals and rule pruning, and recommends where it lives.

### Evidence

- None.
