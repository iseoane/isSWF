# Plan funcional de construcción de isSWF v1

Estado reconciliado el 17 de octubre de 2026. Este plan ordena los pendientes por beneficio para el operador. La [visión](vision.md) describe el producto y la [especificación](spec-v1.md) conserva sus criterios. Actualizar el plan no implementa capacidades ni autoriza nuevos workers, costes o efectos externos.

La cola reciente de implementación está cerrada, incluidos #66 con el alcance aceptado, el intake nativo de la [PR #25](https://github.com/iseoane/isSWF/pull/25), las plantillas de la [PR #26](https://github.com/iseoane/isSWF/pull/26) y los planes por iniciativa de la [PR #28](https://github.com/iseoane/isSWF/pull/28). Esta reconciliación documental no implementa el siguiente corte. La v1 completa no está cerrada. Los números de encargos históricos y las slices S01–S08 no son intercambiables: cerrar un corte acotado no acredita todos los criterios de su slice.

## Cómo decidir el siguiente trabajo

1. Elegir un problema útil de la propia factory, no un proyecto artificial para probarla.
2. Reutilizar el flujo disponible y contrastar el código antes de diseñar soporte nuevo.
3. Entregar una unidad pequeña con comportamiento comprobado, revisión independiente, PR en inglés y CI verde antes del merge autorizado.
4. Ampliar solo donde el uso revele una fricción o falte una garantía exigida. No construir paneles, colas o clasificadores universales por anticipación.

La entrevista, TDD, un investigador separado, múltiples revisores y benchmarks no son pasos universales. Cada trabajo elige las comprobaciones proporcionales a su riesgo. La aceptación de producto sigue separada del cierre técnico.

## Entregado y pendiente por slice

| Slice | Lo que ya aporta | Lo que no se da por cerrado |
| --- | --- | --- |
| S01. Issue → brief | Intake nativo prepare/read comprobado con issue #21, relectura sin duplicación y bloqueo de cambios. Planes y jobs por iniciativa, plantillas en `.factory/templates/`, inventario de calidad y procedimientos de setup/etiquetas. | Reconciliar cambios materiales con nuevas revisiones, deduplicar entradas y comprobar decisiones ambiguas y observación integrada. Setup y etiquetas son procedimientos del coordinador, no sincronización remota automática. U1/U2 siguen históricos. |
| S02. Trabajo → PR | Entrada nativa y activación #44; issue #1/PR #2 como corte técnico H1; revisión, entregas propias, formato y CI/lint/dead code. | Toda la experiencia integrada de preparación, observación y continuidad del chat. Un caso real no certifica todos sus criterios. |
| S03. Rutas y límites | #66 aceptada: investigador con éxito primario real, presupuestos acumulativos, 503 controlado y cuota Go de formato conocido. | Paneles/slots y generalización a otros contratos. No se promete clasificación universal ni transición de cuota observada en el servicio actual. |
| S04. Recuperación | #68 verificada para los casos soportados en el mismo arranque, con revisión y sucesor autorizado. | Recuperación general tras reinicio de máquina. Los efectos GitHub de sus cortes de fallo se verificaron con transporte simulado. |
| S05. Paralelismo | #67 verificó coordinación cooperativa, espacios aislados y espera de un artefacto integrado. | Admisión/capacidad y cola/panel completamente automatizados. |
| S06. Ideas → encargos | Perfiles de planificación y grounding; recorder de planes con jobs, dependencias, estados, historial y revisión por SHA. | Un recorrido integrado de idea ambigua a decisiones y slices aprobadas. |
| S07. Retrospectivas | Procedimientos y contrato de propuestas de mejora. | Flujo integrado con deduplicación y sin alterar trabajos activos. |
| S08. Contexto | #69 añadió Engram/Codegraph opcionales, recuperación observada y hechos contrastados en briefs. | Todas las garantías de separación por proyecto, degradación y recuperación en el uso previsto. |

Evidencia de entrada: [ciclo de vida y recuperación](local-worker-lifecycle.md), [activación](activacion-por-proyecto.md), [H1 PR #2](https://github.com/iseoane/isSWF/pull/2), [contexto PR #4](https://github.com/iseoane/isSWF/pull/4), [concurrencia PR #6](https://github.com/iseoane/isSWF/pull/6), [workflow PR #8](https://github.com/iseoane/isSWF/pull/8), [calidad PR #12](https://github.com/iseoane/isSWF/pull/12) y [cuota conocida PR #20](https://github.com/iseoane/isSWF/pull/20). No hay que repetir lo ya probado solo para marcar una casilla antigua.

## Prioridad por valor aportado

| Orden | Próximo resultado útil | Qué aporta | Límite del primer corte |
| --- | --- | --- | --- |
| 1 | Observación de S01/S02: consultar iniciativas, jobs y decisiones | Permite saber qué ocurre sin perseguir logs y artefactos. | Vista de lectura y resumen del coordinador sobre los registros existentes, con antigüedad y procedencia; no otra base de estados. El panel local completo sigue pendiente de v1. |
| 2 | S01: reconciliar una entrada que cambia | Permite continuar después del bloqueo seguro ya implementado. | Conservar el brief anterior, registrar la decisión y publicar una revisión explícita; resolver un duplicado con evidencia, sin otro escritor implícito. |
| 3 | S06: recorrer una idea ambigua real | Evita implementar algo técnicamente correcto pero distinto de lo deseado. | Una idea propia, decisiones necesarias y plan con jobs aprobables; reutilizar el recorder existente y comprobar el recorrido, no crear otro planner. |
| 4 | S07: convertir una retrospectiva en una propuesta no duplicada | Convierte uso real en mejoras pequeñas y trazables. | Un hallazgo comprobado y su issue/propuesta; nunca autoaplicar cambios de reglas. |
| 5 | S05 y parte de S03: capacidad/dependencias más automáticas | Reduce coordinación manual cuando dos trabajos reales lo necesiten. | Mejorar primero la decisión y su visibilidad; una nueva cola o scheduler requiere una necesidad observada. |
| 6 | S04: recuperación tras reinicio de máquina | Protege trabajos más largos ante cortes del entorno. | Un caso propio controlado, con autorización para la interrupción y bloqueo seguro de lo incierto. |
| 7 | S08: completar garantías de contexto necesarias | Reduce pérdidas de contexto sin mezclar proyectos ni depender del servicio. | Engram/Codegraph opcionales; verificar casos concretos de separación, ausencia y recuperación. |

Las necesidades de seguridad prevalecen sobre esta prioridad de conveniencia. Antes de usar la factory en proyectos cliente deben comprobarse sus fronteras de archivos, herramientas, efectos y contexto. No se pospone esa condición para acelerar una demo.

La prioridad 1 es el siguiente corte propuesto; preparar y releer la issue #21 ya se entregó. Las demás no son una orden de construirlas todas seguidas: se reordenan cuando el uso aporte evidencia. Traducir gradualmente instrucciones operativas existentes queda como mantenimiento, no como requisito para empezar. Las instrucciones nuevas y las issues/PRs se redactan en inglés; la documentación de producto puede seguir en español.

## S01. De una issue a un brief visible

### Corte entregado

La propia factory sirvió como destino: la [issue #21](https://github.com/iseoane/isSWF/issues/21) quedó cerrada mediante la PR #25. La [evidencia de intake](https://github.com/iseoane/isSWF/blob/7678f6476501c410245d0056a1e1c5e262ff8c21/.audit/s01-80-proof.json) distingue preparación real, reutilización del mismo brief y ausencia de autorización de ejecución.

- [x] Una issue clara obtiene objetivo, alcance, aceptación y siguiente paso sin entrevista innecesaria.
- [x] La autorización confiable se distingue del texto y las etiquetas externas.
- [x] Releer sin cambios reutiliza el mismo trabajo y brief.
- [x] Un cambio de fuente, grant o propuesta conserva el primer brief y bloquea la ampliación.
- [x] El resumen muestra la observación disponible y decisiones pendientes, sin afirmar una consulta viva.
- [x] Controles públicos, una preparación propia autorizada y revisión independiente verificaron ese corte.

La PR #28 añadió `.factory/initiatives/<id>/plan.md` y jobs dentro de cada iniciativa. El tipo es un dato y no cambia el ID. El planner propone y el coordinador mantiene el plan único. El recorder local permite preparar, leer y revisar el plan con SHA esperado e historial; no ejecuta dependencias ni certifica el progreso declarado. Véase la [evidencia](https://github.com/iseoane/isSWF/blob/7678f6476501c410245d0056a1e1c5e262ff8c21/.audit/setup-81-proof.json).

El setup recoge la elección local o GitHub, manteniendo el registro local canónico y permisos remotos separados. Las etiquetas de tipo y preparación existen en el repositorio; su aplicación corresponde al coordinador dentro del grant. La detección de calidad recomienda controles no detectados sin ejecutar scripts, instalar herramientas ni fingir resultados. Los briefs antiguos no se reescriben. Estos son procedimientos y soporte acotado, no un setup CLI ni autosincronización general. El contrato de uso está en [trabajo durable](durable-work.md) y [entrada nativa](s01-intake.md).

### Pendiente de S01

La prioridad 2 resuelve el bloqueo ante cambios mediante una nueva revisión explícita. Faltan contrastar el recorrido de decisiones pendientes, la deduplicación y las resoluciones de trabajo ya existente, y vincular la observación común de prioridad 1. Cambiar un plan no reconcilia automáticamente un intake inmutable. No se reabre Python ni se duplica el estado para completar U3/U4. S01 completa conserva los criterios TRI/OPS/SEC de la especificación.

## S02. De una issue clara a una PR revisada

El caso propio de issue #1/PR #2 ya demostró implementación y entrega real. La entrada normal permite ejecutar un job de una versión fijada; no depende de completar S01 histórica. El siguiente beneficio de S02 está en hacer cómodo y consistente su uso, no en reconstruir el runner.

En prioridad 2 se propone una consulta de lectura que muestre trabajo, estado observado, última actualización, candidato, evidencias, bloqueos, decisiones y PR. El coordinador debe explicar esa misma vista y avisar de datos antiguos o indisponibles. No se duplica estado editable para una interfaz nueva. La primera consulta no elimina el objetivo de panel local de la v1 completa.

Las entregas siguen el [perfil delivery](../.agents/roles/delivery.md) y su [referencia de publicación](../.agents/roles/references/delivery.md). El perfil prepara texto; no publica ni concede permisos. El coordinador publica con el mecanismo GitHub existente solo dentro del grant. La [plantilla local](../.factory/templates/delivery.md) conserva evidencia detallada y no impone un cuerpo extenso a todas las PRs.

El formato remoto propio es conciso y en inglés: motivo, cambio, aspectos relevantes, riesgo y pruebas. Usa un visual cuando explique el comportamiento real. Mantiene checkpoints y PRs tempranas sin anunciar aceptación antes de resolver verificaciones y revisión. Un cambio tras PASS exige renovar la evidencia y revisión afectadas. El merge necesita autorización vigente y CI verde del head exacto; esa comprobación es manual en este repositorio.

Falta contrastar de forma integrada toda la experiencia de S02, incluida la continuidad general del chat. Los cortes de cese del coordinador y recuperación del proceso Pi no acreditan por sí solos todos los cierres posibles del chat ni un reinicio de máquina.

## S03. Continuar ante una cuota agotada

#66 está cerrada con el alcance aceptado por el operador. El caller investigador conserva ruta y brief fijados, presupuestos acumulativos y resultados durables. Las pruebas cubren indisponibilidad, cuota Go reconocida, incompatibilidad, agotamiento de intentos/ruta y rechazo de señales ambiguas. Véanse [guía](model-routing.md), [contrato](https://github.com/iseoane/isSWF/blob/7678f6476501c410245d0056a1e1c5e262ff8c21/.audit/fallback-66-quota-contract.json) y [revisión/evidencia](https://github.com/iseoane/isSWF/blob/7678f6476501c410245d0056a1e1c5e262ff8c21/.audit/fallback-66-quota-proof.json).

La ejecución real primaria completó una lectura con cita en la versión anterior al observer de cuota. El observer posterior se comprueba con transporte controlado; su envelope publicado es un contrato conocido, no prueba de la respuesta que emita hoy el backend migrado. No se presenta como transición real observada ni clasificador universal.

No se ampliarán ahora proveedores, códigos o dispatchers para cerrar S03 artificialmente. Los errores desconocidos bloquean y el operador decide. Los criterios de paneles y slots de MOD-07 se retoman con prioridad 5 si aparece esa necesidad. Se usan respuestas controladas para errores; no se agotan cuotas reales deliberadamente. Una nueva llamada de integración necesita su propio grant concreto.

## S04. Recuperar un trabajo interrumpido

#68 está verificada para los casos soportados de la [entrada normal](local-worker-lifecycle.md): mismo arranque, un intento original y como máximo un sucesor con revisión y grant explícitos. La [prueba de reinicio del proceso Pi](https://github.com/iseoane/isSWF/blob/7678f6476501c410245d0056a1e1c5e262ff8c21/.audit/recovery-68-environment-parent-v2.json) confirma su salida antes de consultar desde otro proceso. En la [prueba real de modelo](https://github.com/iseoane/isSWF/blob/7678f6476501c410245d0056a1e1c5e262ff8c21/.audit/recovery-68-real-parent-final.json), A001 quedó parcial por un fallo del instrumento; se revisó sin repetirlo y A002 terminó correctamente.

La [reconciliación remota](https://github.com/iseoane/isSWF/blob/7678f6476501c410245d0056a1e1c5e262ff8c21/.audit/recovery-68-effects-parent-v2.json) usa un transporte GitHub simulado y SIGKILL real del cliente, no GitHub real. La [evaluación de los cinco criterios](https://github.com/iseoane/isSWF/blob/7678f6476501c410245d0056a1e1c5e262ff8c21/.audit/recovery-68-acceptance-scope-deepseek.json) distingue esas evidencias. Identidad incierta, candidato cambiado o efecto no reconciliable bloquean sin repetir a ciegas.

La prioridad 6 aborda lo que falta: recuperar tras reiniciar la máquina, conservando artefactos y referencias de efectos. Sigue siendo un objetivo de v1, no una capacidad ya entregada ni autorización para reiniciar este entorno. No se promete backup ni exactly-once en sistemas externos.

## S05. Avanzar trabajos compatibles en paralelo

La PR #6 verificó dos trabajos offline independientes en espacios aislados y un tercero retenido hasta integrar su artefacto exacto. Un bloqueo de uno no canceló al otro. Es coordinación cooperativa, no un scheduler global ni demostración de modelos reales simultáneos.

El recorder de la PR #28 comprueba ciclos y conserva dependencias declaradas, pero no las ejecuta ni reserva capacidad. La prioridad 5 completa primero visibilidad de dependencias y capacidad. Esperar aceptación humana no equivale a mantener un intento ejecutándose ni a dar su entrega por integrada. La automatización de admisión y liberación se añade si evita una fricción observada, preservando exclusión de escritores y reservas cuando el cese sea incierto.

## S06. Convertir una idea en trabajo de producto

La prioridad 3 usa una idea real de la propia factory. Los perfiles de planificación, investigación y coordinación y el recorder de planes por iniciativa ya existen. Falta demostrar conjuntamente que se preguntan solo decisiones de producto, se contrastan hechos con las fuentes y se obtienen objetivo, exclusiones, aceptación y slices aprobables.

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

## Cierre de v1 y ampliaciones posteriores

### Pendientes de v1

La lista priorizada anterior ordena el trabajo, no reduce el contrato. Para cerrar v1 siguen pendientes:

- **Observación y continuidad:** consulta común, panel local y resumen conversacional coherentes, decisiones y antigüedad visibles, y contraste integrado de conversación mientras se ejecuta y al retomar.
- **Entrada y producto:** reconciliación de cambios, decisiones ambiguas, deduplicación y recorrido real desde una idea hasta un plan y entregas aceptables. Crear un plan con varios jobs no prueba por sí solo ese recorrido.
- **Cierre y mejora:** retrospectiva integrada con propuesta respaldada, deduplicación y reanudación sin cambiar reglas activas.
- **Dependencias y límites:** comprobar la admisión/capacidad y paneles/slots que exige MOD-07. Se construye el mínimo necesario cuando se aborde ese criterio; la coordinación cooperativa actual no lo acredita.
- **Recuperación:** caso tras reinicio de máquina y comprobaciones integradas que faltan del ciclo de conversación y efectos. Los cortes de fallo GitHub existentes son simulados; no se presentan como prueba de fallos sobre el servicio real. Cualquier prueba nueva requiere autorización concreta.
- **Contexto y seguridad:** completar los casos necesarios de separación, ausencia y recuperación de Engram/Codegraph opcionales, y comprobar fronteras de capacidades, archivos y efectos antes de usar proyectos cliente.
- **Aceptación de conjunto:** contrastar los criterios de la especificación con evidencia y limitaciones, y obtener aceptación del operador. Tener issues cerradas o CI verde no equivale a declarar la v1 aceptada.

### Fuera de v1

- PRs apiladas como capacidad general.
- Coordinación entre proyectos y múltiples operadores.
- Despliegues automáticos y servicio alojado permanente.
- Merges autónomos como permiso general. Los merges concretos autorizados en este repositorio no cambian ese límite.
- Otros runtimes o trackers. Local/GitHub es la elección de seguimiento aprobada; no una promesa de adaptadores para cualquier servicio.

### Mantenimiento y mejoras condicionadas al uso

Traducir instrucciones operativas existentes, ampliar detección de checks a otros stacks o introducir un detector de clones no son bloqueos universales de v1. Se proponen si resuelven una necesidad observada. Nuevos proveedores, clasificación universal de errores o un scheduler más amplio no se añaden para engordar la checklist. Cualquier cambio del alcance de v1 se decide explícitamente; no se pospone un criterio obligatorio llamándolo mejora opcional.

El [siguiente corte operativo histórico](next-operational-cut.md) conserva contexto de decisiones anteriores; no sustituye este orden ni es evidencia actual.
