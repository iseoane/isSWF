### Overview — objetivo

Modelo de esta sesión: **OpenAI `gpt-6.1-sol`**, sin sustitución. No he modificado archivos ni ejecutado el spike.

El experimento debe separar **desconexión del chat**, **detención del worker** y **caída del supervisor**. RPC no proporciona continuidad por sí solo: depende de quién mantiene los pipes. Esto verifica el diseño previo, no implementa una factory.

### Key concepts — distinciones

- **Cliente conversacional:** puede desaparecer sin cerrar stdin de Pi.
- **Supervisor externo:** conserva stdin y drena stdout/stderr continuamente; después atiende otra consulta.
- **Identidad Linux:** `(boot_id, PID, starttime)` identifica una ejecución, no solamente un número reutilizable.
- **Detención confirmada:** Pi y todos los escritores identificados han cesado. Un ACK, `isStreaming:false` o un heartbeat inmóvil no bastan.

### How it works — prueba mínima

1. **Preparación.** Reutilizar el entorno aislado y flags de `docs/research/probes/pi-rpc.py`: directorio temporal, configuración propia, offline, telemetría desactivada, sin credenciales, extensiones ni MCP. No enviar `prompt` ni `compact`; ninguna publicación.

2. **Trabajo controlado.** El supervisor envía, terminado en LF:

   ```json
   {"id":"work-1","type":"bash","command":"printf '%s\\n' \"$$\" > worker.pid; while :; do date +%s%N >> heartbeat; sleep 0.2; done"}
   ```

   Mantener este comando en primer plano, con plazo máximo de limpieza externo. El lector RPC debe ser independiente de quien espera respuestas: `bash` responde **al terminar**, no al arrancar. Así puede enviarse `get_state` mientras continúa.

3. **Desconexión y consulta.** Desconectar únicamente el cliente conversacional. Comprobar que siguen las mismas identidades y crece `heartbeat`. Reconectar y consultar mediante el supervisor existente. Contrastar RPC con `/proc` y archivos; `get_state` no acredita actividad Bash.

4. **Parada.** Solicitar `abort_bash`, comprobar cese del comando y descendientes; cerrar después stdin y esperar la salida real de Pi. Confirmar ausencia de escritores y estabilidad del archivo. Registrar incertidumbre si falta evidencia.

5. **Crash/reinicio.** Matar y reiniciar el supervisor después de la parada verifica reconciliación de un intento terminado. **No demuestra recuperación con trabajo activo**: hace falta otra ejecución donde caiga durante el heartbeat, incluyendo un descendiente con `setsid`.

Guardar previamente las identidades de supervisor, Pi y escritores. Al recuperar, comparar `boot_id` y campo 22 de `/proc/PID/stat`; analizarlo respetando el nombre entre paréntesis. Si no coinciden, **no señalar ese PID**. Para evitar la carrera entre comprobación y señal, abrir un **pidfd**, validar la identidad y señalar mediante ese descriptor.

### Where things live — referencias

- `docs/arquitectura-candidata.md`: «Recorrido y fallos» y «Siguiente unidad».
- `docs/research/pi-runtime.md` y `pi-agentes.md`: EOF, persistencia y límites.
- Pi instalado, `docs/rpc.md` —leído completo— y `rpc-commands.md#bash`, `#abort_bash`.
- `dist/core/tools/bash.js`: shell separado; `dist/utils/shell.js:157`: limpieza por grupo.

### Gotchas — trampas

**Sí, un hijo con `setsid` puede sobrevivir al supervisor**: morir el padre no lo mata; EOF puede detener Pi, pero su limpieza por grupo no alcanza otro grupo. Tampoco basta buscar descendientes después de su reparentado.

El probe actual cierra stdin deliberadamente y espera respuestas secuencialmente: no prueba independencia conversacional. Su JSONL puede ni existir sin mensajes user/assistant; no usarlo como autoridad ni restauración de procesos.
