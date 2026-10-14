## Revisión del candidato U1

- **suggestion — `isswf/intake.py:96–126, 222–230`; `isswf/panel.py:44–45`**: `show()` llama a `_connect()` y `_database()`, que crean el directorio, la DB y tablas, y cambian permisos. Reproducción: `show()` sobre una ruta inexistente devolvió `[]` y creó `isswf.sqlite3`. El panel no escribe snapshots, pero su lectura sí muta estado.

- **suggestion — `isswf/intake.py:231–239`; `isswf/panel.py:75–94`**: `show()` acepta un snapshot que sea JSON válido aunque no tenga la estructura esperada. Lo reproduje guardando `{"corrupt": true}`: `show()` lo devolvió; `/api/work` respondió con datos corruptos y `/` falló al renderizar con `KeyError` (HTTP 500). Validar la estructura o tratarla como error de lectura evitaría presentar datos inválidos como válidos.

- **suggestion — `isswf/panel.py:60–65`**: `urlsplit()` puede lanzar `ValueError` con un `Origin` malformado, por ejemplo `http://[`. Reproducción: el manejador lanzó excepción y cerró la conexión sin respuesta de rechazo. Capturar el error permitiría rechazarlo limpiamente.

- **suggestion — `isswf/panel.py:25–38`**: La vista omite revisión, `motive`, `next_step`, riesgos y condiciones/comprobaciones de revisión que el brief guarda. La lista HTML tampoco los muestra. Confirmado comparando el renderizador con el snapshot de `examples/u1/proposal.json`.

**Verificación:** `python tests/test_u1.py` pasó los 9 tests. `python -m unittest discover -s tests -v` falló porque `tests/` no es importable en este entorno; ejecución directa sí funcionó. Las referencias relativas de la skill a `docs/u1-usage.md` y al fixture resuelven correctamente. No encontré comentarios explicativos sobrantes. El brief estructurado en JSON en vez de Markdown es una desviación de representación, no un defecto funcional.
