# Plan funcional de construcción de isSWF v1

Estado reconciliado el 17 de octubre de 2026. Este plan ordena los pendientes por beneficio para el operador. La [visión](vision.md) describe el producto y la [especificación](spec-v1.md) conserva sus criterios. Actualizar el plan no implementa capacidades ni autoriza nuevos workers, costes o efectos externos.

La cola reciente de encargos está cerrada, incluido #66 con el alcance aceptado. La v1 completa no está cerrada. Los números de encargos históricos y las slices S01–S08 no son intercambiables: cerrar un corte acotado no acredita todos los criterios de su slice.

## Cómo decidir el siguiente trabajo

1. Elegir un problema útil de la propia factory, no un proyecto artificial para probarla.
2. Reutilizar el flujo disponible y contrastar el código antes de diseñar soporte nuevo.
3. Entregar una unidad pequeña con comportamiento comprobado, revisión independiente, PR en inglés y CI verde antes del merge autorizado.
4. Ampliar solo donde el uso revele una fricción o falte una garantía exigida. No construir paneles, colas o clasificadores universales por anticipación.

La entrevista, TDD, un investigador separado, múltiples revisores y benchmarks no son pasos universales. Cada trabajo elige las comprobaciones proporcionales a su riesgo. La aceptación de producto sigue separada del cierre técnico.

## Entregado y pendiente por slice

| Slice | Lo que ya aporta | Lo que no se da por cerrado |
| --- | --- | --- |
| S01. Issue → brief | Skill de triage y contratos de trabajo durable. U1/U2 son prototipos históricos comprobados. | Entrada nativa integrada, relectura y decisiones sin duplicación, y observación coherente. U3/U4 describen esas necesidades; no obligan a completar el backend Python. |
| S02. Trabajo → PR | Entrada nativa y activación #44; issue #1/PR #2 como corte técnico H1; revisión, entregas propias, formato y CI/lint/dead code. | Toda la experiencia integrada de preparación, observación y continuidad del chat. Un caso real no certifica todos sus criterios. |
| S03. Rutas y límites | #66 aceptada: investigador con éxito primario real, presupuestos acumulativos, 503 controlado y cuota Go de formato conocido. | Paneles/slots y generalización a otros contratos. No se promete clasificación universal ni transición de cuota observada en el servicio actual. |
| S04. Recuperación | #68 verificada para los casos soportados en el mismo arranque, con revisión y sucesor autorizado. | Recuperación general tras reinicio de máquina. Los efectos GitHub de sus cortes de fallo se verificaron con transporte simulado. |
| S05. Paralelismo | #67 verificó coordinación cooperativa, espacios aislados y espera de un artefacto integrado. | Admisión/capacidad y cola/panel completamente automatizados. |
| S06. Ideas → encargos | Perfiles y procedimientos de planificación y grounding. | Un recorrido integrado de idea ambigua a decisiones y slices aprobadas. |
| S07. Retrospectivas | Procedimientos y contrato de propuestas de mejora. | Flujo integrado con deduplicación y sin alterar trabajos activos. |
| S08. Contexto | #69 añadió Engram/Codegraph opcionales, recuperación observada y hechos contrastados en briefs. | Todas las garantías de separación por proyecto, degradación y recuperación en el uso previsto. |

Evidencia de entrada: [ciclo de vida y recuperación](local-worker-lifecycle.md), [activación](activacion-por-proyecto.md), [H1 PR #2](https://github.com/iseoane/isSWF/pull/2), [contexto PR #4](https://github.com/iseoane/isSWF/pull/4), [concurrencia PR #6](https://github.com/iseoane/isSWF/pull/6), [workflow PR #8](https://github.com/iseoane/isSWF/pull/8), [calidad PR #12](https://github.com/iseoane/isSWF/pull/12) y [cuota conocida PR #20](https://github.com/iseoane/isSWF/pull/20). No hay que repetir lo ya probado solo para marcar una casilla antigua.

## Prioridad por valor aportado

| Orden | Próximo resultado útil | Qué aporta | Límite del primer corte |
| --- | --- | --- | --- |
| 1 | S01: preparar y releer una issue propia autorizada | Reduce preparación manual y evita briefs duplicados o desactualizados. | Una issue clara, un brief durable, relectura segura y bloqueo ante cambio material. Sin nuevo motor de ejecución. |
| 2 | Observación de S01/S02: consultar estado y decisiones | Permite saber qué ocurre sin perseguir logs y artefactos. | Vista de lectura y resumen del coordinador sobre los mismos registros; no exige empezar por una web. |
| 3 | S06: recorrer una idea ambigua real | Evita implementar algo técnicamente correcto pero distinto de lo deseado. | Una idea propia, decisiones necesarias y slices aprobables; no otra plataforma de planificación. |
| 4 | S07: convertir una retrospectiva en una propuesta no duplicada | Convierte uso real en mejoras pequeñas y trazables. | Un hallazgo comprobado y su issue/propuesta; nunca autoaplicar cambios de reglas. |
| 5 | S05 y parte de S03: capacidad/dependencias más automáticas | Reduce coordinación manual cuando dos trabajos reales lo necesiten. | Mejorar primero la decisión y su visibilidad; una nueva cola o scheduler requiere una necesidad observada. |
| 6 | S04: recuperación tras reinicio de máquina | Protege trabajos más largos ante cortes del entorno. | Un caso propio controlado, con autorización para la interrupción y bloqueo seguro de lo incierto. |
| 7 | S08: completar garantías de contexto necesarias | Reduce pérdidas de contexto sin mezclar proyectos ni depender del servicio. | Engram/Codegraph opcionales; verificar casos concretos de separación, ausencia y recuperación. |

Las necesidades de seguridad prevalecen sobre esta prioridad de conveniencia. Antes de usar la factory en proyectos cliente deben comprobarse sus fronteras de archivos, herramientas, efectos y contexto. No se pospone esa condición para acelerar una demo.

La prioridad 1 es el siguiente corte propuesto. Las demás no son una orden de construirlas todas seguidas: se reordenan cuando el uso aporte evidencia. Traducir gradualmente instrucciones operativas existentes queda como mantenimiento, no como requisito para empezar. Las instrucciones nuevas y las issues/PRs se redactan en inglés; la documentación de producto puede seguir en español.

## S01. De una issue a un brief visible

La issue puede pertenecer al propio repositorio isSWF. Propuesta de título: **Prepare and re-read one authorized isSWF issue without duplicate briefs**. Puede describir la mejora del propio intake. Preparar manualmente ese primer encargo no demuestra que el nuevo intake exista; la comprobación llega después de implementarlo.

### Resultado del siguiente corte

Con autorización para preparar una issue concreta, el coordinador usa la skill existente y los contratos de [trabajo durable](durable-work.md) para obtener un brief identificable y consultable. Primero se comprueba qué resuelve ya el flujo nativo; no se prescribe otro CLI, registro o base de datos por anticipado. El [contrato histórico de S01](s01-intake.md) conserva los escenarios U3/U4, no una arquitectura obligatoria.

- [ ] Una issue clara de isSWF obtiene objetivo, alcance, aceptación y siguiente paso sin entrevista innecesaria.
- [ ] Se distingue la autorización confiable del texto y las etiquetas externas; preparar no autoriza ejecutar.
- [ ] Releer la misma issue sin cambios reutiliza el mismo trabajo y brief, sin duplicarlos.
- [ ] Un cambio material de fuente o autorización conserva el brief aprobado y bloquea la ampliación hasta reconciliarla.
- [ ] El resumen muestra la fuente leída, su antigüedad y las decisiones pendientes.
- [ ] Pruebas controladas e inspección de una issue propia autorizada verifican los casos anteriores. Una revisión independiente contrasta el candidato exacto.

Quedan fuera de esa primera issue el panel completo, la reconciliación de todas las entradas ambiguas, el etiquetado automático, los workers nuevos y la modernización del backend Python. S01 completa sigue exigiendo sus criterios TRI/OPS/SEC de la especificación.

## S02. De una issue clara a una PR revisada

El caso propio de issue #1/PR #2 ya demostró implementación y entrega real. La entrada normal permite ejecutar un job de una versión fijada; no depende de completar S01 histórica. El siguiente beneficio de S02 está en hacer cómodo y consistente su uso, no en reconstruir el runner.

En prioridad 2 se propone una consulta de lectura que muestre trabajo, estado observado, última actualización, candidato, evidencias, bloqueos, decisiones y PR. El coordinador debe explicar esa misma vista y avisar de datos antiguos o indisponibles. No se duplica estado editable para una interfaz nueva. La primera consulta no elimina el objetivo de panel local de la v1 completa.

Las entregas siguen el [perfil delivery](../.agents/roles/delivery.md) y su [referencia de publicación](../.agents/roles/references/delivery.md). El perfil prepara texto; no publica ni concede permisos. El coordinador publica con el mecanismo GitHub existente solo dentro del grant. La [plantilla local](../.factory/templates/delivery.md) conserva evidencia detallada y no impone un cuerpo extenso a todas las PRs.

El formato remoto propio es conciso y en inglés: motivo, cambio, aspectos relevantes, riesgo y pruebas. Usa un visual cuando explique el comportamiento real. Mantiene checkpoints y PRs tempranas sin anunciar aceptación antes de resolver verificaciones y revisión. Un cambio tras PASS exige renovar la evidencia y revisión afectadas. El merge necesita autorización vigente y CI verde del head exacto; esa comprobación es manual en este repositorio.

Falta contrastar de forma integrada toda la experiencia de S02, incluida la continuidad general del chat. Los cortes de cese del coordinador y recuperación del proceso Pi no acreditan por sí solos todos los cierres posibles del chat ni un reinicio de máquina.

## S03. Continuar ante una cuota agotada

#66 está cerrada con el alcance aceptado por el operador. El caller investigador conserva ruta y brief fijados, presupuestos acumulativos y resultados durables. Las pruebas cubren indisponibilidad, cuota Go reconocida, incompatibilidad, agotamiento de intentos/ruta y rechazo de señales ambiguas. Véanse [guía](model-routing.md), [contrato](../.audit/fallback-66-quota-contract.json) y [revisión/evidencia](../.audit/fallback-66-quota-proof.json).

La ejecución real primaria completó una lectura con cita en la versión anterior al observer de cuota. El observer posterior se comprueba con transporte controlado; su envelope publicado es un contrato conocido, no prueba de la respuesta que emita hoy el backend migrado. No se presenta como transición real observada ni clasificador universal.

No se ampliarán ahora proveedores, códigos o dispatchers para cerrar S03 artificialmente. Los errores desconocidos bloquean y el operador decide. Los criterios de paneles y slots de MOD-07 se retoman con prioridad 5 si aparece esa necesidad. Se usan respuestas controladas para errores; no se agotan cuotas reales deliberadamente. Una nueva llamada de integración necesita su propio grant concreto.

## S04. Recuperar un trabajo interrumpido

#68 está verificada para los casos soportados de la [entrada normal](local-worker-lifecycle.md): mismo arranque, un intento original y como máximo un sucesor con revisión y grant explícitos. La [prueba de reinicio del proceso Pi](../.audit/recovery-68-environment-parent-v2.json) confirma su salida antes de consultar desde otro proceso. En la [prueba real de modelo](../.audit/recovery-68-real-parent-final.json), A001 quedó parcial por un fallo del instrumento; se revisó sin repetirlo y A002 terminó correctamente.

La [reconciliación remota](../.audit/recovery-68-effects-parent-v2.json) usa un transporte GitHub simulado y SIGKILL real del cliente, no GitHub real. La [evaluación de los cinco criterios](../.audit/recovery-68-acceptance-scope-deepseek.json) distingue esas evidencias. Identidad incierta, candidato cambiado o efecto no reconciliable bloquean sin repetir a ciegas.

La prioridad 6 aborda lo que falta: recuperar tras reiniciar la máquina, conservando artefactos y referencias de efectos. Sigue siendo un objetivo de v1, no una capacidad ya entregada ni autorización para reiniciar este entorno. No se promete backup ni exactly-once en sistemas externos.

## S05. Avanzar trabajos compatibles en paralelo

La PR #6 verificó dos trabajos offline independientes en espacios aislados y un tercero retenido hasta integrar su artefacto exacto. Un bloqueo de uno no canceló al otro. Es coordinación cooperativa, no un scheduler global ni demostración de modelos reales simultáneos.

La prioridad 5 completa primero visibilidad de dependencias y capacidad. Esperar aceptación humana no equivale a mantener un intento ejecutándose ni a dar su entrega por integrada. La automatización de admisión y liberación se añade si evita una fricción observada, preservando exclusión de escritores y reservas cuando el cese sea incierto.

## S06. Convertir una idea en trabajo de producto

La prioridad 3 usa una idea real de la propia factory. Los perfiles de planificación, investigación y coordinación ya existen. Falta demostrar conjuntamente que se preguntan solo decisiones de producto, se contrastan hechos con las fuentes y se obtienen objetivo, exclusiones, aceptación y slices aprobables.

Una issue clara conserva el camino corto. Una solución que pasa tests pero cambia el objetivo no supera aceptación. Un riesgo, alcance o coste nuevo vuelve al operador. No hace falta otro planificador permanente ni un framework de entrevistas.

## S07. Cerrar y mejorar sin cambiar las reglas en vuelo

La prioridad 4 prueba una retrospectiva útil sobre un trabajo propio. Un hallazgo con evidencia produce una propuesta o issue pendiente de triage. Repetir el análisis enlaza la propuesta existente, sin duplicarla ni ejecutarla automáticamente.

El cierre de sesión no cancela un worker activo. Las propuestas de skills o instrucciones pasan por revisión y PR y no alteran trabajos en curso. Una retrospectiva fallida puede quedar pendiente sin invalidar la entrega aceptada. Los procedimientos existen; ese recorrido integrado sigue por comprobar.

## S08. Retomar contexto mediante Engram

La PR #4 añadió uso opcional de Engram/Codegraph al coordinador y hechos contrastados en el brief. Se observó recuperación en una sesión nueva y descarte de memoria obsoleta. El caso de degradación usa una ausencia controlada; no es evidencia de una caída real ni de todos los escenarios entre proyectos.

La prioridad 7 completa las garantías necesarias para el uso previsto: decisiones recuperadas sin repetir preguntas, memoria antigua incapaz de sustituir fuentes actuales, degradación explícita y separación de proyectos sin secretos. Engram no es el estado operativo. No se instala otro sistema de memoria ni se bloquea un encargo con fuentes suficientes porque falten estas herramientas.

## Trazabilidad y permisos

S01 conserva TRI-01–05, OPS-01 y SEC-01–02; S02, AGT/GND/DEL/NAV y OPS-02–03/SEC-03–04; S03, MOD-01–07; S04, OPS-04–06; S05, OPS-07–09; S06, PRD-01–03; S07, RET-01–05; S08, MEM-01–04. Los criterios completos siguen en la especificación; este orden no los reduce ni declara todos satisfechos.

El repositorio y las rutas actuales ya están elegidos. No se reabren esas decisiones históricas por una checklist antigua. Antes de cada nuevo trabajo se verifican fuente y revisión, autorización, alcance, dependencias, presupuesto, aislamiento, aceptación y comprobaciones aplicables. Una propuesta de backlog no autoriza implementación ni llamadas a modelos.

Quedan para después de v1 las PRs apiladas como capacidad general, la coordinación entre proyectos, varios operadores, despliegues automáticos y servicio alojado permanente. Antes de clientes sigue siendo obligatoria la comprobación de sus fronteras de datos y efectos. El [siguiente corte operativo histórico](next-operational-cut.md) conserva contexto de decisiones anteriores; no sustituye este orden ni es evidencia actual.
