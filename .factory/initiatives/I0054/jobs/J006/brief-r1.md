# I0054/J006 r1: File tree as a third tab (started 2026-11-14)

Grounding (main ad63815): hooks/register.tsx draws tabs `initiatives`/`agents` from state `tab`; J004 added a separate pane `isswf-initiative-tree` opened by `openTree()` from the card title, drawn by its own `ui.render` hook with state `tree`. Move that drawing into a `files` tab of the main pane; the title press sets `tree` and `tab: 'files'`. Keep `treeRows`, the boundary (`isInside`, listed rows only), 60,000-character and 4 MiB limits, CRLF normalisation.
Methodology: coordinator as writer with roles/worker.md, design-principles (UI state), verification-principles, comments, code-quality; isswf-writing for docs. Checks: `claude plugin test`, check-docs; bound review; CI; operator try.

Added by the operator during the job (2026-11-14): one record detail open at a time; one unfolded completed job at a time (non-completed jobs always show their rounds); a record detail lists only known facts and a record with none is not selectable.
