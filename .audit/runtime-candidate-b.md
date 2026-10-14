# Candidato B — supervisor RPC local, A2A como vista opcional

## Problema

El runtime debe garantizar lo que nada existente da: worker sin chat, un solo escritor por espacio, recuperación sin repetición ciega de efectos externos, y un estado que separa trabajo, intento, resultado técnico, aceptación e integración. Probado: EOF termina Pi; el `bash` de RPC evade la allowlist del modelo; reabrir un `--session-id` no recupera un JSONL no persistido. En A2A/JS: el envío no bloqueante drena en background, pero retirar el consumidor del stream deja `WORKING` aunque el executor termine, cancelar sin bus marca `CANCELED` sin llamar al executor, y `messageId` repetido crea dos tareas.

**Procedencia.** `a2a.md` fija el SDK Python 1.0.1, anterior a v1.2.2 (commit `2f9e44af…`); no baso el rechazo a A2A en hallazgos de ese Python, incluido el registro activo cacheado. El contraste A2A/JS y la recomendación contrato/Pi siguen válidos, acotados a sus recorridos.

## Uso (vista del coordinador)

El cliente es local; no hay servidor por worker. No pasa modelo, effort, repo ni rutas: solo la referencia del trabajo.

```ts
const sup = abrirSupervisor()                 // separado del chat
await sup.delegar({ work: "W-014" }, brief)   // → { attempt: "A-014-1" }  ACK, no fin
sup.estado({ work: "W-014" })                 // intentos, cierre, aceptación, bloqueo
await sup.cancelar({ attempt: "A-014-1" })    // → detención o incierto
sup.reconciliar()                             // tras reinicio
```

El panel y GitHub son vistas de `WorkState`; el chat pide transiciones.

## Forma

Dos estructuras.

**B1 `RPCsupervisor` (base).** Un proceso dueño (`isswf-run`) fuera del chat: journal en disco, resuelve brief/perfil/configuración, lanza un hijo Pi RPC por intento con worktree y rama exclusivos y conserva el estado. Interfaz local estrecha.

**B2 `A2Aexecutor`.** Un servidor A2A con `AgentExecutor` que supervisa Pi; envío no bloqueante y consulta de estado; `TaskStore` como registro. Añade contrato de cable, auth, versionado y estado duplicado.

**Base: B1**: esconde más capacidad tras una superficie menor y no duplica estado. De B2 se injertan el vocabulario de intentos y el patrón envío-no-bloqueante + consulta, ya cubierto por `delegar`/`estado`. A2A queda como adaptador opcional: `Task` se proyecta desde el journal.

**Distinciones.** El journal manda. `Task`, sesión Pi, panel y etiquetas son vistas. `WorkState.aceptacion` no es `Task.COMPLETED`; `Resultado` no es cierre técnico; `integracion` la confirma el humano.

### Esquema conceptual (no compilable)

```ts
type WorkId = string; type AttemptId = string
type BriefRev = { work: WorkId; rev: number; digest: string }
type Brief = { work: WorkId; rev: BriefRev; goal: string; scope: string; excl: string[]
  aceptacion: Criterio[]; refs: Ref[]; perfil: PerfilRef; checks: CheckRef[]
  repo: string; base: CommitSha; auth: AuthRef; dependsOn: WorkId[]; cadencia: Cadencia }
type Efecto = { intencion: string; work: WorkId; ids: string[]; resultado?: "confirmado" | "incierto" }
type Resultado = { attempt: AttemptId; briefRev: BriefRev; base: CommitSha; candidato?: CommitSha
  artefactos: Ref[]; evidencia: Evidencia[]; hallazgos: Hallazgo[]; dudas: string[]; bloqueo?: Bloqueo }
type AttemptState = { t: "en_cola" } | { t: "ejecutando"; pid: number; destino: { proveedor: string; modelo: string; effort: Level } }
  | { t: "detenido"; motivo: string } | { t: "incierto" } | { t: "terminado"; resultado: Resultado }
type WorkState = { work: WorkId; briefRev: BriefRev; intentos: AttemptId[]; activo?: AttemptId
  cierre?: { candidato: CommitSha; rev: ReviewRef }
  aceptacion?: { candidato: CommitSha; por: string; cuando: Fecha }
  integracion?: { pr: string; merge: CommitSha }
  bloqueo?: { motivo: string; responsable: string; salida: string } }
interface Journal {                                  // autoridad única
  intencion(e: Efecto): EfectoId
  confirmar(id: EfectoId, r: { estado: "confirmado" | "incierto"; dato?: string }): void
  works(): WorkState[]; intento(a: AttemptId): AttemptState; pendientes(): Efecto[] }
interface Supervisor {                               // superficie pública
  delegar(w: { work: WorkId }, b: Brief): Promise<{ attempt: AttemptId }>
  estado(w: { work: WorkId }): WorkState
  cancelar(a: { attempt: AttemptId }): Promise<Detencion>
  reconciliar(): Informe
}
```

### Ownership

| Dato | Dueño | Otros |
|---|---|---|
| Journal y transiciones | supervisor | el coordinador lee o pide |
| Worktree/rama | un intento; se libera tras `detenido` | nadie más escribe |
| Brief, perfil, skills | coordinador; digest al iniciar | inmutable por intento |
| JSONL de sesión Pi | hijo Pi, por intento | vista, nunca autoridad |
| Resultado | escritor del intento | supervisor lo registra |
| Cierre técnico | coordinador (resultado + revisión) | aceptación: operador; integración: humano |
| Panel y `Task` A2A | proyección de `WorkState` | no se escriben |

Inferencia: la allowlist de Pi no es sandbox; el canal RPC queda fuera del modelo.

## Flujo

**Delegación.** Brief y autorización → `delegar`; el supervisor valida configuración, crea el worktree, registra la intención antes de efectos y arranca Pi. El resultado llega por journal.

**Finalización.** `agent_settled` no implica éxito → mensajes finales, `stopReason` y herramientas → `Resultado` → `terminado`. Cierre y aceptación son posteriores.

**Cierre del chat.** No afecta al supervisor: los hijos Pi siguen.

**Cancelación.** `abort` + `clear_queue` → confirmar proceso y descendientes muertos y sin escrituras → `detenido`; si no → `incierto`, que bloquea otro escritor.

**Recuperación.** El journal decide: adoptar procesos vivos solo con identidad verificable, buscar todo efecto `incierto` antes de repetir, o bloquear. Ni PID ni log son estado actual.

## Límites y fallos

Cuota o transporte caído → siguiente destino aprobado, con motivo visible. Credencial, permiso o configuración incompatible → bloqueo. Test fallido o hallazgo → se resuelve en el intento, sin fallback. Destinos agotados o ciclo sin progreso → bloqueo. Dos slots; esperar humano no consume slot. Un intento por espacio; `incierto` impide liberarlo. Sin exactly-once sobre GitHub: intención, IDs y reconciliación antes de reintentar.

## Tradeoffs aceptados

- Journal propio a cambio de no arrastrar servidor, transporte y estado duplicado.
- Un supervisor que sobrevive al chat a cambio de que el chat no sea requisito.
- ACK sin finalización, a cambio de no bloquear la conversación ni mentir.
- `incierto` como estado, a cambio de prohibir repeticiones ciegas.

## Alternativas consideradas

- **B2 A2A como base:** superficie mayor (transporte, auth, versión, tarjeta) que expone complejidad al coordinador sin resolver recuperación ni escritor único.
- **SDK in-process:** el proceso Pi muere con el chat.
- **Pstack existente:** su background ligado a sesión no acredita vida propia.
- **Un servidor por worker:** descartado; multiplica superficie sin garantía nueva.

## Preguntas abiertas y riesgos

- ¿Journal en SQLite o ficheros atómicos append+fsync?
- ¿Cómo verificar identidad del proceso Pi tras reinicio sin PID?
- ¿Qué timeout y límite de intentos se calibran con casos reales?
- ¿A2A como adaptador de interoperabilidad o descartado en v1?
- Riesgo: tratar Engram o el panel como autoridad reintroduce la sincronización manual.

## Pruebas pendientes

Probado: EOF apaga Pi; `bash` RPC evade la allowlist; sin mensaje user/assistant no hay JSONL; envío A2A no bloqueante drena; el camino streaming puede dejar `WORKING`; `messageId` no deduplica. Pendiente (prueba integrada): continuidad y recuperación tras reinicio con intento en curso; cese real de proceso y descendientes al cancelar; reconciliación de un efecto externo con respuesta perdida; delegación duplicada sin doble escritura; versión de skills fija durante un intento; aislamiento efectivo de capacidades por perfil. Las afirmaciones sobre Python v1.2.2 quedan sin verificar aquí.

## Siguiente paso

Esqueleto del supervisor con journal en disco y `delegar`/`estado` sobre un hijo Pi RPC de prueba, sin modelo, demostrando cierre de chat + reinicio + cancelación confirmada.
