# Plan funcional de construcción de isSWF v1

Estado reconciliado el 21 de octubre de 2026 con el [plan canónico I0001](../.factory/initiatives/I0001/plan.md) y el [cierre aceptado](../.factory/initiatives/I0001/jobs/J008/delivery.md). Sus 14 jobs figuran completados. Las entregas aceptadas conservan sus límites; no equivalen a una certificación universal ni a nuevos permisos de ejecución.

La [visión](vision.md) describe la experiencia buscada. La [especificación](spec-v1.md) conserva los criterios originales. Este documento resume entregas y próximos pasos, pero no sustituye el registro canónico ni vuelve a abrir los trabajos aceptados.

## Entregado y límites por slice

| Slice | Entrega aceptada y referencia | Límites que se conservan |
| --- | --- | --- |
| S01. Issue → brief | J002 entrega reconciliación explícita y duplicados con evidencia. El intake nativo conserva entradas y briefs anteriores. | Setup y etiquetas siguen el procedimiento autorizado del coordinador; no hay sincronización remota general implícita. U1/U2 Python son prototipos históricos. |
| S02. Trabajo → PR | J001/J009 entregan consulta y panel sobre registros canónicos, con evidencias y decisiones de aceptación. J011 entrega delegación nativa. | El panel requiere arranque manual. Los casos aceptados no prueban todos los cierres literales del chat ni una cadena real universal de todos los roles. |
| S03. Rutas y límites | #66 conserva fallback acotado. J005 añade capacidad compartida y slots de revisión para callers participantes. | El envelope de cuota conocido y el panel tienen pruebas controladas. No son un clasificador universal ni una prueba de panel simultáneo con proveedores reales. |
| S04. Recuperación | J006 añade un reinicio físico real con preservación de registros y rechazo conservador de identidad incierta. | No acredita reanudación automática. Los casos de interrupción de efectos remotos conservan sus límites de transporte simulado. |
| S05. Paralelismo | J005 entrega capacidad, dependencias y slots bajo un pool y política explícitos. | Callers no vinculados quedan fuera. No es un scheduler global de la máquina ni un servicio de autenticación de actores. |
| S06. Ideas → encargos | J003 valida una idea ambigua real mediante decisiones, jobs funcionales y entrega aceptada en PR55. J011 aporta el planner nativo. | Un caso aceptado no garantiza que toda conversación aplique correctamente la selección de roles. |
| S07. Retrospectivas | J004 valida propuestas respaldadas y reutilización de la propuesta existente al repetir el análisis. | Es un recorrido acotado skill-first. No autoaplica reglas ni modifica workers en curso. |
| S08. Contexto | J007 entrega contexto opcional contrastado, degradación y un perfil sintético con stores y procesos separados. | El contraejemplo de metadatos de otros proyectos en resúmenes de store compartido sigue vigente. Cada despliegue cliente exige verificar su frontera real. |

Los IDs, aceptación y evidencias por entrega están en el plan canónico. Las tarjetas históricas pueden conservar solicitudes de aceptación anteriores; las decisiones posteriores del plan prevalecen. No se reescriben los informes para convertir un resultado inconcluso en PASS.

## S01. De una issue a un brief visible

El intake nativo prepara y relee una issue clara sin duplicar el trabajo. J002 amplía ese corte con revisiones explícitas y resolución de duplicados respaldada por evidencia. Los planes y jobs viven en `.factory/initiatives/`; el tipo no cambia su ID.

El triage distingue una decisión de producto pendiente de un hecho técnico investigable. `ready-for-agent` identifica un siguiente paso acotado, no autorización de ejecución. La propuesta de triage no publica, implementa ni registra por sí sola respuestas del operador. Véanse [entrada nativa](s01-intake.md) y [trabajo durable](durable-work.md).

## S02. De una issue clara a una PR revisada

J001/J009 aportan consulta y panel local sin otra base editable de estados. J011 permite delegación nativa con entradas fijadas, grants y resultados durables. La issue #1/PR #2 conserva el primer corte de entrega propia.

El coordinador elige verificación mecánica, semántica o combinada según el riesgo y las exigencias del brief. No llama a un revisor de modelo si una comprobación mecánica suficiente cubre el cambio y no existe una exigencia explícita de juicio independiente. Cuando ese juicio es necesario, no lo sustituye por su propia revisión. Véase la [selección de revisión](../.agents/roles/references/review.md#choose-sufficient-verification).

El [perfil delivery](../.agents/roles/delivery.md) prepara la entrega. Publicación, push, merge y despliegue conservan sus permisos separados. La CI verde corresponde al candidato exacto; no sustituye aceptación ni demuestra comportamiento que no se haya comprobado.

## S03. Continuar ante una cuota agotada

#66 mantiene su alcance aceptado de ruta aprobada, presupuestos acumulativos y respuesta controlada ante indisponibilidad y cuota Go conocida. Los errores desconocidos bloquean sin fallback improvisado. J005 cubre slots compartidos en el ámbito explícitamente vinculado. Véase [rutas de modelos](model-routing.md).

## S04. Recuperar un trabajo interrumpido

La recuperación soportada del mismo arranque conserva su evidencia anterior. J006 añade un reinicio físico real sobre un worker sintético offline. Los registros y el resultado parcial sobreviven, y la identidad incierta bloquea la continuación. Eso satisface la entrega acotada aceptada, no promete auto-resume ni recuperación universal de efectos externos.

Otro reinicio, intento o reemplazo necesita su propia autorización y reconciliación. Véase [ciclo de vida](local-worker-lifecycle.md).

## S05. Avanzar trabajos compatibles en paralelo

J005 entrega admisión compartida, dependencia de artefactos integrados y slots sucesivos de revisión para callers vinculados al mismo pool y política. La liberación exige evidencia de cese; un estado incierto conserva la reserva. Los escritores mantienen espacios propios.

La prueba del panel es fixture-only. Ni esa prueba ni la aceptación amplían la garantía a procesos ajenos al pool.

## S06. Convertir una idea en trabajo de producto

J003 recorrió una idea ambigua de la propia factory hasta una entrega aceptada. El coordinador conserva las decisiones de producto y adopta o rechaza las propuestas del planner. El researcher aporta hechos contrastados cuando una incertidumbre técnica lo requiere. Ninguno es un jefe permanente ni un paso obligatorio de todas las issues.

Una entrada clara conserva el camino corto. Una entrada ambigua necesita preguntas concretas antes de fijar aceptación que dependa de las respuestas. El registro de decisiones sigue el contrato del camino de intake elegido.

## S07. Cerrar y mejorar sin cambiar las reglas en vuelo

J004 validó el recorrido acotado de retrospectiva y deduplicación. Una propuesta no se autoautoriza ni cambia reglas activas. El cierre del chat no cancela por sí mismo una ejecución.

J013 conserva la política aceptada de retención. La organización posterior de auditoría distingue evidencia histórica de desarrollo y runtime instalado; no autoriza borrados ni reescritura de historia.

## S08. Retomar contexto mediante Engram

J007 valida selección de contexto contrastado, recuperación y degradación en los casos documentados. Engram y Codegraph son opcionales y no son el registro operativo ni una fuente de autorización.

El perfil aislado sintético no certifica la integración del proceso padre ni un despliegue cliente. Una consulta con selector de proyecto no demuestra aislamiento técnico. La falta de una frontera requerida bloquea el uso cliente, no el trabajo con fuentes primarias suficientes.

## Próximo trabajo por valor

No hay otra cola de implementación autorizada por este documento. El siguiente paso es contrastar escenarios de uso y registrar solo las fricciones demostradas.

| Clasificación | Evidencia necesaria | Siguiente acción |
| --- | --- | --- |
| Existe y debe aplicarse mejor | El contrato y la capacidad existen, pero la respuesta o ejecución los omite. | Aplicar el camino existente y comprobar el resultado. |
| Falta instrucción | Los perfiles no determinan una conducta necesaria o se contradicen. | Proponer una corrección acotada de instrucciones. |
| Falta implementación | Un recorrido requerido falla porque falta soporte ejecutable. | Reproducir la carencia y preparar un job funcional. |
| Ampliación futura | Se pide una garantía fuera de lo aceptado. | Explicitar el nuevo alcance y solicitar la decisión correspondiente. |

### Escenario de tres issues

Este escenario es una simulación conversacional. No se han inspeccionado issues ni ejecutado workers. Su omisión inicial de roles es un fallo de explicación, no evidencia de soporte ausente.

| Issue | Triage y definición | Delegación condicional | Worker y comprobación prevista |
| --- | --- | --- | --- |
| X. Aspecto de un botón | Contrastar defecto, reproducción y referencia visual. Preguntar solo si falta el aspecto deseado. | Worker con diagnóstico y arreglo si la causa es local. Diagnostician si la causa es desconocida, intermitente o cruza componentes. Researcher/planner no son obligatorios. | Reproducir, reutilizar el patrón visual y cambiar lo mínimo. Comprobar aspecto, estados e interacción. TDD solo si lo pide el brief o existe una regresión local útil; no forzar un test lógico para demostrar CSS. |
| Y. Lista a tarjetas | Conservar datos y acciones salvo cambio explícito. Concretar contenido y responsive si el proyecto no los define. | Researcher si hay hechos técnicos pendientes. Planner si dependencias o alcance necesitan unidades funcionales, no por ser una mejora. | Reutilizar tarjetas existentes. Verificar datos, acciones, accesibilidad y responsive. TDD para lógica significativa o requisito explícito, más observación visual. |
| Z. Visor Markdown | Aclarar origen de ficheros, dialecto, significado de opciones, HTML, enlaces y errores cuando afecten al objetivo. No inventar respuestas para cerrar el brief. | Researcher para renderizadores existentes, compatibilidad y riesgos. Planner si el alcance requiere diseño y secuencia funcional. El coordinador adopta las propuestas después de resolver decisiones de producto. | Reabrir código y contratos, implementar el resultado aprobado y probar ejemplos del dialecto, errores y contenido inseguro. TDD es apropiado para lógica comprobable de renderizado/seguridad, sin sustituir la prueba del visor real. |

En las tres issues, el brief fija el modo de revisión por riesgo. Un cambio visual o un renderizador no se da por validado solo por pasar lint. La revisión semántica se centra en el comportamiento afectado; el visor añade riesgos de contenido externo. Las correcciones renuevan las comprobaciones y la revisión afectadas. El paralelismo requiere capacidad autorizada, espacios propios y ausencia de dependencias incompatibles.

La clasificación actual es **existe y debe aplicarse mejor** para triage, preguntas, elección de roles, TDD proporcional y revisión. No se ha demostrado una carencia de instrucciones o implementación con esta conversación. Los próximos escenarios pueden aportar esa evidencia sin reabrir el conjunto de v1.

## Trazabilidad y permisos

S01 conserva TRI-01–05, OPS-01 y SEC-01–02; S02, AGT/GND/DEL/NAV y OPS-02–03/SEC-03–04; S03, MOD-01–07; S04, OPS-04–06; S05, OPS-07–09; S06, PRD-01–03; S07, RET-01–05; S08, MEM-01–04. Los criterios completos siguen en la especificación. La aceptación acotada no modifica su texto ni convierte limitaciones en garantías.

Antes de cada nuevo trabajo se verifican fuente y revisión, autorización, alcance, dependencias, presupuesto, aislamiento, aceptación y comprobaciones aplicables. Una propuesta de backlog no autoriza implementación ni llamadas a modelos. Las instrucciones nuevas y las issues/PRs se redactan en inglés; la documentación de producto puede seguir en español.

## Cierre de v1 y ampliaciones posteriores

J008 registra tu aceptación del conjunto desde las entregas existentes. El [cierre](../.factory/initiatives/I0001/jobs/J008/delivery.md) conserva el índice histórico de 61 criterios y los resultados inconclusos sin promoverlos a un PASS global. Esta reconciliación no vuelve a certificar cada criterio.

Las limitaciones aceptadas no desaparecen por cerrar los jobs. Reanudación automática tras reinicio, nuevas garantías de proveedores o uso cliente requieren alcance y verificaciones propios. Antes de un cliente se comprueban las fronteras reales de archivos, procesos, herramientas, efectos y memoria.

Siguen fuera de v1 la coordinación entre proyectos, múltiples operadores, PRs apiladas como capacidad general, despliegues automáticos y un servicio alojado permanente. No existe permiso general de merge autónomo. Otros runtimes, trackers y proveedores tampoco se incorporan por esta actualización.

Traducir instrucciones existentes o ampliar analizadores se propone según una necesidad observada. El [siguiente corte operativo histórico](next-operational-cut.md) conserva contexto, no es la cola actual ni una autorización.
