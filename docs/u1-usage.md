# U1. Preparar y observar una issue

U1 permite registrar una decisión del operador, preparar una propuesta dentro de ese objetivo y alcance, conservar revisiones en SQLite y leer el mismo snapshot por CLI y panel. No consulta GitHub ni ejecuta, delega o publica trabajo. El límite de 600 líneas de producción es orientativo; esta unidad implementa solo la preparación y lectura.

## Autorización y preparación

Use Python 3.10 o posterior desde el directorio del proyecto. No hace falta instalar el paquete.

```sh
python -m isswf --state /ruta/privada authorize examples/u1/authorization.json
```

El comando imprime un `id` nuevo. Sustitúyalo en `authorization_id` de una copia de `examples/u1/proposal.json`, y luego ejecute `prepare` con ese archivo. El fixture autoriza exclusivamente `factory/isswf-demo#17` y no representa una autorización real.

```sh
python -m isswf --state /ruta/privada prepare /ruta/proposal.json
python -m isswf --state /ruta/privada show
python -m isswf --state /ruta/privada show work-<id>
```

La propuesta requiere los campos del fixture y `questions`, `decision_refs` y `resolution`. Una propuesta ordinaria usa `questions: []`, `decision_refs: []` y `resolution: null`. `source.body` solo se usa para calcular un fingerprint y no se guarda. El panel y snapshot exponen título, etiquetas, fecha de lectura y fingerprint, no la autorización privada. `objective` y `scope` deben coincidir exactamente con el grant.

`ready-for-agent` requiere aceptación no vacía, ninguna pregunta pendiente y `resolution: null`. `needs-info` y `ready-for-human` requieren preguntas concretas con `id`, `kind`, `question`, `owner` y `exit_condition`. `owner` debe ser `operator`. `kind` puede ser `product` o `missing-information`; las dudas técnicas pertenecen al grounding, no al cuestionario. La aceptación puede estar vacía mientras el trabajo espera una respuesta. Los snapshots U1 guardados antes de este cambio siguen disponibles en lectura. La vista añade valores vacíos en memoria y no modifica SQLite.

Las revisiones comienzan en 1. Una modificación requiere el `expected_revision` actual. Una relectura idéntica y no obsoleta devuelve el snapshot sin crear una nueva revisión. Conflictos y alcance distinto se rechazan. Las revisiones previas se conservan. SQLite publica el snapshot actual y la fila de historia en una transacción; el estado no promete serializar procesos que eviten esa transacción.

## Panel local

```sh
python -m isswf --state /ruta/privada serve --port 8765
```

Solo enlaza `127.0.0.1`. `GET /` lista los snapshots, `GET /api/work` lista JSON, `GET /api/work/<id>` devuelve uno y `GET /work/<id>` presenta su detalle con repositorio/issue, revisión y los campos pertinentes del brief. `GET /panel.css` sirve el estilo local constante. No hay JavaScript, endpoints de escritura, CORS ni recursos externos. No se admite HEAD. Host debe coincidir exactamente con la dirección loopback y puerto del servidor. Origin, si está presente, debe ser el mismo origen local; se rechaza `Sec-Fetch-Site: cross-site`.

La carpeta de estado se crea con modo privado (0700) y la base con modo 0600 al autorizar o preparar. `show` y el panel abren una base existente en solo lectura; no crean carpeta, base ni esquema. Si el estado aún no existe, informan que no está disponible en lugar de devolver una lista vacía. Los snapshots JSON se validan antes de mostrarse y una estructura inválida devuelve error, no éxito ni HTML roto. SQLite local no protege frente a otro proceso bajo el mismo usuario, root o un host comprometido. El panel loopback y estos permisos no constituyen sandbox ni prueba de aislamiento frente al usuario local. No guardar secretos en el grant.

## Skill

`.agents/skills/isswf-triage/SKILL.md` es un procedimiento para producir una propuesta, no para registrar una autorización. Pi descubre skills de proyecto bajo `.agents/skills/` cuando el directorio es confiable. U1 no edita settings globales ni activa la skill como una factory completa.

## Límites

La fuente externa no crea grants ni configura ejecución. U1 no implementa `needs-info`, reconciliación completa, consulta real a GitHub, ejecución, workers, fallbacks, identidad de procesos o recuperación S01 completa. `ready-for-agent` refiere solo al grounding que sigue. CLI y permisos de archivo no aíslan frente a procesos del mismo usuario.
