# Visión de isSWF

Estado revisado el 14 de octubre de 2026. Esta visión conserva los acuerdos de producto y distingue los resultados comprobados en el entorno local de las capacidades aún no implementadas en el runtime de isSWF o en instalaciones de clientes. Las evidencias actuales están en [cierre del núcleo Markdown](../.audit/markdown-core-closure.md), [cierre de calidad #54](../.audit/quality-54-closure.md), [cierre de adaptación #49](../.audit/adaptation-49-closure.md), [comprobación de integración Engram](../.audit/engram-integration.json) y [comprobación del índice Codegraph](../.audit/codegraph-index-verify.json).

## Acuerdos

La factory empieza como herramienta personal para un proyecto. Podrá usarse con clientes cuando demuestre calidad. La apertura del código no es una prioridad ni un impedimento. La coordinación entre varios proyectos queda para una etapa posterior.

Pi es el entorno inicial de ejecución de agentes. GitHub es el tracker inicial para issues y PRs. El etiquetado se inspira en el triage de Matt: distingue categorías como bug o mejora y estados de preparación para triage, agente o humano. Los nombres y significados exactos de las etiquetas se concretarán antes de implementarlas.

El modelo de autorización previsto permite commits y creación o actualización de PRs draft dentro de un repositorio y encargo aprobados. La aceptación final, el merge y el despliegue siguen inicialmente en manos del usuario. En una operación anterior, el usuario autorizó y se completó el push de `origin/main` de `0d81c5f` a `5c85a38`. Esa autorización no incluye PR, merge, despliegue ni instalación. Esta tarea 63 está limitada a cambios documentales locales y no autoriza otro push.

Un coordinador mantiene la conversación con el usuario mientras los agentes ejecutan trabajos en background. Puede resumir avances, pendientes y bloqueos, y preparar nuevas features sin detener los trabajos actuales.

Cerrar la conversación no debe detener los workers mientras su entorno de ejecución siga encendido. Tras un apagado o reinicio, la factory debe poder recuperar el trabajo sin perder resultados ni duplicar acciones. La conversación y el ciclo de vida de la ejecución deben estar separados. La primera versión se ejecuta en la máquina del usuario; el funcionamiento permanente en un servidor queda para después. Este comportamiento es un requisito confirmado, no una capacidad ya implementada.

La concurrencia inicial es de dos trabajos, configurable. También hay límites configurables de reintentos y rondas de corrección. Si se agotan los destinos de modelos autorizados o el trabajo deja de progresar, queda bloqueado con un motivo visible. No se habilitan servicios con costes adicionales sin autorización.

La factory cubre el ciclo de producto y mantenimiento. Recibe ideas abiertas, features definidas, issues y bugs. Todas las entradas pasan por triage, pero no todas necesitan entrevista, diseño o TDD.

Antes de implementar debe comprobarse el código y el contexto necesario. El usuario propone un research después del triage y del brief para contrastar el encargo con la realidad. El código determina el comportamiento actual; el brief y los criterios aprobados determinan el comportamiento deseado. Una diferencia entre ambos requiere investigación y no autoriza a redefinir el objetivo para que encaje con el código.

La propuesta es hacer ese grounding obligatorio y proporcional. El propio worker puede resolverlo en cambios claros y acotados; una investigación amplia, incierta o transversal puede usar un agente investigador con skills pertinentes. Sus resultados se vinculan a una versión concreta y se incorporan al brief antes de cambiar código. Además del análisis, el research entrega un mapa de lectura para el worker con rutas reales, símbolos, rangos de líneas y motivos. Incluye contratos reutilizables, consumidores y tests pertinentes, no solo un texto de búsqueda. El worker comprueba la vigencia y abre esos puntos antes de editar. El investigador no es un implementador encubierto.

El usuario participa especialmente en la definición y la aceptación. El coordinador puede arrancar encargos claros dentro de lo autorizado. No pregunta repetidamente por cada paso ni por cada revisión si tiene criterios suficientes para decidir. Las autorizaciones necesarias para acciones sensibles no desaparecen por esa autonomía.

Cada trabajo tiene una ficha breve con objetivo, tratamiento elegido y motivo, dependencias, comprobaciones previstas y decisiones pendientes. El usuario puede corregir el tratamiento. Las dependencias bloquean los trabajos afectados, no todos los trabajos del proyecto.

Las notificaciones se reservan para decisiones que solo el usuario puede tomar, riesgos importantes y entregas listas para aceptar. Los avances ordinarios quedan disponibles en el panel y en resúmenes bajo petición.

Las entregas necesitan evidencias de comportamiento, revisión independiente y contraste con lo pedido. Las revisiones llevan criterios concretos, incluidos producto, mantenibilidad, reutilización, complejidad y comentarios. No se impone la misma batería completa a todos los trabajos.

La implementación de funcionalidades se organiza en slices verticales que entregan comportamiento funcional y verificable. No se organiza como una etapa de base de datos, seguida por API y luego interfaz. El paralelismo debe respetar las dependencias y el aislamiento de cambios.

Engram es el candidato del usuario para la memoria externa; isSWF no necesita construir su propio sistema de memoria. La comprobación real del CLI guardó o confirmó dos memorias aprobadas en el proyecto `isswf`, las recuperó y probó consultas acotadas por proyecto y una ejecución sin Engram disponible. El código actual no consume Engram en runtime: esto no demuestra integración, recuperación de trabajos ni una degradación de un consumidor inexistente. Véase el [registro de integración](../.audit/engram-integration.json).

El #62 entregó una skill de setup invocada explícitamente para reconciliar decisiones y, con autorización, actualizar valores de ruta en un `.factory/models.json` ya existente en el proyecto objetivo. Si falta ese archivo, la configuración queda pendiente: no se instala ni copia la factory, no se crea runtime y no se hacen cambios globales. La decisión de producto acordada para distribución es una instalación compartida de una versión fija, con activación explícita por proyecto; no implica copiar toda la factory a cada proyecto ni sobrescribir su `AGENTS.md`. El mecanismo de instalación/activación aún no está aprobado ni demostrado. Véase el [estado de arranque por proyecto](arranque-por-proyecto.md).

Engram y Codegraph son herramientas externas, no sistemas que isSWF reconstruya. La comprobación de Codegraph del 14 de octubre consultó un índice de 18 archivos y devolvió símbolos y código fuente; la cobertura fue parcial. No se probaron actualidad durante escrituras concurrentes, rechazo de un índice de otro proyecto ni un mapa de grounding para un encargo real. La comprobación del CLI de Engram tampoco encontró un consumidor en `isswf/` o `tests/`. Ninguna herramienta sustituye la lectura del checkout, las pruebas o la aceptación. Véanse la [comprobación del índice](../.audit/codegraph-index-verify.json) y el [registro de Engram](../.audit/engram-integration.json).

Pstack interesa por su modelo de workers y elección de skills según la casuística, no únicamente por su tratamiento de TDD. Los perfiles Markdown actuales de worker, diagnostician, reviewer y coordinator se cargan manualmente por ruta; no son roles nativos ni proporcionan autonomía completa o ejecución independiente del chat. Las pruebas del núcleo confirmaron despacho real de un worker en un fixture local y un flujo del coordinador ejecutado manualmente, no una delegación nativa autónoma. La experiencia de Gentle AI es una referencia, pero el usuario quiere menos consultas innecesarias y más criterio dentro de lo autorizado.

Las PRs deben explicar visualmente qué cambia y cómo funciona, los problemas relevantes encontrados y cómo se resolvieron. Deben destacar el riesgo de integrar el cambio. Está acordado que el runtime futuro pueda crear o actualizar PRs draft dentro del repositorio y encargo aprobados; el push autorizado de `origin/main` no demuestra publicación de PRs. El formato concreto y los criterios de cierre siguen pendientes.

Hay una retrospectiva al terminar una feature o bug completo y una revisión conjunta cuando el usuario cierra explícitamente una sesión de trabajo. Cerrar el chat no cierra el trabajo. La retrospectiva analiza posibles mejoras a `AGENTS.md`, a las skills del proyecto y al proceso de la factory. Puede generar issues pendientes de triage. Los cambios de instrucciones o skills se revisan y proponen mediante PR, no se aplican directamente a las reglas vigentes.

## Problema de entrega señalado por el usuario

El usuario relata que una feature puede acumular unas 4000 líneas sin commit ni PR. Es una experiencia reportada, no una medición de este repositorio. La factory debe evitar que el primer punto de revisión o recuperación aparezca solo al terminar toda la feature.

## Planificación, unidades de implementación y PRs encadenadas

El usuario confirma una capacidad explícita de planificación. El coordinador conserva la responsabilidad del plan, las prioridades y la autorización. Usa una skill de planificación directamente en cambios pequeños y puede delegarla a un agente planificador en trabajos amplios. El planificador no es otro jefe permanente, no implementa y no amplía el alcance autorizado.

El plan se contrasta con el grounding antes de implementar. Distingue tres tamaños: una slice entrega comportamiento funcional demostrable; una unidad de implementación es un cambio coherente y comprobable, normalmente apto para un commit pequeño; una PR agrupa una entrega revisable. No se obliga a que cada unidad sea una slice ni a que cada commit tenga una PR propia.

Cada unidad declara resultado, alcance, dependencias, comprobación y punto de commit. El plan establece checkpoints durante el trabajo, sin esperar al final de una slice para preservar progreso. No usa un límite universal de líneas ni divide funcionalidades por capas. Si una unidad crece o aparecen hallazgos materiales, el worker avisa y el coordinador reconcilia el plan antes de seguir ampliándolo. Los commits parciales se identifican como tales y no acreditan cierre técnico.

Las PRs encadenadas son una capacidad deseada y opcional, no el camino por defecto. Cada PR identifica su base y dependencia. Permiten preparar un cambio dependiente antes de integrar su predecesor, con espacios de escritura aislados. El merge sigue siendo humano y en orden. Cambiar una PR anterior obliga a reconciliar las descendientes y repetir las verificaciones y revisiones afectadas; no heredan un PASS por conservar su nombre. Los trabajos independientes no se encadenan artificialmente.

La especificación v1 actual espera código integrado y deja las PRs apiladas para después. Este acuerdo registra la capacidad deseada, pero no cambia silenciosamente ese contrato. Su inclusión en v1 o en una ampliación posterior queda pendiente de diseño y actualización explícita de la especificación y del plan.

## Primer hito y calidad mínima

El primer hito cubre una issue definida y real de la propia factory. Debe pasar por triage, recibir un brief, ejecutarse con un worker y skills pertinentes, comprobar el comportamiento, pasar revisión independiente y corregir los hallazgos bloqueantes. Las correcciones vuelven a comprobarse y se revisan las partes afectadas. La PR presenta evidencia visual cuando corresponde, los problemas relevantes y su resolución, y el riesgo de integrar el cambio.

El usuario aclara que revisión y correcciones no se dejan para una fase posterior. El mínimo reduce el alcance y el número de tipos de trabajo soportados, no la calidad exigida al trabajo que sí ejecuta. La batería concreta de revisiones depende del cambio; no se exige entrevista ni TDD por defecto.

Una PR draft puede publicarse temprano para dar visibilidad. Eso no significa que la entrega esté lista para aceptación. El cierre técnico requiere comportamiento verificado y hallazgos bloqueantes resueltos; la aceptación, el merge y el despliegue siguen siendo decisiones humanas. Un fallo de verificación o una revisión ausente no se presentan como aprobación.

En el primer hito el usuario puede observar el avance en el panel y seguir conversando con el coordinador. El paralelismo y la recuperación tras reinicios se añaden y prueban en los hitos posteriores. Son requisitos de la v1, no garantías ya entregadas por este primer corte.

## Contratos desarrollados en la especificación v1

El [borrador de especificación](spec-v1.md) desarrolla los puntos siguientes. El [plan funcional](plan-v1.md) propone cómo construirlos. Los defaults nuevos y las decisiones técnicas pendientes siguen sujetos a revisión; escribirlos no los convierte en capacidades implementadas.

- Contrato exacto para cerrar slices verificables con commits identificables y agruparlas en entregas revisables.
- Estados operativos y su relación con etiquetas de GitHub; la memoria Engram no sustituye ese estado.
- Briefs, resultados y límites de autoridad de coordinador, workers y revisores.
- Formato de PRs, severidades y condiciones de corrección o bloqueo.
- Configuración de modelos, esfuerzo, fallback, concurrencia y reintentos.
- Contrato de retrospectiva y creación de issues de mejora.
- Orden de slices para construir y usar progresivamente la propia factory.

La autoridad acordada para commits y PRs se limita al repositorio y encargo aprobados. El push autorizado y completado de `origin/main` es una operación concreta, no prueba una arquitectura de ejecución completa. Existe una primera unidad local de preparación y observación, descrita en la [guía de U1](u1-usage.md).

## Skills, agentes Markdown y delegación

Los perfiles existentes son instrucciones Markdown, no roles nativos; se seleccionan y cargan manualmente. La adaptación #49 propone selección contextual de skills y la calidad #54 añade revisiones proporcionales. #57 construyó perfiles de planificador e investigador. En el ejercicio manual, el investigador GLM high produjo hallazgos útiles pero incumplió el alcance; la validación separada con Luna no fue fallback. `.factory/models.json` registra la ruta del investigador GLM 5.3 Flash/high seguida de Luna/medium; `docs/model-routing.md` define una preselección manual y sus bloqueos, no un fallback de runtime. Una ruta configurada no demuestra disponibilidad, compatibilidad ni ejecución.

El usuario exige que la mayor parte de la factory se exprese en skills y agentes Markdown. No quiere una colección creciente de herramientas con muchos parámetros. La metodología, los perfiles, los briefs, las rúbricas y la selección adaptativa de procedimientos deben poder entenderse y cambiarse en esos archivos.

La propuesta es que el coordinador delegue mediante un brief referenciado y un perfil de agente. El brief aporta alcance, aceptación y contexto, incluido el mapa de lectura del research. El agente lee las instrucciones de su perfil y las skills pertinentes, y devuelve artefactos, evidencias, dudas y bloqueos. No recibe por defecto todo el historial de conversación ni asume el contexto de otros agentes.

El soporte de ejecución se limita a los mecanismos que necesitan estado o comprobaciones estructurales: iniciar y observar ejecuciones, preservar su estado, aislar escritores, recuperar interrupciones y aplicar límites de autorización. El procedimiento de producto no se convierte en un flujo rígido codificado. Se reutilizan las capacidades existentes de Pi, Git, GitHub y Engram cuando cumplan el contrato. La independencia del chat y la recuperación no se dan por resueltas solo por disponer de Markdown.

Los agentes ejecutan perfiles e instrucciones fijados para su encargo. Modificar una skill de la versión candidata no cambia retroactivamente las reglas de un worker activo. El número y la forma concreta de comandos de ejecución se deciden al diseñar y comprobar el runtime; no se inventa una herramienta por skill.

## Navegación y mantenibilidad

El usuario exige que tanto el código de isSWF como el que produzca para otros proyectos sea fácil de navegar. Es un criterio de calidad del diseño y de las revisiones, no solo una necesidad de documentación.

La propuesta es usar conceptos y nombres del dominio, responsabilidades con un dueño claro e interfaces que oculten complejidad real. Evitar wrappers de paso, capas especulativas, helpers duplicados, estado oculto y cambios que obliguen a perseguir un comportamiento por archivos sin responsabilidad clara.

Los revisores deben poder explicar dónde vive un comportamiento, de dónde viene su estado, quién lo cambia y dónde se comprueba. Un cambio que funciona pero introduce complejidad evitable necesita corregirse o justificarse. Los checks deterministas se concretan según el stack del proyecto; no se impone una arquitectura universal ni un límite de líneas como sustituto de la comprensión.

La documentación de entrada debe ser breve y señalar código, pruebas y contratos reales. En proyectos existentes se respetan sus convenciones y se señalan problemas concretos, sin reorganizar el repositorio gratuitamente. Estos criterios se aplican a la primera unidad local de isSWF. Sus pruebas y revisión tienen el alcance indicado en la [guía de U1](u1-usage.md); no acreditan la calidad de una factory completa.

## Configuración de modelos y esfuerzo

El usuario pide configuración explícita de modelo y esfuerzo por rol. `.factory/models.json` es ahora la fuente central de rutas configuradas y `docs/model-routing.md` su guía de interpretación manual; esto no implica resolver rutas en runtime.

La propuesta es disponer de valores por defecto y overrides por rol, y permitir excepciones explícitas por encargo. La factory registra modelo, proveedor, esfuerzo y configuración efectiva de cada ejecución. Cambiar los valores por defecto no altera retroactivamente trabajos en curso.

La selección de skills del worker y la configuración de su modelo son responsabilidades distintas. Usar varias skills no significa lanzar un agente nuevo para cada una. Los paneles de revisión o exploración pueden configurar varios participantes con modelos y esfuerzos propios.

El usuario aprobó rutas ordenadas de tuplas modelo/esfuerzo por rol. Los valores actuales están en `.factory/models.json`; no hay default de proyecto ni aliases de cuenta configurados. Pertenecer a la ruta no otorga autorización ni prueba disponibilidad.

Los niveles de esfuerzo dependen del modelo y del proveedor. Antes de ejecutar, la factory debe comprobar que cada combinación existe y es compatible. El avance por una ruta solo está especificado como interpretación manual: requiere indisponibilidad o cuota agotada confirmadas, reconciliar el writer anterior, autorización total vigente y validar la siguiente tupla. #60 probó casos controlados manualmente, no un resolver ni un fallback automático. No debe introducir un destino no configurado, cambiar silenciosamente la calidad requerida ni eliminar revisiones obligatorias.

Un test fallido o una solución incorrecta no son motivos por sí solos para cambiar de proveedor. Si todos los destinos se agotan, el trabajo queda bloqueado y se comunica. Para retomar un trabajo parcial con otro destino, debe confirmar que el escritor anterior ya no actúa, recuperar los artefactos y comprobar las operaciones ya realizadas antes de repetirlas. Las credenciales permanecen fuera de la configuración versionada del proyecto. Se han acordado límites configurables de reintentos y bloqueo visible al agotarlos, y la prohibición de activar costes adicionales sin autorización. Los valores concretos y los tiempos de espera se fijarán en la especificación.

## Secuencia de trabajo acordada

#55–62 están terminados dentro de sus límites documentados. #55 formalizó documentos durables: paths explícitos de spec/plan y jobs bajo `.factory/jobs/`, con ownership y referencias fijadas; no una base operativa, backup, runtime ni garantía de recuperación. #57 creó perfiles Markdown; #58–60 ejercitaron manualmente instrucciones y configuración; #61 fue una demo supervisada; #62 entregó la skill de setup, no un instalador. La [especificación v1](spec-v1.md) no cambia por estos cierres.

La secuencia siguiente es: reconciliar el estado y decisiones; preparar activación mínima por proyecto y diseñar **aislamiento técnico** antes de implementar #44; diseñar y probar aparte el ciclo de vida independiente del chat; obtener el grant de un encargo real para intentar demostrar H1/PR; abordar después fallback, recuperación, concurrencia e integraciones, y dejar traducción operativa y pasadas profundas para más adelante. El aislamiento de cliente es un prerequisito duro y no está demostrado. #61 no acredita H1, aceptación de producto, OPS-03 a OPS-06, independencia del chat, recuperación ni fallback automático; #62 no instala ni activa una factory.

El [siguiente corte operativo](next-operational-cut.md) concreta la propuesta de activación fijada y el diseño de aislamiento mínimo; su alcance y sus bloqueos no equivalen a autorización de implementación.

## Uso progresivo para construir la propia factory

El usuario quiere usar isSWF durante su propia implementación conforme disponga de capacidades funcionales. Las primeras entregas históricas se apoyaron en Pi, Pstack y skills disponibles. Los ejercicios #57–61 no demuestran todavía transferencia operativa autónoma a isSWF; esa transición depende de capacidades verificadas y del aislamiento requerido.

El primer hito mínimo está definido arriba. U1 y U2 son unidades históricas locales implementadas con el CLI Python, no una arquitectura objetivo ni requisito de los contratos Markdown. U3 y U4 siguen pendientes. S01 y S02 no están completas, y H1 no se ha demostrado: #61 fue una demo local supervisada, no una PR real ni una prueba de independencia del chat en runtime. El orden detallado de slices y la transferencia de responsabilidades se concretarán en la especificación v1. Como propuesta de seguridad, la versión que ejecuta trabajos permanece estable mientras se construye y verifica una versión candidata. Una propuesta de mejora de las reglas no se aplica retroactivamente a workers en curso. Un fallo del prototipo no debe impedir volver al flujo de apoyo existente.

## Método de investigación

El usuario pide comprender los mecanismos de las referencias, especialmente la composición de agentes y skills de Pstack. Un catálogo de skills o una lectura de README no basta para elegir la base de la factory. Las conclusiones deben trazar contratos, carga de instrucciones, contexto transmitido, autoridad y retorno, distinguiendo recomendaciones de garantías comprobadas.

## Referencias

El contraste de Zazencodes, Matt Pocock, Pstack original y port, Addy Osmani y Gentle AI está en [referencias.md](research/referencias.md). Pi y GitHub están elegidos para la primera versión. Los contratos de trabajo se desarrollan en el [borrador de especificación](spec-v1.md). Quedan por elegir y probar el mecanismo de ejecución local independiente del chat, la persistencia operativa y el aislamiento.
