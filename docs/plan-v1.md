# Plan funcional de construcción de isSWF v1

Estado revisado el 14 de octubre de 2026. Sigue siendo una propuesta para revisar junto a la [especificación](spec-v1.md), no una orden de ejecución ni un plan técnico con módulos y comandos ya decididos. La asignación documental de criterios y los cierres locales no demuestran que S01, S02, H1 ni los 61 criterios estén completos. Véanse [cierre del núcleo Markdown](../.audit/markdown-core-closure.md), [cierre de calidad #54](../.audit/quality-54-closure.md), [cierre de adaptación #49](../.audit/adaptation-49-closure.md), [comprobación de integración Engram](../.audit/engram-integration.json) y [comprobación del índice Codegraph](../.audit/codegraph-index-verify.json).

## Lectura del plan

Cada slice termina en un resultado observable, con evidencias y revisión independiente de lo construido. Las casillas se marcan cuando esas evidencias existen, no cuando el implementador informa que ha terminado.

Las primeras slices se construyen con Pi, Pstack y las skills de Matt disponibles. La factory asume responsabilidades conforme las demuestra. El soporte externo sigue disponible si una capacidad aún no existe o falla.

El primer hito previsto, H1, comprende S01 y S02. Incluye una issue real y definida, grounding, implementación, revisión, correcciones y PR visual. H1 aún no se ha demostrado: falta una PR real y no se ha probado independencia del chat en el runtime de producto. Las slices posteriores completan v1; no se presentan como disponibles en H1.

No se obliga a usar TDD, diez revisores o benchmarks en cada slice. Se eligen comprobaciones según riesgo. Todos los cambios de código necesitan verificación de comportamiento y revisión independiente.

## Estado y secuencia acordada

U1 y U2 son unidades históricas locales de S01, implementadas con el CLI Python. No se exige ese CLI para el núcleo Markdown. U3 y U4 siguen pendientes; por tanto, S01 sigue abierta. S02 tampoco está completa. Las pruebas Markdown acreditan el uso manual de perfiles y un worker en un fixture local, no la ejecución autónoma del coordinador ni la independencia del chat. Codegraph tiene un índice local verificado y devolvió código fuente en una consulta; aún no existe un mapa de grounding completo para un encargo real.

La secuencia de trabajo acordada es:

1. Reconciliar el estado y las decisiones pendientes.
2. Completar #55 con artefactos durables para spec, plan y jobs, ownership, snapshot por intento y checkpoints Git. No incluye backup completo ni un proceso runtime.
3. Tras #55, construir en paralelo los perfiles de planificador e investigador. Las ejecuciones de planificación y research requieren materiales reconciliados y un brief explícito; no se inician automáticamente a la vez sobre materiales sin reconciliar.
4. Construir en paralelo los formatos y procedimientos de entrega visual y retrospectiva. No se prepara una PR draft real sin evidencia de entrega.
5. Centralizar la configuración.
6. Completar la demostración local supervisada #61. Esta demostración no prueba OPS-03 a OPS-06, independencia del chat, recuperación tras reinicio ni H1 completo.
7. Crear la skill propia de setup #62 después de la demo: detectar proyecto y configuración existente, preguntar solo decisiones no deducibles, proponer permisos, verificaciones, entrega y rutas modelo/effort/fallback autorizadas, mostrar el diff y dejar un checkpoint. Debe poder repetirse sin sobrescribir decisiones ni alterar intentos activos. No guarda credenciales ni realiza cambios globales implícitos. Configurar un proyecto no instala ni conecta el runtime; #44 sigue pausada.

El contrato documental de `.factory/jobs/` se formalizó y probó de forma acotada en #55; véase la [guía de trabajo durable](durable-work.md). La configuración manual de rutas está en `.factory/models.json`, con sus límites en la [guía de modelos](model-routing.md). Esto no entrega una instalación runtime ni demuestra recuperación de procesos. Esta secuencia no cambia la [especificación v1](spec-v1.md).

Antes de usar la factory con clientes, verificar aislamiento técnico de archivos, herramientas y efectos autorizados. Las instrucciones de alcance y la elección de un modelo no son una frontera de seguridad; las pruebas supervisadas actuales no satisfacen ese requisito. Su implementación no se añade implícitamente a #61 ni reactiva #44.

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

Un perfil Markdown y un brief permiten preparar y ejecutar un trabajo de código con el soporte disponible. Los perfiles actuales de worker, diagnostician, reviewer y coordinator se cargan manualmente por ruta; no son roles nativos ni acreditan autonomía completa o independencia del chat. El research entrega análisis y mapa de lectura cuando se delega, o el worker hace grounding acotado. Se aprobó desarrollar un perfil investigador autónomo separado para research de solo lectura, con destino `opencode-go/glm-5.3-flash` y esfuerzo `high`; el destino alternativo aprobado es `openai-codex/gpt-6-luna` con esfuerzo `medium`. El desarrollo del perfil no depende de que la configuración esté lista. Esta ruta aún no está configurada: antes de un probe real se validan disponibilidad y compatibilidad, y el brief debe declarar explícitamente el destino elegido. No hay fallback silencioso ni runtime automático probado. La revisión usa otro contexto. Las correcciones vuelven a comprobarse antes de declarar cierre técnico.

La ruta inicial de modelo y effort es explícita. En esta slice una cuota agotada puede bloquear el trabajo; el fallback automático pertenece a S03. Esto se comunica como límite de H1, no como incumplimiento oculto de una v1 terminada.

- [ ] Una issue real de bajo riesgo recorre triage, grounding, implementación, verificación, revisión y entrega.
- [ ] Un hallazgo bloqueante provoca corrección y nueva verificación del candidato.
- [ ] Un cambio tras PASS exige una revisión nueva; una revisión ausente bloquea la entrega.
- [ ] El mapa de lectura abre rutas reales, símbolos y líneas vigentes, incluidos tests y consumidores.
- [ ] Una slice deja un commit verificable y una PR draft antes de acumular el trabajo de las siguientes.
- [ ] Un checkpoint previo al final preserva el progreso parcial y lo muestra como WIP, con verificaciones pendientes; no se anuncia cierre ni se desbloquea otro trabajo.
- [ ] Una unidad que crece fuera de su resultado revisable se subdivide antes de ampliar el diff; la cadencia de checkpoints se respeta.
- [ ] La PR contiene resultado, visual pertinente, evidencia, problemas relevantes y riesgo explícito.
- [ ] Durante la ejecución el operador consulta avances y prepara otra issue en el coordinador.
- [ ] Cerrar la conversación no mata el worker en curso; al volver se encuentra su resultado o estado real.
- [ ] Ningún paso hace merge ni despliega; la ejecución está confinada al alcance y permisos autorizados.
- [ ] El resultado y las instrucciones permiten explicar el comportamiento sin wrappers o helpers duplicados innecesarios.

H1 se demuestra sobre una issue real, no solo sobre un worker que imprime done. La recuperación tras caída del entorno todavía no está entregada. A partir de H1 se pueden delegar cambios acotados de la propia factory manteniendo aceptación e integración humanas.

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

El operador reinicia el entorno después de una interrupción. La factory inspecciona estado, artefactos y operaciones conocidas antes de decidir qué reanudar. Una operación de resultado incierto no se repite a ciegas.

- [ ] Una interrupción antes de crear una PR no duplica commits, ramas, PRs o issues al reanudar.
- [ ] Una interrupción después de crear la PR pero antes de registrar su respuesta local reconcilia la PR existente.
- [ ] Un proceso cuya identidad no está confirmada impide lanzar otro escritor sobre el trabajo.
- [ ] Una revisión anterior no se aplica a un candidato que cambió durante la recuperación.
- [ ] Una operación remota que no puede reconciliarse queda bloqueada con su incertidumbre visible.

La evidencia incluye identificadores de los efectos antes y después. No se promete exactly-once sobre sistemas externos; se demuestra convergencia de los casos soportados y bloqueo seguro del resto.

## S05. Avanzar trabajos compatibles en paralelo

El coordinador admite dos trabajos independientes. Otro que depende de su contrato integrado espera. Las ramas y espacios de escritura están aislados y la conversación sigue disponible.

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

La comprobación del 14 de octubre de 2026 verificó búsquedas y contexto por proyecto en el store real, pero también confirmó que isSWF no consume Engram en runtime. Esto no completa S08 ni demuestra una ruta de degradación ante fallos. La integración propuesta aún debe probarse dentro de isSWF. Una nueva conversación debe recuperar decisiones y aprendizajes del proyecto; el coordinador contrasta su vigencia contra briefs, código y estado operativo actuales. Si falla la separación entre proyectos o la recuperación, se revisa la propuesta con el operador, no se anuncia completada esta slice. Véase el [registro de integración Engram](../.audit/engram-integration.json).

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

Las decisiones de almacenamiento, interfaz local, composición de prompts, sandbox y comandos exactos siguen abiertas. La elección usa pruebas acotadas donde puedan resolverla; no exige al operador elegir detalles técnicos por intuición.
