# Candidato A — Supervisor local con workers Pi por RPC

Candidato de arquitectura; nada aquí está implementado ni autoriza merge, deploy ni cambios en los contratos vigentes.

## Problema

Un coordinador Pi conversacional delega trabajos cuyos workers viven fuera del ciclo de vida del chat, con una única autoridad de estado, un escritor por espacio, fallback y recuperación sin repetición ciega. Hechos que la forma debe respetar: **probado** en Pi 1.2.0, EOF de stdin apaga el proceso, la sesión persiste solo con mensaje `user`/`assistant` y reabrir un ID no recupera evidencia; **probado** en A2A JS 1.3.0, repetir un `messageId` crea dos ejecuciones; **probado** en código, `agent_settled` no acredita éxito. La decisión no es de transporte: es quién posee procesos y estado cuando nadie conversa.

## Uso (vista del coordinador)

El coordinador delega por referencia; el runtime resuelve brief, perfil y configuración (AGT-01). Interfaz conceptual, no CLI definitivo:

```text
iswf delegate <brief-ref> [--profile worker|researcher|reviewer]  -> WorkId (en cola)
iswf status [WorkId]            -> estado, intento, destino, antigüedad, bloqueo
iswf result <WorkId>            -> TechResult (referencias, checks, hallazgos, dudas)
iswf block <WorkId> --reason R --exit-condition C
iswf cancel <WorkId>            -> "solicitada"; confirmada tras comprobar cese
iswf accept <WorkId> --decision <humana>   -> registra Acceptance (no integra)
```

Tres llamadas reales:

1. **Delegar research**: `iswf delegate .briefs/ISSUE-12.md --profile researcher` → `w-7`. El coordinador sigue conversando; luego `iswf status w-7`.
2. **Cerrar intento**: `iswf result w-7` devuelve referencias a artefactos y mapa de lectura; el coordinador redacta el brief siguiente sin repetir parámetros.
3. **Corrección**: el runtime confirma que el escritor anterior ya no actúa, reconcilia y abre `Attempt` nuevo sobre la misma `WorkId`.

## Forma

**Supervisor `iswfd`**: un proceso local, una entrada por proyecto. Posee los procesos Pi hijos (RPC stdin/stdout JSONL), el store de estado, los slots de escritores y el registro de intenciones; única autoridad de escritura de estado. El coordinador lo alcanza por un borde fino (CLI o herramienta MCP única) que parsea a tipos de dominio; el transporte no cruza la interfaz (per boundary-discipline).

### Esquema de datos (conceptual, no compilable)

```ts
Work        = { id, briefRef, profileRef, status, deps, attempts: [AttemptId] }
Attempt     = { id, workId, destination: {model, effort, provider}, workspaceRef,
                instructionVersions, phase, startedAt, lastSeenAt, stopReason? }
TechResult  = { attemptId, briefRev, base, candidate?, artifacts: [Ref],
                checks, findings, uncertainties, recommendedStep }
Acceptance  = { covers: {attemptId, briefRev, candidate}, decision }
Intent      = { attemptId, op, knownRefs, outcome: confirmed|uncertain }
Status      = queued | running | blocked | awaiting_acceptance
            | accepted_pending_integration | completed | canceled
```

Cuatro distinciones que ni una Task A2A ni una sesión Pi reemplazan: **trabajo** (lo autorizado), **intento** (delegación con config e instrucciones fijadas), **resultado técnico** (evidencia referenciada) y **aceptación/integración** (humanas). Un Task o session-id es a lo sumo referencia dentro de un `Attempt`; el dominio vive solo en el store. **TaskStore**: aquí no existe store A2A; si A2A se añade como fachada, su TaskStore es proyección derivada, nunca segunda autoridad (single source of truth). El JSONL de Pi es transcript de solo lectura.

### Flujos

- **Delegación**: validar autorización → resolver config efectiva → espacio exclusivo (worktree + rama) → lanzar Pi con flags fijados → prompt desde referencias; el worker abre brief, perfil y mapa él mismo (AGT-02).
- **Finalización**: `agent_settled` + `stopReason` → cosechar el artefacto de resultado del workspace (no el transcript) → registrar `TechResult`; pasa a `awaiting_acceptance` o `blocked`.
- **Desconexión**: el chat muere; `iswfd` no. Continuidad como propiedad de proceso.
- **Cancelación**: `abort` + `clear_queue` + esperar idle + verificar salida del proceso y descendientes + reconciliar efectos (git, gh); solo entonces libera el espacio. `cancel_requested` hasta confirmación.
- **Recuperación**: por cada intento `running`: verificar identidad del proceso (no un PID aislado), inspeccionar workspace y commits, contrastar `Intent` con efectos reales (¿existe la PR?), reanudar con intento nuevo y brief de reanudación, o bloquear lo irreconciliable (OPS-05).
- **Fallback**: cuota agotada → confirmar que el escritor anterior ya no puede escribir → reconciliar artefactos → nuevo `Attempt` con el siguiente destino aprobado. Los intentos no se reinician al cambiar de proveedor.

### Ownership

| Dato | Único escritor |
| --- | --- |
| Estado operativo (status, attempts, slots, intents) | `iswfd` (store) |
| Workspace, commits, artefacto de resultado | worker asignado, exclusivo |
| Briefs | coordinador (archivos, flujo normal) |
| Aceptación e integración | humano |
| Transcript JSONL | Pi (solo lectura) |
| Panel | vista derivada del store |

### Casos de fallo y límites

Fallo del supervisor: pierde memoria, no el store ni los workspaces; al arrancar reconcilia. Fallo de un worker: no arrastra al supervisor. Efecto externo con respuesta perdida: `Intent` incierto bloquea; no hay exactly-once sobre GitHub. Los límites globales (2 trabajos, 2 ejecuciones delegadas) los aplica el supervisor; los paneles comparten slots (MOD-07). El canal RPC ejecuta bash del lado del cliente, **probado** fuera de la allowlist del modelo; el canal de `iswfd` queda fuera del alcance del worker y del panel.

**Profundidad de interfaz**: seis verbos ocultan propiedad de procesos, resolución de configuración, espacios, fallback, reconciliación de efectos y límites. Al coordinador le queda decidir trabajo, perfil y transiciones.

## Tradeoffs aceptados

- Construir y operar un demonio propio a cambio de continuidad como propiedad de proceso.
- RPC sobre pipes (protocolo probado), no SDK in-process, a cambio de aislar los crashes del worker de la autoridad de estado.
- Reconciliación posible-bloqueante ante incertidumbre a cambio de no duplicar efectos externos.
- Supervisor como código (no Markdown) a cambio de que la metodología siga en skills y perfiles; el runtime solo aporta mecanismos con estado.

## Alternativas consideradas

**Exposición A2A con executor Pi interno** (segunda forma pedida): un servidor A2A por proyecto cuyo `AgentExecutor` controla Pi. El rechazo se apoya en lo vigente y acotado, no en el SDK Python antiguo: la semántica del protocolo — estados terminales de Task que invitan a confundir tarea con cierre técnico, deduplicación por `messageId` no obligatoria (spec 1.0.1), y probes JS que **prueban** duplicación al reenviar (riesgo OPS-04) — y un TaskStore como segunda autoridad o copia sincronizada a mano. Añade servidor y superficie wire/autenticación que v1 local no necesita. Vigencia: `a2a.md` contrastó el SDK Python 1.0.1 (`69273a3…`) y lo explicita; el último release es v1.2.2 (5 de octubre, `2f9e44a…`), cuyos hallazgos específicos no se generalizan: su contraste del critical path y sus pruebas de adopción son la referencia a re-ejecutar contra v1.2.2 antes de decidir. Como fachada futura, el executor sería cliente del supervisor, no dueño.

**SDK in-process** (el supervisor hospeda `AgentSession`): elimina pipes, pero acopla el runtime del agente al proceso dueño del estado; un crash de sesión arrastra la autoridad. Pierde en aislamiento de fallas.

**Background de Pstack**: ligado al ciclo de vida de la sesión; ya analizado, no cumple continuidad por sí solo. Descartado.

## Preguntas abiertas y riesgos

- ¿Supervisor en Node/TS (cerca del SDK) o Python (cerca del probe RPC)? Pendiente del primer hito.
- La detención de descendientes (gh, git) tras `abort` es **inferencia**: ¿basta esperar idle o hace falta matar el grupo de procesos? Prueba integrada.
- ¿Store como JSONL de apéndice o SQLite? Formato diferido; el dominio no cambia por ello.
- ¿Un worktree garantiza un solo escritor frente a un humano curioso? Prueba integrada.

## Pruebas integradas pendientes (hipótesis → demostración)

1. Crash del supervisor con intento `running`: reconciliación sin duplicar efectos (intención registrada, PR existente detectada).
2. Cancelación durante operación externa: descendientes, efectos tardíos, espacio liberado solo tras confirmación.
3. Fallback de cuota con verificación de escritor inactivo y brief de reanudación.
4. Dos trabajos aislados concurrentes dentro de límites; el bloqueo de uno no cancela el otro.
5. Cierre del chat con worker activo; `status` posterior refleja estado real, no estancado.

## Siguiente paso de implementación

Un spike del supervisor que lance un worker Pi RPC sin modelo, sobreviva al cierre del cliente, registre `Work`/`Attempt`/`TechResult` y demuestre la prueba 5 sobre el probe existente.
