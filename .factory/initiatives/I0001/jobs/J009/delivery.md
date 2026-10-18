# Delivery summary

## Work and candidate

J009, brief-r2.md. Project-wide navigation extends the readonly cut integrated in PR39. Current candidate identity is established by its source commit and review, not inferred from this record.

## What changed and why

Un solo panel por proyecto lista las iniciativas por nombre, progreso declarado y bloqueos. Desde cada iniciativa se abre su Kanban y sus fichas, con enlace para volver. No requiere un servidor por iniciativa ni otro estado editable.

## Visual summary

Ejecutar node tools/isswf-panel.mjs --project /absolute/project --port 0 y abrir la URL loopback impresa. Elegir Abrir Kanban, abrir una ficha y volver a Todas las iniciativas. --initiative I0001 permite abrir directamente ese Kanban sin restringir el servidor a él.

## Scope

Solo lectura. Sin respuestas/aceptación desde el navegador, arrastrar tarjetas, comandos, modelos, merge, servicios globales ni llamadas GitHub. Los estados siguen siendo los del plan. No hay telemetría viva ni prueba de uso efectivo de referencias.

## Checks and results

La base PR39 pasó revisión, CI exact-head y comprobaciones postmerge. Este corte añade pruebas HTTP con dos iniciativas, datos canónicos, navegación, escape de texto, registros ausentes/inseguros y límite del listado. Los resultados definitivos de calidad, navegador, revisión e integración se conservan en A/V del job; no se deducen de este resumen.

## Independent review

PR39 tiene revisión independiente PASS retenida en V001. Este corte requiere su propia revisión exacta, registrada por separado antes de integrar.

## Closure and acceptance

J009 sigue en curso. No se pide aceptar el panel completo. Faltan respuestas seguras desde el navegador y criterios runtime. Los cuatro jobs ya aceptados no se reabren.

## Integration risk and recovery

Loopback no autentica usuarios locales. Las fichas deben contener evidencia apta para mostrar y no credenciales; no hay sanitizador universal. No verifica procesos, slots, PRs actuales ni dependencias satisfechas. El listado es acotado y los registros se leen por separado, no como snapshot atómico. No está acreditado para clientes.

## Blockers and next action

Integrar la navegación multiiniciativa tras pruebas/revisión/CI y abordar después las respuestas mediante un límite seguro del coordinador.
