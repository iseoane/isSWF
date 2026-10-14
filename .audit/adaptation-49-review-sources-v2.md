## Gate final #49 — readonly (sin ediciones, sin subagentes, sin sesiones ajenas)

**Método.** Leí las 4 notas, las 2 revisiones previas (`adaptation-49-review-sources-v1.md`, `adaptation-49-review-experience-v1.md`), el checkout Pstack en `94f5ce95`, el JSON de Engram y el estado git local. Verifiqué URLs por HTTP, commits por `gh api` y hechos locales por git. No escribí en el repo, no ejecuté runtime ni toqué el worktree de otra sesión.

## Veredicto

| Eje | Resultado |
|---|---|
| **Standards** (procedencia, pinning, atribución, licencias) | **FAIL** — 4 defectos demostrados |
| **Spec** (encargo #49: fuentes fijadas, hecho upstream vs recomendación, estado actual, propuestas #54) | **FAIL** — mismos bloqueantes; ninguna decisión de contenido se cuestiona |

| Nota | Standards | Spec | Bloqueantes |
|---|---|---|---|
| `adaptacion-matt.md` | PASS | PASS | 0 |
| `adaptacion-pstack-addy.md` | FAIL puntual | PASS en sustancia | B4 |
| `adaptacion-experiencia.md` | FAIL puntual | PASS en sustancia | B1, B2 |
| `adaptaciones-agentes.md` | FAIL puntual | PASS en sustancia | B3 (y eco de B4) |

Coincide con el FAIL de Luna final: hash Zazen truncado + discrepancia Engram. Añado dos defectos demostrados que esa nota no recogía: base "actual" del mapa y atribución de la regla Thermo 1k.

## Bloqueantes demostrados (con procedencia para corregir tras ambas revisiones)

**B1 — Hash Zazen truncado. `docs/research/adaptacion-experiencia.md:56`**
Enlace `[dashboard, líneas 267–277](…/blob/555467c365e6750278efba09349369109f62f/…)` → 37 chars; completo: `555467c365e6750278efba09349369109f62f65f` (faltan `65f`). Los otros dos enlaces de la línea (README `#L78-L87`, dashboard `#L385-L407`) usan 40 chars. HTTP 200 hoy en ambos, pero viola el pinning que declaran la propia nota y el mapa. Es el mismo tipo de defecto que v1 exigió corregir para el hash de Addy (ya corregido). Fix: sustituir solo ese hash.

**B2 — Traza Engram mal etiquetada. `docs/research/adaptacion-experiencia.md:118`**
Dice «documenta una prueba del entorno `isswf` en commit `0d81c5f`». El registro primario `.audit/engram-integration.json` fija `repo.commit = e1c186d26d2f88d82ff3b8302079692dd04b1b72` (base de ejecución; `previous_commit = 499849e…`) y `checks_passed: 22`. `0d81c5f` es el commit que **añade** el registro y el script (640 líneas), no la base probada. Fix: distinguir «prueba ejecutada sobre el código de `e1c186d` (previo `499849e`)» de «evidencia incorporada en `0d81c5f`», sin implicar que la integración no exista.

**B3 — «Base actual» errónea en el mapa. `docs/research/adaptaciones-agentes.md:76`**
Afirma «La fuente local actual para la rúbrica Standards/Spec es `d0bbc666`». HEAD es `3b2a52f`; `git diff d0bbc666 3b2a52f -- .agents/roles/reviewer.md .agents/roles/references/review.md` está **vacío**, así que el contenido de la rúbrica sí sobrevive, pero `d0bbc666` es el commit histórico que la introdujo, no la base actual. Prueba adicional: `.agents/skills/isswf-coordinator/SKILL.md` **sí cambió** entre ambos commits. Fix: citar `3b2a52f` como base actual y, si se quiere, `d0bbc666` como commit que introdujo el perfil sin cambios posteriores. («Base examinada `d0bbc666`» en el encabezado y en las otras notas es defendible como base de investigación; la palabra «actual» de la línea 76 no.)

**B4 — Regla Thermo 1k reescrita como señal. `adaptacion-pstack-addy.md:29` (y `:48`, `adaptaciones-agentes.md:61`)**
La fuente en `94f5ce95` (`thermo-nuclear-code-quality-review`) dice, regla 1: «Do not let a PR push a file from under 1k lines to over 1k lines without a very strong reason… Only waive this if there is a compelling structural reason», y en *Approval Bar*: el cruce `<1k → >1k` es **presumptive blocker** salvo justificación clara. El candidato lo describe como «señal para profundizar la revisión»; es correcto que no es un límite estático, pero omite la clasificación de la fuente. La sospecha del parent queda confirmada. Fix: párrafo en dos partes — regla upstream literal (cruce = presumptive blocker waivable) y después decisión local («isSWF lo usa como trigger de inspección, no como gate automático»), marcada como adaptación que se aparta del veredicto upstream.

## Confirmaciones solicitadas

- **Hash Addy completo:** sí. Todas las URLs de Addy tienen 40 chars (code-review-and-quality, security-and-hardening, hardening-patterns, performance-optimization, security-checklist, performance-checklist); `hardening-patterns` y `security-checklist` responden 200; `main` sigue en `aeac41d4…`.
- **Pstack upstream:** sí. Los 8 enlaces apuntan a `github.com/michael-denyer/pstack-claude/blob/94f5ce95…` y responden 200; el checkout local HEAD = `94f5ce95` = `origin/main`; el commit existe publicado (`gh api` 200). No queda ningún `file:///` (corregido desde v1).
- **Licencias:** Matt MIT (API + LICENSE); Pstack MIT © 2026 Lauren Tan **y** Michael Denyer (la nota ahora lo recoge); Addy MIT © 2025 Addy Osmani; Gentle AI MIT; Zazen sin licencia (`license` 404; sin `LICENSE` en raíz ni en `src/software-factory-claude-code/`). Las notas y el mapa son correctos.
- **Versión/revisiones:** existen y son las citadas — Matt `49dd158d…` (main, 2026-10-09), Addy `aeac41d4…` (main, 2026-10-13), Pstack `94f5ce95…` (2026-10-14), Gentle `09e4e4ae…` (2026-10-14), Zazen `555467c…` (2026-10-07).
- **Preguntas de dependencias:** la sección `Dependency Security` existe en `security-checklist.md` (L145, con `Install-Script Gate`); la fila P1 de la nota y la prioridad 9 del mapa son fieles. El candidato es solo documentación: no añade dependencias ni toca manifiestos.
- **No falsa atribución:** un caso de fuente (B4) y dos etiquetas de revisión local (B2, B3). No encontré copia de texto upstream en el delta revisado.

**Delta v1 ya corregido:** hash Addy a 40, enlaces Pstack upstream, mapa reconciliado con reviewer presente y caveat runtime, `throughput checkpoint` y `file:///` eliminados, fila 8 de Matt matizada («prototipo pequeño sin fricción demostrada»), anclas 385–407 y 294–305 completadas, doble copyright Pstack y limitación de commit publicado resueltas.

## Sugerencias (tras corregir bloqueantes)

1. En el fix de B4, alinear `adaptacion-pstack-addy.md:48` («El tamaño es una señal») y `adaptaciones-agentes.md:61` para que la decisión local no se lea como descripción de la fuente.
2. En B2, usar la forma «prueba ejecutada sobre el código de `e1c186d` (previo `499849e`), evidencia incorporada en `0d81c5f`, 22 comprobaciones» — el dato `22` está en `checks_passed` del propio registro.
3. En B3, dejar `3b2a52f` como base y `d0bbc666` como origen de la rúbrica sin cambios; evita que un futuro lector busque la base en un commit histórico.
4. La frase «En esta sesión también usé las herramientas de memoria de Engram» (experiencia, L118) es autorreporte no verificable en este gate; marcarla como tal o retirarla si no hay evidencia enlazada.

**Checks ejecutados:** `curl` HTTP (200/200 Zazen truncado y completo, 200 Pstack thermo, 200 Addy hardening/security), `gh api` (licencias, commits main), `git diff/ls-tree` local (HEAD, d0bbc666 vs 3b2a52f, reviewer/coordinator), parseo del JSON de Engram (`checks_passed: 22`). Sin escritura en repo ni ejecución de runtime. Los 4 bloqueantes son de texto y no cambian ninguna decisión de adaptación.
