**Alcance hecho**: leídos `docs/research/a2a.md`, `a2a-js.md`, `probes/a2a-js.mjs`+`.log`; spec §3.1/§3.2.2/§3.3.1/§3.6; Python latest `active_task_registry.py`, `cluster/task_store.py`, `default_request_handler_v2.py`; JS `default_request_handler.ts` 218–264/627–718/721–783/827–905; SHA de los tres snapshots comprobados (2f9e44, 2c81b8, 3303592) y el bump de 1.0.1 (`/tmp/isswf-a2a-cXkIki/python`, 69273a3) para el bug histórico.

## Distinciones pedidas

- **protocolo vs runtime**: sí. Cabecera del §SDK en la matriz («no cualquier servidor»), «el banner no acredita conformidad», «Se inspeccionaron… sin ejecutar el SDK», `return_immediately` citado a [S1,S2] y presente en el proto (línea 160) y §3.2.2. Correcto.
- **nonblocking vs stream desprendido**: sí, y con evidencia ejecutada. Resultados 2 y 3 separados y `finally`/`eventQueue.stop()` (handler 779-782) frente a `_processEvents` en background del no bloqueante (693-712). La frase «el gap pertenece al camino streaming, no al envío no bloqueante» está respaldada.
- **bug antiguo vs corrección latest**: sí, y verificado de forma independiente. 1.0.1 devuelve `self._active_tasks[task_id]` sin owner (`registry.py:38-39`); latest consulta el store con el caller y lanza not-found (líneas 80-103), y `on_cancel_task:229`/`on_subscribe_to_task:555` releen con contexto. `LegacyTaskStoreAdapter.save` ignora versiones (docstring y `del … prev_version`): fiel.
- **CANCELED vs parada física**: sí, explícito en a2a.md («no demuestra que un comando… haya dejado de producir efectos») y resultado 4. Correcto.

## Hallazgos

1. **low — `a2a-js.md`, sección «Por qué ocurren estos resultados» (handler:827–905)**: dice que sin bus «actualiza el snapshot directamente». El código pasa por `new ResultManager(...).processEvent(statusUpdate)`, que aplica lock de escritura por (tenant,owner,taskId) y guarda terminal (comentario en 866-871). La observación del probe (CANCELED sin llamar `cancelTask`) es correcta; «directamente» describe mal el mecanismo.
2. **low — `a2a.md`, párrafo de reintentos**: «§3.3.1 exige idempotencia de consultas y cancelación». §3.3.1 lo enuncia como propiedad («are naturally idempotent», «Cancel Task operations are idempotent»), sin MUST; sólo Send Message es MAY. No cambia la conclusión (no hay dedup exigida), pero «exige» sugiere normatividad inexistente.

## Sin bloqueantes

- Ninguna afirmación Python se presenta como ejecutada: el contraste 1.2.2 se rotula «evidencias de código, no tests», y los resultados JS sí tienen probe+log con asserts que coinciden con el `.log` (`PASS`/`OBSERVED` 1-6).
- `runExecutor`/`_runStreamExecutor` desacoplan ejecución de consumo en ambas rutas; no hay claim de supervivencia a crash que el probe no pruebe.
- §3.1.1 «MUST return immediately» frente a §3.2.2 bloqueante: la nota lo detecta y lo resuelve por configuración, no lo ignora.
