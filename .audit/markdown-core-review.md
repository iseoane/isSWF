# Revisión independiente del núcleo Markdown

## Candidato

Base anterior `0d81c5f209d0f23ac7d6a3dfdf312e71df1394c6`. Se revisaron los nueve archivos de `.agents/roles/`, la skill `.agents/skills/isswf-coordinator/SKILL.md`, README y `docs/research/adaptaciones-agentes.md`. El instalador Python candidato no forma parte del cambio.

## Veredicto del núcleo

Una ejecución distinta de los autores emitió «apto para commits del núcleo», sin bloqueantes. Comprobó que las condiciones de la revisión anterior se cerraron:

- README limita Engram y Codegraph a sus pruebas locales; `origin` configurado no se presenta como publicación.
- El coordinador enlaza worker y diagnostician y distingue perfil Markdown de capacidad del dispatcher.
- Los permisos derivan del encargo explícito; una decisión de producto pendiente no obliga a preguntar otra vez por permisos ya cubiertos.
- TDD y principios son contextuales; el worker tiene guías concretas de calidad y comentarios.
- El mapa diferencia candidatos futuros de lo implementado y declara evidencia externa indirecta, versiones y licencias pendientes.

El revisor repitió `node .audit/verify-markdown-core.mjs /home/iseoane/Work/isSWF`. Pasaron enlaces/formato y catálogo Pi con trust y sin trust. No accedió a memorias de clientes ni a un store operativo. No editó archivos ni usó subagentes.

Esta revisión no demuestra comportamiento general de los modelos, expansión nativa de `/skill:` con LLM, continuidad durable, sandbox ni fallback. La prueba operativa posterior usó lectura manual de la skill y un despacho real; véase `markdown-core-behavior.md`.

## Veredicto del fixture final

Otro contexto independiente emitió «apto» tras comprobar el fixture final directamente. HEAD coincide con `196bae50a7dfc17c58b9b34cdc249af66f4b0a82`; solo está modificado `sum.sh`, con cambio de resta a suma. `check.sh` no cambió y no hay archivos nuevos ni commits posteriores a la base.

Repitió `bash check.sh`, `0 + 0 -> 0`, `-7 + 3 -> -4` y validación de sintaxis de ambos scripts. Entradas no enteras y overflow estaban fuera del encargo y no se probaron. No hizo cambios.

## Modelos y trazabilidad

Todos los autores y revisores de este cierre usaron OpenAI GPT-6 Luna con esfuerzo high. La comprobación de metadatos está en `markdown-core-models.json`; no se basa en la autoafirmación de los agentes. Independencia de contextos no equivale a diversidad de modelos: la diversidad es reducida por la elección del usuario.

Los mensajes finales que sustentan los veredictos pertenecen exclusivamente a esta sesión de isSWF:

- Núcleo: `2026-10-14T14-29-14-577Z_ff75e76a-85e9-428c-bbb7-a14c4db80912.jsonl`.
- Fixture: `2026-10-14T14-32-33-482Z_5f0ae73a-2dd9-408a-9e6d-2bbf72f571f9.jsonl`.

El contenido relevante se conserva arriba para no exigir acceso a rutas personales de Pi. No se exportaron razonamientos internos ni datos de otras sesiones.
