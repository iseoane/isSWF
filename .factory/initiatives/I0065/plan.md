# I0065: In-repo workflow flowchart without Archify

Type: enhancement

The operator found the Archify workflow diagrams confusing: they mix every role, skill and reference in one picture. On 2026-11-22 they approved an interactive flowchart mockup ([mockup.html](mockup.html)) and decided to drop Archify entirely. In the mockup, clicking a node lists the questions that role asks itself. Each question opens to a yes and a no outcome, highlights the arrow it leads to, and links the cited `.md` file on GitHub. Nodes that have automatic guards carry a small mark. All text uses plain language, with the technical name shown only as a grey link.

The README tone and structure are a separate operator discussion. This initiative changes only the README's diagram section.

## J001

- Status: pending
- Objective: A bilingual interactive flowchart page, generated from one in-repo data source and checked by the quality suite, replaces the Archify `workflow.html` pages.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: Dispatch an isswf-worker.

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

- None.

## J002

- Status: pending
- Objective: The README shows a static SVG overview generated from the same data file, and all Archify tooling, sources and docs are removed.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None.
- Next step: Wait for J001.

### Acceptance

- The same script writes `docs/en/workflow.svg` and `docs/es/workflow.svg`, which show nodes and arrows only and no JavaScript. `--check` covers them.
- `README.md` and `README.es.md` show the SVG and link the interactive page. Only the diagram section changes.
- The following are removed: `docs/diagrams/workflow.json`, `workflow.generated.json`, both `workflow.delivery.json` files, `tooling/maintenance/workflow-diagrams.mjs`, `tooling/maintenance/workflow-citations.mjs`, their tests and their `check-quality` calls, and `/.archify/` in `.gitignore`. Each removal is checked for other callers first.
- `docs/en/development.md` and `docs/es/development.md` describe how to maintain the new source. `.github/workflows/pages.yml` still publishes the two pages.

### Evidence

- None.
