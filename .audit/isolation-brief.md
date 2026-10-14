# Spike de aislamiento local

Estado: investigación autorizada, sin implementar la factory. Solo OpenAI GPT 6 y 6.1 para autoría y revisión; sin fallback a otra familia.

## Decisión y forma de datos

Comparar un control deliberadamente sin aislamiento con dos perfiles Bubblewrap: worker con candidato writable y reviewer con candidato readonly más scratch writable. Un caso describe perfil, mounts permitidos, canarios falsos, operación, resultado esperado y evidencia observada. No se diseña un scheduler ni una API nueva.

El host dispone de Bubblewrap 0.12.0 y permite crear namespaces user, PID y net. Un preflight real de raíz mínima ejecutó Python bajo PID 2. Esto demuestra disponibilidad, no cumplimiento de permisos.

## Fronteras

Los únicos datos sensibles son canarios ficticios del fixture: archivo privado, home falso con credencial falsa, journal falso y sockets de autoridad falsos. No acceder a secretos reales, modificar configuración, instalar paquetes, publicar ni ejecutar modelos en la carga experimental.

El sandbox monta runtime público y el candidato, no el home real ni los archivos de autoridad. Tiene /proc propio, entorno limpio, descriptores cerrados salvo stdio deliberado, red separada y caps eliminadas. El dueño de Bubblewrap es un proceso persistente del experimento, nunca el cliente descartable. --die-with-parent no puede ligarse al chat.

## Observaciones requeridas

- Control sin aislamiento accede a los canarios falsos y el instrumento detecta esos accesos. Una negación aislada sin control positivo no demuestra nada.
- Worker ejecuta Pi RPC real y comandos controlados, lee el candidato y escribe dentro de su espacio.
- Reviewer ejecuta una comprobación real del candidato desde scratch y deja iguales los hashes originales. Lectura permitida y escritura/chmod/borrado sobre candidato denegados, incluidas rutas alias.
- Ambos perfiles rechazan acceso a archivo/home/journal/canal de autoridad fuera del mount, symlinks hacia fuera, ruta /proc del host y credencial falsa de entorno. Probar descriptor de canario heredado deliberadamente en el control, pero cerrado en lanzamiento aislado.
- Sockets de filesystem y abstract del host, y listener TCP local falso, sirven como controles. La red offline no es un diseño de acceso a proveedores LLM.
- Un hijo controlado cambia de sesión, ignora SIGTERM y escribe heartbeat. No coopera publicando identidad como requisito de su contención. Al terminar el namespace PID o morir el dueño, comprobar cese físico de esos escritores antes del timeout de seguridad, no por un ACK.
- Cliente descartable puede salir sin matar el sandbox. Una parada del intento debe destruir su namespace, no solo abortar un comando Pi.

No probar comandos destructivos sobre procesos ajenos. Señales solo a procesos lanzados por el instrumento, con identidad verificada. Registrar zombies como terminados y recolectarlos en limpieza. Los resultados no acreditan resistencia ante vulnerabilidades del kernel, pérdida de energía, arbitrariedad completa del código ni montaje de proyectos reales.

## Checkpoint y alcance

Primero raíz mínima y pruebas de permisos con control positivo. Después Pi real y contención del hijo separado. Si el sandbox no arranca o una operación permitida no funciona, declarar fallo/bloqueo sin ampliar mounts al home entero. Una comparación útil vence a añadir capas.

Conservar un probe reproducible y log, no componentes de producción. Credenciales/red para LLM, manifest mínimo de runtime, caches, dependencia de build y capacidades de proyectos reales quedan pendientes aunque los casos offline pasen.
