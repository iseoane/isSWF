# I0054/J003 r2: AutoWakeUp and methodology use in the pane (2026-11-14)

Supersedes r1 by adding operator requests made during the job (2026-11-14 conversation). r1's grounding, limits and checks still apply.

Added acceptance:
- The switch reads `⏰ AutoWakeUp: sí|no (HH:MM)`: the time is the window's reset plus 5 minutes whenever it is known, even while off or below the threshold.
- Agents tab: one row per role; skills and references one per line with a dim `×n`; only methodology the run used counts (skills invoked with `Skill`; `.agents/` files it read that its prompt, a brief it read, or on Pi its system sections name, plus one hop of links from those; never files it edited). Empty sections and roles that used nothing are not drawn.
- Each delegated role with a shared profile shows `perfil k/n`; while a visible in-progress job has a coordinator-written attempt, the coordinator row says whether this session read `roles/worker.md`.
- Record detail: no skill/reference line; effort beside the model, cost beside tokens.
- The usage JSON adds `usedSkills` and `usedReferences` without changing existing fields (docs EN/ES `operations.md`).

Methodology (coordinator as writer): `roles/worker.md`, `references/design-principles.md` (contract change: usage JSON), `references/verification-principles.md`, `references/comments.md`, `references/code-quality.md`; `isswf-writing` for the EN/ES docs. TDD not selected (pane tests exist and were extended).
Test coverage: `hooks/register.test.tsx` and `tests/run-usage.mjs` cover each added criterion; review is semantic for the counting rule.

Exception (2026-11-14, after V004 I2): a role row that used nothing is still drawn when it carries a yellow profile warning; the warning is the information. Known limits: a reference named only by its file name or a title is not counted (V004 I1, A002).
