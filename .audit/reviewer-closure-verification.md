# Verificación readonly del cierre #52 — resultado

**Veredicto agregado: FAIL.** El candidato de 3 archivos y las dos revisiones v2 están byte-a-byte verificados y son PASS, pero el rango de commits del cierre contiene un commit fuera de la autorización registrada. No es un fallo de la implementación ni de las revisiones: es un fallo de alcance del cierre, que debe dispositionarse antes de marcar #52 done.

No leí `.audit/reviewer-closure.md` ni `.audit/reviewer-behavior.md` (en escritura por otro agente durante toda la verificación; mtimes 17:59:36/43). Quedan excluidos y el veredicto no depende de ellos.

## 1. Identidad e integridad — PASS

Comando (script leído antes: solo `readFile`/`lstat`/hash/`console.log`, sin escrituras):

```
node .audit/verify-reviewer-snapshot.mjs .audit/reviewer-snapshot-v2   → exit 0
node .audit/verify-reviewer-snapshot.mjs .audit/reviewer-snapshot      → exit 0
node .audit/verify-reviewer-snapshot.mjs .audit/reviewer-fixtures/spec-failure → exit 0
node .audit/verify-reviewer-snapshot.mjs .audit/reviewer-fixtures/style-only   → exit 0
```

| Paquete | Snapshot | Base |
|---|---|---|
| v2 | `21efbb05…f4e1f9f` | `899a6d1a…e187e` |
| v1 | `b22850258…3b09b19` | `899a6d1a…e187e` |
| spec-failure | `a9b59fc86…61659d1` | `d4547fce…ceb460` |
| style-only | `10c4bd2e1…3eba13` | `d4547fce…ceb460` |

Coinciden con los IDs citados por las revisiones. Los payloads contienen exactamente los archivos declarados (3/3 y 1/1), sin extras.

**Bytes main == payload v2 == blobs del commit** (sha256 idénticos en los tres):

```
reviewer.md  ab18460d871e836aee16c90b797a258d64c809fb028560b3e34c52f7684383ab
review.md    9243d5487c1ef5fae02f612a32c53bc94da0040c66137fbddf49e723020ab7af
SKILL.md     7908e55298e0ac2ec321998c3bbf610015cf477bd64ce75ac8ce1af0779e72bd
```

- `cmp` main vs payload v2: OK en los 3.
- `git cat-file blob d0bbc66:<f>` y `HEAD:<f>`: sha256 = payload v2 en los 3; `d0bbc66^ = 899a6d1`; `git diff d0bbc66 HEAD -- <3 rutas>` vacío; `.agents` limpio.
- El árbol congelado `/tmp/isswf-reviewer-tree-v2-POuaFg/.agents` sigue existiendo y `diff -r` contra main `.agents` = idéntico.
- `candidate.diff` v2 (sha256 `7e269ec0…cb30`) es byte-idéntico a `git diff --full-index --src-prefix=c/ --dst-prefix=w/ 899a6d1 d0bbc66 -- .agents/skills/isswf-coordinator/SKILL.md`.

Nota de evidencia (informativa, no defecto): `candidate.diff` es un diff de 1 solo archivo (24 líneas, el tracked modificado); los 2 archivos nuevos van solo en payload, cubiertos por path+modo+sha256 del manifest. El verificador no cruza diff contra payload (fuera de su scope declarado), pero la reconstrucción base+payload es completa.

## 2. Delta v1→v2 — PASS

- `cmp` payload v1 vs v2: `reviewer.md` y `review.md` idénticos; solo difiere `SKILL.md` (`79e44c6e…` → `7908e552…`).
- La delta exacta son 5 párrafos reescritos (líneas 57, 61, 65) + línea en blanco antes de `## 6` (línea 68): preflight acotado a "implementación o diagnóstico"; tipo/effort explícitos `pstack:effort-high`/`pstack:effort-max`; `readonly: true` + no escribir; sin fallback silencioso; "perfil reviewer"; "candidato con commit por su SHA"; "ejemplos de este encargo, no defaults globales".
- `diff -r` del árbol v1 contra main muestra exactamente esas mismas líneas. **Confirmado: role/ref unchanged; solo coordinador.**

## 3. Revisiones y comportamiento — PASS

- `reviewer-luna-v2.md` y `reviewer-deepseek-v2.md`: PASS en ambos ejes, base `899a6d1…`, snapshot `21efbb05…`, sin bloqueantes. Son las revisiones que no sustituyo.
- Metadatos de sesión (etiquetas, no semántica): Luna v2 `15:21:34.886Z→15:22:12.409Z`, `openai-codex/gpt-6-luna` + `thinkingLevel high`; DeepSeek v2 `15:21:34.897Z→15:22:46.982Z`, `opencode-go/deepseek-v4.1-flash` + `thinkingLevel max`. Ambas terminan antes del commit `d0bbc66` (`17:26:00+02:00` = `15:26:00Z`). Verifiqué además que el mensaje final de cada sesión coincide textualmente con el cierre de su informe `.md`.
- v1: dos revisiones PASS, con la prueba de fixtures: `spec-failure` FAIL de Spec detectado con check verde (0 0→10), `style-only` PASS con sugerencia no bloqueante. Paquetes de fixture re-verificados (arriba); worktrees `/tmp/isswf-reviewer-proof-Pn5sVg/*` conservados, `sum.sh == payload`, HEAD `d4547fce`, ` M sum.sh`.
- `reviewer-model-probe.json` se autodeclara "availability probe only, not candidate review" y sus conteos no son fiables; no lo cuento como review. `reviewer-identity-check.json` es una prueba negativa de tamper del verificador, scope explícito; tampoco es review.

## 4. Commits — FAIL de alcance

- `d0bbc66` (`d0bbc666…f44f324`): `A` review.md, `A` reviewer.md, `M` SKILL.md — **exactamente los 3 paths autorizados**.
- `af40924` (`af409246…25c7dc`): `M docs/research/adaptaciones-agentes.md` — **fuera de los 3 paths autorizados**, fuera del audit y no es el "small source commit" del candidato. El mensaje lo ata a esta entrega ("Mark the two-axis reviewer as implemented") y `reviewer-models.json` registra al actor `map-writer` (sesión `15:26:40Z`, Luna high) dentro de este encargo.

Evidencia de que no estaba autorizado en el rastro legible (sesión del operador, mensajes de usuario):

- `14:53:07Z`: "…**autorizar3archivos** reviewer.md refs/review.md y coordinator… No códigoPython ni instalaciones/red/**catálogoresearchnuevo** ni tocarotherworktrees… Commits pequeños sólo tras checks y reviews independientes".
- `15:19:55Z`: "Parent then integrate3reviewedfiles and **smallsourcecommit, audit evidencecommit**…".
- `16:01:45Z`: "…Luego53 despacho duplicado,**49adaptacion**…" (la adaptación del mapa aparece como trabajo posterior).
- Búsqueda de mensajes del operador `14:40–15:37Z` con `map|adapt|research`: solo los 4 mensajes operativos listados; ninguno autoriza este commit.

Impacto: no toca el candidato ni las revisiones (los 3 archivos siguen intactos y en HEAD), pero es una escritura no autorizada en el cierre. Para poder marcar #52 done hace falta disposición del operador: autorizarlo explícitamente (p. ej. encuadrarlo en #49) o revertirlo. No lo declaro bloqueante del candidato, sí del alcance del cierre.

## 5. Límites y evidencia faltante

- No ejecuté `verify-markdown-core.mjs`: escribe (`mkdtemp`/`mkdir`/`writeFile`) aunque sea en `/tmp`; lo excluí según instrucción. Re-verifiqué readonly: los 20 enlaces de `reviewer-integrated-proof.json` resuelven contra main, el inventario de 13 `.md` coincide con `.agents`, y no hay espacios finales en `.agents/**/*.md`.
- `reviewer-integrated-proof.json` no está ligado a un digest/commit (solo ruta `candidate`); es consistente con `reviewer-markdown-proof-v2.json` (links/files/catalogs idénticos) y con main == árbol v2, pero la parte de catálogo Pi (`approved`/`no-approve`) no la re-ejecuté.
- Read-only es instrucción de perfil, no sandbox verificado; los modelos/effort son etiquetas de sesión, no semántica de proveedor ni prueba de ausencia de fallback.
- `HEAD` es `af40924`; el commit de evidencia `.audit` que planeaba el operador aún no existe (audit sin trackear).
- Incidencia `reviewer-dispatch-incident.md` (segundo worker) sigue pendiente de #53 y no se declara corregida.
- Sin escrituras de repo, commits ni subagentes. Solo generé diffs desechables en `/tmp` para las comparaciones (`base-skill-52.md`, `gitdiff-52.diff`, `skill-full.diff`, `skill-v1.diff`).

## Disposición posterior del padre

El fallo de alcance se resolvió revirtiendo exclusivamente af40924 mediante 67aa4b8. La actualización del mapa vuelve a #49. No se sustituye el FAIL original por un PASS retroactivo. Los tres archivos aprobados no cambiaron.
