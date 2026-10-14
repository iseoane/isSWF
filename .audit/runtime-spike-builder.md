Checkpoint cerrado. No ejecuté `crash`, `escape` ni `mismatch`.

Instrumento en `/tmp/isswf-runtime-spike.Ti6Xj2/spike.py`, **481 líneas**. Supera el objetivo aproximado de 300. No seguí puliéndolo.

`py_compile` y `normal` terminaron con código 0. Salida íntegra en `/tmp/isswf-runtime-spike.Ti6Xj2/normal.ndjson`. Stderr vacío.

Observaciones reales del último `normal`:
- El cliente inicial salió. Otro cliente consultó el mismo Pi `171494/319521349` y escritor `171510/319521400`, indicando PID/starttime.
- El heartbeat creció de **2 a 9**.
- Tras `abort_bash`, el shell estaba ausente y el escritor era zombie, ya incapaz de escribir, **antes** de cerrar stdin.
- EOF terminó Pi con código 0. El archivo permaneció en 9 heartbeats.
- La limpieza recolectó el zombie. Pi, shell y escritor quedaron ausentes.

Extracto literal:
```json
{"case": "normal", "event": "case_confirmed", "outcome": "stopped", "stop_margin_seconds": 26.054}
```

El dueño conserva los pipes y drena stdout mediante un hilo. El socket acepta únicamente `start/status/stop`. Las señales abren pidfd antes de validar identidad. Un subreaper permite recolectar descendientes huérfanos. El plazo de 28 segundos exige confirmar parada con al menos cinco segundos de margen.

`Model the Domain` determinó el journal de identidades y reserva observada. `Prove It Works` determinó comprobar `/proc`, crecimiento y cese físico, no ACK ni `isStreaming`.

Los casos pendientes están implementados pero **no verificados**. `escape` incluye dos ensayos, abort y crash. La recuperación solo reconcilia hacia detenido-seguro; no recupera pipes. El journal es scratch sin prueba de durabilidad ante pérdida de energía. Todo funciona bajo el mismo UID, sin garantía de sandbox ni autenticación. Solo escribí bajo el directorio autorizado.
