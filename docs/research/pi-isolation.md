# Aislamiento offline de workers y reviewers

Estado: experimento ejecutado, repetido y revisado independientemente sin bloqueantes para los casos ensayados. No es un sandbox de producción ni una factory implementada. Se usaron solamente canarios ficticios, sin credenciales reales, instalaciones ni cambios de configuración.

## Decisión y alternativas

El [spike de ciclo de vida](pi-lifecycle.md) mostró que un hijo separado podía sobrevivir al abort de Pi. Este experimento compara un control sin aislamiento con dos perfiles Bubblewrap: worker con candidato writable y reviewer con candidato readonly y scratch separado.

Bubblewrap 0.12.0 ya estaba instalado en esta máquina Linux 7.1.9. El preflight confirmó namespaces disponibles. `systemd-run` también está disponible, pero no se ejecutó ni se compara como solución probada: contener procesos mediante cgroups no sustituye las restricciones de archivos.

El resultado respalda seguir usando mecanismos existentes de Linux, en lugar de implementar seguimiento de cada hijo como única barrera. La metodología seguirá en Markdown. Ningún comando o perfil de este probe se adopta todavía como API de la factory.

## Qué se ejecutó

El [instrumento](probes/pi-isolation.py) y su [log final](probes/pi-isolation.log) conservan los casos. La fuente ejecutada tiene SHA-256 `afb6c8b6c729297664e3f2cc9645ae505f4b0a1c4ee4c19d780b6dd469a3f1e6`. El log final contiene 195 comprobaciones correctas. El revisor GPT 6.1 repitió `all` dos veces, con 195 comprobaciones correctas en cada ejecución, y reprodujo el rechazo de la mutación de scratch. El [dictamen técnico](../../.audit/isolation-technical-review.md) y los [logs independientes](../../.audit/isolation-independent-all-1.log) conservan esa evidencia. La [auditoría del rastro](../../.audit/isolation-trail-review.md), realizada con GPT 6, no encontró un PASS global sin prueba en los mensajes examinados. Se construyó en `/tmp/isswf-isolation-spike.v3JOF0`; las ejecuciones conservadas crean sus fixtures en directorios temporales.

La raíz del sandbox contiene runtime montado readonly, `/proc` propio y espacios temporales. Se separan namespaces user, PID, red, IPC y UTS; se eliminan capacidades y entorno heredado. El launcher cierra descriptores salvo stdio deliberado. No se montan el home real ni archivos privados de autoridad.

Para Pi se montan Node 26.8.1 y los node_modules públicos de Pi 1.2.0 en rutas del runtime. Se ejecuta su CLI real en RPC, sin extensiones, MCP, contexto de proyecto ni prompts de modelo. No se copia la configuración de autenticación del usuario.

`/work` es writable para el worker y readonly para el reviewer. Scratch empieza vacío, sin aliases writable ni hardlinks al candidato. La raíz restante se remonta readonly. Esto describe el fixture controlado, no valida orígenes de mounts de cualquier proyecto.

## Observaciones de permisos

El control sin aislamiento accede efectivamente a archivos privados ficticios, una credencial de entorno, un descriptor de archivo deliberadamente heredado y listeners falsos. Por tanto, la ausencia observada dentro del sandbox no se explica por canarios inexistentes o servicios que nunca arrancaron.

En ambos perfiles aislados, las lecturas y escrituras de archivos privados y journal falsos fallan con ENOENT. Fallan también los symlinks absolutos y relativos que apuntan fuera del mount, y las rutas de `/proc` que intentan alcanzar al supervisor del fixture. El `/proc` propio sigue disponible.

La credencial falsa de entorno no aparece dentro. El descriptor 77, heredado deliberadamente en el control, devuelve EBADF en el sandbox. Su valor tampoco se transmite como expectativa en argv ni en el comando Bash aislado. El instrumentador comprueba esto antes de ejecutar.

Los sockets de filesystem externos resultan inaccesibles. La conexión al socket abstract del host falla con ECONNREFUSED. El listener TCP local ficticio también resulta inaccesible desde el namespace de red separado. Estos son casos offline, no una política de acceso a proveedores.

El worker lee y modifica archivos del candidato. El reviewer puede leerlo, copiarlo a scratch, compilar esa copia y ejecutar su comprobación de comportamiento, cuyo resultado es `10`. Los intentos de escribir, borrar o cambiar permisos en el candidato, por ruta directa y alias, fallan con EROFS. Sus hashes y modos originales permanecen iguales.

Las mismas comprobaciones se ejecutaron mediante comandos Bash del Pi RPC real en ambos perfiles. El canal RPC lo conserva el proceso externo. Se ensayó la inaccesibilidad de canales de autoridad ficticios; no un protocolo de autorización de la factory ni resistencia a mensajes RPC falsificados.

## Contención de procesos

Un dueño separado del cliente inicia el sandbox. El cliente sale y el dueño permanece vivo; siguen creciendo los archivos de actividad de dos writers. Uno usa `setsid` e ignora SIGTERM. No publica su identidad al dueño como requisito para que la contención funcione.

El observador identifica el namespace del bwrap del intento actual. En una variante envía SIGKILL a su PID1 desde fuera. Los writers terminan y los archivos dejan de crecer antes de la limpieza auxiliar. El dueño sigue vivo. En la otra variante muere el dueño y `--die-with-parent` termina la cadena de contención y sus writers.

El cese se comprueba con identidades host y ausencia de nuevas escrituras. Un zombie es un proceso terminado; después se recolecta y se comprueba ausencia. La prueba se completa con al menos cinco segundos de margen respecto al timeout de seguridad de 30 segundos, sin contarlo como cancelación.

Esta carga de lifecycle es Python controlado, no Pi con un run de modelo. Se ensayó Pi en los casos de permisos, pero no se juntaron ambos experimentos en una ejecución Pi con hijos separados. Tampoco se probó que abortar Pi, por sí solo, destruya el namespace. El reaper de Bubblewrap puede permanecer mientras queden procesos; la parada debe controlar el contenedor del intento.

## Correcciones del instrumento

Antes de aceptar el resultado se detectaron y corrigieron cuatro defectos del probe:

1. Un error ENOENT en una escritura permitida de scratch se contaba como denegación correcta. Una mutación mínima reprodujo el falso PASS; ahora cada caso declara éxito o errores permitidos. La misma mutación es rechazada.
2. Un evento `bash_execution_update` compartía id con el comando. El probe lo confundía con respuesta. Ahora correlaciona por `type: response` e id.
3. La ejecución conjunta incluía namespaces de ensayos anteriores. Seleccionaba un PID1 equivocado. Ahora la selección pertenece al árbol del bwrap actual; dos ejecuciones completas consecutivas comprobaron esa corrección.
4. El valor de la credencial falsa se incluía como expectativa en argumentos del helper. Ahora el sandbox recibe rutas y `token: null`, no esos bytes.

Estos fallos no se presentan como escapes de Bubblewrap ni como defectos de Pi. La evidencia y correcciones quedan registradas localmente en `.audit/isolation-findings.md`; no hay tracker remoto autorizado. El [control de mutación](../../.audit/isolation-control-check.py) permite repetir el rechazo del falso positivo.

## Límites y siguiente decisión

Los resultados no acreditan resistencia ante exploits del kernel, código hostil arbitrario, fork bombs ni consumo general de recursos. No hay límites de procesos mediante cgroups ni política seccomp ensayada. Los límites y timeouts del instrumento protegen estos casos, no certifican builds arbitrarios.

La comprobación llamada `root-write` intenta escribir en `/usr`, no en cada ruta de la raíz. FD77 demuestra la denegación de ese descriptor, no la ausencia universal de capacidades mediante stdio o runtime público. El mount readonly de `/usr` y del runtime público es amplio. Una implementación tendrá que validar qué expone y cómo fija sus recursos. No se probaron mounts proporcionados por clientes, hardlinks externos, cambios concurrentes del candidato, registros corruptos ni ventanas de arranque.

La red separada y HOME vacío impiden usar directamente la autenticación habitual de Pi para llamadas LLM. El acceso al modelo debe resolverse sin exponer credenciales a las herramientas. Este probe no elige un broker, proxy ni adaptación SDK, y no sería suficiente activar red y montar auth.json para dar por solucionada esa frontera.

La carga experimental no usa modelos ni servicios remotos. Autoría y revisión siguen restringidas a OpenAI GPT 6 y 6.1. No se demuestra integración del chat real, recuperación tras reinicio, una entrega de producto o cumplimiento completo de SEC/OPS.

La repetición completa es `python docs/research/probes/pi-isolation.py all`. Requiere las versiones y rutas locales de Node y Pi fijadas en el probe, Bubblewrap y Python con pidfd. No es un instalador portable.

Mantener como candidata la combinación de dueño externo, Pi RPC y contención OS existente. Ya puede concretarse S01, que prepara y muestra encargos sin ejecutar código de un cliente. S02 debe cerrar antes su contrato de red, autenticación, recursos y capacidades reales. A2A integrado sigue pendiente y no bloquea esta decisión local.
