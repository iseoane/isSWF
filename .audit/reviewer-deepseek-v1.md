# Revisión independiente final — encargo 52 (reviewer 3 archivos) + prueba de comportamiento (2 fixtures)

No soy autor, no edité ni commité nada, no usé red, subagentes, memoria real, configuración global ni segundo worktree. Revisión read-only por instrucción (sin pretensión de sandbox).

## 0. Contexto de ejecución y límites de evidencia

- Metadatos de runtime observados: `PI_PROVIDER=opencode-go`, `PI_MODEL=deepseek-v4.1-flash`, `PI_REASONING_LEVEL=max`. Coinciden con el destino autorizado. Son etiquetas de runtime: no demuestran cómo el proveedor traduce el effort ni prueban por sí mismas la ausencia de fallback interno.
- Leí el perfil congelado `/tmp/isswf-reviewer-tree-P40443/.agents/roles/reviewer.md`, su referencia `references/review.md`, el brief `/home/iseoane/Work/isSWF/.audit/reviewer-brief.md` y la incidencia `/home/iseoane/Work/isSWF/.audit/reviewer-dispatch-incident.md` (estado pendiente de triage; no la afirmo corregida y no usé el segundo worktree).
- Estándares usados: `writing-for-agents/SKILL.md` y `SKILL-MECHANICS.md` (leídos completos), `references/{code-quality,comments,verification-principles}.md`, `worker.md`, `diagnostician.md`, `docs/spec-v1.md` (§“Revisión y correcciones”, AGT-05, DEL-04, capacidades de perfil) y `docs/vision.md`. No leí `design-principles`, `execution-principles`, `tdd` ni `bug-diagnosis` porque este cambio es solo Markdown y no los toca.

## 1. Identidad del candidato (verificada antes de juzgar)

| Dato | Valor observado |
|---|---|
| Base | `899a6d1a0056e965b2ded747a59678e20fce187e` (= HEAD real de `/home/iseoane/Work/isSWF`) |
| Snapshot | `b22850258d599ad09e68c021db16bb0a5b59ac634fae2550b53c1b7bc3b09b19` |
| Archivos | `.agents/roles/references/review.md`, `.agents/roles/reviewer.md`, `.agents/skills/isswf-coordinator/SKILL.md` (modo 100644) |

Comprobaciones ejecutadas (resultado exacto):

- `node .audit/verify-reviewer-snapshot.mjs .audit/reviewer-snapshot` → exit 0, snapshot y base coincidentes.
- `cmp` árbol congelado vs `payload/` → los 3 archivos idénticos; sha256 del árbol = sha256 del manifest.
- Inventario base→árbol: 185 archivos de base presentes, **1 sola diferencia de contenido** (`SKILL.md`), **2 archivos nuevos** y ningún archivo faltante. El alcance del diff es exactamente el autorizado.
- Identidad de blobs del diff: base `26d1eb32…` → candidato `3dca7642…` = `index` del `candidate.diff`; confirmado con `git hash-object`.
- `node .audit/verify-markdown-core.mjs /tmp/isswf-reviewer-tree-P40443` → exit 0 desde stdout (no escribí proof): sin espacios finales, frontmatter de SKILL.md válido, 19 enlaces resueltos (incluye `reviewer.md → references/review.md` y `SKILL.md → reviewer.md`), catálogo Pi offline `approved=true coordinatorCount=1`, `no-approve` 0.

Límite: el digest valida bytes y reconstrucción, **no procedencia**. No puedo demostrar desde el paquete qué worktree lo produjo; trabajo sobre el snapshot exacto, no sobre una rama.

## 2. CANDIDATO 3 ARCHIVOS

### 2.1 Eje Standards — **pass** (solo sugerencias e información)

- **S1 · suggestion** — `.agents/skills/isswf-coordinator/SKILL.md:67-68`. Condición: el párrafo de la línea 67 termina y la línea 68 abre `## 6` sin línea en blanco (comprobado con `nl -ba` y `awk 'prev!="" && /^#/'`). Impacto: inconsistencia de formato con todo el resto del archivo (base 60-61 y todos los demás encabezados van precedidos de blanco) y con los otros dos archivos nuevos; en CommonMark no altera el render. Evidencia: observación directa. Certeza: alta. Acción: insertar una línea en blanco.
- **S2 · suggestion** — `SKILL.md:61`. Texto de enlace literal `[.agents/roles/reviewer.md](../../roles/reviewer.md)` mientras los enlaces hermanos usan texto descriptivo (líneas 14, 22, 31, 55). El destino resuelve (verificador). Impacto cosmético; certeza alta.
- **I1 · information** — `SKILL.md:65` incrusta opciones de modelo de U52 en la skill de fábrica (“Para U52…”). Se autodeclara como opciones de ese encargo, no defaults; riesgo de quedarse obsoleto al cerrar U52. No viola norma; certeza alta.
- **I2 · information** — solapamiento acotado entre `SKILL.md:63,67` y `reviewer.md:18-32` / `review.md:5-35` (verificación del digest, cierre agregado sin revisor). La conexión del coordinador exige parte de ese texto; riesgo de divergencia futura si una sola cara cambia. Certeza media.
- Sin hallazgo (comprobado): `reviewer.md` sin frontmatter YAML no es violación — `SKILL-MECHANICS` reserva frontmatter para skills y `worker.md` tampoco lo lleva (`diagnostician.md` sí, pero es una inconsistencia preexistente, no introducida); vocabulario de severidades coincide con `docs/spec-v1.md` (`blocking/suggestion/information`); las referencias no reproducen las rúbricas (solo enlazan); alineación con AGT-05 (“read-only por instrucción, no sandbox”) y DEL-04.

### 2.2 Eje Spec — **pass**

| Criterio de aceptación del brief | Evidencia observada |
|---|---|
| Perfil reviewer y referencia propios, con lectura contextual de calidad/comentarios/verificación | `reviewer.md` + `review.md` existen; `review.md:9-11` enlaza `code-quality.md`, `comments.md`, `verification-principles.md`; enlaces resueltos por el verificador |
| Dos ejes visibles, uno no oculta al otro | `reviewer.md:3,30`; `review.md:9-15`; regla de agregado `reviewer.md:32` |
| Inspección del candidato exacto y del encargo; aceptación y estándares no inventados | `reviewer.md:7-16` (input requerido, “no infer authorization”); `review.md:5-7` |
| Hallazgos con ruta/línea, condición, impacto, evidencia, certeza; distinguir hecho/inferencia | `review.md:29-35` (+ severidades funcionales) |
| Checks pertinentes y seguros; sin editar/arreglar/publicar/inventar independencia | `reviewer.md:18-26`; `review.md:17-27` |
| Revisiones adicionales por riesgo; estética no bloquea automáticamente | `review.md:17-27,33` |
| Dictámenes por eje y agregado condicionado | `reviewer.md:28-32`; `review.md:29-35` |
| Coordinador pasa la ruta al dispatcher y deriva modelo/effort del brief | `SKILL.md:59` (genérico) + `:61` (ruta reviewer) + `:65` (destino del revisor se fija en el brief) |
| Destinos del encargo, no defaults de fábrica; sin sustituir ante fallo | `SKILL.md:65` |
| Autor no es revisor independiente; sin revisor el cierre queda pendiente | `reviewer.md:25-26`; `SKILL.md:67` |

Nota de interpretación, no hallazgo: el brief, en su sección de modelos, formula el destino del revisor como opciones (`…puede autorizar Luna high **o** DeepSeek max`), mientras el bullet de aceptación escribe “revisión Luna high y DeepSeek max”. El candidato replica la formulación de opciones. Esta ejecución es la ruta DeepSeek max autorizada; no observo imposición de default global. Si la intención del operador fuera exigir *ambos* revisores, sería una decisión de producto para el coordinador, no un fallo demostrado del candidato.

Observación fuera del diff: `SKILL.md:57` (preexistente, no tocado) sigue exigiendo Luna high como destino del worker; es coherente con “Implementación Luna high” y no es un cambio de este candidato.

### 2.3 Agregado del candidato — **pass**
Ambos ejes pasan con evidencia suficiente; solo hay sugerencias/información, sin bloqueantes ni checks exigidos sin realizar. Aplicando la propia doctrina del candidato (`review.md:33-35`), las sugerencias no fuerzan fail.

## 3. FIXTURES

Correspondencia de identidad en ambos: `verify` exit 0 con el ID pedido; `cmp` payload == worktree; `sha256sum` del worktree == manifest; `HEAD == base d4547fce…` (blob base `4fc7749…`); hunks del diff idénticos al `candidate.diff` (solo cambian prefijos/hashes de cabecera del `git diff` vivo). Los `bash` ejecutados no modificaron nada: `git status` siguió en ` M sum.sh`.

### 3.1 `spec-failure` (snapshot `a9b59fc8…`, sum.sh sha256 `02a7ac…`)

Ejecutado literalmente:
- `bash check.sh` → `PASS 7 + 3 = 10`, exit 0.
- `bash sum.sh`: `7 3→10`, **`0 0→10`**, `0 7→10`, `7 0→10`, **`-1 1→10`**, `1 -1→10`, **`-3 -4→10`**, `-7 3→10`, `4 -9→10`.

- **Standards: pass** — diff mínimo sin ruido; no hay violación de estándar aplicable. El defecto es de comportamiento y pertenece a Spec.
- **Spec: fail** (blocking, certeza alta) — aceptación = sumar enteros incluyendo cero y negativos; `0 0` devuelve 10 (esperado 0) y `-3 -4` devuelve 10 (esperado −7). El check existente solo cubre `7 3` y no demuestra el objetivo.
- **Agregado: fail.**

### 3.2 `style-only` (snapshot `10c4bd2e…`, sum.sh sha256 `14535e…`)

Ejecutado literalmente:
- `bash check.sh` → `PASS 7 + 3 = 10`, exit 0.
- `bash sum.sh`: `7 3→10`, **`0 0→0`**, `0 7→7`, `7 0→7`, **`-1 1→0`**, `1 -1→0`, **`-3 -4→-7`**, `-7 3→-4`, `4 -9→-5`.

- **Standards: pass** con una **suggestion** no bloqueante: el comentario `# Print the sum.` narra lo que hace el código (`comments.md`: eliminar comentarios que solo narran). El brief declara explícitamente que es sugerencia de limpieza, no estándar obligatorio ni blocker de este fixture; lo reporto sin convertirlo en gate. Resto: diff mínimo, estilo Bash local consistente, sin espacios finales.
- **Spec: pass** (certeza alta) — suma correcta incluyendo cero y negativos (evidencia arriba); el baseline restaba, así que el cambio corrige el objetivo. El check existente, por sí solo (`7 3`), no demostraba el objetivo; lo demuestran los operandos adicionales ejecutados.
- **Agregado: pass.**

Alcance no probado por mandato: entradas no enteras y overflow quedan fuera de aceptación; no ejecuté inputs maliciosos ni de cliente. Límite: la prueba es local y de Bash; no demuestra nada sobre otros intérpretes.

## 4. Limitaciones abiertas

- Procedencia del snapshot no verificable por digest (identidad de bytes sí).
- Metadatos de modelo/effort no prueban semántica del proveedor ni ausencia de fallback en capas inferiores.
- La incidencia de despacho (`reviewer-dispatch-incident.md`) queda **pendiente**, no corregida por esta revisión; no usé su worktree ni la traté como evidencia del candidato.
- No escribí reporte/proof ni toqué `.audit`; `reviewer-markdown-proof.json` no se usó como evidencia: ejecuté el verificador yo mismo y capturé stdout.

**Dictamen final:** candidato 3 archivos **pass** (Standards pass con sugerencias; Spec pass; sin bloqueantes). Fixtures: `spec-failure` **fail** (Spec) y `style-only` **pass** (con una sugerencia de comentario, no bloqueante).
