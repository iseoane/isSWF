# I0065: In-repo workflow flowchart without Archify

Type: enhancement

The operator found the Archify workflow diagrams confusing: they mix every role, skill and reference in one picture. On 2026-11-22 they approved an interactive flowchart mockup ([mockup.html](mockup.html)) and decided to drop Archify entirely. In the mockup, clicking a node lists the questions that role asks itself. Each question opens to a yes and a no outcome, highlights the arrow it leads to, and links the cited `.md` file on GitHub. Nodes that have automatic guards carry a small mark. All text uses plain language, with the technical name shown only as a grey link.

J003 restructures the README and its reference page, as the operator decided on 2026-11-22.

Integration: the operator authorized integrating every I0065 job on 2026-11-22 ("tienes mi autorizacion para integrarla"), after required review and exact-head CI. Operator 2026-11-22 ("saca release Patch cuando este todo"): finish I0065 without asking per job and release the patch at close. Earlier note: no release was planned: the changed files are outside the package `files` list, except `.agents/skills/isswf-howto/` if J003 changes it, which would then need a patch release. The operator authorized that patch release on 2026-11-22 ("ok pues entonces release patch"): at initiative close, if any packaged file changed, release the next patch through `.claude/skills/project-release/SKILL.md`; otherwise no release.

## J001

- Status: completed
- Objective: A bilingual interactive flowchart page, generated from one in-repo data source and checked by the quality suite, replaces the Archify `workflow.html` pages.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- One data file holds nodes, edges, questions (yes/no outcomes, destination, cited paths) and guards in English and Spanish, with matching IDs in both languages.
- A Node script with no dependencies writes `docs/en/workflow.html` and `docs/es/workflow.html` from that file. The pages work offline as single files, follow the mockup's behavior (one question open at a time, destination arrow highlighted, links open in a new tab) and work in light and dark themes and at phone width.
- `--check` fails when:
  - a generated page differs from what the data file produces;
  - a cited path does not exist at HEAD;
  - the two languages differ in nodes, edges, questions or guards;
  - an edge names an unknown node.
  It runs in `tools/check-quality.mjs`.
- Every question's content is grounded in the cited role, skill or reference text at the base revision. Nothing is presented that the source does not say.

### Evidence

- Merged as e552183b05bcee3a7f94283d638e81312128485a (PR #392), exact-head CI success on da857fab. Attempts A001, A002; reviews V001 (fail, corrected) and V002 (pass). Known limits: 390 px not observed (500 px observed); N1 (researcher exception in coord.who) fixed in J002.

## J002

- Status: completed
- Objective: The README shows a static SVG overview generated from the same data file, and all Archify tooling, sources and docs are removed.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- The same script writes `docs/en/workflow.svg` and `docs/es/workflow.svg`, which show nodes and arrows only and no JavaScript. `--check` covers them.
- `README.md` and `README.es.md` show the SVG and link the interactive page. Only the diagram section changes.
- The following are removed: `docs/diagrams/workflow.json`, `workflow.generated.json`, both `workflow.delivery.json` files, `tooling/maintenance/workflow-diagrams.mjs`, `tooling/maintenance/workflow-citations.mjs`, their tests and their `check-quality` calls, and `/.archify/` in `.gitignore`. Each removal is checked for other callers first.
- `docs/en/development.md` and `docs/es/development.md` describe how to maintain the new source. `.github/workflows/pages.yml` still publishes the two pages.

### Evidence

- Merged as 7821cf9790b920c9ad384013f847c7434425c4e6 (PR #393), exact-head CI success on 04eacf3d. Attempts A001, A002; reviews V001 (fail, corrected) and V002 (pass). Ignored Archify receipts moved from the primary checkout to tooling/.local/archify-receipts. Known limit: the HTML page's loop label offset (+70) may touch its arrow (V002 N1), follow-up outside I0065.

## J003

- Status: completed
- Objective: The README becomes a short, plain-language front page that tells the story of a first complete session. Reference detail moves into the existing "How the factory works" guide, in both languages.
- Depends on: J002
- Brief: [brief-r1.md](jobs/J003/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- `README.md` and `README.es.md` follow the operator's outline in the brief, in plain language, and define any technical term they keep.
- `docs/en/reference.md` and `docs/es/reference.md` hold the reference topics the brief lists, each grounded in its canonical guide and linking to it rather than copying it.
- The README's first-session story tells new users to run `isswf-howto` when unsure what to ask. `isswf-howto` is updated if it is stale against the new pages, or A001 records why no change was needed.
- The legacy compiled-release path and the Pages publication notes leave the README. They stay findable from the documentation index.
- `check-docs` passes, and no content that is still current is lost: each removed README paragraph is either moved or already covered, and A001 records where each went.

### Evidence

- Merged as 9d50fc7cd8ceaed34b1d600d914770926535fe6d (PR #394), exact-head CI success on 02673537; operator product acceptance 2026-11-22 ("por lo demas OK"). Attempts A001-A003; reviews V001 (fail, corrected), V002 and V003 (pass). isswf-howto unchanged, so no packaged file changed. F14 and F15 wording carried to J006.


## J004

- Status: in-progress
- Objective: The README front page opens with two hooks: an animated SVG that simulates a first complete session, and an animated SVG that simulates the Claude Code initiatives panel.
- Depends on: J003, J006
- Brief: [brief-r1.md](jobs/J004/brief-r1.md)
- Blocker: None.
- Next step: Worker dispatched in background; worktree `isSWF-worktrees/i0065-j004`, branch `i0065-j004`.

### Acceptance

- A Node script with no dependencies writes `docs/en/first-session.svg` and `docs/es/first-session.svg` from one bilingual script file. The SVG animates without JavaScript, is labeled as a simulation, and every command and response in it matches the real skill and coordinator behavior at the base revision.
- `--check` fails when a generated SVG differs from the script file or the two languages differ in steps. It runs in `tools/check-quality.mjs`.
- `README.md` and `README.es.md` show the animation near the top of the front page and the panel animation in the first-session section, with alt text. The panel animation is labeled as a simulation and shows only fields, states and layout that the panel code renders at the base revision (operator decision, 2026-11-22: simulated rather than recorded).


## J005

- Status: completed
- Objective: A gap inventory lists current isSWF capabilities that a new user would value but that the README, the reference page or the workflow flowchart do not mention, so the operator can choose what to add.
- Depends on: None
- Brief: [brief-r1.md](jobs/J005/brief-r1.md)
- Blocker: None.
- Next step: None. The operator chooses which gaps to add.

### Acceptance

- Each gap names the capability, its canonical source path, where it is missing (README, reference, flowchart) and why a new user would care.
- Every listed capability is current behavior grounded in code, a skill, a role or a current guide; proposals and historical records are excluded.
- The inventory is ranked, with a short recommendation of at most the top ten.

### Evidence

- Researcher return, 2026-11-22, base d293487e, judged also against the J003 candidate snapshot. Top ten: (1) Pi needs the separately installed pi-subagents extension, dropped by the J003 candidate (regression); (2) compaction reminder; (3) integration gate stamps; (4) review coverage check in CI; (5) isswf-status --next and snapshot; (6) package-acquisition refusal; (7) token and cost reports (estimates); (8) record check after writes; (9) initiative close gate; (10) isswf-handoff missing from the skills table. Also: guards framed as Claude-only though Pi has equivalents; flowchart node pr implies a PR for every change, while records-only push and local mode have none.


## J006

- Status: completed
- Objective: The reference page, the README and the flowchart cover the J005 gaps 2-10 and show the delivery paths without a pull request.
- Depends on: J003
- Brief: [brief-r1.md](jobs/J006/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- `docs/en/reference.md` and its Spanish mirror explain, each grounded in `docs/en/operations.md` or the named tool and linking to it: the compaction reminder, the integration gate and its stamp (observe and enforce), the review coverage check in CI, `isswf-status --next` and the snapshot, the package-acquisition refusal, token and cost reports as estimates, the record check after writes, and the initiative close gate. Host and version qualifiers from the sources are kept.
- The reference skills table lists `isswf-handoff`.
- The README gains at most four plain-language sentences for the most useful of these, linking the reference.
- The flowchart data shows that records-only direct push and local mode reach the base branch without a pull request; `--check` passes and both languages match.

### Evidence

- Merged as cee39ae76cbd46c2440da9975b571946cb642374 (PR #395), exact-head CI success on 9417ef1e; operator acceptance 2026-11-22 ("adelante"). Attempts A001, A002; reviews V001 (fail, corrected) and V002 (pass). Known limit V002 F7: compaction row names managed settings only; operations.md gives the full condition. Local mode is worded as staying on the machine, matching its source (V001 F6).
