# Pruebas acotadas del núcleo Markdown

## Alcance

Estas pruebas usan Pi/pstack y perfiles Markdown. No ejecutan la CLI Python de isSWF, no abren su registro operativo y no prueban continuidad tras reinicios, aislamiento frente a procesos hostiles ni fallback de modelos. El catálogo nativo de Pi se contrasta por separado con `verify-markdown-core.mjs`.

## Coordinador

Dos ejecuciones independientes siguieron el candidato del coordinador por ruta; no fueron una invocación nativa mediante `/skill:`. La primera preparó una única frase para README con baseline `0d81c5f209d0f23ac7d6a3dfdf312e71df1394c6` y grounding comprobado en `docs/u1-usage.md:23`, sin entrevistar ni editar. La segunda distinguió el criterio de producto de «última actualización» del comportamiento ya existente y no inventó una decisión. Ambas estaban autorizadas solo para preparar, no para despachar. En la prueba operativa posterior, la solicitud ya cubría edición y despacho del fixture. El coordinador preparó un brief y despachó un único worker sin pedir confirmaciones rutinarias.

## Worker real

El padre creó un repositorio temporal propio en `/tmp/isswf-worker-proof-hWCSUj`, baseline `196bae50a7dfc17c58b9b34cdc249af66f4b0a82`. El permiso de prueba cubría solo modificar `sum.sh`, leer/ejecutar `check.sh` y comprobar sumas enteras. No incluía commits, subagentes, red ni cambios de la factory.

Antes del despacho, el padre ejecutó `bash check.sh` y observó salida `FAIL expected 10, received 4`, exit 1. El worker volvió a reproducir y sustituyó únicamente resta por suma en `sum.sh:3`.

Después del despacho, el padre repitió `bash check.sh` y observó `PASS sum 7 3 = 10`, exit 0. Verificó el diff de una única línea y las invocaciones `0 0 -> 0`, `-7 3 -> -4`, `7 -3 -> 4` y `-7 -3 -> -10`. No se agregaron archivos ni comentarios narrativos.

SHA-256 del resultado:

- `sum.sh`: `9f373cd75842f50cebcb63bc19b7970fbf9742a6b130ac0dc51084a3fb23c9c5`.
- `check.sh`: `ffce70e00380cec53d32b834da036fbcc158c7f72540bc444119f63d6d98395a`.

El tool `agent` despachó `pstack:poteto-agent-high` con `openai-codex/gpt-6-luna`, pasando el perfil por ruta. Es despacho real del padre, no evidencia de que la skill coordinadora hiciera una delegación automática. El worker leyó el perfil y referencias anteriores a su ampliación integrada con principios y diagnóstico. Esta primera ejecución demuestra la corrección y el uso del perfil anterior. Se repitió después con el perfil integrado exacto y sus referencias de diagnóstico, TDD, calidad, comentarios y verificación. El worker volvió a observar rojo antes del cambio, verde después y un diff de una línea, sin pedir permisos rutinarios ni cargar referencias de diseño o ejecución que no eran pertinentes. El padre repitió `check.sh` después y confirmó el mismo diff.

## Diagnóstico sin acceso

Una ejecución distinta leyó el perfil y su referencia ante un servicio de cliente desconocido, sin checkout, logs, dump ni reproducción disponible. Solo se autorizaba elaborar un paquete desde los datos recibidos. Devolvió diagnóstico inconcluso, sin causa confirmada ni comandos de reproducción inventados. Solicitó evidencia redactada antes/después del reinicio, versión y logs acotados, no credenciales. No sustituyó código de isSWF por evidencia del servicio desconocido.

Esta prueba verifica cómo declara el límite de acceso; no prueba diagnóstico causal, reproducción compleja ni instrumentación.

## Recorrido operativo del coordinador

Tras integrar los Markdown en el checkout principal, el padre inició otra ejecución con la petición `/skill:isswf-coordinator` y autorización explícita para preparar y despachar una sola corrección del fixture. El comando no se expandió nativamente en esa ruta RPC del subagente: el coordinador abrió el archivo real y siguió las instrucciones manualmente. Por tanto, se prueba descubrimiento nativo en el catálogo y ejecución manual del flujo, no invocación nativa con LLM.

El registro de la herramienta muestra un despacho real mediante `agent`, `subagent_type: pstack:poteto-agent-high` y `model: openai-codex/gpt-6-luna`, con el perfil `.agents/roles/worker.md` por ruta y el brief completo. El hijo terminó con exit 0. El coordinador volvió a ejecutar el check y casos de cero/negativos; el padre volvió a confirmar el check verde, la sintaxis Bash y el diff de una línea. No se creó otro agente para diagnosticar el bug simple ni se editó la factory. El coordinador no contó su propia inspección como revisión independiente.

## Revisión y límites

Una ejecución independiente aprobó los Markdown y el verificador para commits del núcleo. Repitió el descubrimiento de skills con trust y sin trust. Otra ejecución independiente comprobó el fixture final y lo aprobó. Ambos veredictos y sus límites están en `markdown-core-review.md`.

La combinación de estas pruebas no demuestra todos los disparadores de los principios, el enrutado de todos los bugs complejos, continuidad en background, aislamiento hostil, recuperación ni fallback. La expansión nativa de `/skill:` con LLM en una sesión interactiva no se probó. La integración de los archivos es local; los commits se registran en el informe de cierre.

Los caminos temporales son ubicaciones históricas de la prueba, no recursos de instalación. Las afirmaciones del autor no sustituyen las comprobaciones del padre o del revisor.
