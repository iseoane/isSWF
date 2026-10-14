# Unidad 1 de calidad para #54

## Contrato de encargo

**Objetivo observable.** Restaurar exactamente la unidad 1 del candidato congelado `ee27e08da53496a2b68267f268b2553545685f3abe3678007c53e77a09b47042` en el worktree exclusivo de esta asignación. Cambiar solo las tres citas nuevas de fuentes de investigación para que muestren rutas de repositorio en los perfiles, y dejar este brief como contrato durable de ejecución y verificación. No alterar el contenido operativo restante ni presentar perfiles Markdown como controles del runtime.

**Base.** `c083c861fe736c37ce0dc16b16b6899d01abfa51`.

**Checkout y ownership.** El checkout autorizado es `/home/iseoane/Work/isSWF/.claude/worktrees/agent-a2da91fb935f95bfe`, confirmado como `pwd` y worktree Git en esa ruta, en la base indicada. El escritor previo fue la sesión Pi `6ba18a30-3b26-4888-b62c-7e494422547e` y su escritura está confirmada como terminada. El escritor de esta fase es el parent phase writer, único escritor actual de los tres paths autorizados. El paquete fuente de solo lectura está en `/home/iseoane/Work/isSWF/.audit/quality-54-unit1-snapshot/`; el registro de comportamiento de solo lectura está en `/home/iseoane/Work/isSWF/.audit/quality-54-behavior.json`.

**Autorización y límites.** El coordinador autorizó expresamente esta corrección fresca con un escritor. Se permite escribir exclusivamente `.agents/roles/references/code-quality.md`, `.agents/roles/references/review.md` y `.audit/quality-54-unit1-brief.md` en este worktree. No modificar el checkout principal ni otros worktrees. No crear commits ni subagentes. No usar red, runtime, instalaciones, Python ni otros archivos o notas. No crear un script verificador. No añadir contenido a las fuentes ni inventar una identidad de candidato antes de detener al escritor.

**Modelo.** `openai-codex/gpt-6-luna`, esfuerzo alto.

## Grounding vigente

El mapa de fuentes es orientativo; se releen los archivos actuales antes de editar.

- `.agents/roles/worker.md:5-17` define los campos obligatorios del brief. `:19-34` prescribe reconciliar base, cargar referencias pertinentes, mantener el cambio mínimo, ejecutar y reportar solo checks observados, escribir dentro del scope y no crear commits o subagentes no autorizados.
- `.agents/roles/references/code-quality.md:1-12` es la guía de calidad de cambios de código. En la línea 12 está la cita contextual a investigación, mostrada como code span con la ruta repo `docs/research/adaptacion-pstack-addy.md`, no como enlace Markdown.
- `.agents/roles/references/review.md:1-40` regula identidad del candidato, Standards, Spec, probes y hallazgos. En la línea 21 están las dos citas contextuales, mostradas como code spans con las rutas repo `docs/research/adaptacion-pstack-addy.md` y `docs/research/adaptaciones-agentes.md`, no como enlaces Markdown.
- `.agents/roles/references/comments.md:1-7` limita comentarios a razones, restricciones e invariantes no evidentes. No se cambia.
- `.agents/roles/reviewer.md:1-37` asigna review independiente, requiere identidad exacta, separa ejes y desautoriza al implementador como revisor. No se cambia.
- `docs/research/adaptacion-pstack-addy.md:33-50` fundamenta el mapeo contextual a Standards y Spec y sus límites. `docs/research/adaptaciones-agentes.md:55-66` registra que el reviewer existente es el dueño y que las propuestas son condicionales, no nuevas capacidades.
- El escritor previo describió `.audit/verify-markdown-core.mjs:20-41` como un escáner de Markdown bajo `.agents` que reconoce enlaces Markdown locales y lee sus destinos, y señaló que la línea 26 copia `.agents` al proyecto temporal. El parent debe comprobar qué formato aplica y el resultado de los enlaces después de convertirlos en code spans. Esta fase no afirma que el script no aplique ni reporta esa comprobación como aprobada.
- El escritor previo reportó que `.audit/quality-54-behavior.json` contiene un resultado anterior del coordinador: antes y después fueron `PASS 6 observable cases`, con el mismo hash de checks y bytes finales. Es evidencia reportada por el escritor previo de resultado igual, no de mejora ni de ejecución de esta fase.

## Aceptación observable

1. Los tres archivos se copiaron primero byte por byte desde `.audit/quality-54-unit1-snapshot/payload/`. Sus hashes iniciales deben coincidir con el manifiesto congelado: `code-quality.md` `9bd6f7672c787a7313d0a7b8ed5dbddf0f390b1105beaf30e579f8acd24cc06f`; `review.md` `048aa91e338bafdbaa0465fa87f11ea9384f2fe0ba63f416c87b74ad5bf02e96`; brief `a4b779e6691dfc6bdc300cbbcae3fc32f454499bbeedb4b084fb587d20d1a2c9`.
2. El cambio en `code-quality.md` convierte solo la cita nueva a `docs/research/adaptacion-pstack-addy.md` en un code span de ruta, sin enlace Markdown. El cambio en `review.md` hace lo mismo para sus dos citas nuevas, a `docs/research/adaptacion-pstack-addy.md` y `docs/research/adaptaciones-agentes.md`.
3. Se preservan todos los párrafos operativos y el resto del contenido de los dos perfiles. No se añaden reglas, verificadores ni referencias runtime. El cambio no extiende las fuentes de investigación.
4. Este brief especifica objetivo, criterios observables, scope, exclusiones, autorización, checkout exclusivo, ownership, base, modelo, fuentes actuales con rangos, checkpoints y estado separado de evidencia y checks.
5. El estado previo de comportamiento se cita solo como resultado idéntico antes/después en seis casos, nunca como mejora. La ejecución del verificador Markdown-core y cualquier nuevo resultado de comportamiento quedan pendientes del coordinador; no cuentan como PASS en este trabajo.
6. La revisión independiente sigue requerida. Después de que el escritor se detenga, el coordinador asigna la identidad exacta del candidato y conserva el paquete congelado y manifiesto en `.audit/quality-54-unit1-snapshot-v2/manifest.json`. No inventar SHA de commit ni digest, ni incluir una suma autorreferencial del manifiesto. Revisores en contexto separado: `openai-codex/gpt-6-luna` con esfuerzo alto y `opencode-go/deepseek-v4.1-flash` con esfuerzo máximo. El autor no sustituye la revisión.

## Checkpoints

- **Grounding reportado por el escritor previo antes de editar.** La base, el worktree, el manifest del candidato original, las fuentes actuales, los rangos, el comportamiento guardado y el cuerpo del verificador se leyeron. Los tres payloads se copiaron y sus hashes iniciales coincidieron con el manifest.
- **Cierre del escritor.** Inspeccionar diff y scope, comprobar que solo hay tres paths cambiados, verificar que las únicas diferencias en los perfiles son las tres citas convertidas a code spans sin enlace, y ejecutar `git diff --check`. Informar cada resultado como observado o pendiente. No crear commit.
- **Checkpoint del coordinador, no del escritor.** Congelar identidad del candidato después de detener al escritor; ejecutar las comprobaciones aprobadas en el entorno padre y solicitar la revisión independiente especificada arriba. No atribuir al escritor checks que no ejecutó.

## Checks y estado de evidencia

**Reportado por el escritor previo.** `pwd` devolvió el checkout exclusivo especificado; `git rev-parse HEAD` devolvió la base indicada; `git worktree list --porcelain` registró este checkout en esa ruta. El manifest fuente indicó base `c083c861fe736c37ce0dc16b16b6899d01abfa51` e identidad congelada `ee27e08da53496a2b68267f268b2553545685f3abe3678007c53e77a09b47042`. Tras la copia, los tres hashes coincidieron con el manifest. El registro de comportamiento previo mostró el mismo resultado en los seis casos y `sameFinalBytes: true`.

**Pendiente del coordinador.** Comprobar qué formato aplica el verificador y revisar los enlaces tras convertir las citas en code spans; no se presume que el verificador aplique o no aplique. Ejecutar cualquier check de comportamiento antes/después que autorice el padre. Congelar el manifiesto v2 y completar la revisión independiente sobre ese candidato exacto.

**No ejecutado aquí.** Runtime, verificador, checks de comportamiento, red, instalaciones, revisiones independientes y commits. No se reportan como PASS.
