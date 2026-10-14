## Revisión independiente #49 — readonly

**Método.** Leí solo `docs/research/adaptacion-matt.md` y `docs/research/adaptacion-pstack-addy.md`. No abrí `adaptacion-experiencia.md`, no usé subagentes, no escribí en el repo ni ejecuté workflows. Verifiqué las URLs por HTTP (GitHub API + `raw.githubusercontent`) y el checkout Pstack y los perfiles locales directamente.

## Veredicto

| Nota | Resultado | Bloqueantes |
|---|---|---|
| `adaptacion-matt.md` | **PASS** | 0 factuales |
| `adaptacion-pstack-addy.md` | **PASS en sustancia**; gate de procedencia **FAIL** puntual hasta corregir | hash Addy truncado (línea 65) |

## Bloqueante de procedencia (sigue presente)

`adaptacion-pstack-addy.md:65` — el enlace de `hardening-patterns` usa **37 chars** (`aeac41d4d005999432bb7312f7ff06383a91d`), faltan `59d`. GitHub lo resuelve hoy (HTTP 200 en API y blob), pero rompe la afirmación de la propia tabla («las URL fijan el commit inspeccionado») y el criterio de hash completo. **Corrección obligatoria antes de cerrar la nota.** El resto de URLs de Addy y las 17 de Matt usan hash completo de 40 chars.

## Verificación factual

**adaptacion-matt.md**
- Commit `49dd158d…` real; fecha API 2026-10-09 (coincide); `main` actual sigue siendo ese commit.
- `LICENSE` MIT © 2026 Matt Pocock: verificado.
- Las 17 rutas fijadas existen en ese commit (tree API, 287 paths).
- Claims muestreados contra fuente y todos coinciden: `triage` (estados `needs-info`/`ready-for-agent`, `.out-of-scope/`, verificación previa, espera dirección); `code-review` (dos subagentes paralelos, punto fijo, fuentes de spec y standards); `implement-spec` (grafo, ramas de integración, background, TDD obligatorio); `retro` (categorías y mecanicista→check); `wayfinder` (mapa de decisiones); `grill-with-docs/SKILL.md` delega solo en grilling + domain-modeling; doc de `grill-with-docs` (entrevista ≠ spec; decisiones solo en la conversación); `to-questionnaire` (solo destinatario y necesidad); `writing-docs`, `codebase-design` (one adapter = seam hipotético), `improve-codebase-architecture`, `AGENT-BRIEF`.
- Contraste local: `reviewer.md` + `review.md` cubren ambos ejes e inconcluso (verificado); el mapa `adaptaciones-agentes.md` sigue diciendo «Hoy existen únicamente… coordinator, worker y diagnostician» y reviewer como propuesta futura — **stale confirmado** respecto a `.agents/roles/reviewer.md` (tracked en la base `3b2a52f`).

**adaptacion-pstack-addy.md**
- Pstack local HEAD `94f5ce95…` coincide; además está **publicado upstream** (API 200, 2026-10-14). La limitación «no se comprobó que el commit local esté publicado» ya es resoluble.
- `LICENSE` MIT, © 2026 Lauren Tan + Michael Denyer. La nota dice MIT (correcto) pero omite el doble copyright; solo importa si #54 copia texto, y la nota ya advierte avisos de autoría.
- Claims de skills Pstack verificados contra el checkout: `poteto-agent` (lee `poteto-mode` entero, navega hojas), owner del playbook, `how`/`swarm`/`interrogate`/`no-comments` con spawneos propios (general-purpose readonly, comment-sicko, reviewers por modelo), `deslop`, `blast-radius` (un hecho probado ejecutando; arena solo cambio grande/ancho), `thermo-nuclear-review` («NOTHING can slip through», consulta discusión del PR con hallazgos medium/high), 1k crossing rule. Todo correcto. Matiz: el «umbral de 1000 líneas» es regla de cruce (<1k → >1k por la PR), no límite estático; la contradicción con `spec-v1` se mantiene.
- Addy: commit `aeac41d4…59d` real, sigue siendo `main`; las 27 rutas existen, incluidas `references/security-checklist.md` y `performance-checklist.md` en raíz; `LICENSE` MIT © 2025.
- Claims Addy verificados: cinco ejes, remediation estructural, arquitectura web, «The system prompt is not a security boundary», trust boundaries con LLM output/procesos/ficheros, rutas destructivas, supply chain; rendimiento MEASURE→VERIFY keep/revert, RUM, ledger, budgets. Coinciden.
- Contraste local verificado: `worker.md` (confirmar base, reabrir código, alcance exclusivo, checks, code-quality al cierre/comments al editar), reviewer/review, `spec-v1` (revisiones adicionales por superficie y bloqueo por inconcluso, líneas 106-131), mapa (P1 reviewers, P2 seguridad), `referencias.md:113` (no cinco autoridades globales).

## Portabilidad y sugerencias

1. **`file:///home/iseoane/...`** (líneas 60-63, 8 enlaces). La nota lo declara y limita, así que no es bloqueante; ahora que el commit es público, la corrección directa es usar URLs upstream (`github.com/michael-denyer/pstack-claude/blob/94f5ce9…/...`) y dejar la ruta solo como «checkout local del operador».
2. **`adaptacion-matt.md` fila 8**: «no hay base de producto» sobreafirma — existe `isswf/` con 840 líneas (`contracts` 287, `intake` 312, `panel` 193, `main` 47) y `tests/test_u1.py` de 718. «Principalmente documentos y pruebas» es correcto por conteo (216/232 archivos tracked), pero la frase debería decir «prototipo pequeño sin fricción demostrada»; la decisión de diferir se mantiene.
3. Línea `throughput checkpoint: n/a, read-only investigation` es un artefacto del protocolo Pstack sin significado en una nota del repo; eliminar o explicar.
4. Fila P1 singular del reviewer en Matt: el mapa tiene dos filas P1 (spec y standards); la conclusión cubre ambas, pero conviene decirlo.

## Recomendación adaptada vs afirmación source

Ambas notas separan bien: Matt usa «Destino y decisión» (adaptar/rechazar/diferir) y Addy declara «adopción literal, adaptación de idea, rechazo» con límite por fila. Verifiqué que lo rechazado existe tal cual en la fuente (tracker/labels/cierre, `implement-spec`, `no-comments` autónomo, Thermo como gate, 1k). No imponen workflow copiado. Único punto de diseño para #54: el mapeo de los cinco ejes de Addy a Standards/Spec — «Correctness» incluye «does it match the spec», que pertenece a Spec; al mapear hay que separar corrección de comportamiento (Standards) de cumplimiento del objetivo (Spec) para no duplicar hallazgos.

## Gaps técnicos (Pstack, tests/deps, implementación actual)

- **Profundidad Pstack:** suficiente para decidir (delegado de estilo vs agentes especializados, carga selectiva de principios, skills con rutas propias). No entra en contrato de hojas `principle-*`, routing modelo/effort ni taxonomía de subagentes; aceptable si no se copia runtime, y la nota lo declara como límite.
- **Tests:** ninguna nota define verificación de la adaptación. `spec-v1.md:174` exige para cambios de instrucciones «un caso representativo antes y después» y validar formato si hay validador; #54 debería citarlo y cumplirlo. Los «evidence output» por fila son criterios de aplicación, no tests.
- **Deps:** no hay dependencias nuevas (cambios Markdown), pero no se declara explícitamente; añadir una línea. La única dependencia externa es el checkout Pstack, resoluble vía upstream público.
- **Implementación actual:** las propuestas encajan con `spec-v1.md:38` («una especialidad puede ser rúbrica o skill del perfil existente»); citarlo justificaría «no segundo revisor». La P1 «selección de principios Pstack» puede duplicar el mapa de 24 principios de `adaptaciones-agentes.md`: la nota dice reconciliar pero no muestra el delta nuevo.
- **Mapa desactualizado:** Matt lo detecta correctamente, pero la corrección del mapa no está como ítem con dueño/coste en ninguna tabla (queda en la recomendación final). Añadirla a #54 o a tarea autorizada.

Sugerencia de cierre: corregir el hash truncado y las 4 sugerencias de la nota Addy/Matt en la misma pasada de los autores; ninguna decisión de contenido cambia.
