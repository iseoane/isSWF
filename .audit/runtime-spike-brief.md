# Spike integrado de ciclo de vida Pi

Estado: instrumento desechable de investigación, no runtime de producción.

## Decisión

Comprobar si un dueño local de procesos y pipes independiente del cliente permite cerrar y retomar la conversación sin detener el trabajo. Contrastar qué pierde ese dueño al caer y qué debe reconciliar antes de admitir otro escritor. No se elige todavía almacenamiento, sandbox ni transporte de producción.

## Forma de los datos

Una ejecución guarda identidad del dueño, Pi y escritores controlados. Cada identidad contiene boot_id, PID y starttime Linux. El intento tiene estado observado, distinto de la solicitud de cancelación. El efecto controlado es un archivo de heartbeat con secuencia creciente. No hay aceptación del producto ni cambio en la spec.

## Casos

1. Lanzar Pi RPC real, sin prompts LLM, extensiones, MCP, contexto ni credenciales. Un dueño separado del cliente mantiene stdin y drena stdout. Enviar un comando Bash controlado que escribe heartbeats en el directorio temporal.
2. Desconectar el cliente. Confirmar que siguen el mismo Pi y escritor y que el archivo crece. Reconectar y consultar estado por el dueño existente.
3. Pedir abort_bash y comprobar identidad y cese del escritor. Cerrar Pi y confirmar salida. No usar ACK ni isStreaming como prueba de parada.
4. Caer el dueño durante otro trabajo activo. Reiniciar y reconciliar las identidades previas contra /proc y archivos. No relanzar a ciegas. Comprobar tanto el escritor ordinario como un descendiente controlado que cambia de sesión con setsid.
5. Ante una identidad que no coincide, no señalar ese PID ni liberar el espacio a otro escritor. Para parar procesos de identidad confirmada, usar pidfd y validar identidad después de abrirlo.

Los casos deben mostrar las observaciones físicas además del estado. La parada puede cerrar trabajo o dejar incertidumbre explícita, pero no anunciar éxito sin comprobarla. Se registra si el escritor escapado demuestra que abort_bash o EOF no alcanzan todo el árbol.

## Alcance y límites

Python estándar, procesos Linux y Pi instalado. Sin dependencias nuevas, red de servicio, modelos en la carga experimental, GitHub, commits, PRs, credenciales ni cambios de configuración del usuario. La autoría y revisión usan OpenAI GPT 6 o 6.1 por petición del usuario, sin fallback OpenCode.

Un socket local temporal sirve únicamente para desconectar el cliente del dueño. No acredita aislamiento de seguridad. Si la identidad de un escritor es incierta, el resultado seguro del spike es bloquear y conservar la reserva. La recuperación puede confirmar parada y permitir un intento posterior; no promete reenganchar los pipes de un Pi huérfano.

## Checkpoint

Primero observar cliente desconectado, consulta y parada normal. Después probar crash activo y escritor escapado con el mismo instrumento. Si la separación o reconciliación falla, documentar el resultado antes de añadir otro proceso o framework. Preservar solo instrumento, salida y análisis necesarios para repetirlo.
