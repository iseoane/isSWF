En `/tmp/isswf-u1-fix-7gkzq409`, `show` y el panel ahora leen SQLite en modo readonly y rechazan snapshots con estructura o fechas inválidas. El panel rechaza `Origin` malformado antes de leer el estado y muestra los campos pertinentes del brief, escapados, con CSS local en `/panel.css`. La skill ya no promete reconciliación completa.

Las regresiones previas dieron 3 fallos y 1 error conductuales. Después, `python -W error::ResourceWarning -m unittest discover -s tests -v` pasó los 13 tests. El registro está en `fix-verification.log`.

Cambié `isswf/intake.py`, `isswf/panel.py`, `tests/test_u1.py`, `docs/u1-usage.md` y `.agents/skills/isswf-triage/SKILL.md`. `fix-verification.log` es el único archivo nuevo. No usé subagentes, red, instalaciones ni Git. No autocertifico el modelo ni declaro S01 completo.

`Boundary Discipline` concentró la validación en las fronteras de almacenamiento y HTTP. `Fix Root Causes` corrigió las escrituras de las lecturas, en vez de ocultarlas. `Test Behavior` y `Prove It Works` guiaron las regresiones con SQLite y HTTP reales.
