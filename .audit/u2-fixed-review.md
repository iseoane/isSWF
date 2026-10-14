## Hallazgos reproducibles

- **P2 — Una respuesta registrada puede volver a aparecer como pregunta pendiente.** En `isswf/intake.py:209-212`, la reconciliación permite volver a incluir una pregunta ya respondida si conserva su texto e ID. Reproduje `prepare → decide → prepare` con la propuesta original: publicó revisión 3 en `needs-info`, con la pregunta pendiente y la misma respuesta ya registrada. Esa pregunta ya no puede responderse otra vez porque `decide` la rechaza como duplicada. Rechazar preguntas cuyo ID ya tenga respuesta.

- **P2 — Una disposición con varias preguntas bloquea `decide`.** El contrato acepta `needs-triage` con `resolution` y preguntas pendientes, pero `decide` cambia a `needs-info` si quedan preguntas (`isswf/intake.py:282-293`). Al persistir, `parse_snapshot` rechaza esa combinación porque `resolution` requiere `needs-triage` (`isswf/contracts.py:256`). Reproduje la excepción y confirmé que no cambian ficha ni historia. Hay que definir una transición coherente para esa combinación.

## Verificación y límites

`python -m unittest discover -s tests -v`: **28 tests pasan**; `git diff --check`: pasa. Ejecuté la verificación autorizada en una copia temporal: **9 comprobaciones CLI/HTTP/browser pasan**. Los fallos previos de refs, cambio de grant y espera con varias preguntas están cubiertos por regresiones que pasan.

**Calidad:** quedan helpers sin uso en `isswf/intake.py` (`_strings`, `_timestamp`); no encontré complejidad o comentarios excesivos que justifiquen otro hallazgo.

No usé red ni subagentes; no modifiqué candidato ni `main`. No es una certificación general de seguridad.
