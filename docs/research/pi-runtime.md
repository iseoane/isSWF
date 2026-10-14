# Límites de Pi para el runtime de isSWF

Estado: investigación técnica local, no implementación de la factory. Se consulta Pi instalado en la versión 1.2.0. Las conclusiones de documentación, código y ejecución se distinguen expresamente.

## Prueba RPC sin modelo

El script [probes/pi-rpc.py](probes/pi-rpc.py) lanza Pi en un directorio temporal, sin extensiones, MCP, contexto de proyecto ni prompts de modelo. Deshabilita actividad automática de red y telemetría y no pasa variables de credenciales al hijo. Los efectos de shell quedan dentro del directorio temporal y se eliminan al terminar.

```bash
python docs/research/probes/pi-rpc.py
```

Resultado observado:

```text
PASS: correlated state/error responses without a model prompt
OBSERVED: RPC bash writes even with model tool allowlist read,grep,find,ls
PASS: stdin EOF shuts down the Pi process
OBSERVED: a named session with bashExecution but no assistant response has no persisted JSONL
PASS: reopening exact ID does not recover the unpersisted name or bash evidence
Scope: protocol/lifecycle/session checks only; no LLM, chat independence, sandbox or crash recovery proof
```

El comando `bash` del protocolo RPC pertenece al control del cliente. La allowlist de herramientas del modelo no impide que ese cliente ejecute shell. Esto no demuestra que el agente pueda saltarse su allowlist por sí mismo, pero obliga a mantener el canal de control fuera de su acceso y del panel de observación.

Cerrar stdin apaga Pi. Un cliente que vive dentro del chat no consigue independencia de ese chat solo por usar RPC. La propiedad de los procesos y sus pipes necesita un mecanismo cuyo ciclo de vida sea independiente.

La primera versión de la prueba esperaba encontrar un JSONL tras shell y nombre de sesión, sin respuestas de modelo. Esa expectativa falló. La prueba corregida conserva el caso que contradijo la hipótesis y verifica que reabrir el mismo ID no recupera esos datos. La existencia de un ID o evidencia en memoria no acredita durabilidad operativa.

Estas pruebas no consumen cuota para generar respuestas. No demuestran aislamiento del sistema operativo, recuperación tras crash ni calidad del agente. El script comprueba el comportamiento de la versión instalada; si cambia, debe reconciliarse la investigación en vez de alterar la expectativa para conseguir un PASS.

## Fuentes iniciales

La documentación instalada está bajo `/home/iseoane/.pi/agent/install/releases/1.2.0/node_modules/@earendil-works/pi-coding-agent/`.

- `docs/cli.md`: flags efectivos, selección de herramientas y recursos; `pi --help` se contrastó localmente.
- `docs/cli-integration.md`: diferencias de RPC, JSON y SDK.
- `docs/rpc.md`: correlación, eventos y cierre al terminar stdin.
- `docs/sdk.md`: ownership de `AgentSession`, eventos y persistencia de contexto.
- `docs/session-format.md`: JSONL de conversación y tipos de entradas.

El [análisis anterior de Pstack](pstack-agentes.md) explica por qué su background ligado a la sesión no cumple por sí solo la continuidad exigida por isSWF.

El código instalado explica la observación de persistencia: `dist/core/session-manager.js:786–813`, `_hasConversation()` y `_persist()`, crea el archivo cuando aparece un mensaje `user` o `assistant`. Nombre, setup y `bashExecution` no satisfacen ese predicado. No hay que esperar necesariamente a la primera respuesta del modelo; un mensaje de usuario persistido ya activa el volcado. Se ha contrastado directamente ese código, sin ejecutar un prompt de modelo.

El trazado de instrucciones y control fue realizado por dos exploradores separados y un sintetizador con modelo heredado, sin diversidad de modelos. La [explicación de arquitectura y límites](pi-agentes.md) recoge el flujo, referencias de código y requisitos todavía no demostrados. No se ha elegido todavía la arquitectura a partir de estas observaciones.
