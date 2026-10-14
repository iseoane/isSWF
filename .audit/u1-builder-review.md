Construí U1 en `/tmp/isswf-u1-owner-qvccmjli`: CLI y dominio en `isswf/`, panel local de solo lectura, ejemplos ficticios, pruebas en `tests/test_u1.py`, skill `.agents/skills/isswf-triage/SKILL.md` y guía `docs/u1-usage.md`. La preparación conserva revisiones en SQLite, valida autorización y revisión esperada, y publica el mismo snapshot por CLI y panel.

La forma de datos separa el grant confiable de la propuesta externa; SQLite publica snapshot e historial en una transacción. Apliqué Model the Domain y Boundary Discipline con esquemas explícitos y validación en los límites; Laziness Protocol manteniendo una implementación pequeña; Prove It Works verificando CLI y HTTP reales. Un solo propietario evitó escrituras compartidas y fan-out.

Verificación: `python -W error::ResourceWarning -m unittest discover -s tests -v` pasó las 9 pruebas. `compileall` y `python -m isswf --help` también pasaron. Las pruebas cubren persistencia, concurrencia, conflictos, permisos de archivos, escape HTML, controles HTTP y errores de lectura.

Límites: esto no completa S01 ni implementa U2/U3, consulta GitHub, ejecución de trabajos o aislamiento frente a procesos del mismo usuario. La revisión independiente y la integración real quedan pendientes para el padre.
