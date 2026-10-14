# Encargo del primer reviewer Markdown

## Resultado y autorización

El usuario autorizó construir el primer reviewer mediante la factory y añadir DeepSeek 4.1 max como revisor adicional. El cambio pertenece a isSWF sobre la base `899a6d1`. Solo se autorizan `.agents/roles/reviewer.md`, `.agents/roles/references/review.md` y la conexión en `.agents/skills/isswf-coordinator/SKILL.md`. No instala software, crea runtime, exige Python ni autoriza publicación o cambios globales.

El coordinador usa el perfil worker existente y delega a una ejecución Luna high en un worktree exclusivo. El candidato permanece sin commit hasta la revisión independiente.

## Aceptación

- Perfil reviewer y referencia propios, con lectura contextual de calidad, comentarios y verificación existentes.
- Dos ejes visibles: objetivo/producto/spec y estándares/calidad. Uno no oculta el fallo del otro.
- Inspección del candidato exacto y del encargo; aceptación y estándares no los inventa el revisor ni el worker.
- Hallazgos concretos con ruta/línea, condición, impacto, evidencia y grado de certeza; distinguir incumplimiento, riesgo e hipótesis/heurística.
- Comprobaciones pertinentes y seguras; no editar, arreglar, publicar ni inventar pruebas o independencia.
- Revisiones adicionales por riesgo, no una batería universal. Preferencias estéticas no bloquean automáticamente.
- Dictámenes separados por eje y cierre agregado condicionado por bloqueantes y comprobaciones no realizadas.
- El coordinador pasa el perfil por ruta al dispatcher real y deriva modelo/esfuerzo del brief autorizado. Implementación Luna high; revisión Luna high y DeepSeek `opencode-go/deepseek-v4.1-flash` max en este encargo. No son defaults universales ni configuración global.
- Un autor no cuenta como revisor independiente. Sin revisor disponible, el cierre de esa revisión queda pendiente.

## Fuentes

La skill local `code-review` de Matt aporta los ejes Standards/Spec; se adapta el criterio, no su fan-out obligatorio, el tracker ni su sintaxis Git por defecto. Los contratos de isSWF están en `docs/spec-v1.md`, `docs/vision.md` y las guías ya implementadas bajo `.agents/roles/references/`.

## Prueba de comportamiento

Repositorios temporales propios, nunca proyectos clientes. Baseline común `d4547fce0273f1be277796d562115a35b9ceb460` en `/tmp/isswf-reviewer-proof-Pn5sVg/{spec-failure,style-only}`. El permiso cubre solo lectura y comprobaciones sin modificar archivos.

La aceptación exige sumar dos enteros, incluidos cero y negativos. El check existente solo cubre `7 3 -> 10`. El padre confirmó ambos checks verdes antes de delegar revisión.

- `spec-failure`: el candidato imprime siempre `10`; para `0 0` da `10`, no `0`. Debe detectarse incumplimiento aunque el test existente pase.
- `style-only`: suma correctamente y añade `# Print the sum.`. El comentario narrativo es una sugerencia de limpieza, no un estándar obligatorio de este fixture. No debe bloquearse únicamente por estética.

Las pruebas deben inspeccionar el diff real y el resultado observado, no repetir este documento como si fuera evidencia ejecutada. Los revisores no reciben permiso para corregir fixtures. Entradas no enteras y overflow quedan fuera del alcance.

## Modelos y límites

El probe de disponibilidad de DeepSeek no es un veredicto de revisión. `max` se comprobará en metadatos de Pi; esa etiqueta no demuestra cómo el proveedor traduce el esfuerzo internamente. No sustituir modelos silenciosamente ante cuota o fallos. Las revisiones finales deben evaluar el candidato y los fixtures, no contar el probe como reviewer gate.
