## Resumen

**Es un candidato razonable para el spike, no una garantía demostrada.** Leí `docs/arquitectura-candidata.md`, `docs/research/pi-lifecycle.md`, `bwrap --help` y el manual local completo de **bwrap 0.12.0**. No ejecuté el experimento, modifiqué archivos, accedí a credenciales ni usé red o subagentes.

El spike anterior mostró que un hijo separado mediante `setsid` sobrevive a abort y pérdida de pipes. La siguiente pregunta es si desaparece al destruir **su namespace PID**, además de quedar limitado a los archivos autorizados.

## Mecanismo

El **dueño permanente**, no el cliente conversacional, lanza bwrap con `close_fds=True`, únicamente stdio deliberado, y:

`--unshare-pid --unshare-net --unshare-user --new-session --die-with-parent --clearenv --proc /proc`

Bwrap crea una raíz vacía sobre tmpfs y un namespace de mounts. Construir solamente:

- `/usr` readonly y enlaces mínimos compatibles para bibliotecas/binarios.
- Runtime público de Pi: `/home/iseoane/.pi/agent/install/releases/1.2.0/node_modules` → `/runtime/node_modules`, readonly.
- Node concreto: `/home/iseoane/.local/share/mise/installs/node/26.8.1/bin/node` → `/runtime/node`, readonly.
- Fixture `/work`: rw para worker; ro para reviewer.
- `/buildscratch`, `/tmp` y HOME desechables, sin alias writable del candidato.

No montar `/home` entero, estado Pi, credenciales, journal ni socket supervisor. Fijar explícitamente cwd, PATH y HOME; el manual exceptúa PWD de `--clearenv`. Comprobar dependencias del runtime, sin ampliar mounts indiscriminadamente.

**`setsid` cambia sesión/grupo, no namespace PID.** Cuando muere su PID 1, Linux mata los demás procesos del namespace, incluidos hijos separados y namespaces PID descendientes. Esto no equivale a matar el grupo de una shell. Tampoco debe suponerse que salir Pi destruye inmediatamente PID 1: el manual describe un reaper y su salida cuando no quedan procesos; hay que observarlo.

`--die-with-parent` vincula la cadena bwrap al padre. Si ese padre es el cliente, cerrar el chat corta el trabajo; debe ser el dueño permanente. `--new-session` separa el terminal, no proporciona limpieza general.

## Controles mínimos

**Positivos:**

- Worker lee fixture y escribe únicamente donde está permitido.
- Reviewer lee candidato y ejecuta una comprobación desde copia en buildscratch; hashes originales permanecen iguales.
- Hijo `setsid`, con heartbeat falso, sigue activo tras salir el cliente.

**Negativos y limpieza:**

- Cancelar el intento y matar al dueño: confirmar cese de heartbeats e identidades host, antes del timeout de seguridad; registrar zombies por separado.
- Probar lectura/escritura de canarios externos, symlinks absolutos/relativos y rutas alias. Validar también symlinks en los **orígenes** de mounts: podrían montar externamente algo no autorizado.
- Intentar acceso mediante `/proc/PID/root`, `/proc/PID/fd`, raíz anterior y FDs heredados de archivo, directorio o socket ficticios. Inventariar FDs efectivos.
- Socket Unix filesystem externo inaccesible; abstract del host aislado por namespace net. Un socket filesystem montado podría seguir siendo accesible pese a `--unshare-net`.
- Controles debilitados deliberadamente deben permitir el canario correspondiente.

## No adopción

Readonly protege ese mount, **no es un sandbox universal**. Fugas, aliases, namespaces adicionales, recursos ilimitados y ventanas de arranque siguen pendientes.

`systemd-run --user` con limpieza del cgroup contiene descendientes para lifecycle; no aporta seguridad filesystem equivalente.

`--unshare-net` deja este spike offline: **no resuelve autenticación ni red para LLM**. Credential broker futuro, sin implementarlo aquí.
