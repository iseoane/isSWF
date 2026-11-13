# Job brief J010 / r1

- Source and authorization: operator request 2026-11-13 in the Claude Code session, started directly ("Añadir a J009 ... O como J010"); same delivery scope as J009 (commit, push to PR #281, CI, merge of the I0046 chain into main).
- Objective: the pane treats an initiative as touched when a Bash command names it with `--initiative IXXXX`, in addition to record paths.
- Scope: `touchedIds` in hooks/register.tsx, one test, installation guide en/es sentence.
- Methodology considered: TDD declined (small seam, negative control instead); review mechanical (plugin tests with negative control, check-docs).
