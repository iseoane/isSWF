**Standards PASS · Spec PASS.** v2 `/tmp/isswf-reconcile63-v2-Icdh7T` fixes every v1 blocker:

1. Chatter: no `otro escritor` / `esta tarea no lo modifica` remains (grep over six files empty).
2. Codegraph historical: `vision:39`, `plan-v1:17`, `arranque:27` — "comprobación del 14 de octubre … 18 archivos … cobertura parcial".
3. Claim narrowed: `nextcut:9` — "por sí solos … una política de sistema efectivamente impuesta puede serlo, pero debe comprobarse".
4. Direction retained: `vision:37`, `arranque:31` — shared fixed-version installation + explicit per-project activation; `nextcut:14` and `nextcut-63-build-brief:16` agree.
5. Config: `nextcut:18` — `.factory/models.json` canonical; `isswf.config.json` unapproved; SQLite/Python not required.
6. Remote: `vision:11`, `arranque:35` — push `0d81c5f`→`5c85a38` authorized/completed; no PR/merge/deploy/install authority.
7. Lock/scope: `nextcut:31` exclusive actor is a precondition, not proof of multiwriter denial; `:39` defers the multiwriter gate; no client readiness.

Verified: six SHA-256 match `.audit/reconcile-63-candidate-v2.json` (base `5c85a383` = HEAD = `origin/main`); reflog shows `update by push` for both commits, `0d81c5f` ancestor; 46 links — 43 resolve, 3 target the candidate's new `docs/next-operational-cut.md`; no checked boxes; exactly six files.

Minor (non-blocking): date stamps "14 de octubre" (`vision:3`, `plan-v1:3`) predate the 15 Oct push they cite — cosmetic staleness, no contradiction. PASS stands.
