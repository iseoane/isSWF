# Continuidad y recuperación local con Pi

Estado: spike de investigación completado el 13 de octubre de 2026. Instrumento desechable, no implementación de la factory. Se ejecutó Pi 1.2.0 real con comandos Bash controlados, sin prompts de modelo ni publicaciones remotas.

## Qué decide este experimento

La [arquitectura candidata](../arquitectura-candidata.md) propone separar el cliente conversacional del dueño de procesos y pipes. El spike distingue dos fallos: desaparecer el cliente y caer ese dueño. No cambia la visión, el contrato v1 ni sus criterios pendientes.

El resultado respalda seguir evaluando un dueño local externo al chat con Pi RPC. No justifica añadir ahora un segundo dueño permanente de pipes para conservar Pi tras cualquier crash. La recuperación probada inspecciona y detiene ejecuciones conocidas; no recupera sus canales ni continúa la herramienta interrumpida.

## Instrumento y evidencia

El [probe conservado](probes/pi-lifecycle.py) usa Python estándar, procesos Linux, un socket Unix temporal y Pi instalado. Su SHA-256 revisado es `b994ae4f5459ba9a6139520c294cdd57fdf45ffc1c3609027ed3962e14a7731d`. La [salida final](probes/pi-lifecycle.log) conserva identidades, estados físicos, heartbeats, señales y limpieza.

El dueño mantiene stdin de Pi y drena stdout en un hilo. Un cliente separado solicita el inicio y sale; otro proceso cliente consulta después. La entrada acepta únicamente `start`, `status` y `stop`. El comando Bash es fijo, no passthrough de instrucciones arbitrarias. Esta entrada pertenece al experimento, no es una API adoptada para isSWF.

Cada ejecución controlada registra boot_id, PID y starttime. Para enviar una señal se abre primero un pidfd y luego se valida la identidad. Un nonce distingue los registros, pero no autentica procesos. El journal temporal no se sustituye por el JSONL conversacional de Pi.

Un runner de observación permanece vivo y actúa como subreaper para recolectar hijos huérfanos. Eso permite inspeccionar zombies y comprobar después su ausencia. No demuestra la limpieza tras caída simultánea del runner, supervisor y máquina.

El directorio de construcción fue `/tmp/isswf-runtime-spike.Ti6Xj2`. Se conservó únicamente el instrumento reproducible y su evidencia en el proyecto. Al repetirlo, los archivos de cada caso se crean y eliminan en directorios temporales.

## Observaciones

Los cinco casos se ejecutaron individualmente, se repitieron juntos y se volvieron a ejecutar desde la fuente conservada. Un revisor independiente GPT 6.1 también ejecutó esa fuente con resultado 0 y observaciones concordantes.

| Caso | Evidencia física en el log conservado | Resultado acotado |
| --- | --- | --- |
| Cliente que sale y consulta posterior | Mismas identidades Pi y writer; heartbeat de 2 a 9. Ambos clientes terminan como procesos. | El cliente no posee los pipes de Pi; desaparecer no detiene ese trabajo. |
| Parada normal | Shell ausente y writer zombie tras `abort_bash`, antes de cerrar stdin. Después Pi termina con código 0 y el heartbeat sigue en 9. | Parada de escritores ordinarios confirmada, distinta del ACK. |
| Crash activo del dueño | Trabajos conocidos vivos antes de SIGKILL; después Pi y escritores ordinarios están terminados y el heartbeat no crece. | La caída del dueño pierde los canales. El proceso nuevo reconcilia hacia detenido, sin relanzar. |
| Writer separado de sesión | El hijo creado con `start_new_session` sigue vivo tras abort y cierre de pipes. En el crash su heartbeat crece de 15 a 19. | Abort o salida de Pi no acreditan el cese de todos sus posibles hijos. Recuperación envía SIGTERM al hijo conocido y confirma su cese. |
| Identidad esperada incorrecta | Se altera starttime en el registro de un proceso vivo. No recibe señal; su heartbeat crece de 12 a 20 y la reserva permanece incierta. | No se usa ese PID para señalar ni se declara el espacio libre. La limpieza explícita posterior usa la identidad original correcta. |

El caso del hijo separado tiene dos variantes, abort y crash. Por eso cinco casos corresponden a normal, crash, escape-abort, escape-crash y mismatch.

Cada confirmación de parada ocurre con más de cinco segundos antes de la expiración de seguridad de 28 segundos. La expiración no cuenta como prueba de cancelación. Un zombie ya no puede escribir; el cierre de limpieza exige además que los registros de los procesos conocidos desaparezcan de `/proc`. Las cinco limpiezas lo comprobaron.

El evento del log llamado `after_crash_EOF` observa la pérdida simultánea de stdin y stdout al morir el dueño. No aísla EOF como causa única de salida de Pi. La prueba anterior de [EOF deliberado](pi-runtime.md) es distinta.

## Qué no queda demostrado

- El cierre y restauración del chat Pi real o de su TUI. Los clientes son procesos controlados, no una conversación con modelo.
- Continuidad de Pi tras caída de su dueño, recuperación de pipes o reanudación automática de herramientas.
- Admisión efectiva de un intento nuevo después de liberar la reserva, ni una prueba general de exclusión entre supervisores competidores.
- Identificación de cualquier proceso hijo arbitrario. Los writers cooperan, publican identidades y tienen un límite de vida.
- Crash antes de registrar identidad, fallos parciales de arranque, registros corruptos, reinicio de máquina o durabilidad ante pérdida de energía.
- Sandbox, autenticación, separación entre clientes o protección frente a código hostil. Todos los actores usan el mismo UID.
- Efectos GitHub, modelos, fallbacks, skills fijadas, revisión de producto o aceptación de una entrega.

La existencia del socket no es un handshake completo de readiness. La lectura de archivos de identidad presupone metadata cooperativa y completa. La construcción RPC y errores de stdout tienen ventanas no ensayadas. No se usa este probe como runner de producción ni como prueba de todos los criterios OPS.

## Repetición y revisión

La ejecución completa es `python docs/research/probes/pi-lifecycle.py all`. También admite `normal`, `crash`, `escape` y `mismatch`. Requiere Linux, Python con `pidfd_open` y `pidfd_send_signal`, y Pi instalado. En esta máquina se usó Python 3.14.7.

La autoría y revisión de este paso usaron `openai-codex/gpt-6.1-sol` y `openai-codex/gpt-6-sol`, sin fallback a OpenCode, por petición del usuario. Hubo contextos independientes, pero no diversidad de familias de modelos. La carga experimental no invoca un LLM.

La revisión técnica no encontró bloqueantes de las observaciones acotadas. Señaló los límites de causalidad, readiness y arranque anteriores. La auditoría del rastro señaló referencias temporales; se conservan el instrumento, log y veredictos en el proyecto. La revisión de comentarios eliminó un docstring redundante, sin introducir capas ni cambiar el comportamiento.

## Consecuencia para el diseño

Mantener la preferencia provisional por el dueño externo con Pi RPC. El cliente conversa y observa; no conserva los procesos. Si cae el dueño, recuperar significa reconciliar antes de decidir un intento nuevo, no prometer continuación invisible.

La siguiente prueba debe cerrar la frontera de procesos y permisos: cómo contener y detener también hijos no cooperativos, sin acceder a autoridad operativa o credenciales. Antes de implementar se necesita esa evidencia o bloquear los perfiles que no cumplan. No se seleccionan aquí sandbox, almacén, transporte de producción o A2A. La comparación A2A integrada sigue pendiente, no descartada.
