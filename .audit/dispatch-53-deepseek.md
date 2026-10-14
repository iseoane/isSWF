# Revisión independiente #53 — informe

**Readonly cumplido:** no escribí ni commiteé nada en el repo, no lancé subagentes ni dispatch real. Usé dos directorios desechables en `/tmp` para reproducir el diff canónico, ya borrados. D/E/F son ejercicios **textuales** sobre el candidato, no runtime.

## 1. Identidad e integridad — PASS

| Dato | Valor |
|---|---|
| Base revisada | `a64068cf8536579eeb823b076babdaf4c33cca72` (HEAD/main, coordinator idéntico al blob `ba52cf14…` y sha256 `7908e552…`) |
| Candidato | `.audit/dispatch-53-candidate/SKILL.md`, sha256 `f369fb7faae8fe408734080ede62d8a83d37c76076a84b3d0cd878376faaf32b` — coincide con el esperado |
| Delta real | 1 hunk: **9 líneas añadidas, 0 eliminadas**, insertadas en candidato 61–69; el resto byte-idéntico. Sin errores de whitespace, newline final presente |
| `candidate.diff` proyectado | sha256 `568fb9c697a0c1d2e37210c62ac9078a7418b1feb9b556738ff4b9a58050ac8c` |
| Snapshot proyectado | `2dc5810d80acc69c0f4a2549137f796a7c531762cdd15aee81616d99b77b49f0` |

Método de snapshot validado contra el fixture retenido: reproduje su `candidate.diff` **byte a byte** (`7e269ec0…`) y su digest (`21efbb05…`) con el algoritmo de `verify-reviewer-snapshot.mjs`, mapeando la ruta objetivo `.agents/skills/isswf-coordinator/SKILL.md`.

## 2. Ejes

**Standards — PASS** (2 sugerencias)
- Ubicación y estilo coherentes con §5 ("Decide si puedes despachar"), términos del GLOSSARY (worker, candidato, evidencia) y registro impersonal del documento.
- Alineado con `execution-principles.md` (Ownership, Reintentar reconciliando, Autonomía dentro del encargo) y con `spec-v1.md` OPS-05 (identidad incierta bloquea otro escritor), OPS-08 (ningún espacio con dos escritores) y la contabilidad de límites/attempts.
- El descargo de línea 68 es correcto y consistente con el preámbulo de la skill y el perfil reviewer: instrucción ≠ sandbox.

**Spec — PASS**
El encargo verificable (incidente + prompt): reconciliar identidad/ownership/estado/autorización antes de reintentar/reanudar/reemplazar; no confundir workers activos con el **total autorizado de workers distintos**; `total1` no se libera por inactividad; trabajo independiente ya autorizado con ownership/checkout propios y dentro del límite no se detiene; sin promesa de enforcement por Markdown.
- Línea 61 cubre reconciliación, contabilidad total y la excepción de trabajo independiente.
- Líneas 63–65 cubren activo / `completed` / `unknown`-error con la decisión correcta en cada caso.
- Línea 66 cubre fallo confirmado: inspección del parcial, reemplazo solo con salida confirmada + autorización dentro del límite, y la regla explícita `total1` ≠ reciclar por inactividad.
- Línea 68 evita la sobreafirmación de enforcement.

## 3. Ejercicio D/E/F (solo texto del candidato; sin metadata real)

**(D) W failed, salida confirmada, partialpatch, total1 consumido → ningún despacho justificable**
- Reconciliación: W es el único worker distinto autorizado y su total está consumido; estado `failed` (no activo).
- La línea 66 exige salida confirmada **y** autorización restante: esta última falta. No sé si el parcial satisface aceptación (no hay metadata real).
- Acciones: (1) inspeccionar parche parcial y efectos de W con evidencia; (2) conservar su ownership/checkout hasta terminar la inspección; (3) si el trabajo puede completarse, la vía que no crea worker distinto es continuar con el mismo actor —el texto no la prohíbe, pero tampoco la autoriza expresamente, ver S2—; (4) si hiciera falta otro worker, bloquear y pedir autorización explícita al operador. **No devuelvo argumentos porque no hay llamada justificable.**

**(E) Igual que D pero grant total2 → reemplazo justificable tras inspección, condicionado al preflight §5**
- Reconciliación: 1 de 2 workers distintos consumido; queda autorización. Tras inspeccionar el parcial, la línea 66 permite **un** worker nuevo.
- Acciones: verificar si el parcial cierra la unidad; si no, preparar brief de reanudación (referencias y revalidación de base/candidato/evidencias, OPS-06) y despachar un solo worker. No reanudar W y despachar otro a la vez sobre la misma unidad.
- Argumentos exactos **si el preflight §5 se confirma** (no lo confirmé; no invento disponibilidad):
```
agent({
  description: "Unidad <X>: completar tras fallo confirmado de W",
  subagent_type: "pstack:poteto-agent-high",
  model: "openai-codex/gpt-6-luna",
  prompt: "<ruta .agents/roles/worker.md> + brief: actor = nuevo worker W2; identidad y parche parcial del intento W; unidad autorizada X; checkout exclusivo propio; alcance/exclusiones; permisos de escritura; grounding; comprobaciones; modelo y esfuerzo efectivos; revalidar brief/base/candidato/evidencias; no crear subagentes ni ampliar alcance",
  isolation: "worktree"   // coherente con "checkout exclusivo"; no lo ordena el skill literalmente
})
```
- Con high implícito/exigido por `pstack:poteto-agent-high`. Si el §5 no está confirmado, el despacho queda bloqueado sin fallback.

**(F) W activo en unidad A; unidad B independiente autorizada, checkout propio, grant total2 → despacho de B justificable**
- Reconciliación: 1 activo (A) con total 2; B es independiente y cabe. La última frase de la línea 61 no detiene ese trabajo.
- Acciones: confirmar independencia real de B (sin archivos/efectos compartidos con A) y su autorización explícita; mantener a W con A sin reanudar ni reemplazar; despachar B en su checkout exclusivo. El slot de B procede del total autorizado, no de liberar el de W.
- Argumentos exactos (mismo preflight §5):
```
agent({
  description: "Unidad B: <objetivo> (independiente de A)",
  subagent_type: "pstack:poteto-agent-high",
  model: "openai-codex/gpt-6-luna",
  prompt: "<ruta .agents/roles/worker.md> + brief: unidad autorizada B; independencia respecto de W/A; checkout exclusivo propio distinto del de A; exclusiones sobre A; grounding; comprobaciones; modelo y esfuerzo efectivos",
  isolation: "worktree"
})
```
- Si B dependiera de A o compartiera checkout, la línea 61 la bloquea.

## 4. Inspección faltante

1. **Paquete sin manifest ni `candidate.diff`**: identidad proyectada por mí, no reproducida desde un paquete retenido. Para integrar, retener el paquete según `review.md` (si aplica al path objetivo).
2. **No existe brief de #53 en el repo**: aceptación derivada del incidente y de este prompt; no lo trato como brief registrado.
3. **Reconciliación no instrumentalizada**: la línea 61 dice "herramientas y registros existentes" sin nombrarlos (p. ej. registro de agentes de la sesión para id/estado, `send_message` para el mismo actor) ni su alcance: sin registro durable de despachos en el flujo Markdown (relevante para OPS-03).
4. **Cese del escritor anterior al reutilizar checkout**: la línea 66 exige inspeccionar el parcial, no confirmar que el intento y sus descendientes ya no pueden escribir (execution-principles / `spec-v1.md:209`). El contrato de Pi mitiga (`failed` se reporta solo tras salir el proceso); riesgo residual bajo.
5. **Sin evidencia runtime**: no confirmé disponibilidad de `pstack:poteto-agent-high` + `openai-codex/gpt-6-luna`, no leí metadata real de agentes y no despaché.

## 5. Hallazgos

**Bloqueantes: ninguno demostrable.**

- **S1 (sugerencia)** — línea 61: nombrar las comprobaciones concretas de reconciliación y su límite de sesión; acotarla evita que un contexto nuevo confíe en una vista parcial.
- **S2 (sugerencia)** — línea 66: desambiguar reanudación del mismo actor vs nuevo intento con otro destino aprobado (MOD-05: "reanudar con otra configuración crea un intento registrado") respecto al total autorizado.
- **S3 (información)** — línea 66/68: el guard es prosa sin check estructural, consistente con que el runtime aún no existe y con el descargo de enforcement; la corrección depende de cumplimiento del coordinador.
- **S4 (información)** — S4 = los puntos 1, 2 y 5 de inspección faltante: limitaciones de evidencia, no defectos del texto.

## 6. Verdict

**Standards: PASS · Spec: PASS · Agregado: PASS** — sin bloqueantes; 2 sugerencias (S1, S2). El candidato aplica exactamente el guard pedido: reconciliación por identidad/ownership/estado, contabilidad por total autorizado de workers distintos (no por activos), `total1` no reciclable por inactividad, permiso del trabajo independiente con ownership/checkout propios, y sin afirmar garantía de runtime. Las decisiones D/E/F derivadas del texto son correctas; D no justifica despacho, E y F sí, condicionados al preflight §5 que no ejecuté.
