Auditoría cerrada. Las dos filas nuevas (16:59:59) están incluidas y las he contrastado: coinciden con el transcript (edición 16:59:16 de a2a.md/a2a-js.md; corrección de regex 16:58:19).

**Modelo:** subagente fable (GLM). **Alcance:** `.audit/runtime-a2a.tsv` (11 filas), `docs/arquitectura-candidata.md`, y extracción por script de textos/acciones solo del transcript activo, tramo 16:23–16:59, sin thinking ni otras sesiones; sin edits/writes/red.

**Afirmaciones de tests con proof (verificadas en transcript):**
- "probes Pi y JS reproducidos" (fila 16:58:30): respaldada — ejecuciones frescas a las 16:58:11 (`pi-rpc.py` PASS, `a2a-js.mjs` PASS contra snapshot fijado).
- "61 criterios; 8 slices; 44 links": respaldada por `verify-definition.py` PASS a las 16:58:30 y re-verificada a las 16:59:45 tras las últimas ediciones.
- "prueba integrada pendiente": marcado como pendiente en TSV y doc, sin sobreafirmación. El fallo inicial del checker fue del patrón (0 criterios, AssertionError propio), no de la spec — coincide con tu lectura y ahora tiene fila propia.

**Decisiones abandonadas:** presentes tras la actualización — pasada técnica detenida (16:51:09), agentes Codex fallidos (16:24:03), corrección de regex (16:59:59). Residual menor: el endurecimiento del probe a las 16:46:41 (check `git diff --exit-code` pristine) no tiene fila; es metodología, no decisión.

**Flags (3):**
1. **Evidencia de revisión volátil**: los veredictos "sin bloqueantes" de DeepSeek viven en `/tmp/isswf-*-final-review.md`, fuera del repo y sin puntero en la columna evidence del TSV. Si /tmp se limpia, el rastro no puede reverificar esas revisiones.
2. **Sin control negativo del checker**: doc, checker y corrección de regex son del mismo actor; el fallo inicial solo demuestra que falla ante 0 criterios, no que rechace estados inválidos sutiles. PASS es consistencia documental, no prueba de factory.
3. **Diversidad de modelos limitada**: reviews dependieron de un modelo (deepseek vía alias opus) tras fallos de límite de Codex; el propio doc lo declara en a2a.md, pero conviene recordarlo al usar estos veredictos.

Sin más riesgos detectables dentro del alcance. Investigación cerrada; nada autoriza implementación.
