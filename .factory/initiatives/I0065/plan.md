# I0065: In-repo workflow flowchart without Archify

Type: enhancement

The operator found the Archify workflow diagrams confusing: they mix every role, skill and reference in one picture. On 2026-11-22 they approved an interactive flowchart mockup ([mockup.html](mockup.html)) and decided to drop Archify entirely. In the mockup, clicking a node lists the questions that role asks itself. Each question opens to a yes and a no outcome, highlights the arrow it leads to, and links the cited `.md` file on GitHub. Nodes that have automatic guards carry a small mark. All text uses plain language, with the technical name shown only as a grey link.

J003 restructures the README and its reference page, as the operator decided on 2026-11-22.

Integration: the operator authorized integrating every I0065 job on 2026-11-22 ("tienes mi autorizacion para integrarla"), after required review and exact-head CI. No release is planned: the changed files are outside the package `files` list, except `.agents/skills/isswf-howto/` if J003 changes it, which would then need a patch release. The operator authorized that patch release on 2026-11-22 ("ok pues entonces release patch"): at initiative close, if any packaged file changed, release the next patch through `.claude/skills/project-release/SKILL.md`; otherwise no release.

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

- Status: in-progress
- Objective: The README shows a static SVG overview generated from the same data file, and all Archify tooling, sources and docs are removed.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None.
- Next step: Worker dispatched in background; worktree `isSWF-worktrees/i0065-j002`, branch `i0065-j002`, base e552183b. Wait for its report.

### Acceptance

- The same script writes `docs/en/workflow.svg` and `docs/es/workflow.svg`, which show nodes and arrows only and no JavaScript. `--check` covers them.
- `README.md` and `README.es.md` show the SVG and link the interactive page. Only the diagram section changes.
- The following are removed: `docs/diagrams/workflow.json`, `workflow.generated.json`, both `workflow.delivery.json` files, `tooling/maintenance/workflow-diagrams.mjs`, `tooling/maintenance/workflow-citations.mjs`, their tests and their `check-quality` calls, and `/.archify/` in `.gitignore`. Each removal is checked for other callers first.
- `docs/en/development.md` and `docs/es/development.md` describe how to maintain the new source. `.github/workflows/pages.yml` still publishes the two pages.

### Evidence

- None.

## J003

- Status: pending
- Objective: The README becomes a short, plain-language front page that tells the story of a first complete session. Reference detail moves into the existing "How the factory works" guide, in both languages.
- Depends on: J002
- Brief: [brief-r1.md](jobs/J003/brief-r1.md)
- Blocker: None.
- Next step: Wait for J002.

### Acceptance

- `README.md` and `README.es.md` follow the operator's outline in the brief, in plain language, and define any technical term they keep.
- `docs/en/reference.md` and `docs/es/reference.md` hold the reference topics the brief lists, each grounded in its canonical guide and linking to it rather than copying it.
- The README's first-session story tells new users to run `isswf-howto` when unsure what to ask. `isswf-howto` is updated if it is stale against the new pages, or A001 records why no change was needed.
- The legacy compiled-release path and the Pages publication notes leave the README. They stay findable from the documentation index.
- `check-docs` passes, and no content that is still current is lost: each removed README paragraph is either moved or already covered, and A001 records where each went.

### Evidence

- None.


## J004

- Status: pending
- Objective: The README front page opens with two hooks: an animated SVG that simulates a first complete session, and an animated SVG that simulates the Claude Code initiatives panel.
- Depends on: J003
- Brief: [brief-r1.md](jobs/J004/brief-r1.md)
- Blocker: None.
- Next step: Wait for J003.

### Acceptance

- A Node script with no dependencies writes `docs/en/first-session.svg` and `docs/es/first-session.svg` from one bilingual script file. The SVG animates without JavaScript, is labeled as a simulation, and every command and response in it matches the real skill and coordinator behavior at the base revision.
- `--check` fails when a generated SVG differs from the script file or the two languages differ in steps. It runs in `tools/check-quality.mjs`.
- `README.md` and `README.es.md` show the animation near the top of the front page and the panel animation in the first-session section, with alt text. The panel animation is labeled as a simulation and shows only fields, states and layout that the panel code renders at the base revision (operator decision, 2026-11-22: simulated rather than recorded).
