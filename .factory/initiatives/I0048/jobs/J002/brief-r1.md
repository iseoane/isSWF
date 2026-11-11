# Job brief I0048/J002 / r1

Local request from the operator on 2026-11-11: apply both non-blocking review suggestions from J001 (PR271), close the initiative and publish a patch release. No GitHub issue.

## Objective

- Observable outcome: the retrospective template prompts for a sizing miss, and the brief template's size line names the plan as its source.
- Why this work is needed: the J001 reviewer noted sizing misses might go unrecorded and that plan and brief sizes could disagree.
- Size (S/M/L) and one-line reason, copied from the plan (the plan is the source): S, two template lines, one review pass, no special risk.

## Scope and acceptance

- `.factory/templates/retrospective.md` Findings prompts for a sizing miss (more than one correction round or partial review coverage, compared with the recorded size and reason).
- `.factory/templates/job-brief.md` size line states it is copied from the plan.
- check-docs and focused template tests pass. No other files.

## Exclusions

- No change to roles, coordinator, schema or tools.

## Inputs and bases

- Target base: main fa584c3fc331233cb5c32224281a14ec8e945200 plus I0048 records.
