## Dictamen

**Sin bloqueantes para las observaciones acotadas del fixture.** No constituye una certificación general del sandbox.

Revisión realizada con OpenAI `gpt-6.1-sol`, sin fallback ni subagentes. SHA exacto confirmado. Fuentes, log y documentos permanecen iguales; sin instalaciones ni red externa.

Repetí `all` **dos veces consecutivas**: salida 0, stderr vacío y **195/195 checks** en cada ejecución. El log entregado también contiene 195, no 190. Evidencia nueva: `/tmp/isswf-independent-review-e42hPF/`.

## Observaciones válidas

Referencias `P` = `docs/research/probes/pi-isolation.py`; `L` = `docs/research/probes/pi-isolation.log`.

- **Controles positivos efectivos.** Baseline lee/escribe los archivos privados ficticios, atraviesa ambos symlinks, observa la credencial falsa por entorno y FD77, y conecta a Unix filesystem, abstract y TCP. No son negaciones sin contraste (`P:211–235`; `L:6–26`).
- **Worker/reviewer y denegaciones.** Worker modifica el candidato; reviewer rechaza escritura, borrado y chmod, tanto directos como por alias. Ambos construyen la copia en scratch y obtienen `10\n`; reviewer conserva hashes y modos originales (`P:237–266,294–296,348–349`). Los errores observados son ENOENT=2 para privados/symlinks/proc-host/socket filesystem, EBADF=9 para FD77, ECONNREFUSED=111 para abstract/TCP y EROFS=30 para candidato reviewer. TCP admite explícitamente 101 o 111, no cualquier fallo (`P:224–235,253–258`).
- **ISO-001 corregido.** El helper separa éxito esperado de errno permitido (`P:199–206`). Ejecuté `.audit/isolation-control-check.py:10–21`: el mutante falla por `scratch-write`, errno 2, `passed:false`; el verificador termina correctamente. El comportamiento previo consta en findings, pero no reejecuté una versión histórica.
- **ISO-002 corregido.** La correlación exige simultáneamente `type=response` e id (`P:334–336`). Pi RPC real funciona en ambos perfiles mediante `get_state` y `bash`, sin enviar prompts ni solicitar inferencia al proveedor (`P:300–351`; `L:109–183`).
- **ISO-004 corregido.** Los argumentos aislados llevan `token=None`; la comparación con los bytes secretos ficticios se realiza fuera del sandbox antes del lanzamiento/envío (`P:276–282,340–341`). El valor sigue reservado al control baseline.
- **ISO-003 corregido para estos ensayos.** La selección procede de los descendientes del **bwrap actual**, no del census global (`P:452–464`). La evidencia anterior identifica el PID1 equivocado en `.audit/isolation-namespace-failure.json:13–23,108–120`; las dos repeticiones nuevas contienen únicamente el namespace correspondiente.

## Safety y calificadores

- Las señales usan pidfd y comprueban boot-id/PID/starttime; el recorrido comprueba parentesco y la limpieza se limita a descendientes propios (`P:39–90,508–519,564–572`). No observé señales contra procesos ajenos.
- Lifecycle usa **Python, no Pi**. El writer separado hace `setsid`, ignora SIGTERM y no publica identidad como requisito. El cliente sale, los heartbeats continúan y luego cesan por SIGKILL al INIT observado o por muerte del owner con `--die-with-parent` (`P:364–400,440–487`).
- El cese se observa **antes de cleanup**, mediante estados absent/zombie y estabilidad de escrituras. Los cuatro ensayos nuevos terminan esa observación antes de 1,75 s frente al límite de 30 s: margen superior a 28 s. Después se exige ausencia tras reap (`P:488–506`).
- Namespaces, entorno limpio, cierre de FDs y raíz readonly están explícitos (`P:126–140,285–287`). No obstante, el caso llamado `root-write` prueba `/usr`, no toda la raíz; FD77 tampoco demuestra ausencia universal de capacidades en stdio o runtime público.

**Quedan fuera:** auth/red LLM, código arbitrario completo, kernel, resource-DoS, ventanas de arranque, validación general de mounts, hardlinks/clientes reales, TUI y persistencia. Ningún PASS aquí resuelve esos límites.
