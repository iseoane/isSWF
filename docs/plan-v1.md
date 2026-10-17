# Plan funcional de construcción de isSWF v1

Estado revisado el 17 de octubre de 2026. Sigue siendo una propuesta para revisar junto a la [especificación](spec-v1.md), no una orden de ejecución ni un plan técnico con módulos y comandos ya decididos. La asignación documental de criterios y los cierres locales no demuestran que S01, S02, H1 ni los 61 criterios estén completos. Véanse [cierre del núcleo Markdown](../.audit/markdown-core-closure.md), [cierre de calidad #54](../.audit/quality-54-closure.md), [cierre de adaptación #49](../.audit/adaptation-49-closure.md), [comprobación de integración Engram](../.audit/engram-integration.json) y [comprobación del índice Codegraph](../.audit/codegraph-index-verify.json).

## Lectura del plan

Cada slice termina en un resultado observable, con evidencias y revisión independiente de lo construido. Las casillas se marcan cuando esas evidencias existen, no cuando el implementador informa que ha terminado.

Las primeras slices se construyen con Pi, Pstack y las skills de Matt disponibles. La factory asume responsabilidades conforme las demuestra. El soporte externo sigue disponible si una capacidad aún no existe o falla.

El primer hito previsto, H1, comprende S01 y S02. Incluye una issue real y definida, grounding, implementación, revisión, correcciones y PR visual. El corte técnico de H1 produjo la issue #1 y la PR #2, integrada tras revisión y verificaciones. Esto no completa S01/S02 ni demuestra independencia general del chat en el runtime de producto. Las slices posteriores completan v1; no se presentan como disponibles en H1.

No se obliga a usar TDD, diez revisores o benchmarks en cada slice. Se eligen comprobaciones según riesgo. Todos los cambios de código necesitan verificación de comportamiento y revisión independiente.

## Estado y secuencia acordada

U1 y U2 son unidades históricas locales de S01, implementadas con el CLI Python; no son la arquitectura objetivo ni requisito para el núcleo Markdown. U3 y U4 siguen pendientes, por lo que S01 está abierta. S02 tampoco está completa. #55–62 añadieron contratos durables, perfiles e instrucciones y ejercicios supervisados; no entregaron un runtime autónomo. La comprobación de Codegraph del 14 de octubre consultó un índice de 18 archivos y devolvió código y símbolos con cobertura parcial; no se ha producido un mapa de grounding completo para un encargo real.

## Estado reconciliado y siguiente secuencia

#55–62 están cerrados dentro de sus límites documentados: contratos durables de jobs, perfiles, ejercicios manuales de worker/workflow/model routing, demo supervisada #61 con candidato técnicamente verificado y revisión independiente acotada PASS, y skill de setup #62. La aceptación de producto de #61 sigue pendiente. Estos cierres no equivalen a independencia del chat, recuperación, fallback automático ni H1. Véanse los cierres exactos enlazados en la [visión](vision.md) y los límites de comportamiento en `.audit/`.

El cierre acordado de #44 se limita al arranque local operativo de un job: versión compartida fija, activación explícita, entrada nativa normal, resultado consultable y revisión independiente de un cambio útil de la propia factory. La [guía de activación](activacion-por-proyecto.md) conecta los veinte recursos y dos skills con la [entrada normal](local-worker-lifecycle.md#run-a-job-from-an-activated-project), implementada en `7560d2c`. J802 usó esa entrada para añadir ayuda al CLI real: un worker Luna/high, tres checks originales verdes y solo un archivo cambiado ([replay parental](../.audit/operational-44-own-parent-checks.json)). La [prueba del coordinador terminado](../.audit/coordinator-exit-44-parent-checks.json) cubre SIGKILL/ESRCH de ese proceso aislado antes de liberar su worker y consulta posterior desde un CLI nuevo; no demuestra cierre del chat principal ni recuperación general. #64/#65 conservan sus [límites](../.audit/probe-64-closure.md) [originales](../.audit/boundary-65-final-closure.md). Este cierre finito no acredita H1, cliente listo, seguridad exhaustiva, MCP/autoridad, multiwriter ni integración runtime de Engram/Codegraph.

La guía de [trabajo durable](durable-work.md) fija rutas explícitas para spec y plan, artefactos bajo `.factory/jobs/`, ownership y entradas fijadas. No crea un nuevo store ni garantiza liveness, recuperación o backup. Las rutas configuradas viven en [`.factory/models.json`](../.factory/models.json); [la guía de modelos](model-routing.md) define interpretación y preflight manuales, no un resolver runtime.

Secuencia autorizada por el operador, sin grants implícitos para nuevas ejecuciones o efectos remotos:

1. #68: recuperación verificada para la entrada normal en el mismo arranque, con reinicio del proceso Pi y un sucesor de modelo autorizado. S04 detalla la evidencia real, los casos remotos simulados y los estados no soportados que bloquean; no acredita reinicio de la máquina.
2. #66: corrección de `MissingSessionID` integrada en PR #16 y ejecución real posterior GLM/high con HTTP 200, un intento y fuente citada. No hubo retry ni fallback real. El manejo automático se verifica offline para un contrato JSON de cuota Go conocido; no es un clasificador universal ni prueba del formato desplegado actualmente. Concesión consumida, sin nuevas llamadas autorizadas.
3. #70: corte técnico entregado en issue #1 y PR #2, revisada e integrada. #61 y J802 siguen siendo evidencia distinta.
4. #69: consumidor del coordinador entregado en issue #3 y PR #4, integrada. Engram y Codegraph son opcionales; el brief fijado conserva solo hechos contrastados con fuentes actuales.
5. #67: corte cooperativo entregado en issue #5 y PR #6, integrada. A/B avanzaron aislados y C esperó el artefacto integrado; no es un scheduler nativo ni exclusión global de escritores.
6. #71: pulir instrucciones y flujos reales de v1. Cada tarea conserva sus gates y permisos; cerrar un corte anterior no autoriza nuevos costes o efectos externos.

El [siguiente corte operativo](next-operational-cut.md) conserva la propuesta anterior al probe; sus opciones no son evidencia actual ni decisiones de implementación. Esta secuencia no cambia la [especificación v1](spec-v1.md) ni declara S01, S02, H1 o los 61 criterios completos. El operador autorizó las publicaciones e integraciones de las PR #2, #4 y #6, y los merges necesarios del trabajo acordado en este repositorio, tras revisión y verificación. Un push autorizado no concede por sí solo autoridad de merge; estos grants tampoco autorizan despliegues, force-push ni nuevas llamadas de pago.

Antes de usar la factory con clientes, debe demostrarse aislamiento técnico de archivos, herramientas y efectos autorizados. El demo #61 no lo hizo.

## Mantenimiento futuro: idioma de las instrucciones

- [ ] Traducir al inglés las skills, perfiles de agentes y referencias operativas existentes que todavía estén en español. Conservar permisos, triggers, contratos y enlaces, y verificar que la traducción no cambia su comportamiento. No incluye traducir la documentación de producto ni la conversación con el operador.

Desde ahora, las instrucciones operativas nuevas de la factory se escriben en inglés. La traducción de las existentes queda pendiente y no amplía el alcance de #55.

## Dependencias y trazabilidad

La numeración propone un orden de entrega, no una cadena obligatoria. Las dependencias de la tabla esperan aceptación e integración humana de los contratos indicados. S01 aporta intake; S02, ejecución y entrega; S03, intentos y cambio de destino; S04, recuperación para operar en paralelo. Producto, retrospectiva y memoria no necesitan esperar a todas las capacidades anteriores. El grafo no divide el trabajo por frontend, backend o almacenamiento.

| Slice | Depende de | Resultado | Criterios de la spec |
| --- | --- | --- | --- |
| S01 | ninguna | Una issue autorizada queda triada, con brief y estado visible. | TRI-01, TRI-02, TRI-03, TRI-04, TRI-05, OPS-01, SEC-01, SEC-02 |
| S02 | S01 | Una issue clara produce una entrega revisada y una PR. | AGT-01, AGT-02, AGT-03, AGT-04, AGT-05, GND-01, GND-02, GND-03, GND-04, GND-05, GND-06, GND-07, DEL-01, DEL-02, DEL-03, DEL-04, DEL-05, DEL-06, DEL-07, OPS-02, OPS-03, SEC-03, SEC-04, NAV-01, NAV-02, NAV-03, NAV-04, NAV-05 |
| S03 | S02 | Una cuota agotada cambia al destino aprobado y conserva el trabajo. | MOD-01, MOD-02, MOD-03, MOD-04, MOD-05, MOD-06, MOD-07 |
| S04 | S03 | Un trabajo interrumpido se reconcilia y puede reanudarse sin repetir efectos. | OPS-04, OPS-05, OPS-06 |
| S05 | S04 | Dos trabajos independientes avanzan y un dependiente espera su contrato. | OPS-07, OPS-08, OPS-09 |
| S06 | S02 | Una idea ambigua llega a un encargo aprobado con slices verticales. | PRD-01, PRD-02, PRD-03 |
| S07 | S02 | Cerrar trabajo o sesión produce mejoras trazables sin cambiar reglas activas. | RET-01, RET-02, RET-03, RET-04, RET-05 |
| S08 | S01 | Una conversación nueva recupera decisiones mediante Engram sin alterar el estado operativo. | MEM-01, MEM-02, MEM-03, MEM-04 |

Este orden recomendado prioriza seguridad antes de paralelismo y automatización de mejoras. Tras satisfacer sus dependencias, S06, S07 y S08 pueden adelantarse según la necesidad del operador. No exige que una slice sea una única PR: se subdivide si deja de ser revisable, manteniendo resultados comprobables. La programación de sus partes técnicas se define después del diseño.

## S01. De una issue a un brief visible

El [contrato de construcción de S01](s01-intake.md) concreta el recorrido, las responsabilidades, las revisiones del brief y cuatro unidades funcionales pequeñas. U1 y U2 tienen una implementación local histórica en Python, comprobada con fixtures y guías de [entrada clara](u1-usage.md) y [decisiones pendientes](u2-usage.md). Esa CLI no es requisito del núcleo Markdown. U3 y U4 siguen pendientes; no se marcan los escenarios siguientes como superados ni S01 como completa.

El operador registra un repositorio autorizado y entrega una issue definida. La skill de triage contrasta información, clasifica, señala dudas y propone el tratamiento. El panel muestra la issue, brief, estado y decisiones pendientes.

El único trabajo automatizado en esta slice es preparar el encargo. La implementación de la propia slice usa el soporte existente. No se simula un worker de isSWF que aún no existe.

- [ ] Una issue clara obtiene categoría y estado de preparación correctos, brief y criterio de éxito.
- [ ] Una issue ambigua pasa a needs-info o solicita una decisión sin iniciar código.
- [ ] Una etiqueta externa no concede permiso de ejecución.
- [ ] Releer la misma issue no crea trabajos o briefs activos duplicados.
- [ ] El panel y el resumen del coordinador muestran el mismo estado, con su antigüedad visible.
- [ ] La revisión independiente usa los casos anteriores y comprueba alcance, autorizaciones y exposición de datos.

Con S01 funcionando, se usa su intake para preparar issues de las siguientes slices. La ejecución sigue en Pi con el soporte previo.

## S02. De una issue clara a una PR revisada

Los perfiles worker, diagnostician, reviewer, coordinator, planner y researcher son instrucciones Markdown cargadas manualmente, no roles nativos ni autonomía de runtime. #57 construyó planner/researcher. En su ejercicio, GLM high produjo mapas útiles pero incumplió el alcance; una validación separada con Luna no fue fallback. `.factory/models.json` contiene actualmente la ruta configurada del researcher, GLM 5.3 Flash/high seguida de Luna/medium. El caller `tools/researcher-task.mjs` implementa presupuestos y cambios de ruta acotados, probados offline. La ejecución original y dos diagnósticos autorizados devolvieron HTTP 400 sin fallback. El diagnóstico legible identificó `MissingSessionID` por falta de `x-opencode-session`; la corrección del caller usa `sessionId` y pasó regresiones offline. Tras integrarla, una nueva ejecución autorizada del caller normal obtuvo HTTP 200 con GLM/high, un intento y la cita esperada del bundle fijado. No hubo retry ni cambio de destino, por lo que no se declara integración real de fallback demostrada. #58 ejercitó instrucciones propias sobre un fixture simple, con Pstack todavía visible. #59 ejercitó perfiles manualmente con registros sintéticos, sin PR, tracker o UI reales.

La ruta inicial de modelo y effort es explícita. En esta slice una cuota agotada puede bloquear el trabajo; el fallback automático pertenece a S03. Esto se comunica como límite de H1, no como incumplimiento oculto de una v1 terminada.

- [ ] Una issue real de bajo riesgo recorre triage, grounding, implementación, verificación, revisión y entrega.
- [ ] Un hallazgo bloqueante provoca corrección y nueva verificación del candidato.
- [ ] Un cambio tras PASS exige comprobaciones y revisión independiente de las partes afectadas contra la nueva identidad del candidato; una revisión requerida ausente bloquea la entrega.
- [ ] El mapa de lectura abre rutas reales, símbolos y líneas vigentes, incluidos tests y consumidores.
- [ ] Una slice deja un commit verificable y una PR draft antes de acumular el trabajo de las siguientes.
- [ ] Un checkpoint previo al final preserva el progreso parcial y lo muestra como WIP, con verificaciones pendientes; no se anuncia cierre ni se desbloquea otro trabajo.
- [ ] Una unidad que crece fuera de su resultado revisable se subdivide antes de ampliar el diff; la cadencia de checkpoints se respeta.
- [ ] La PR contiene resultado, visual pertinente, evidencia, problemas relevantes y riesgo explícito.
- [ ] Durante la ejecución el operador consulta avances y prepara otra issue en el coordinador.
- [ ] Cerrar la conversación no mata el worker en curso; al volver se encuentra su resultado o estado real.
- [ ] Ningún paso hace merge sin autorización explícita que nombre repositorio y alcance, ni despliega; la ejecución está confinada al alcance y permisos autorizados.
- [ ] El resultado y las instrucciones permiten explicar el comportamiento sin wrappers o helpers duplicados innecesarios.

H1 se demuestra sobre una issue real, no solo sobre un worker que imprime done. S04 verifica recuperación en el mismo arranque; no demuestra recuperación tras reiniciar la máquina. A partir de H1 se pueden delegar cambios acotados de la propia factory manteniendo aceptación e integración humanas.

## S03. Continuar ante una cuota agotada

La ruta de un rol contiene destino inicial y fallbacks con su propio effort. Una indisponibilidad prevista cambia el destino sin perder las referencias ni los requisitos del trabajo.

- [ ] Simular una cuota agotada muestra el cambio al siguiente destino aprobado y su motivo.
- [ ] Un fallo de tests no provoca fallback de proveedor.
- [ ] Una combinación incompatible de modelo y effort se rechaza antes de ejecutar.
- [ ] Todos los destinos agotados dejan el trabajo bloqueado; no se inventa otro proveedor ni se activan costes adicionales.
- [ ] El intento anterior no puede seguir escribiendo cuando empieza el nuevo.
- [ ] Cambiar defaults deja intacto un worker activo y la configuración efectiva es visible.
- [ ] Un panel respeta los slots compartidos y no bloquea esperando a sus propios participantes.

Las comprobaciones de error usan respuestas controladas, sin consumir deliberadamente cuotas reales. Se añade una ejecución con un destino real autorizado para comprobar la integración, sin afirmar que el caso simulado valida la calidad del modelo.

## S04. Recuperar un trabajo interrumpido

Verificada para los casos soportados de la [entrada normal](local-worker-lifecycle.md): mismo arranque, un intento original y como máximo un sucesor con revisión y grant explícitos. La [prueba de reinicio del proceso Pi](../.audit/recovery-68-environment-parent-v2.json) confirma su salida antes de consultar el worker desde otro proceso. En la [prueba real de modelo](../.audit/recovery-68-real-parent-final.json), A001 quedó parcial por un fallo del instrumento; se revisó sin repetirlo y A002 terminó correctamente. Ambos slots quedaron consumidos. La [reconciliación remota](../.audit/recovery-68-effects-parent-v2.json) usa un transporte GitHub simulado y SIGKILL real del cliente, no GitHub real. La [evaluación de los cinco criterios](../.audit/recovery-68-acceptance-scope-deepseek.json) distingue esas evidencias. Este cierre de #68 no acredita H1, reinicio de máquina, concurrencia multiwriter ni facturación exactly-once. Los estados inciertos o no soportados bloquean, sin autorización implícita para repetir efectos.

El operador reinicia el entorno después de una interrupción. La factory inspecciona estado, artefactos y operaciones conocidas antes de decidir qué reanudar. Una operación de resultado incierto no se repite a ciegas.

- [x] Una interrupción antes de crear una PR no duplica commits, ramas, PRs o issues al reanudar. El flujo soportado no crea issues; la publicación de PR se comprueba con transporte simulado.
- [x] Una interrupción después de crear la PR pero antes de registrar su respuesta local reconcilia la PR existente. Comprobado con PR persistente simulada y pérdida real del proceso cliente.
- [x] Un proceso cuya identidad no está confirmada impide lanzar otro escritor sobre el trabajo.
- [x] Una revisión anterior no se aplica a un candidato que cambió durante la recuperación.
- [x] Una operación remota que no puede reconciliarse queda bloqueada con su incertidumbre visible.

La evidencia incluye identificadores de los efectos antes y después. No se promete exactly-once sobre sistemas externos; se demuestra convergencia de los casos soportados y bloqueo seguro del resto.

## S05. Avanzar trabajos compatibles en paralelo

La PR #6 verificó dos trabajos offline independientes en espacios aislados y un tercero retenido hasta integrar el artefacto exacto. La liberación positiva de capacidad y la cola/panel automatizados siguen sin demostrarse. El coordinador decide cooperativamente qué trabajos compatibles admite. Otro que depende de su contrato integrado espera. Las ramas y espacios de escritura están aislados y la conversación sigue disponible.

- [ ] A y B progresan simultáneamente; C, dependiente de A, espera hasta que exista la condición de desbloqueo.
- [ ] Un bloqueo de A no cancela B ni bloquea una nueva investigación independiente.
- [ ] Dos solicitudes de escritura sobre el mismo espacio no producen dos escritores simultáneos.
- [ ] Esperar aceptación humana libera capacidad de ejecución sin dar por integrada la entrega.
- [ ] La cola, el panel y el resumen distinguen dependencias, capacidad y decisiones pendientes.

## S06. Convertir una idea en trabajo de producto

Una idea abierta se entrevista solo donde faltan decisiones. El coordinador contrasta posibilidades con grounding y devuelve objetivo, exclusiones, aceptación y slices verticales para aprobar.

- [ ] Una idea ambigua solicita decisiones de producto sin preguntar hechos que se pueden investigar.
- [ ] Una issue clara conserva el camino corto sin repetir una entrevista.
- [ ] Cada slice propuesta muestra un comportamiento completo y dependencias justificadas.
- [ ] Una solución técnicamente correcta pero distinta del objetivo no supera la aceptación del producto.
- [ ] Un riesgo o alcance nuevo vuelve al operador; no cambia silenciosamente el brief autorizado.

## S07. Cerrar y mejorar sin cambiar las reglas en vuelo

Una skill de retrospectiva analiza un trabajo completo o el cierre explícito de la sesión. El coordinador transforma los hallazgos comprobables en propuestas o issues, con deduplicación y el tracker autorizado.

- [ ] Cerrar una sesión con B activo analiza lo ocurrido y deja B ejecutándose.
- [ ] Repetir la retrospectiva conserva una sola issue por el mismo hallazgo.
- [ ] Una mejora de skills sigue el proceso de PR y no altera B.
- [ ] Una retrospectiva fallida queda pendiente sin invalidar una entrega aceptada.
- [ ] La issue de la factory puede entrar en su propio triage, pero no se autoautoriza.

## S08. Retomar contexto mediante Engram

La comprobación del 14 de octubre verificó operaciones del CLI de Engram acotadas al proyecto real `isswf`, incluida lectura y una ejecución sin Engram disponible. Ese registro histórico no prueba el consumidor actual. La PR #4 añadió su uso opcional al coordinador y un handoff de hechos contrastados al brief fijado; se observó recuperación en una sesión nueva y descarte de memoria obsoleta. El test de degradación usa un caso controlado, no una caída real del servicio, y no completa S08. Una nueva conversación debe recuperar decisiones y aprendizajes del proyecto; el coordinador contrasta su vigencia contra briefs, código y estado operativo actuales. Si falla la separación entre proyectos o la recuperación, se revisa la propuesta con el operador, no se anuncia completada esta slice. Véase el [registro de integración Engram](../.audit/engram-integration.json).

- [ ] Una decisión guardada se recupera en una conversación nueva sin volver a preguntarla.
- [ ] Un recuerdo antiguo no sobreescribe una decisión posterior ni marca un trabajo terminado.
- [ ] Una caída de Engram se informa y permite continuar con las fuentes disponibles cuando son suficientes.
- [ ] No se leen memorias de otros clientes ni se guardan secretos como aprendizaje.

## Antes de implementar

- [ ] Revisar esta propuesta y los defaults nuevos de la especificación.
- [ ] Elegir repositorio GitHub y su visibilidad; verificar acceso sin publicar ni instalar todavía.
- [ ] Comparar diseños pequeños para separar chat y ejecuciones, fijar instrucciones y conservar estado.
- [ ] Probar los puntos de riesgo del runtime Pi, aislamiento y recuperación. Registrar qué no está demostrado.
- [ ] Elegir perfiles y modelos disponibles, incluyendo fallback y effort compatibles.
- [ ] Definir las verificaciones y comandos reales de la primera slice; no copiar rutas de código inexistentes.
- [ ] Autorizar la implementación de la primera slice con su alcance concreto.

Las decisiones de las etapas pendientes siguen abiertas; los comandos y límites del arranque local probado son los de la guía vigente. La elección usa pruebas acotadas donde puedan resolverla; no exige al operador elegir detalles técnicos por intuición.
