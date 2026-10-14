# Unidad 1 de calidad para #54

## Resultado

Se amplían las referencias existentes, sin crear perfiles, agentes, gates universales ni una rúbrica paralela. `code-quality.md` incorpora una inspección breve y contextual tipo deslop para diffs de código con señales pertinentes. `review.md` mapea corrección, legibilidad, arquitectura, seguridad y rendimiento a Standards, y conserva Spec como eje separado.

La calidad de pruebas exige assertions suficientes sobre resultados observables y checks capaces de detectar defectos plausibles. Los checks se eligen según riesgo. No se exige TDD universal. La evaluación de seguridad de dependencias solo aplica si cambian dependencias.

## Alcance y aceptación

La unidad modifica únicamente:

- `.agents/roles/references/code-quality.md`
- `.agents/roles/references/review.md`
- `.audit/quality-54-unit1-brief.md`

La inspección contextual no se aplica por analogía a documentación ni a diffs de código sin señales pertinentes. No convierte `no-comments` en workflow, no autoriza subagentes y no permite ampliar el alcance. La guía de revisión mantiene ejes separados, no permite que el autor apruebe su propio cambio y selecciona probes según riesgo. Los perfiles Markdown documentan contratos y no imponen permisos técnicos ni garantías del runtime.

Esta unidad no autoriza unidades posteriores.

## Fuentes de investigación

- [Adaptación de Pstack y Addy](../docs/research/adaptacion-pstack-addy.md), para la propuesta de cinco dimensiones, el cierre contextual tipo deslop y sus límites.
- [Mapa de adaptaciones de agentes](../docs/research/adaptaciones-agentes.md), para el alcance del reviewer existente y las propuestas de #54.

## Checks

- `git rev-parse HEAD`: devolvió `c083c861fe736c37ce0dc16b16b6899d01abfa51`.
- `git diff --check`: terminó sin errores.
- `for path in .agents/roles/references/../../../docs/research/adaptacion-pstack-addy.md .agents/roles/references/../../../docs/research/adaptaciones-agentes.md .agents/roles/references/code-quality.md .agents/roles/references/comments.md .agents/roles/references/verification-principles.md .audit/../docs/research/adaptacion-pstack-addy.md .audit/../docs/research/adaptaciones-agentes.md; do test -f "$path" || exit 1; done && printf 'all referenced relative destinations exist\n'`: todos los destinos existen. El script `.audit/verify-markdown-core.mjs` valida otro comportamiento de descubrimiento de skills, por lo que no aplica a esta unidad.
- `grep -nE 'docs/research/|\]\([^)]*\.md' .agents/roles/references/code-quality.md .agents/roles/references/review.md .audit/quality-54-unit1-brief.md`: las únicas fuentes de investigación citadas son los dos documentos enlazados arriba; los demás enlaces son referencias locales de contrato ya existentes.
- Se relevaron las secciones citadas de ambas fuentes y se contrastaron los textos con los contratos actuales de `worker.md` y `reviewer.md`.

No se usó red ni se instalaron herramientas.
