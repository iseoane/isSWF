# Decisión de diseño #55

Base `9cd0eeb`. Comparados [árbol por iniciativa](durable-55-design-a.md) y [registro plano](durable-55-design-b.md). Se elige la separación de ownership de A con los IDs planos y referencias Git de B. Se descarta un único archivo que todos actualicen y la duplicación de spec/plan por job.

## Forma elegida para probar

Cada iniciativa conserva una especificación y un plan en rutas explícitas propias, que pueden existir ya. El plan enlaza jobs. Los documentos de producto actuales no se copian por cada trabajo. Los jobs viven bajo `.factory/jobs/J001/`, con `brief-r1.md`, artefactos de intento `A001.md` y revisiones `V001.md` creados solo cuando hacen falta. La ubicación es un espacio documental del proyecto, no una instalación de runtime. Coordinador asigna IDs por proyecto y actualiza plan/brief; worker y reviewer producen sus artefactos en checkouts exclusivos. El coordinador integra las referencias sin editar sus conclusiones.

Delegar documentalmente entrega ruta relativa del brief + SHA Git completo del checkpoint de inputs, dentro de una autorización confiable ya existente. Se usa `git show SHA:ruta`, no un comando nuevo ni un resolver implementado. Las rutas de inputs se leen en ese checkpoint salvo revisión explícita distinta. No se exige conocer el SHA propio dentro de un documento antes de commitearlo: el checkpoint se registra en el encargo de despacho y en el artefacto posterior del intento. El plan puede enlazar rutas sin inventar hashes autorreferenciales; la referencia de ejecución fija la revisión. No se crea un ledger paralelo ni se afirma que el tool agent actual resuelva un job por sí solo.

Una revisión de criterios crea otro brief y checkpoint; no reescribe los inputs de intentos activos. Se distingue ID del job, intento, checkpoint de documentos y base de código del destino. Resultados de proceso se observan con herramientas existentes; el estado guardado es último reporte con evidencia/fecha, no prueba de vida. Engram conserva aprendizaje, no sustituye documentos. Git local aporta checkpoints, no backup externo, atomicidad ni recuperación de procesos.

## Primera unidad

Guía `docs/durable-work.md`, tres plantillas (`docs/templates/job-brief.md`, `attempt.md`, `review.md`) y un punto de carga contextual mínimo en el coordinador, expresado como ruta informativa si el documento está fuera del paquete `.agents`. No crear plantillas de spec/plan duplicadas ni ficheros vacíos por cada fase. No construir planner/researcher aún ni exigir Python, SQLite, configuración global o runtime nuevo. La ruta económica del researcher se registra como acuerdo futuro, no fallback ejecutado.

## Prueba requerida

Fixture Git aislada con dos revisiones del brief y spec/plan, un intento anclado al checkpoint anterior y resultados de jobs separados. Un contexto nuevo, sin el chat, debe leer por ruta+SHA la aceptación correcta; la revisión antigua debe conservar sus criterios tras cambiar el plan. Inputs ausentes o identidad insuficiente bloquean solo el job afectado. Los artefactos de dos jobs independientes son distintos y el dependent no se libera por un simple reporte complete. Una revisión identifica base y candidato exactos. Estas pruebas no acreditan exclusión de escritores hostiles, continuidad del chat o recuperación de procesos.

Revisión independiente del diseño: a7376400b65d13565, DeepSeek max, recomendó esta base con injertos y advirtió que solo podrá aceptarse la implementación después de pruebas. Decisión del padre bajo la autorización actual, sin checkpoint humano adicional para trabajo reversible.
