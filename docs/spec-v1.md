# Especificación funcional v1 de isSWF

Estado: borrador para revisión. Este documento especifica comportamiento futuro; no describe una factory ya implementada ni autoriza su implementación.

La [visión](vision.md) recoge los acuerdos del usuario. Esta especificación concreta sus contratos. Los defaults nuevos están identificados como propuestas. El [plan de construcción](plan-v1.md) ordena las slices; el [glosario](../GLOSSARY.md) fija sus términos.

## Alcance

La v1 permite a un operador gestionar un proyecto local con Pi y GitHub. Recibe ideas, issues definidas y bugs, aplica triage y ejecuta trabajos con procedimientos proporcionales. Mantiene al coordinador disponible mientras los workers actúan.

Incluye un panel local, trabajos aislados, revisiones y correcciones, PRs visuales, modelos y esfuerzo por rol, fallbacks aprobados, dependencias, recuperación y retrospectivas. Se propone Engram como integración de memoria externa, condicionada a comprobar separación por proyecto y recuperación; isSWF conserva su propio estado operativo.

Quedan fuera de v1 la coordinación entre proyectos, múltiples operadores, despliegues automáticos, merges autónomos, servicio alojado permanente y soporte para otros runtimes o trackers. No se construye una memoria alternativa a Engram.

## Skills, agentes y runtime mínimo

La metodología de isSWF vive principalmente en skills y perfiles de agentes Markdown. Los procedimientos de triage, grounding, implementación, revisión, corrección y retrospectiva son instrucciones componibles, no ramas de un pipeline rígido en código.

Un perfil define la responsabilidad, instrucciones de entrada, límites y forma del resultado de un agente. Las skills aportan procedimientos y referencias cuando el trabajo los necesita. El brief especializa ese perfil para el encargo. El catálogo anuncia qué está disponible; los cuerpos se leen cuando corresponden.

El runtime aporta los mecanismos de ejecución que las instrucciones no pueden demostrar por sí solas: mantener workers independientes del chat, conservar ejecuciones e intentos, aislar escritores, comprobar referencias de resultados y recuperar interrupciones con límites de autorización. La política exige evidencia; el runtime comprueba sus condiciones estructurales sin pretender decidir el valor del producto.

Se reutilizan Pi, Git, el CLI de GitHub y Engram. Una integración nueva se justifica por una capacidad ausente o una comprobación que no puede conseguirse de forma fiable con lo existente. No se envuelve cada comando de Git o GitHub ni se crea una herramienta por skill.

El formato técnico y los comandos exactos se eligen después de comprobar el diseño. La interfaz conceptual de delegación recibe una referencia de trabajo; el runtime resuelve su brief, perfil y configuración. No obliga al coordinador a repetir modelo, effort, repositorio, rama, rutas, herramientas y reglas en una llamada con decenas de parámetros.

### Cómo se delega

1. El coordinador crea o actualiza el brief, verifica la autorización y declara el resultado esperado.
2. Selecciona un perfil y un procedimiento proporcional. Añade referencias a contexto, mapa de lectura, contratos y evidencias previas cuando existen.
3. La ejecución fija la versión de instrucciones y configuración. Resuelve el destino de modelo y esfuerzo, y da al escritor un espacio exclusivo.
4. El agente abre su perfil, brief y las referencias necesarias. Carga las skills pertinentes; no recibe toda la conversación ni presupone acceso al contexto de sus hermanos.
5. El agente entrega artefactos, evidencia, dudas y bloqueos mediante un resultado referenciado. Puede elegir técnicas dentro del alcance; una nueva decisión de producto vuelve al coordinador.
6. El coordinador comprueba el resultado, conserva el estado operativo y decide el siguiente paso. Un informe del worker no equivale a cierre técnico.

La ejecución background permite al coordinador seguir conversando, preparar otros encargos y consultar avances. No hace falta mantener una conversación abierta dentro de cada worker.

Los perfiles mínimos distinguen coordinación, investigación, ejecución, revisión y retrospectiva. Una especialidad puede ser una rúbrica o skill del perfil existente; solo se separa en otro agente cuando aporta contexto independiente, aislamiento o trabajo realmente paralelo.

El worker no crea una cadena de subagentes sin control. Si el procedimiento necesita exploradores, candidatos o un panel, el coordinador los registra como ejecuciones con contexto, límites y resultados propios. Eso no requiere una herramienta diferente para cada especialidad.

Un investigador pasa análisis y mapa de lectura al worker mediante referencias. Un revisor recibe candidato, encargo y rúbrica en contexto independiente. El coordinador recibe sus resultados y resuelve discrepancias sin convertir al implementador en su propio revisor.

- `AGT-01`: delegar un trabajo usa su referencia y resuelve instrucciones y configuración sin duplicarlas en el prompt.
- `AGT-02`: el worker conoce alcance, aceptación y contexto sin necesitar la conversación completa del operador.
- `AGT-03`: una especialidad que puede expresarse como skill no exige una herramienta nueva.
- `AGT-04`: una modificación de skills no cambia el contrato de una ejecución en curso.
- `AGT-05`: llamar reviewer a un perfil no acredita aislamiento; sus capacidades y candidato efectivo deben comprobarse.

## Grounding antes de implementar

El código es la fuente del comportamiento actual, no una justificación automática de que ese comportamiento sea correcto. El brief y los criterios aprobados expresan el objetivo. Cuando no coinciden, se investiga la diferencia antes de cambiar código o alcance.

El recorrido de un cambio empieza con triage y un brief, seguido por grounding del código y del contexto necesario. El brief se reconcilia con los hallazgos antes de implementar. Triage puede incluir una exploración preliminar; no es necesario repetirla si sigue siendo suficiente y vigente.

El grounding comprueba dónde vive el comportamiento, qué existe ya, qué helpers y contratos se deben reutilizar, cómo se verifica y qué dependencias o riesgos aparecen. Para un bug comprueba la reproducción y distingue causa confirmada de hipótesis. Las fuentes externas se consultan cuando son necesarias, priorizando documentación oficial.

Todo cambio de código necesita grounding, pero no todo cambio necesita un agente investigador separado. El worker puede hacerlo para un cambio claro y acotado. El coordinador delega una investigación amplia, incierta o transversal sin bloquear la conversación del usuario. Un researcher puede usar skills de arquitectura, diagnóstico, historia o fuentes según el encargo; no tiene un procedimiento único obligatorio.

El resultado identifica la base y el área explorada, hallazgos con evidencias, opciones pertinentes, comprobaciones disponibles y preguntas no resueltas. Se entrega mediante artefactos referenciados, no solo en el chat. No es un transcript de comandos ni un volcado del código encontrado.

Su parte operativa es un mapa de lectura ordenado para el worker. Cada entrada incluye la revisión examinada, ruta real, símbolo cuando exista, rango de líneas y motivo de lectura. Distingue código a entender, helper o contrato a reutilizar, consumidores afectados, tests y comprobaciones. Señala qué debe leerse antes de modificar y qué sirve de contexto adicional.

El análisis explica el comportamiento y las relaciones entre esas entradas, y distingue hechos observados de hipótesis. Las referencias apuntan también al contexto que contiene las invariantes; no se recorta un fragmento hasta ocultar sus precondiciones.

El worker usa el mapa para ir directamente a los puntos relevantes y abre el código antes de editar. Comprueba que las referencias correspondan a su base efectiva. Si el código cambia, localiza de nuevo los símbolos y reconcilia los hallazgos afectados; no aplica rangos antiguos como instrucciones de edición. Una diferencia material vuelve al coordinador o al investigador según su alcance.

Una investigación no autoriza cambios de producto ni un fix fuera del alcance. Si revela una decisión de producto, vuelve al usuario. Si solo aclara un hecho técnico, el coordinador ajusta el brief dentro de la autorización existente. Las reproducciones y pruebas respetan los permisos del proyecto y no actúan sobre producción sin autorización.

- `GND-01`: una petición ya implementada se identifica con evidencia antes de crear otra implementación.
- `GND-02`: un bug conserva el comportamiento esperado aunque el código actual haga otra cosa.
- `GND-03`: un cambio de base invalida los hallazgos afectados y obliga a reconciliar el contexto.
- `GND-04`: una investigación sin información suficiente no produce un encargo listo para implementar.
- `GND-05`: un cambio pequeño puede pasar de grounding inline a implementación sin entrevista ni researcher adicional.
- `GND-06`: el resultado de research permite abrir directamente código, contratos, consumidores y tests mediante un mapa con rutas, símbolos, rangos y motivos.
- `GND-07`: mover líneas o cambiar la base no hace que el worker edite un fragmento distinto; reubica y comprueba el contexto antes de actuar.

## Contrato de entrega

### Cierre técnico y aceptación

Una entrega supera el cierre técnico cuando cumple el encargo vigente, tiene evidencia de comportamiento y ha pasado las revisiones requeridas. No puede tener hallazgos bloqueantes abiertos. El worker no puede certificar por sí solo su propia revisión independiente.

La aceptación humana se refiere a una entrega y revisión concretas. No equivale a merge ni despliegue. Si el candidato cambia después de aceptar, la aceptación técnica anterior deja de cubrirlo y se vuelve a comprobar lo afectado.

Una PR draft puede publicarse tras el primer commit verificable. No se anuncia como entrega lista. El coordinador puede proponerla para revisión humana tras el cierre técnico, pero no hace merge ni despliega.

No hay una entrevista, un documento de diseño o TDD obligatorios para cada cambio. Sí hay criterios de éxito, verificación pertinente y revisión independiente para todo cambio de código que se entregue. Los trabajos de investigación entregan evidencia y conclusiones, no una PR ficticia.

### Slices, commits y tamaño de entrega

Cada slice de una funcionalidad entrega un comportamiento acotado que se puede demostrar. Su aceptación no se expresa como terminar una capa técnica.

Antes de ampliar el alcance de un trabajo, el worker deja comprobado y commiteado el comportamiento de la slice actual. Registra las verificaciones y avanza la PR draft correspondiente cuando procede. Un commit de recuperación no demuestra que la slice esté cerrada.

Cada trabajo declara una cadencia máxima de checkpoints de avance, que se calibra en el diseño técnico y queda visible en el brief. También hay checkpoint al bloquearse, antes de una suspensión controlada o de cambiar de subobjetivo. No se espera al fin de una slice para preservar progreso. Se inspeccionan diff, alcance y comprobaciones: si la unidad creció más allá de un resultado revisable, se subdivide antes de seguir añadiendo código.

Si aún no existe un comportamiento verificable, se conserva un commit identificado como trabajo parcial, con comprobaciones pendientes o fallidas y sin secretos. Puede abrirse o actualizarse una PR draft que indique ese estado. No obtiene cierre técnico ni desbloquea dependencias. Una interrupción abrupta se recupera desde archivos y estado disponible; los checkpoints reducen pérdida y acumulación, no garantizan que toda escritura esté commiteada.

Las PRs agrupan cambios coherentes y revisables. Una slice no exige una PR exclusiva. Una feature grande tampoco justifica aplazar toda la revisión hasta una PR gigante. El coordinador decide la agrupación antes de ejecutar y la revisa si el trabajo crece.

En v1 las dependencias de código usan como base la versión integrada por el humano. Las PRs apiladas son una extensión posterior, no una autorización implícita para consumir contratos sin integrar.

No se establece un límite universal de líneas. Si una unidad no puede explicarse y verificarse como un resultado concreto, se subdivide antes de continuar. Los refactors mecánicos amplios necesitan una secuencia específica con estados comprobables; no se fuerzan a parecer una funcionalidad vertical.

### Revisión y correcciones

El tratamiento del trabajo declara las revisiones necesarias y su motivo. El mínimo de una entrega de código combina contraste con el encargo y calidad de ingeniería en un contexto independiente del implementador. Puede ser un revisor con ambas rúbricas; no obliga a lanzar un agente por cada criterio.

Las revisiones adicionales se activan por el cambio:

| Cambio | Comprobación adicional |
| --- | --- |
| Interfaz de usuario | Uso real, resultado visual y accesibilidad pertinente. |
| Datos, permisos, secretos o entradas externas | Riesgos de seguridad y pérdida de datos. |
| Contrato compartido, concurrencia o integración | Consumidores afectados, invariantes e integración. |
| Objetivo de rendimiento | Medición relevante, condiciones y límites de la evidencia. |
| Reestructuración o complejidad creciente | Navegabilidad, ownership, abstracciones y helpers canónicos. |
| Cambio de comportamiento documentado | Documentación y terminología que deban actualizarse. |

El revisor recibe el encargo, el candidato exacto, su base, las normas del proyecto y las evidencias. Devuelve hallazgos con ubicación, razonamiento y severidad, o un resultado explícito sin hallazgos. Un fallo de ejecución del revisor no es un resultado sin hallazgos.

Las severidades funcionales son `blocking`, `suggestion` e `information`. Las preferencias de estilo no se convierten en bloqueantes sin una norma o un problema demostrado.

El coordinador clasifica cada hallazgo como corregir, descartar con motivo o pedir decisión. No acepta automáticamente todas las recomendaciones del revisor. Tampoco descarta fallos objetivos solo para terminar.

Las correcciones conservan el alcance. Después se repiten las comprobaciones y revisiones afectadas. Un cambio de objetivo exige autorización nueva, no editar la spec para justificar lo implementado.

Los informes se vinculan a la revisión del encargo, base y candidato comprobados. Antes de entregar, una diferencia en código, base, contratos o evidencia invalida los resultados afectados. Un cambio de código exige nueva revisión del candidato; no se reutiliza un PASS por el nombre de la rama.

Si falta una revisión requerida, su resultado es inconcluso o se agota el límite de correcciones, el trabajo queda bloqueado. No se elimina el requisito ni se anuncia listo para humano.

### PR visual y riesgo

La descripción de PR es un resumen revisable, no el transcript de los agentes. Incluye estos elementos:

1. Motivo y resultado observable, con referencia al encargo.
2. Visual mínimo útil: captura antes y después, flujo, esquema o diff conceptual según el cambio.
3. Alcance incluido y exclusiones relevantes.
4. Evidencias ejecutadas, resultados y enlace a los artefactos más extensos.
5. Problemas relevantes y resolución, si explican una decisión o un riesgo residual.
6. Riesgo de integración, mitigación y reversibilidad.

El riesgo indica quién puede verse afectado, qué podría fallar, qué se comprobó y qué sigue sin comprobarse. Distingue corregir código de revertir efectos como una migración de datos. Un color o la palabra bajo no bastan.

La reversión se describe como un procedimiento cuando es conocida. Si no se ha probado, se indica; no se anuncia rollback seguro por defecto. Los cambios de alto impacto no pierden severidad por ser pequeños.

Los problemas resueltos no se inventan para rellenar una sección. Los logs, capturas y artefactos públicos se revisan para no publicar secretos o datos de clientes.

### Escenarios de aceptación de la entrega

- `DEL-01`: una issue clara produce una entrega verificada, revisión independiente y PR con alcance, evidencias y riesgo.
- `DEL-02`: un bloqueante provoca corrección y nuevas comprobaciones; no hay entrega lista antes de resolverlo.
- `DEL-03`: una nueva revisión del código invalida el PASS anterior y no hereda aceptación humana.
- `DEL-04`: un reviewer indisponible bloquea el cierre sin omitir la revisión.
- `DEL-05`: una PR draft temprana muestra trabajo en curso, no aprobación.
- `DEL-06`: una segunda slice no amplía el trabajo sin dejar cerrada técnicamente y commiteada la anterior; los checkpoints preservan y muestran trabajo parcial sin esperar al final ni anunciarlo como entrega.
- `DEL-07`: una investigación de solo lectura puede cerrarse con evidencia sin cambios de código ni PR.

## Retrospectiva y mejora

La retrospectiva es una skill con un perfil de análisis, no una herramienta nueva. Se ejecuta al cerrar una feature o bug completo y cuando el operador cierra explícitamente una sesión de trabajo. No se dispara al cerrar una ventana de chat ni tras cada respuesta del worker.

El cierre de sesión registra también trabajos pendientes. No los cancela, no los declara completos y no bloquea sus ejecuciones. Una revisión conjunta analiza solo la actividad transcurrida desde la retrospectiva anterior y enlaza hallazgos ya registrados.

Sus entradas son briefs, decisiones, mapa de lectura, resultados, revisiones, correcciones y eventos del trabajo. Los transcripts solo se consultan si aportan evidencia necesaria y pertenecen al proyecto y sesión autorizados.

Cada candidato de mejora tiene problema observado, evidencia, impacto, destino y una forma de comprobar si la mejora funciona. Se distinguen problemas del proyecto de problemas del proceso de la factory. Una anomalía aislada puede justificar una issue, pero no una regla general sin evidencia suficiente.

Se prioriza eliminar el error con estructura, tipos o comprobaciones automatizadas cuando sea viable. Las instrucciones y skills se ajustan para decisiones de criterio. No se llena AGENTS.md de reglas que un check puede hacer cumplir.

El coordinador busca duplicados antes de crear una issue. Las propuestas nuevas se registran como `needs-triage`, con su origen y evidencia. No se convierten automáticamente en encargos autorizados. El repositorio destino debe estar autorizado; si no lo está, se conserva la propuesta local y se solicita esa decisión.

Una modificación de instrucciones o skills usa el proceso normal de brief, grounding, revisión y PR. Necesita un caso representativo antes y después que demuestre el comportamiento buscado, además de validar el formato cuando haya un validador. El merge sigue siendo humano.

Los workers activos conservan las instrucciones con las que empezaron. Una candidata de la factory o de sus skills no reemplaza la versión estable durante el trabajo que la está construyendo. Si la retrospectiva falla, su estado queda pendiente con motivo; no invalida una entrega técnicamente correcta ni se marca retrospectiva realizada.

- `RET-01`: cerrar una sesión con un worker activo registra su estado y no lo cancela.
- `RET-02`: un problema respaldado por evidencia crea una propuesta o issue pendiente de triage, no una ejecución automática.
- `RET-03`: analizar de nuevo el mismo problema enlaza la issue existente en vez de duplicarla.
- `RET-04`: una propuesta de cambio en skills no altera workers en curso ni modifica reglas sin PR.
- `RET-05`: una retrospectiva fallida queda pendiente y se puede retomar sin repetir issues ya creadas.

## Modelos, effort y límites de ejecución

### Configuración efectiva

Existe una configuración legible del proyecto para defaults, perfiles y excepciones de un trabajo. No contiene credenciales. Su formato y ubicación física se eligen en el diseño técnico; la configuración no se multiplica en parámetros de herramientas.

Cada perfil declara una ruta ordenada: destino inicial y fallbacks aprobados. Cada destino indica proveedor, identificador de modelo, effort compatible o uso explícito del valor por defecto del proveedor, y autorización de coste. OpenCode Go y OpenAI son proveedores deseados; los identificadores reales se comprueban en Pi antes de configurarlos.

La precedencia es excepción explícita del trabajo, perfil elegido y default del proyecto. Una ruta se reemplaza como unidad; no se combina el modelo inicial de un override con fallbacks de otra configuración. Las excepciones no amplían automáticamente los proveedores o costes autorizados.

La ejecución conserva la configuración efectiva y las versiones de perfil, skills y brief. Cambiar defaults afecta a nuevas ejecuciones, no a intentos activos. El operador puede aprobar una configuración nueva para reanudar un trabajo bloqueado; queda registrada como un intento nuevo.

Los perfiles cubren coordinador, investigador, worker, revisor y retrospectiva. Un perfil de worker puede diferenciar bugs y features. Los paneles declaran sus participantes y rutas; usar varias skills no cambia por sí mismo de modelo ni crea nuevos agentes.

### Fallos y fallback

| Condición | Respuesta |
| --- | --- |
| Cuota o capacidad de uso agotada | Avanzar al siguiente destino aprobado, sin insistir sobre la cuota agotada. |
| Fallo temporal de transporte o disponibilidad | Aplicar reintentos acotados y después avanzar al siguiente destino aprobado. |
| Credenciales inválidas, configuración incompatible o permiso denegado | Bloquear con diagnóstico; no buscar credenciales ni ampliar permisos. |
| Test fallido, hallazgo de revisión o implementación incorrecta | Resolver dentro del trabajo; no es una señal de cuota ni un motivo automático de fallback. |
| Resultado sin evidencia o salida incompleta | No cerrar la fase; recuperar o bloquear conforme a los límites de intentos. |
| Todos los destinos agotados | Bloquear con los destinos y causas observadas. |

Antes de cambiar de destino se confirma que el intento anterior ya no puede escribir. Se reconcilian artefactos, commits y efectos conocidos, y se entrega al nuevo agente un brief de reanudación con referencias. No se confunde salir del proceso con no haber realizado cambios.

La ruta alternativa preserva la responsabilidad y los requisitos de verificación. No puede sustituir un revisor por el implementador ni convertir una revisión obligatoria en opcional. No se introducen modelos fuera de la cadena aprobada para terminar antes.

Las limitaciones del modelo se validan antes del intento: existencia, acceso, capacidades necesarias y effort soportado. Un modelo que no cumple el contrato se señala como configuración incompatible; no se transforma silenciosamente high en otro nivel.

### Límites propuestos

El límite inicial aprobado es de dos trabajos concurrentes, configurable. Los trabajos esperando al humano o bloqueados no consumen un slot de ejecución cuando no tienen un intento activo. Si la detención de un intento es incierta, su reserva de espacio y su capacidad potencial se conservan hasta comprobar el cese; marcar el trabajo bloqueado no acredita que su proceso haya parado.

Como defaults nuevos para revisar se proponen dos ejecuciones delegadas simultáneas además del coordinador, un reintento temporal por destino y dos rondas de corrección tras la revisión inicial. Los paneles usan los mismos slots; no multiplican el límite por rol. Un trabajo que espera otra ejecución no conserva innecesariamente un slot.

Cada ejecución tiene un timeout de actividad definido por el perfil y un límite total de intentos que no se reinicia al cambiar de proveedor. Los valores de timeout se calibran con casos reales en el diseño técnico. Un silencio del modelo no basta para declarar que se ha detenido: primero se comprueba su ejecución.

Repetir un ciclo sin nuevo commit, evidencia, hallazgo resuelto o información útil detiene la ampliación del trabajo y produce un bloqueo. Los límites no se resetean automáticamente para ocultar un bucle. El coordinador mantiene la conversación disponible y explica el estado.

Los servicios con costes adicionales permanecen deshabilitados salvo autorización específica. No se interpreta contratar una suscripción como autorizar gasto API fuera de ella. Si existe autorización de coste, necesita un tope y la ejecución debe poder comprobarlo; si no puede, bloquea ese destino.

El panel muestra destino actual, motivo de fallback, número de intento y límites consumidos. Expone las unidades que el proveedor realmente ofrece; no convierte estimaciones de tokens en un saldo exacto de suscripción.

- `MOD-01`: cada rol usa su ruta y effort efectivos sin que la llamada de delegación los repita.
- `MOD-02`: una cuota agotada produce fallback autorizado y deja visible el motivo.
- `MOD-03`: un fallo de tests no cambia de proveedor por sí solo.
- `MOD-04`: una combinación modelo y effort incompatible bloquea antes de ejecutar.
- `MOD-05`: cambiar defaults no altera un worker activo; reanudar con otra configuración crea un intento registrado.
- `MOD-06`: agotar la cadena o los intentos bloquea sin eliminar revisiones ni activar costes extra.
- `MOD-07`: un panel respeta el límite global de ejecuciones y puede usar slots sucesivos sin deadlock.

## Navegabilidad y calidad del diseño

Estos criterios se aplican al código de isSWF y a los proyectos que produce. En un proyecto existente prevalecen sus convenciones documentadas; una reorganización necesita justificar un problema concreto y entrar en el alcance aprobado.

Un lector puede localizar el comportamiento, sus contratos, el estado que usa y las pruebas que lo verifican sin recorrer una cadena de wrappers de paso. La responsabilidad de cambiar un dato tiene un dueño identificable. Los nombres mantienen el vocabulario del dominio.

Cada nueva abstracción debe ocultar complejidad real o aislar una variación existente. Una interfaz preventiva para una segunda implementación imaginaria no se considera mejora por sí sola. Se reutilizan helpers canónicos cuando hacen el trabajo; no se fuerza a compartir comportamientos distintos solo porque su código se parece.

El revisor cuestiona duplicación, estado sincronizado manualmente, capas que repiten los mismos argumentos, dependencia circular y condiciones de una feature dispersas sin necesidad. Una complejidad evitable se corrige o se justifica con el contrato y sus restricciones.

La documentación de entrada es breve y señala dónde encontrar comportamiento, pruebas, configuración y decisiones. Los estándares mecánicos se comprueban con las herramientas del stack cuando existan. Las referencias no se convierten en copias manuales de todos los archivos ni en una segunda fuente de configuración.

Los perfiles y skills Markdown también se revisan por navegabilidad: responsabilidad clara, triggers específicos, pasos observables, referencias válidas y criterios de finalización. El worker carga lo necesario, no toda la biblioteca. Una skill nueva requiere una necesidad distinta de las existentes y un ejemplo que pruebe su utilidad.

El tamaño de un archivo es una señal para inspeccionar, no una medida de comprensión. No se aprueba una entrega por tener muchos archivos pequeños ni se rechaza únicamente por un número de líneas.

- `NAV-01`: el grounding y la PR permiten encontrar el comportamiento y sus pruebas en rutas reales.
- `NAV-02`: duplicar un helper canónico o añadir un wrapper sin función concreta produce un hallazgo razonado.
- `NAV-03`: un cambio de una regla operativa se realiza en su fuente y no exige sincronizar copias ocultas.
- `NAV-04`: el código y las skills nuevos usan nombres coherentes con el dominio y referencias que se pueden abrir.
- `NAV-05`: la demostración de una slice incluye explicar el camino de entrada, decisión, efecto y comprobación sin un mapa ficticio.

## Entrada, triage y brief

El coordinador admite ideas, bugs, tareas de mantenimiento e issues existentes. El triage determina objetivo, información disponible, duplicados, comportamiento ya existente, riesgo y dependencias. Propone camino corto, investigación o definición de producto según las incertidumbres; no pide permiso para cada comprobación ya autorizada.

Se propone una categoría principal (`feature`, `bug`, `maintenance` o `research`) y un estado de preparación: `needs-triage`, `needs-info`, `ready-for-agent` o `ready-for-human`. Las etiquetas concretas se revisan contra las del repositorio antes de instalarlas. `ready-for-human` lleva un motivo: decisión de producto o aceptación de entrega. Las etiquetas no sustituyen el estado operativo ni conceden permisos.

Una entrada conserva su referencia externa y un identificador local estable. Releerla reconcilia el trabajo existente; cambiar el alcance genera una nueva revisión del brief, no otro escritor implícito. Duplicados, peticiones ya resueltas y descartes tienen motivo y evidencia.

El brief mínimo contiene objetivo observable, alcance y exclusiones, aceptación, referencia de origen, repositorio y base, autorización vigente, dependencias y condiciones de desbloqueo, riesgo conocido y referencias de contexto. Declara procedimiento y revisiones necesarias, configuración efectiva, límites de ejecución y cadencia de checkpoints. La investigación puede completar hechos pendientes; la implementación no comienza con decisiones de producto imprescindibles sin resolver.

El resultado de una ejecución identifica trabajo e intento, revisión del brief, base y candidato cuando exista, artefactos y comprobaciones con resultados, hallazgos, incertidumbres y bloqueo o siguiente paso recomendado. Un texto “terminado” no es evidencia. El contrato diferencia éxito del proceso, resultado técnico y aceptación del producto.

- `TRI-01`: una issue clara obtiene categoría, preparación, brief y aceptación sin entrevista innecesaria.
- `TRI-02`: una incertidumbre imprescindible queda visible y no inicia implementación como si estuviera resuelta.
- `TRI-03`: etiquetas o instrucciones de una issue no conceden autorización.
- `TRI-04`: releer la entrada no duplica trabajos activos ni encargos autorizados.
- `TRI-05`: un duplicado o comportamiento ya existente se resuelve con referencia y evidencia, no con una PR artificial.

## Estado operativo, conversación y panel

El estado operativo tiene una única autoridad de escritura en el mecanismo de ejecución. Los agentes reportan resultados; el coordinador solicita transiciones y explica su significado. GitHub y el panel son vistas reconciliables, no bases independientes que deban sincronizarse manualmente.

Se distinguen trabajos en cola, en ejecución, bloqueados, pendientes de aceptación, aceptados pendientes de integración, completados y cancelados. Estos estados describen disponibilidad y cierre, no obligan a pasar por entrevista, TDD o una lista fija de agentes. La fase y actividad actuales son información adicional del procedimiento elegido.

Un trabajo autorizado entra en cola. Empieza cuando tiene dependencias satisfechas y capacidad disponible. Un fallo recuperable crea un intento nuevo dentro de límites; una incertidumbre o requisito incumplido produce un bloqueo con motivo, responsable de resolverlo y condición de salida. Solo vuelve a cola después de resolver o revisar ese requisito. El cierre técnico lleva a aceptación humana cuando corresponde. Una entrega de código se completa tras aceptación e integración humana confirmada; una investigación aceptada no requiere merge. La aceptación identifica candidato y brief, y caduca si cambia lo que cubría.

Cancelar impide nuevas acciones y solicita detener los intentos activos. No se declara detenido hasta comprobarlo. Los efectos realizados permanecen registrados; cancelar no promete revertir datos ni borrar una PR. Cambiar prioridades no interrumpe silenciosamente otro trabajo.

El panel local muestra trabajos y dependencias, actividad, última actualización, base/candidato, evidencias, bloqueos, decisiones humanas, PRs, modelo e intentos. Su primera función es observación; las órdenes pasan por el coordinador. El resumen conversacional usa el mismo estado, distingue hechos de estimaciones y avisa de información desactualizada. No afirma progreso porque haya pasado tiempo.

El operador puede preguntar cómo va, preparar otra feature o cambiar prioridades mientras los workers siguen. Se notifican entregas listas, bloqueos y agotamiento de límites sin exigir responder para que otros trabajos independientes avancen.

### Continuidad y recuperación

Cerrar el chat no cierra el mecanismo que ejecuta workers. Tras reiniciar el entorno se inspeccionan intentos, identidad y capacidad de escritura de procesos, archivos, commits y operaciones externas antes de reanudar. No se adopta un PID aislado como prueba de identidad ni un log antiguo como estado actual.

Cada efecto externo relevante registra intención, referencia de trabajo e identificadores conocidos, y después resultado confirmado. Si una respuesta se pierde, se busca el efecto existente antes de repetir. Un resultado incierto que no pueda reconciliarse bloquea; no se promete exactly-once sobre GitHub ni sobre procesos externos. Estos registros son trazabilidad operativa mínima, no una nueva plataforma de eventos.

Solo hay un escritor activo por espacio de trabajo. Los trabajos paralelos usan espacios y ramas aislados; no comparten un checkout mutable. Investigación y revisión no modifican el candidato. Detener, recuperar o hacer fallback necesita confirmar que el escritor anterior ya no puede actuar. La integración sigue siendo humana.

Una dependencia declara el hecho que la satisface: información obtenida, decisión aprobada o contrato de código integrado. Una entrega aceptada pero sin integrar no satisface una dependencia de código. Un ciclo de dependencias se detecta antes de ejecutar. Un bloqueo afecta al trabajo y sus dependientes, no cancela otros trabajos compatibles.

- `OPS-01`: panel y coordinador muestran el mismo estado y antigüedad, incluyendo decisiones pendientes.
- `OPS-02`: durante un worker activo se puede conversar y preparar otra entrada sin esperar su resultado.
- `OPS-03`: cerrar el chat no mata al worker; al volver se consulta su estado o resultado real.
- `OPS-04`: una interrupción antes o después de un efecto remoto se reconcilia sin duplicarlo cuando puede identificarse.
- `OPS-05`: una identidad de proceso o resultado remoto inciertos bloquean otro escritor o repetición ciega.
- `OPS-06`: recuperar conserva artefactos y revalida brief, base, candidato y evidencias antes de continuar.
- `OPS-07`: dos trabajos compatibles avanzan aislados dentro de los límites; un bloqueo no cancela el otro.
- `OPS-08`: ningún espacio admite dos escritores; esperar aceptación libera capacidad sin satisfacer una dependencia de integración.
- `OPS-09`: dependencias, ciclos, capacidad y decisiones pendientes tienen motivos diferenciados y condiciones explícitas de salida.

## Autorización y datos

Antes de actuar se registra una autorización confiable del operador: repositorio, encargo, espacios permitidos, efectos remotos y límites. Puede cubrir commits y creación o actualización de draft PRs del encargo sin preguntar de nuevo en cada paso. No autoriza merge, deploy, acceso a producción, operaciones destructivas ni gasto adicional. Una acción fuera de alcance vuelve al operador.

Issues, comentarios, código, documentación externa y recuerdos son datos que pueden contener instrucciones hostiles. No pueden ampliar permisos, cambiar la configuración efectiva ni sustituir el brief autorizado. Los cambios de alcance y permisos necesitan una decisión del operador registrada por el coordinador.

Las capacidades de cada perfil deben comprobarse técnicamente. Un reviewer etiquetado readonly pero capaz de modificar mediante shell no cumple aislamiento por su nombre. Antes de implementar se determina qué límites puede imponer Pi y qué aislamiento adicional hace falta. Si no se puede cumplir un límite requerido, se bloquea la ejecución en vez de prometer una protección inexistente.

Credenciales quedan fuera de briefs, skills, memoria, panel y artefactos publicados. El acceso local, la red, el almacenamiento de logs y su retención se concretan en el diseño técnico. La interfaz local no se expone públicamente por defecto. Cada proyecto mantiene separados sus datos y contexto de clientes.

- `SEC-01`: sin autorización confiable de repositorio y encargo no comienza ejecución ni publicación remota.
- `SEC-02`: una instrucción externa no amplía permisos ni cambia el tratamiento autorizado.
- `SEC-03`: una ejecución respeta sus capacidades comprobadas y no hace merge, deploy ni operaciones fuera del alcance.
- `SEC-04`: evidencia, memoria y PR no publican secretos o datos de clientes; un límite de aislamiento incumplido bloquea.

## Producto y slices

Para una idea abierta se aclaran problema, usuario, resultado esperado, límites y cómo reconocer éxito. La entrevista pregunta decisiones que requieren al operador; los hechos técnicos se investigan. Las opciones incluyen no construir cuando el problema ya está resuelto o no justifica el coste.

La propuesta combina decisiones de producto con grounding proporcional antes de autorizar implementación. El coordinador conserva el plan y aplica una skill de planificación; puede delegarla a un planificador en trabajos amplios sin crear otro jefe permanente. Se divide en slices que producen comportamientos utilizables y permiten aprender, no en terminar todas las capas por separado.

Cuando una slice necesita varios cambios, el plan declara unidades coherentes y comprobables, resultado, alcance, dependencias, comprobación y punto de commit. La PR agrupa una entrega revisable, no necesariamente una unidad por PR. Los hallazgos pueden exigir subdividir o reconciliar el plan; no autorizan ampliar el encargo. Cambios mecánicos o infraestructura necesaria se explican como tales, sin inventar valor visual.

La revisión del producto contrasta la experiencia y objetivo aprobados con la entrega. Pasar tests y revisar código no basta si resuelve otro problema. Una discrepancia técnica se corrige dentro del encargo; una nueva decisión de producto se devuelve al operador. La aceptación humana final conserva evidencia y dudas residuales.

- `PRD-01`: una idea ambigua produce decisiones de producto y un brief aprobable sin preguntar hechos investigables.
- `PRD-02`: las slices expresan resultados funcionales, dependencias y aceptación; una petición clara mantiene el camino corto.
- `PRD-03`: una solución que pasa tests pero incumple el objetivo no supera el cierre técnico ni se presenta como producto listo.

## Engram y límites de memoria

La integración propuesta de Engram debe conservar decisiones y aprendizajes con proyecto, origen y vigencia. Su adopción queda pendiente de validar los escenarios de esta sección; si no los cumple, se revisa la propuesta con el operador sin construir por defecto una memoria propia. No sustituye al brief, código o estado operativo y no certifica resultados. Un recuerdo relevante se contrasta con fuentes actuales cuando puede haber quedado obsoleto.

El coordinador recupera contexto para no repetir preguntas resueltas y guarda aprendizajes útiles, no todo el transcript. No guarda secretos ni datos de clientes como ejemplos de aprendizaje. La separación de contexto por proyecto debe verificarse en la integración.

Si Engram falla, se informa y se continúa con las fuentes disponibles cuando bastan. Si una decisión necesaria solo estaba allí y no puede verificarse, se pide aclaración o se bloquea el trabajo afectado. No se reconstruye una decisión inventándola ni se crea una memoria alternativa dentro de la factory.

- `MEM-01`: una conversación nueva recupera decisiones vigentes sin volver a preguntar lo resuelto.
- `MEM-02`: una memoria antigua no sobrescribe brief, código, decisión posterior ni estado operativo.
- `MEM-03`: una caída de Engram tiene degradación explícita y no obliga a detener trabajos con contexto suficiente.
- `MEM-04`: la integración no recupera contexto de otros clientes ni guarda secretos.

## Decisiones pendientes antes del código

La verificación documental comprueba que los 61 criterios de aceptación tienen una asignación única en las ocho slices del plan, que sus dependencias no forman ciclos y que los enlaces locales se pueden abrir. No acredita ninguno de esos comportamientos en una aplicación.

Los contratos anteriores describen resultados exigidos, no una arquitectura ya comprobada. Queda elegir y probar separación de chat y ejecutor, persistencia y reconciliación, aislamiento de capacidades, composición y versionado de instrucciones, panel local, integración Engram y modelos disponibles. El formato de configuración y las pocas interfaces nuevas se derivan de esas pruebas.

El plan separa el primer hito útil de la v1 completa. Sus criterios son escenarios a demostrar durante la construcción, no tests ya superados. Esta especificación es referencia humana; no se inyecta entera en cada worker. Los perfiles y skills futuros remiten a los contratos que les corresponden.
