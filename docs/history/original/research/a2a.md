# A2A para isSWF

Estado: investigación primaria del 13 de octubre de 2026, con revisión acotada. El contraste inicial usó un único investigador con modelo heredado; después hubo revisión de criterio GLM y comprobación técnica independiente DeepSeek. No es una auditoría completa de los SDKs, no elige arquitectura ni acredita implementación de la factory.

## Alcance y fuentes fijadas

La [visión](../vision.md), la [especificación v1](../spec-v1.md) y el [plan](../plan-v1.md) exigen independencia del chat, recuperación sin repetición ciega, aislamiento de escritores y cierre técnico con evidencia y revisión independiente. A2A puede describir intercambios con agentes, pero no resuelve por sí mismo esos requisitos.

Se verificó la existencia de la [spec oficial 1.0.1](https://a2a-protocol.org/v1.0.1/specification/) y de su [release](https://github.com/a2aproject/A2A/releases/tag/v1.0.1), publicada el 28 de mayo de 2026. Base inmutable: `a2aproject/A2A`, commit `3303592588e388e62e0f69f701af531d2f4e3991`. Su banner Markdown todavía anuncia 1.0.0. La identificación usada aquí procede del tag y la release, no de ese banner ni de `latest`.

El contraste inicial usa la [release Python v1.0.1](https://github.com/a2aproject/a2a-python/releases/tag/v1.0.1), commit `69273a36b831b852ff61227b015959d4f522c155`, publicada el 22 de abril de 2026. Es una versión del paquete, anterior al parche normativo 1.0.1. No representa la última release ni una certificación de conformidad. Se inspeccionaron código y tests, sin instalar, importar ni ejecutar el SDK. El proceso investigador escribió esta nota pero falló por cuota antes de emitir su informe final; el cierre usa revisión independiente y contraste directo del padre.

El padre consultó después la [API oficial de última release](https://api.github.com/repos/a2aproject/a2a-python/releases/latest): identificó [Python v1.2.2](https://github.com/a2aproject/a2a-python/releases/tag/v1.2.2), publicada el 5 de octubre de 2026, commit `2f9e44af243df5c7c7a3da361c8d095324bcd5e3`. Se contrastaron sus caminos de ownership, cancelación y almacenamiento versionado. La matriz y referencias P1–P9 siguen describiendo 1.0.1; las diferencias verificadas de 1.2.2 se detallan más abajo. Coincidir con el número de la spec no es motivo para elegir una versión antigua del SDK.

Según §3.6 [S2], la negociación usa `1.0`, no `1.0.1`. Coincidir en major.minor no demuestra cumplir todas las correcciones de la spec. `0.3` es otro contrato. Las rutas Python permiten compatibilidad opcional, no una equivalencia entre versiones [P8]. No se usaron páginas `pr-849`.

El [contraste JS del padre](a2a-js.md) fija `2c81b861614905b55b7e0d465d596ef69d85d721`, paquete 1.3.0, cuyo README declara protocolo 1.0.0. Esos datos no acreditan conformidad con 1.0.1. Sus pruebas offline y log están enlazados en esa nota; aquí no se repiten.

## Task no equivale a trabajo ni cierre técnico

El contrato normativo de datos es `specification/a2a.proto`, aunque el texto de §1.4 lo llama `spec/a2a.proto` [S1]. `Task` contiene ID generado por servidor, contexto, estado, artifacts, history y metadata. `contextId` agrupa interacciones, no concede permisos ni identifica un proceso.

`SendMessage` puede devolver una `Message` sin seguimiento o una `Task`. `returnImmediately=false`, valor por defecto, espera un estado terminal o interrumpido. La afirmación general de respuesta inmediata de §3.1.1 debe leerse con esa configuración explícita [S1, S2].

Los terminales son `COMPLETED`, `FAILED`, `CANCELED` y `REJECTED`. `INPUT_REQUIRED` y `AUTH_REQUIRED` son interrupciones, no éxitos ni cancelaciones. La primera admite nueva entrada referida a la misma tarea y contexto. La segunda expresa autenticación pendiente durante el trabajo, distinta del rechazo HTTP por credenciales inválidas [S1, S2].

Una `Task` completada no prueba tests, revisión independiente, aceptación ni merge. isSWF necesita conservar trabajo, intento, revisión del brief, candidato y evidencia. Una correspondencia posible sería una tarea A2A por ejecución delegada, pero también caben otras granularidades. Ninguna está elegida. Un fallo terminal de un intento no obliga a terminar el trabajo completo, y una tarea terminal no admite continuar mediante nuevos mensajes [S2].

`AgentCard` y `AgentSkill` anuncian interfaces, capacidades y modalidades. La skill A2A es descriptiva, no el cuerpo Markdown que Pi carga. La tarjeta tampoco demuestra readiness del runtime, acceso al modelo, effort compatible, cuota disponible o capacidad de escritura [S1]. Esas comprobaciones pertenecen a isSWF.

## Matriz de responsabilidades

En la columna SDK se describe únicamente el código Python fijado, no cualquier servidor que use la biblioteca.

| Necesidad | Aporta el protocolo | Aporta el SDK Python inspeccionado | Debe aportar isSWF |
| --- | --- | --- | --- |
| Delegación | Mensajes, tareas, contexto y metadata [S1, S2]. | `AgentExecutor.execute`, contexto y handler [P1, P2]. | Brief autorizado, perfil, skills y configuración fijados. |
| Observación | `GetTask`, `ListTasks`, streaming y push opcionales [S2]. | Suscripciones y agregación del estado [P2, P3, P5]. | Panel reconciliable, antigüedad y bloqueos explicados. |
| Chat cerrado | El ciclo de tarea es independiente del stream [S2]. | `asyncio.Task` productor y consumidor separados del suscriptor [P3]. | Dueño de procesos y pipes independiente de la conversación. |
| Cancelación | Petición sin éxito garantizado; error si no es cancelable [S2]. | Cancela coroutine productora, llama `AgentExecutor.cancel` y espera finalización interna [P3]. | Detener procesos y descendientes, comprobar escritor inactivo y registrar efectos. |
| Recuperación | Consultar estado y volver a suscribirse [S2]. | Stores de memoria o SQL; registro activo en memoria [P4, P6]. | Identidad de ejecución, reconciliación de archivos y efectos, exclusión de escritores. |
| Retención | Admite expiración y purga. No fija una duración mínima [S2, S3]. | `save/get/list/delete`; memoria desaparece con el proceso [P6]. | Retención documentada de resultados, eventos críticos y referencias. |
| Espera humana | `INPUT_REQUIRED`; continuación con IDs existentes [S1, S2]. | Estados interrumpidos y nuevas solicitudes [P2, P3]. | Motivo, responsable, condición de salida y liberación de capacidad. |
| Entrega | Artifacts con contenido o referencias [S1]. | Acumula artifacts y guarda Task [P5, P6]. | Verificar contenido, candidato y revisión. Separar cierre técnico, aceptación e integración. |
| Reintentos | `SendMessage` solo puede ser idempotente, no debe serlo [S2]. | Cola por tarea, sin deduplicación por `messageId` en el recorrido examinado [P2, P3]. | Límites, identificación de duplicados y bloqueo de efectos inciertos. |
| Seguridad | Autenticación y autorización por operación [S3]. | Contexto de usuario y stores por owner [P6, P7]. | Validación de credenciales, autorización del encargo y aislamiento real. |

## Lo que muestra la implementación

`DefaultRequestHandler` exportado es un alias de `DefaultRequestHandlerV2` [P1]. El recorrido relevante es `on_message_send` o `on_message_send_stream`, `_setup_active_task`, `ActiveTaskRegistry.get_or_create`, `ActiveTask.subscribe` y el productor que llama a `AgentExecutor.execute` [P2–P4].

La opción no bloqueante también espera que el ejecutor produzca un primer resultado. No sustituye una comprobación de readiness [P1, P2].

Al desconectar un suscriptor, `subscribe` cierra su cola y reduce la referencia. No llama a `cancel`. La limpieza exige tarea terminada y ausencia de referencias. La cancelación explícita sí llama a `_producer_task.cancel()` y al método del ejecutor [P3]. Esto distingue desconexión de ejecución, pero las coroutines siguen dentro del proceso servidor. No demuestra supervivencia al cierre de Pi, a un crash o al reinicio de la máquina.

`AgentExecutor.cancel` es abstracto. El estado `CANCELED` no demuestra que un comando Git, proceso Pi o solicitud GitHub ya enviado haya dejado de producir efectos. El adaptador debe comprobarlo antes de permitir fallback o un segundo escritor, conforme a `OPS-05` y `OPS-08`.

`DatabaseTaskStore._to_orm` conserva estado, artifacts, history y metadata. `save` realiza un `merge` transaccional. No persiste la coroutine, los pipes, una cola de trabajo recuperable, la identidad del proceso o intenciones remotas [P6]. `ActiveTaskRegistry` conserva un diccionario y locks locales [P4]. Guardar una tarea `WORKING` antes del crash no reanuda su ejecutor después. Los locks de una instancia tampoco prueban exclusión entre procesos servidores.

Los artifacts separan resultado de conversación. `append` añade contenido al mismo ID y `lastChunk` identifica el último fragmento, no el cierre técnico [S1]. `append_artifact_to_task` reemplaza cuando `append=false`, añade partes cuando es verdadero e ignora un append sin artifact previo. No deduplica fragmentos repetidos ni usa `last_chunk` para certificar integridad [P5]. Una URL de artifact tampoco garantiza disponibilidad futura.

En el snapshot histórico 1.0.1 hay un riesgo estático adicional. Los stores consultan por owner, pero `ActiveTaskRegistry.get_or_create` devuelve una tarea ya activa por `task_id` sin comprobar el nuevo caller. `on_subscribe_to_task` y `on_cancel_task` pasan por ese registro [P2, P4]. No se ejecutó un exploit. Este hallazgo no describe la última release: el contraste 1.2.2 siguiente muestra su corrección.

## Contraste acotado con Python 1.2.2

En [`ActiveTaskRegistry.get_or_create`:82–107](https://github.com/a2aproject/a2a-python/blob/2f9e44af243df5c7c7a3da361c8d095324bcd5e3/src/a2a/server/agent_execution/active_task_registry.py#L82-L107), el camino cacheado consulta el store con el caller y devuelve not-found si no tiene acceso. El código identifica la corrección de #1159. En [`on_subscribe_to_task`:547–584](https://github.com/a2aproject/a2a-python/blob/2f9e44af243df5c7c7a3da361c8d095324bcd5e3/src/a2a/server/request_handlers/default_request_handler_v2.py#L547-L584) y [`on_cancel_task`:222–254](https://github.com/a2aproject/a2a-python/blob/2f9e44af243df5c7c7a3da361c8d095324bcd5e3/src/a2a/server/request_handlers/default_request_handler_v2.py#L222-L254), también se comprueba el snapshot bajo ese contexto antes de actuar. Son evidencias de código, no tests de autenticación ejecutados aquí.

La versión reciente añade [`VersionedTaskStore`](https://github.com/a2aproject/a2a-python/blob/2f9e44af243df5c7c7a3da361c8d095324bcd5e3/src/a2a/server/cluster/task_store.py#L29-L128) y seguimiento compartido. La interfaz exige detectar escrituras con una versión obsoleta. Su `LegacyTaskStoreAdapter` ignora las versiones, así que usar cualquier store antiguo no incorpora esa garantía automáticamente. La cancelación remota puede registrar el cambio para que el dueño lo detecte en su siguiente escritura; eso todavía no certifica que un proceso Pi o una operación externa haya cesado.

Este contraste corrige el riesgo histórico y reconoce mecanismos recientes reutilizables. No es una auditoría completa de 1.2.2 ni demuestra reanudar procesos tras crash. El snapshot nuevo está en `/tmp/isswf-a2a-python-latest.20oRoH/sdk`. No se instalaron ni ejecutaron sus dependencias.

## Reintentos, errores y efectos inciertos

§3.3.1 describe las consultas y la cancelación como idempotentes, pero permite deduplicar `SendMessage` por `messageId` sin exigirlo. Reenviar después de un timeout puede crear otra tarea. El ID JSON-RPC correlaciona respuestas, no es una clave de idempotencia. Python genera un UUID interno por solicitud encolada y procesa solicitudes sucesivas; serializarlas no evita duplicarlas [P3, P9].

El protocolo distingue autenticación, autorización, validación, recurso y sistema. `TaskNotFoundError` también puede significar expiración, purga o falta de acceso. No prueba que nunca se ejecutó. `TaskNotCancelableError` no significa rollback. `FAILED` es estado de la tarea, no sinónimo de error de transporte [S2]. Python aporta clases y mapas de errores, pero un timeout HTTP se convierte en excepción de cliente, no en cancelación remota [P9].

El envío HTTP examinado no implementa un ciclo propio de reintentos [P9]. La configuración del cliente HTTP puede añadir otras políticas. isSWF necesita distinguir cuota agotada, fallo temporal, permiso denegado, test fallido y resultado incierto. A2A no selecciona modelos, esfuerzo, cadenas aprobadas ni límites de corrección.

Los streams ordenan eventos, pero no garantizan recuperar todos los mensajes perdidos. El historial puede omitir mensajes. `SubscribeToTask` debe empezar con el snapshot actual, no con un replay durable. Para información crítica hay que consultar artifacts y negociar retención suficiente [S2]. Push exige al menos un intento de entrega por webhook, permite duplicados y no garantiza recepción exactamente una vez.

Para `OPS-04`, isSWF necesita registrar intención, trabajo y referencias conocidas, y reconciliar el efecto antes de repetirlo. Si GitHub creó una PR y se perdió la respuesta, ni un timeout A2A ni una tarea ausente autorizan crear otra. La incertidumbre no resoluble bloquea. No hay garantía exactly-once sobre herramientas externas.

## Integración potencial y fronteras de seguridad

A2A podría ofrecer un contrato entre coordinador y un ejecutor que internamente controle Pi. También podría reservarse para interoperabilidad futura, mientras el control local usa mecanismos existentes. La utilidad debe compararse con RPC local antes de añadir transporte, servidor o estado duplicado. Esta investigación no selecciona ninguna opción.

Las [pruebas JS del padre](a2a-js.md#resultados) usan handler directo, `InMemoryTaskStore` y ejecutor controlado, sin HTTP ni LLM. Con consumer conectado persiste `COMPLETED`. `SendMessage` no bloqueante mantiene el drenaje después de devolver y también persiste `COMPLETED`. En cambio, después de `.return()` del único consumer de `sendMessageStream`, el ejecutor continúa y publica finalización, pero `getTask` conserva `WORKING`. Un handler nuevo con bus vacío sobre el store existente devuelve `CANCELED` sin llamar a `executor.cancelTask`. Repetir `messageId` como mensaje nuevo crea dos tareas y ejecuciones. Son observaciones de esos recorridos, no de todo el SDK ni del protocolo, y no se reprodujeron aquí. El gap de drenaje pertenece al camino streaming probado, no al envío no bloqueante. Drenaje, persistencia y parada deben probarse juntos.

Los perfiles y skills de Pstack podrían orientar el procedimiento del ejecutor. A2A no carga sus instrucciones ni cambia el ownership de los workers. La [evidencia local de Pi](pi-runtime.md) y el [análisis de Pstack](pstack-agentes.md) son investigaciones separadas. Un stream independiente no corrige por sí solo un proceso ligado a la sesión.

Las fronteras mínimas son las siguientes:

- Autenticar caller y autorizar cada trabajo y operación, incluidos cancelación, suscripción y tarjeta extendida. Una tarjeta con esquemas declarados no instala middleware. `DefaultServerCallContextBuilder` acepta usuario anónimo si el servidor no aporta otro [P7].
- No convertir `contextId`, tenant, metadata, mensajes, artifacts o recuerdos en permisos. Las instrucciones externas son datos, no autoridad del operador.
- Mantener credenciales fuera de artifacts y logs. Comprobar URLs, tamaño, formato y destinos permitidos. Los webhooks y URLs de archivos introducen riesgo de SSRF [S1, S3].
- Separar autorización A2A de capacidades locales. TLS protege transporte, no checkout, shell, procesos, publicación remota ni costes de modelos. El reviewer requiere aislamiento comprobado.

## Mínimos por probar antes de adoptar

1. Solicitud larga con ejecutor controlado, sin modelo. Desconectar stream y chat, volver a consultar y demostrar que existe un único escritor.
2. Cancelar en ejecución, en espera humana y durante una operación externa. Comprobar descendientes, efectos tardíos, cancelación repetida y estado no cancelable.
3. Reiniciar proceso tras guardar `WORKING`, y antes y después de confirmar un efecto simulado. Reconciliar sin duplicación o bloquear explícitamente.
4. Reenviar mismo `messageId`, perder la respuesta inicial y duplicar fragmentos o push. Medir invocaciones y contenido real, no solo estados.
5. Probar expiración, pérdida de historial, reconexión, artifacts inaccesibles, snapshot y errores de transporte separados de `FAILED`.
6. Usar dos identidades para get, list, subscribe, cancel y tarjeta extendida, especialmente con tarea activa cacheada. Probar URLs no autorizadas y límites de entrada.
7. Validar readiness y versiones reales. `A2A-Version: 1.0`, rechazo de versión incompatible y ausencia de downgrade silencioso. Verificar los cambios del parche 1.0.1, incluidos media type y errores, sin deducirlos del número del SDK.
8. Comprobar que `COMPLETED` sin evidencia o revisión no obtiene cierre técnico ni desbloquea una dependencia de integración.

Estas pruebas de adopción e integración siguen pendientes. Los casos JS acotados ya tienen evidencia en su nota, pero no acreditan Pi ni recuperación tras crash. La lectura de tests upstream no cuenta como PASS local. En esta investigación Python no se usaron modelos ni credenciales. No se instalaron dependencias ni se hicieron escrituras remotas. Los clones y descargas quedaron en `/tmp/isswf-a2a-cXkIki`.

## Revisión y cierre de esta investigación

La revisión técnica DeepSeek contrastó la semántica de envío, cancelación y versiones con la spec fijada; los recorridos JS probados; y la corrección de ownership y contrato versionado de Python 1.2.2. No encontró bloqueantes y señaló dos imprecisiones de redacción, corregidas: describir idempotencia como un MUST inexistente y omitir el paso por `ResultManager` al cancelar sin bus. La revisión de criterio GLM no encontró bloqueantes de adopción condicionada a pruebas.

El padre volvió a ejecutar el probe JS y el probe Pi, ambos con sus resultados acotados esperados. No ejecutó Python ni las pruebas integradas de adopción. Esas limitaciones siguen vigentes aunque la investigación documental esté cerrada.

## Mapa primario de lectura

Los enlaces fijan commit, símbolo y líneas. Hay que reubicar y leer el contexto si cambia la base.

- [S1: proto normativo](https://github.com/a2aproject/A2A/blob/3303592588e388e62e0f69f701af531d2f4e3991/specification/a2a.proto#L143-L451). `SendMessageConfiguration`, `TaskState`, `Part`, `Artifact`, eventos y tarjeta. Contratos de datos y readiness no definido.
- [S2: operaciones y semántica](https://github.com/a2aproject/A2A/blob/3303592588e388e62e0f69f701af531d2f4e3991/docs/specification.md#L145-L765). §§3.1–3.7. Cancelación, deduplicación opcional, contexto, versiones y pérdida de mensajes. Push en §§4.3.3–4.3.4, líneas 844–888.
- [S3: seguridad](https://github.com/a2aproject/A2A/blob/3303592588e388e62e0f69f701af531d2f4e3991/docs/specification.md#L3070-L3210). Autorización, webhook, TLS, secretos y retención.
- [P1: exportación del handler](https://github.com/a2aproject/a2a-python/blob/69273a36b831b852ff61227b015959d4f522c155/src/a2a/server/request_handlers/__init__.py#L1-L51). Alias V2. [Interfaz `AgentExecutor`](https://github.com/a2aproject/a2a-python/blob/69273a36b831b852ff61227b015959d4f522c155/src/a2a/server/agent_execution/agent_executor.py#L7-L82). Contrato, no implementación de Pi.
- [P2: `DefaultRequestHandlerV2`](https://github.com/a2aproject/a2a-python/blob/69273a36b831b852ff61227b015959d4f522c155/src/a2a/server/request_handlers/default_request_handler_v2.py#L119-L482). Consultas, cancelación, setup, send, subscribe y tarjeta extendida.
- [P3: `ActiveTask`](https://github.com/a2aproject/a2a-python/blob/69273a36b831b852ff61227b015959d4f522c155/src/a2a/server/agent_execution/active_task.py#L161-L754). Enqueue/start/productor 161–321; subscribe/cancel/cleanup 551–726. Ownership efectivo y ausencia de recuperación durable.
- [P4: `ActiveTaskRegistry`](https://github.com/a2aproject/a2a-python/blob/69273a36b831b852ff61227b015959d4f522c155/src/a2a/server/agent_execution/active_task_registry.py#L22-L88). Caché por task ID, lock local y camino cacheado.
- [P5: `TaskManager`](https://github.com/a2aproject/a2a-python/blob/69273a36b831b852ff61227b015959d4f522c155/src/a2a/server/tasks/task_manager.py#L23-L215). `append_artifact_to_task` y `save_task_event`.
- [P6: `DatabaseTaskStore`](https://github.com/a2aproject/a2a-python/blob/69273a36b831b852ff61227b015959d4f522c155/src/a2a/server/tasks/database_task_store.py#L121-L212) y [`InMemoryTaskStore`](https://github.com/a2aproject/a2a-python/blob/69273a36b831b852ff61227b015959d4f522c155/src/a2a/server/tasks/inmemory_task_store.py#L18-L230). Contenido persistido y scope.
- [P7: `DefaultServerCallContextBuilder`](https://github.com/a2aproject/a2a-python/blob/69273a36b831b852ff61227b015959d4f522c155/src/a2a/server/routes/common.py#L49-L85). Usuario recibido, no autenticación instalada.
- [P8: `create_jsonrpc_routes`](https://github.com/a2aproject/a2a-python/blob/69273a36b831b852ff61227b015959d4f522c155/src/a2a/server/routes/jsonrpc_routes.py#L28-L68). Compatibilidad 0.3 explícita.
- [P9: HTTP helpers](https://github.com/a2aproject/a2a-python/blob/69273a36b831b852ff61227b015959d4f522c155/src/a2a/client/transports/http_helpers.py#L19-L127), [`JsonRpcTransport.send_message`](https://github.com/a2aproject/a2a-python/blob/69273a36b831b852ff61227b015959d4f522c155/src/a2a/client/transports/jsonrpc.py#L64-L83) y [mapas de errores](https://github.com/a2aproject/a2a-python/blob/69273a36b831b852ff61227b015959d4f522c155/src/a2a/utils/errors.py#L132-L189). Transporte y errores, no política de recuperación.
- [Test upstream de suscriptor cancelado](https://github.com/a2aproject/a2a-python/blob/69273a36b831b852ff61227b015959d4f522c155/tests/server/agent_execution/test_active_task.py#L390-L422). Caso de lectura para ampliar a verificación del ejecutor y efectos, no prueba de continuidad tras crash.
