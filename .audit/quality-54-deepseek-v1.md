# Revisión independiente — #54, unidad 1

Ejecutada a mano con `.agents/roles/reviewer.md` y `references/review.md`. Sin trigger nativo, sin subagentes, sin runtime Pi, sin ediciones, commits, escrituras ni red.

## Identidad y alcance

- **Base confirmada:** `c083c861fe736c37ce0dc16b16b6899d01abfa51` (= `HEAD`). El worktree está limpio para los archivos del candidato; el candidato existe solo en el paquete, no aplicado en el checkout.
- **Candidato:** snapshot `.audit/quality-54-unit1-snapshot`, digest `ee27e08da53496a2b68267f268b2553545685f3abe3678007c53e77a09b47042`, **verificado** con el helper readonly (coincide con el ID indicado).
- **Integridad del paquete:** blobs base `70fadf08…`/`e9c39e02…` = `c083c86:…`; blobs candidato `14c28b29…`/`6853a6d7…` = `git hash-object` del payload = líneas `index` del diff; `git apply --check --whitespace=error-all` pasa. Revisé exactamente el paquete, no el worktree.
- **Alcance revisado:** `.agents/roles/references/code-quality.md` (nuevas 10–12), `.agents/roles/references/review.md` (13–21) y `.audit/quality-54-unit1-brief.md` (completo).

## Standards — `pass` (refs) / ver bloqueantes del brief

Contrastado con `worker.md`, `reviewer.md`, `code-quality.md`, `comments.md`, `verification-principles.md`, `tdd.md` y las dos notas locales:

- Los textos nuevos reutilizan los contratos existentes; no crean perfil, agente, rúbrica paralela ni gate. Las cinco dimensiones se aplican «when they apply to the diff and its risks».
- El cierre deslop reproduce la fila P2 de `adaptacion-pstack-addy.md`: señales de comentarios, defensas, casts y ramas; mantiene comportamiento salvo bug claro; no aplica a documentación ni a diffs sin señales; no es `no-comments`; no autoriza delegación ni edición fuera de alcance.
- No hay TDD obligatorio, suite universal, cuota de líneas, gate automático ni autorrevisión; la dependencia se evalúa solo si cambia (`code-quality.md:11`, `review.md:18`).
- Única objeción relevante (B2, abajo): los enlaces nuevos son los primeros enlaces Markdown que escapan de `.agents`; eso interactúa mal con el validador del proyecto.

## Spec — `inconclusive`

Criterios aceptados, observados en el texto:

| Criterio | Evidencia |
|---|---|
| Deslop contextual | `code-quality.md:12`, con límites explícitos |
| 5 dimensiones bajo Standards, Spec separado | `review.md:13–19, 21` |
| Assertions observables / checks que detecten defectos plausibles | `code-quality.md:10`, `review.md:21` |
| Seguridad de dependencias solo si cambian | `code-quality.md:11`, `review.md:18` |
| Sin gates globales / TDD / cuotas / autorrevisión | `review.md:21`, `code-quality.md:10`; sin cuotas en el diff |

Comparación selectiva contra fuentes locales correcta; no se añadió investigación nueva ni enlaces externos. **Falta la evidencia que exige `docs/spec-v1.md:174`** para cambios de instrucciones: un caso representativo antes/después que demuestre el comportamiento buscado. No hay prueba de que un agente cumpla estas instrucciones y no se reclama. `u1-findings.md` (U1-005) y `quality-54-dispatch-failure.md` muestran que el intento de dogfooding quedó pendiente/fallido; no son evidencia sobre este contenido.

## Hallazgos

**B1 — `blocking` — `.audit/quality-54-unit1-brief.md:1–34`.** El brief durable no contiene el contrato de asignación que exigen `reviewer.md` (Required input) y `worker.md` (Assignment contract): no hay criterios de aceptación numerados ni objetivos separados de límites, identidad del candidato (digest/commit), frontera de autorización (grant, checkout, efectos), criterios de revisión independiente ni modelo/effort; el SHA base aparece solo como resultado de comprobación. Impacto: el paquete por sí solo no reconstruye el encargo; ese grounding vive únicamente en el prompt del coordinador. Según la clasificación indicada, es bloqueante del brief, no del contenido fuente. Acción: completar el brief durable.

**B2 — `blocking` — `.agents/roles/references/code-quality.md:12` y `.agents/roles/references/review.md:21` + brief:30.** Los enlaces Markdown nuevos escapan de `.agents` (3 enlaces: 1 en code-quality, 2 en review). `.audit/verify-markdown-core.mjs` copia solo `<candidate>/.agents` (línea 26) y hace `readFile` de cada enlace (líneas 36–40), resolviendo a `<tmp>/docs/research/...`, que nunca existe en el fixture → el validador falla. En la base había 0 enlaces Markdown que escaparan; la convención local para referencias externas es code span (`.agents/skills/isswf-triage/SKILL.md:8`). `docs/spec-v1.md:174` exige validar formato cuando hay validador, y el brief:30 afirma que el script «no aplica», lo que es inexacto: sí comprueba enlaces/formato de estos archivos. Los enlaces sí resuelven en el repo real (verificado). El potencial falso fallo no queda documentado de forma durable. Acción (a decidir por el coordinador): citar como code spans, o registrar la limitación y autorizar el arreglo del fixture en otra unidad. Si se acepta como limitación documentada, B2 se disuelve; tal como está, el check queda fallido/no disponible.

Sin más hallazgos bloqueantes en los dos refs.

## Checks ejecutados (observados)

- `node .audit/verify-reviewer-snapshot.mjs .audit/quality-54-unit1-snapshot` → digest `ee27e08d…b47042`, base y 3 archivos.
- `git rev-parse HEAD`, `git status --porcelain`, `git rev-parse c083c86:…`, `git hash-object` del payload, `git apply --check --whitespace=error-all` → todo consistente.
- Escaneo estático de enlaces: base 13 `.md` bajo `.agents`, 0 escapando; candidato, los 3 citados. Sin espacios finales en el payload.
- Existencia real de los destinos citados → OK.
- **No ejecutados** (limitación, no pass): `verify-markdown-core.mjs` (escribe en `/tmp` y lanza `pi`), runtime Pi, tests (cambio documental), red.

## Agregado

No hay claim de pass: **Standards de los refs = `pass`** (con B2 condicionado a disposición del coordinador); **Spec = `inconclusive`** por evidencia de comportamiento pendiente; **el brief durable tiene dos bloqueantes (B1, B2)**. Si el coordinador trata el brief como entregable en alcance, el paquete no puede cerrarse hasta resolverlos; si los desestima con razón durable, el resultado máximo es `inconclusive` (no `pass`) hasta aportar el caso representativo antes/después.
