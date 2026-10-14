# Comportamiento observado del reviewer

## Candidato v1

Snapshot `b22850258d599ad09e68c021db16bb0a5b59ac634fae2550b53c1b7bc3b09b19`, base `899a6d1a0056e965b2ded747a59678e20fce187e`. Dos contextos independientes, Luna high y DeepSeek 4.1 Flash max, aprobaron Standards y Spec del candidato de tres archivos. Sus informes originales de texto están en `reviewer-luna-v1.md` y `reviewer-deepseek-v1.md`.

Los informes corresponden a v1, no a un candidato que cambie después. El padre pidió una aclaración posterior sobre preflight y esfuerzo por rol y dos arreglos de formato. Esa versión requiere su propia identidad y revisión del delta antes de integrar.

## Contraste funcional

Los dos revisores aplicaron el perfil nuevo a los mismos fixtures, inspeccionaron sus bytes y ejecutaron comprobaciones seguras. Ambos rechazaron el candidato que devuelve una constante aunque su test existente pase; ambos mantuvieron como sugerencia el comentario narrativo del candidato funcionalmente correcto.

| Fixture | Check existente | Caso adicional observado | Standards | Spec | Agregado |
| --- | --- | --- | --- | --- | --- |
| `spec-failure` | Verde para `7 3` | `0 0 -> 10`, esperado `0` | Pass | Fail | Fail |
| `style-only` | Verde para `7 3` | `0 0 -> 0` y sumas negativas correctas | Pass, con sugerencia | Pass | Pass |

Los snapshots de fixture se conservan en `reviewer-fixtures/`. El padre comprobó el contraste antes de las revisiones y sus hashes después. No se autorizó a los revisores a corregirlos. Las entradas no enteras y overflow quedaron fuera del encargo.

## Delta v2

Luna high y DeepSeek 4.1 Flash max revisaron el delta v2 del coordinador. Ambos cerraron `Standards` y `Spec` con pass y sin bloqueantes; véanse [Luna v2](reviewer-luna-v2.md) y [DeepSeek v2](reviewer-deepseek-v2.md). El snapshot v2 y su base constan en [su manifiesto](reviewer-snapshot-v2/manifest.json). El verificador del snapshot pasó.

Los SHA-256 de `.agents/roles/reviewer.md` y `.agents/roles/references/review.md` son idénticos en los manifiestos v1 y v2: `ab18460d871e836aee16c90b797a258d64c809fb028560b3e34c52f7684383ab` y `9243d5487c1ef5fae02f612a32c53bc94da0040c66137fbddf49e723020ab7af`. Por esa identidad de bytes, los resultados v1 de los fixtures aplican al mismo perfil y referencia. Los revisores v2 no volvieron a ejecutar los fixtures.

El delta v2 no prueba despacho nativo del rol Pi. `readonly` sigue siendo una instrucción, no un sandbox. El esfuerzo `max` es metadato y no acredita semántica del proveedor. La prueba integrada verifica descubrimiento de skill y enlaces, no despacho LLM.

## Identidad y límites

El verificador de snapshot aceptó una copia temporal intacta y rechazó sus bytes modificados. Los paquetes originales no se alteraron en esa prueba. Esto detecta divergencia de contenido; no demuestra autenticidad, hostilidad contenida ni filesystem inmutable.

El padre comprobó modelos y esfuerzo mediante metadatos de sus propias sesiones, no solo declaraciones del agente. `max` es el esfuerzo registrado por Pi, no una prueba de cómo lo procesa el proveedor. Hubo dos familias de modelos en la revisión; independencia de contexto no garantiza ausencia de errores.

Los conteos narrados por un revisor no se toman como prueba: el verificador retenido enumera los enlaces efectivamente comprobados. El probe de disponibilidad, que afirmó un conteo incorrecto del worker, no cuenta como revisión del candidato.

La coordinación de este encargo excedió el permiso de un solo worker al iniciar otro durante una continuación. Se seleccionó solo el primer candidato. La incidencia y la tarea 53 están pendientes; estas pruebas no la arreglan ni justifican el exceso de despacho.

No se probó ejecución durable, sandbox, publicación ni integración en proyectos clientes. Los perfiles son Markdown, no roles nativos de Pi.
