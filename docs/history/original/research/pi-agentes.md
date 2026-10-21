## Overview

**Pi permite controlar workers desde un programa mediante RPC o SDK; no convierte ese control en una factory durable ni garantiza el cumplimiento de skills.** Hay tres planos distintos: ejecución del agente, historial conversacional y aceptación del trabajo. Confundirlos produce falsas garantías de recuperación y finalización.

Esta síntesis contrasta los exploradores con **Pi 1.2.0 instalado**. Distingo **código**, **probe documentado** e **inferencia**. No reejecuté el probe, lancé agentes ni modifiqué archivos. Modelo heredado; sin diversidad de modelos.

En las referencias, **P** es `/home/iseoane/.pi/agent/install/releases/1.2.0/node_modules/@earendil-works/pi-coding-agent`.

## Concepts

- **Worker:** una sesión de agente, alojada en un proceso Pi mediante RPC o dentro del programa anfitrión mediante SDK.
- **Controlador:** quien mantiene el proceso y sus canales, envía instrucciones, consume eventos y decide qué constituye una entrega aceptable.
- **`AgentSession`:** gestiona instrucciones, herramientas, colas, retries, compactación y cancelación.
- **`SessionManager`:** conserva entradas y reconstruye contexto conversacional. No es un registro durable de trabajos.
- **Skill:** procedimiento escrito. Su disponibilidad, incorporación al contexto y cumplimiento son propiedades diferentes.
- **Herramientas:** hay que distinguir las registradas, las declaradas al modelo y las invocables indirectamente.

## Flow

### 1. Preparación y control

**Código.** `createAgentSession()` combina cwd, configuración, recursos, modelo, herramientas y contexto previo (`P/dist/core/sdk.js:69–158,253–327`). El SDK comparte el proceso anfitrión; RPC expone una sesión mediante stdin/stdout JSONL.

El controlador RPC puede consultar estado y mensajes, enviar `prompt`, `steer` o `follow_up`, cancelar, limpiar colas y cambiar de sesión. Debe consumir stdout continuamente y correlacionar respuestas con IDs; los eventos no constituyen respuestas individuales a cada petición.

```text
Controlador ── comando + ID ──► Pi RPC / AgentSession
Controlador ◄─ respuesta ────── aceptación o rechazo
Controlador ◄─ eventos ──────── mensajes, herramientas, asentamiento
                                   │
                                   ▼
                             SessionManager
                          historial condicionado
```

**Código.** `prompt` devuelve una disposición: `started`, `queued` o `handled`. Esta última significa que una extensión consumió la entrada; puede no existir un run posterior. **El ACK no acredita finalización ni persistencia** (`rpc-mode.js:298–323`; `agent-session.js:1601–1664`).

### 2. Incorporación de skills

**Código.** El catálogo incluye nombre, descripción y ruta, no el cuerpo completo (`skills.js:249–302`). La elección automática depende del modelo.

`/skill:nombre` lee el archivo e incorpora su cuerpo sin frontmatter. No sigue recursivamente sus referencias ni comprueba los pasos ejecutados. Si el nombre no existe o falla la lectura, pasa el texto original (`agent-session.js:1697–1720`).

Una instrucción base personalizada tampoco elimina automáticamente contexto de proyecto o catálogo (`system-prompt.js:67–119`). El parser instalado no conserva `allowed-tools` como restricción ejecutable.

Por tanto, **skills-first puede describir cómo orientar al worker, pero todavía no certifica cómo trabajó**.

### 3. Ejecución y finalización

**Código.** El run puede encadenar herramientas, retries, compactación y continuaciones de extensiones. `agent_end` puede ser una frontera intermedia. `agent_settled` señala que terminó la continuación automática de ese run y comunica `aborted`; **no demuestra éxito funcional** (`agent-session.js:684–706,1391–1544`).

Para evaluar el resultado hacen falta mensajes finales, `stopReason`, resultados de herramientas y verificaciones del producto.

`abort()` cancela y espera idle, pero no elimina las colas: retirarlas exige `clear_queue` (`agent-session.js:1941–1958`; dispatcher RPC).

### 4. Persistencia y recuperación

**Código.** La creación normal de sesión reserva ID y ruta, pero retrasa el archivo hasta encontrar un mensaje de rol **`user` o `assistant`**. Entonces escribe las entradas acumuladas; después añade entradas (`session-manager.js:691–715,786–820`).

Esta precisión corrige la formulación «hasta el primer assistant»: **un user persistido basta**. El nombre de sesión y `bashExecution`, por sí solos, no bastan. Tampoco un prompt rechazado antes de iniciar garantiza ese user.

**Probe documentado.** El script corregido confirma:

- respuestas de estado/error correlacionadas, sin prompt LLM;
- RPC `bash` escribe aunque la selección del modelo sea `read,grep,find,ls`;
- EOF termina Pi;
- nombre y evidencia Bash, sin user/assistant, no generan JSONL;
- reabrir el mismo ID no recupera esos datos.

El probe actual está en `docs/research/probes/pi-rpc.py`; la referencia inicial del explorador a una prueba fallida quedó desactualizada.

**Código.** Si no encuentra archivo para `--session-id`, Pi crea una sesión nueva con ese ID (`main.js:344–351`). Restaurar reconstruye contexto disponible; no resucita procesos ni continúa automáticamente una herramienta interrumpida.

## Location

| Qué consultar | Archivo |
|---|---|
| Dispatcher, respuestas y cierre RPC | `P/dist/modes/rpc/rpc-mode.js` |
| Runs, skills, herramientas y estadísticas | `P/dist/core/agent-session.js` |
| Creación SDK y restauración de contexto | `P/dist/core/sdk.js` |
| Persistencia diferida y árbol conversacional | `P/dist/core/session-manager.js` |
| Sustitución de sesión y servicios | `P/dist/core/agent-session-runtime.js` |
| Catálogo e instrucciones | `P/dist/core/{skills,system-prompt,resource-loader}.js` |
| Evidencia local corregida | `docs/research/pi-runtime.md`, `docs/research/probes/pi-rpc.py` |

## Gotchas y lo que falta

### Límites demostrados

**Código.** EOF dispone el runtime y termina el proceso (`rpc-mode.js:578–653`). Cambiar de sesión aborta la anterior, emite `session_shutdown` y sustituye sesión/servicios: las suscripciones necesitan reengancharse (`agent-session-runtime.js:103–169`). Usar RPC no aporta por sí solo independencia del controlador.

La selección de herramientas tampoco es un sandbox:

- `defaultTools` selecciona herramientas iniciales, no impone una allowlist permanente.
- Una allowlist que no nombre MCP conserva ciertas herramientas MCP para acceso indirecto.
- Una extensión puede sustituir una herramienta permitida usando el mismo nombre.
- RPC `bash` pertenece al canal del controlador y no pasa por la selección de herramientas del modelo.

Referencias: `agent-session.js:1120–1153,2840–2922`; `rpc-mode.js:439–460`. **No es evidencia de que el modelo haya eludido su allowlist.**

El SDK tampoco reproduce automáticamente la negociación de confianza CLI: la configuración asume proyecto confiable si no se especifica (`settings-manager.js:238`).

### Requisitos pendientes — inferencia, no elección arquitectónica

Para afirmar «factory durable skills-first» aún habría que definir y demostrar:

1. **Continuidad:** propiedad de procesos y canales independiente del chat; comportamiento ante cierre, reinicio y crash.
2. **Estado operativo durable:** aceptación, intentos, cancelaciones y resultados recuperables, sin usar el transcript como sustituto.
3. **Recuperación de efectos:** qué se repite, cómo se detecta trabajo parcial y cómo se evita duplicarlo. Retry no acredita idempotencia.
4. **Contrato skills-first verificable:** recursos/versiones efectivos, evidencia de incorporación y gates que comprueben resultados.
5. **Permisos efectivos:** control de extensiones, MCP, shell, archivos y red, separado del rol textual del worker.
6. **Aceptación y presupuesto:** éxito funcional independiente de `agent_settled`, y límites que incluyan retries, compactación y solicitudes auxiliares.

El probe no demuestra crash recovery, obediencia del modelo ni aislamiento. La comparación Pstack procede de un snapshot fijado, no verifica el port actual. **Estas son brechas de contrato y evidencia; no seleccionan una arquitectura.**
