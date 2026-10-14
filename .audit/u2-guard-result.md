# Resultado del guard de readiness U2

El commit `bf27d776a029d7b658ae4eae3783a167807b5107` restaura el guard de `ready-for-agent` en `isswf/contracts.py`. La causa era que el validador compartido sólo rechazaba la coexistencia de preguntas pendientes y `resolution`; no recibía `preparation` y aceptaba preguntas para propuestas y snapshots `ready-for-agent`.

El validador compartido ahora recibe `preparation` y rechaza `ready-for-agent` si hay preguntas o si `resolution` no es `null`. `tests/test_u1.py` añade una regresión que comprueba ambos puntos de entrada. El cambio conserva las reglas existentes para aceptación no vacía, preguntas pendientes y respondidas disjuntas, y resoluciones sin preguntas pendientes.

Verificación en `/tmp/isswf-u2-guard-tree`:

- Antes del cambio, `parse_proposal` aceptó una propuesta `ready-for-agent` con pregunta pendiente.
- `python -m unittest discover -s tests -v`: 31 tests pasaron, los 30 anteriores y la regresión.
- El checker sin cambios `/home/iseoane/Work/isSWF/.audit/check-u2-variants.py`, ejecutado contra este árbol: 96 casos, 0 `illegal_accepted`.
- `git diff --check`: pasó antes del commit.

El census comprueba variantes estructurales de snapshots. No certifica semántica universal ni el ciclo de vida completo.

Este reporte queda sin commit por instrucción.