# I0062 J002 brief r2

- Supersedes the triage brief [brief-r1.md](brief-r1.md); its two questions are answered below.
- Operator decisions, 2026-11-18 (conversation):
  1. A review finding that only requests a test is blocking only when it covers a stated acceptance criterion or a project-declared mandatory evidence class (security, paths, data writes, external actions). Otherwise it is a suggestion with a justification, and the coordinator accepts it or declines it with a written reason; a declined suggestion is not debt.
  2. In the same change, `isswf-tdd/SKILL.md` becomes a thin entry point to `.agents/roles/references/tdd.md`, which holds every TDD rule once.
- Objective and acceptance: [plan.md](../../plan.md) J002.

## Design

1. `tdd.md`, before writing a test: which concrete mistake would fail it; would an equivalent refactor or a better valid result also fail it; which existing test or check already catches it. Prefer extending an existing test; decline improbable cases that guard no security or data boundary. The attempt report justifies each new test in one line.
2. `review.md` and `isswf-review`: a finding that requests a test names the mistake it would catch and is classified `blocking` or `suggestion` by the rule above; a duplicated or non-detecting test is a Standards finding. The coordinator skill states how a suggestion is accepted or declined.
3. Move the rules that only `isswf-tdd/SKILL.md` states today (separate RED and GREEN commits, honest RED disclosure) into `tdd.md` without loss; the skill keeps its trigger and a pointer.
4. Attempt and review templates gain the justification and classification fields.

## Method

Semantic review (methodology text): one opus/medium reviewer checks that no TDD rule is lost and that the classification rule is stated once. Budget 2 review rounds, 1 correction.
