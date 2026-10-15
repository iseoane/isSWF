# Arranque de isSWF por proyecto

Reconciliación histórica de #55–62, anterior al subalcance verificado de #44. Este documento registra qué se ha demostrado y qué falta para preparar la activación por proyecto; las afirmaciones de estado anteriores deben leerse con esa fecha. No es una autorización general para instalar, copiar o ejecutar la factory.

## Estado comprobado

- #55 fijó contratos documentales durables: las rutas de spec y plan son explícitas; los jobs usan `.factory/jobs/` con IDs, ownership y referencias de entrada fijadas. Esto no es un store de ejecución ni garantiza liveness, backup o recuperación. Véase [`durable-work.md`](durable-work.md).
- #57 creó perfiles Markdown de planner y researcher. Se cargan manualmente. El ejercicio del researcher con GLM high tuvo una brecha de alcance; la validación separada con Luna no fue fallback ni prueba de ruta runtime.
- #58 ejercitó el worker y metodología propios en un fixture simple. El transporte y registro de Pstack seguían visibles; no fue un entorno hermético ni un instalador independiente.
- #59 ejercitó manualmente delivery y retrospective con registros sintéticos. No hubo PR, tracker, UI ni control de proceso reales.
- #60 consolidó rutas por rol en [`.factory/models.json`](../.factory/models.json), interpretadas por [`model-routing.md`](model-routing.md). Es política configurada que requiere preflight manual, no un resolver ni fallback de runtime.
- #61 fue una demo local supervisada. No demostró H1, aceptación de producto, aislación técnica de cliente, ciclo de vida independiente del chat, recuperación ni publicación remota.
- #62 añadió `.agents/skills/isswf-setup/SKILL.md`, invocada explícitamente. Puede reconciliar decisiones y, con autorización expresa, editar rutas en un `.factory/models.json` existente en el proyecto objetivo. Si falta el archivo, deja la configuración pendiente. No instala ni copia archivos de factory, no crea una configuración faltante, runtime, credenciales ni configuración global.

Los informes con resultados y límites exactos son [#55](../.audit/durable-55-closure.md), [#57](../.audit/profiles-57-closure.md), [#58](../.audit/worker-58-behavior.md), [#59](../.audit/workflow-59-behavior-limits.md), [#60](../.audit/models-60-behavior-limits.md), [#61](../.audit/e2e-61-closure.md) y [#62](../.audit/setup-62-closure.md). No se declara completo H1, S01/S02 ni el conjunto de 61 criterios.

## Límites de las rutas de modelos

La fuente canónica de rutas de la factory es `.factory/models.json`; `docs/model-routing.md` define cómo interpretarla. La ruta configurada para researcher contiene GLM 5.3 Flash/high y después Luna/medium. No es una selección efectiva, permiso, comprobación de disponibilidad o fallback automático. El GLM high produjo hallazgos útiles en el ejercicio de #57, pero incumplió el alcance; el resultado separado de Luna fue validación, no reemplazo automático.

La skill #62 solo puede modificar una configuración **existente y propiedad del proyecto objetivo** cuando un grant cubra esa acción. No debe copiar la configuración central ni inventar valores o esquema duplicado. Si el archivo del proyecto no existe, la decisión se presenta y queda pendiente. No se ha aprobado un `isswf.config.json`, una base SQLite nueva ni un almacén operativo por proyecto.

## Engram y Codegraph

La integración real de Engram comprobó el CLI con selector explícito de proyecto: confirmó/recuperó dos memorias aprobadas en `isswf`, comprobó aislamiento de consultas y ejercitó isSWF con Engram no disponible. El código actual no contiene un consumidor Engram en `isswf/` o `tests/`; por tanto, la prueba demuestra comportamiento del CLI y ausencia de dependencia en el flujo probado, no integración runtime ni degradación de un consumidor.

La comprobación de Codegraph del 14 de octubre consultó un índice de 18 archivos y devolvió fuente y símbolos en una consulta exploratoria; la respuesta fue parcial. No están probados frescura bajo escrituras concurrentes, rechazo de un índice de otro proyecto ni un mapa de grounding completo para un encargo real. Ambos registros describen límites: [Engram](../.audit/engram-integration.json) y [Codegraph](../.audit/codegraph-index-verify.json).

## Dirección y trabajo pendiente

La dirección de producto acordada es una instalación compartida de una versión fija, con activación explícita por proyecto. No significa copiar toda la factory dentro de cada proyecto ni sobrescribir su `AGENTS.md`. La afirmación histórica de que no había mecanismo aprobado quedó superada para el subalcance acotado: el CLI aprobado de materialización de recursos y activación en un proyecto existente está implementado y verificado según la [guía vigente](activacion-por-proyecto.md) y el [cierre de #44](../.audit/activation-44-closure.md). Esto no concede una autorización general de instalación ni demuestra readiness para clientes. El árbol, caché, `isswf.config.json`, Python o SQLite de propuestas históricas no son requisitos. U1/U2 en Python son unidades locales históricas, no una arquitectura objetivo. El contrato vigente para artefactos durables es el de `docs/durable-work.md`; la ruta central de modelos está en `.factory/models.json`. La prueba de setup #62 no instaló la factory ni conectó un runtime.

## Reconciliación posterior de #44

El subalcance de instalación compartida y activación local por proyecto está implementado y verificado contra el source commit [`737fc7b`](../.audit/activation-44-committed-proof.json): materializó los 20 recursos comprometidos, activó dos skills y comprobó el descubrimiento Pi offline con aprobación y sin ella. La guía vigente es [Activar los recursos Pi de isSWF en un proyecto](activacion-por-proyecto.md); el [cierre de #44](../.audit/activation-44-closure.md) delimita exactamente lo probado y lo que no, y registra los PASS de las revisiones finales [DeepSeek](../.audit/activation-44-review-v3-deepseek.md) y [Luna](../.audit/activation-44-review-v3-luna.md).

Esto corrige el estado anterior de «#44 sigue pausada» solo para ese subalcance; no cierra #44 en conjunto ni acredita el runtime de workers. #64 completó 20 casos con estado `PROBE_COMPLETE_WITH_UNPROVEN_REQUIREMENTS`, no con PASS de todos los requisitos ([cierre de #64](../.audit/probe-64-closure.md)). #65 sí obtuvo PASS para su experimento real y acotado de frontera modelo/herramienta ([cierre final de #65](../.audit/boundary-65-final-closure.md)). Sus límites siguen vigentes: Engram/Codegraph como integración runtime, broker MCP/autoridad, lifecycle y recuperación, exclusión multiwriter, seguridad exhaustiva, readiness de cliente y H1 permanecen sin demostrar ni autorizados por estos resultados.

La [propuesta de siguiente corte](next-operational-cut.md) es histórica: documenta la propuesta anterior al probe y no sustituye esta evidencia ni convierte sus opciones en decisiones implementadas. El aislamiento técnico sigue siendo requisito para uso con clientes; el probe no lo demuestra de forma exhaustiva. Cualquier trabajo adicional de #44 requiere reconciliación y grant separados. El push anterior de `origin/main` no se extiende a PR, merge, despliegue, instalación adicional ni otro push.
