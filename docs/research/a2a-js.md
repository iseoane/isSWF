# A2A JS: mecanismos reutilizables y límites observados

## Alcance y fuentes fijadas

Se examinó el SDK oficial `a2aproject/a2a-js`, commit [`2c81b861614905b55b7e0d465d596ef69d85d721`](https://github.com/a2aproject/a2a-js/tree/2c81b861614905b55b7e0d465d596ef69d85d721), obtenido como snapshot público en `/tmp/isswf-a2a-js.VWRQAO/sdk`.

Su [package.json](https://github.com/a2aproject/a2a-js/blob/2c81b861614905b55b7e0d465d596ef69d85d721/package.json) indica SDK 1.3.0, Node >=20 y licencia Apache-2.0. Su [README](https://github.com/a2aproject/a2a-js/blob/2c81b861614905b55b7e0d465d596ef69d85d721/README.md) declara implementación del protocolo 1.0.0. No se equipara la versión del SDK con la del protocolo ni se acredita conformidad completa con 1.0.1.

Esto es investigación, no una dependencia incorporada a isSWF ni una elección de arquitectura. Se ejecutó código real de handler y store con un executor controlado, sin HTTP, workers Pi ni modelos.

## Qué podríamos reutilizar

| Pieza | Responsabilidad comprobada en código | Lo que no demuestra |
| --- | --- | --- |
| `DefaultRequestHandler` | Encamina mensajes, ejecución, consultas, streams y cancelación. | Planificación, aceptación del producto o continuidad tras caída del proceso. |
| `AgentExecutor` | Interfaz para ejecutar y publicar resultados; callback de cancelación. | Lanzar, detener y recuperar procesos Pi por sí mismo. |
| `TaskStore` | Guarda y consulta tareas según contexto. | Registro completo de autorizaciones, intentos y efectos externos de la factory. |
| `DatabaseTaskStore` | Backend persistente ya existente en el SDK. | Recuperación de un proceso o de una herramienta interrumpida. |
| Bus de eventos | Distribuye estado y artefactos dentro del proceso. | Cola durable o reproducción completa de eventos perdidos. |

Las referencias de implementación son [AgentExecutor](https://github.com/a2aproject/a2a-js/blob/2c81b861614905b55b7e0d465d596ef69d85d721/src/server/agent_execution/agent_executor.ts), [handler](https://github.com/a2aproject/a2a-js/blob/2c81b861614905b55b7e0d465d596ef69d85d721/src/server/request_handler/default_request_handler.ts), [store](https://github.com/a2aproject/a2a-js/blob/2c81b861614905b55b7e0d465d596ef69d85d721/src/server/store.ts) y [bus manager](https://github.com/a2aproject/a2a-js/blob/2c81b861614905b55b7e0d465d596ef69d85d721/src/server/events/execution_event_bus_manager.ts).

## Prueba reproducible

El [probe](probes/a2a-js.mjs) comprueba el SHA y ausencia de cambios en archivos tracked antes de importar código. El [log](probes/a2a-js.log) conserva la salida. Se usó Bun 1.4.2 para ejecutar TypeScript del snapshot, sin modificarlo. No se comprobó aquí su typecheck ni una build publicada.

Para reproducir en un directorio temporal:

```bash
git clone https://github.com/a2aproject/a2a-js.git sdk
git -C sdk checkout 2c81b861614905b55b7e0d465d596ef69d85d721
mkdir deps
npm install --prefix deps --ignore-scripts --no-audit --no-fund jose@6.2.3 @bufbuild/protobuf@2.10.2
ln -s ../deps/node_modules sdk/node_modules
bun /ruta/a/isSWF/docs/research/probes/a2a-js.mjs "$PWD/sdk"
```

Solo se instalaron esas dependencias dentro del snapshot temporal de investigación. No se instalaron paquetes globales ni se modificó la configuración Pi del usuario. No se arrancó un servicio accesible ni se publicaron issues o PRs.

### Resultados

1. Con un stream conectado hasta terminar, el store guarda `COMPLETED`. Otro tenant no puede recuperar esa tarea en el caso probado.
2. `sendMessage` no bloqueante, con `returnImmediately: true`, devuelve antes de terminar y sigue drenando eventos. Después puede consultarse `COMPLETED` sin mantener un consumidor de stream.
3. Si el único consumidor de `sendMessageStream` se retira después del primer evento, el executor sigue y publica finalización, pero `getTask` conserva `WORKING` en ese camino del SDK fijado.
4. Un handler nuevo, sin bus activo, puede marcar una tarea guardada como `CANCELED` sin llamar al callback de cancelación del executor. Ese estado no prueba que un proceso externo se haya detenido.
5. Un `InMemoryTaskStore` nuevo no recupera tareas del anterior.
6. Repetir el mismo `messageId` como mensaje nuevo crea dos IDs de tarea y dos ejecuciones. No hay deduplicación de encargos por ese identificador en el camino probado.

Los resultados 2 y 3 son distintos y deben conservarse juntos. No justifican afirmar que A2A siempre pierde resultados o que nunca necesita soporte adicional. El fallo inicial del último caso era del probe: interpretaba el retorno directo de `sendMessage` como una respuesta de stream. Se corrigió contra la firma real y se repitieron todos los casos.

## Por qué ocurren estos resultados

En [handler:627–718](https://github.com/a2aproject/a2a-js/blob/2c81b861614905b55b7e0d465d596ef69d85d721/src/server/request_handler/default_request_handler.ts#L627-L718), `sendMessage` no bloqueante devuelve el primer resultado y deja `_processEvents` consumiendo en background. Esa ruta sigue actualizando el store.

En [handler:721–783](https://github.com/a2aproject/a2a-js/blob/2c81b861614905b55b7e0d465d596ef69d85d721/src/server/request_handler/default_request_handler.ts#L721-L783), el consumo del stream llama a `resultManager.processEvent`. Al retirarse, su `finally` detiene esa cola. La ejecución vive aparte, pero mantener vivo al executor no garantiza que otro consumidor persista sus siguientes eventos. El probe reproduce esa diferencia sin cambiar el SDK.

En [handler:827–905](https://github.com/a2aproject/a2a-js/blob/2c81b861614905b55b7e0d465d596ef69d85d721/src/server/request_handler/default_request_handler.ts#L827-L905), cancelar con bus activo llama al executor. Sin bus, registra `CANCELED` mediante `ResultManager.processEvent`, con lock de escritura y protección del estado terminal, pero no llama a la cancelación del executor. isSWF necesita confirmar por separado el cese de escritura antes de liberar o reutilizar un espacio.

En [handler:218–264](https://github.com/a2aproject/a2a-js/blob/2c81b861614905b55b7e0d465d596ef69d85d721/src/server/request_handler/default_request_handler.ts#L218-L264), un mensaje sin `taskId` recibe un UUID de tarea nuevo. La factory no puede tratar un reenvío tras respuesta perdida como autorización para duplicar ejecución o efectos.

## Persistencia y seguridad

El SDK ofrece persistencia con Kysely y drivers de SQLite, PostgreSQL, MySQL o D1. Se leyó su [guía de stores](https://github.com/a2aproject/a2a-js/blob/2c81b861614905b55b7e0d465d596ef69d85d721/docs/persistent-stores.md); no se ejecutó en esta investigación un backend SQL ni una recuperación tras crash.

Esa guía advierte que las configuraciones de webhooks y sus credenciales quedan en texto claro. Activar push notifications no es necesario para el primer caso local y añade controles de destinos, secretos y retención. La autenticación del servidor se integra aparte; anunciarla en un Agent Card no la implementa.

El [resolver de ownership](https://github.com/a2aproject/a2a-js/blob/2c81b861614905b55b7e0d465d596ef69d85d721/src/server/owner_resolver.ts) agrupa solicitudes no autenticadas como `unknown`. La prueba de tenant usa contextos construidos localmente; no acredita autenticación HTTP ni impide que un cliente elija un tenant si el servidor no valida esa pertenencia.

## Implicación para isSWF

A2A puede evitar inventar una interfaz externa de mensajes, seguimiento y artefactos. También hay stores reutilizables; no sería correcto afirmar que hay que construir toda su persistencia desde cero.

Sigue siendo necesario un dueño de la ejecución independiente del chat, que supervise Pi, mantenga autorización e intentos, confirme detención, deduplique encargos y reconcilie efectos. Un estado A2A terminal no equivale a cierre técnico, aceptación humana o integración del código.

Como candidata para evaluar, la entrada no bloqueante seguida de consultas de estado parece más adecuada al caso local que depender exclusivamente de un stream. Eso es una inferencia de los casos probados, no una integración Pi/A2A ya demostrada. No se ha decidido construir una capa A2A ni un servidor por worker.
