# J018 cut 2: Windows caller directory synchronization

## Bounded outcome

Handle unsupported Windows directory synchronization in existing planner/reviewer publication, store creation and capacity-refusal cleanup. Keep file synchronization and other directory errors fatal. Preserve grants, pins, claims, no replay and the publication sequence. Add no production module or general durability framework.

Input Git base: `fcddfda5d2c520b11354bce0407cece17b37cda0` plus [cut 1](brief-r2.md), snapshot `16ef8e01035d40f553773692a20649515b9932948cbbdd159eded61aad364bf1`. Root-only commit `0a143a1761aead70d340e68854d45d2d421bebf8` retains those exact functional bytes. Reviewed combined snapshot: `202670135b4bd40a630c21ae4e2d3191ce2b390ad337362185dd9627c8955074`.

## Evidence and review

- Existing native Windows callers failed directory `fsync` with `EPERM`. The local helpers now tolerate only Windows directory-open/sync `EPERM`; file synchronization remains unchanged and strict. Existing result limits explicitly disclaim Windows power-loss durability.
- One focused fixture exercises both actual callers: publication, readback, no replay, and fatal directory/file `EIO`. Native Windows PASS (18974ms), Linux PASS (3310ms), affected locked ESLint PASS (1561ms).
- The worker timed out after 170029ms; that failed terminal result remains retained. Coordinator corrections affected only the new fixture's clock, existing fault target and unused local, without new cases or increased deadlines. The earlier failed checks remain retained.
- The original unused independent Sol MEDIUM reviewer completed in 34625ms within a separately approved 90000ms window: **Standards PASS, Spec PASS, aggregate PASS, no findings**, for the cut-2 delta only. Full reviewer role, review skill and review guidance were consumed first. No commands or personal test reruns were performed by that reviewer.
- Full Linux working-tree quality PASS (105310ms), including required existing Bun and a real Bubblewrap synthetic-SDK fixture. Windows full ESLint, Knip, documentation and whitespace checks PASS. HEAD-based packaging inside that run used the old committed base, not the dirty candidate.
- Existing full Windows planner/reviewer fixtures advance past directory synchronization but still fail `http400: fetch count` assertions (0 versus 1). These unmodified fixtures and failures remain visible; this cut does not claim whole Windows execution parity.

## Accepted limits and delivery

Cut 1's original adverse coverage review and explicit operator acceptance remain unchanged. This cut does not reopen those tests. Later authorized changes to affected code use TDD for cases needed then.

Actual committed-candidate artifact inspection and exact-head hosted CI are subsequent delivery gates, not implied by the working-tree checks. Their observed results belong to the PR evidence. Native metadata and synthetic fixtures do not prove real-provider behavior, OS containment or POSIX crash durability.

Only two existing callers, the one focused fixture and its quality registration are changed. Capacity-module synchronization, diagnostic evidence roots, privileges, deadlines, PR87, further cuts, merge, release, operative installation and cleanup remain excluded. No further model call, retry or replacement is authorized.
