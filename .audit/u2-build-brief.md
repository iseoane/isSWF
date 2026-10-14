# Implementar U2 sobre U1

Usuario autoriza construir U2 y commits locales. Sólo GPT6 Luna high para subagentes, sin fallback, subagentes propios ni red. Padre verificará metadatos; no autocertificar. Lee este brief completo, docs/s01-intake.md U2, spec Entrada/Autorización, código isswf y tests U1. Trabaja exclusivamente en tu worktree asignado, no main. No GitHub, remoto, merges, cambios globales, instalaciones, workers, Engram, A2A o código cliente.

## Diseño elegido

Base A tras comparación independiente de A/B. Respuesta confiable del operador se registra en el mismo snapshot y publica nueva revisión, no otra autoridad con query-joins. Si quedan preguntas sigue pendiente; cuando no quedan pasa a needs-triage y espera reconciliación. El prepare existente de la skill reconcilia el brief mediante refs a respuestas confiables. No imponer aprobación de todo el brief cada vez ni entrevistas para hechos técnicos. El criterio es Markdown, el código protege invariantes.

Código U1 ya verificado: 13 tests, APIs authorize/prepare/show, CLI, SQLite grants/work/history, readonly lectura y HTTP, endpoints de lectura. Mantener sin regresiones; no declarar S01 completa.

## Forma de datos y uso

Extender propuesta/snapshot con `questions`, `decision_refs` y `resolution` (null por defecto en activo). Puede elegir nombres internos, pero contrato público único y documentado en ejemplos.

Questions: lista de objetos con id estable, kind product o missing-information, pregunta concreta, owner operator y condición de salida. Una duda técnica investigable pertenece a brief/contexto/grounding, no a question humana. questions vigentes son sólo pendientes. Respuestas trusted se conservan en snapshot `answers`, NO admitidas como campo escribible de propuesta. Cada respuesta incluye id, pregunta original completa, trabajo, autorización, revisión de origen, actor, texto y fecha. Un solo dueño de publicación SQLite, snapshots/historia juntos.

Preparaciones: ready-for-agent exige acceptance no vacía, cero preguntas pendientes y resolution null. needs-info/ready-for-human requieren preguntas humanas concretas, responsable y motivo; acceptance puede estar vacía (no inventar éxito). needs-triage permite respuesta recibida pendiente de reconciliar y disposición no accionable. Cuestionario sin bloqueantes no se declara como espera humana. Valores de preparación no autorizan implementación/publicación. Execution sigue no disponible en S01.

Un único nuevo comando de operador `decide <answer.json>` junto a los cuatro actuales. Input mínimo work_id, expected_revision, question_id, answer y actor (estructura exacta elegida/docs). Actor es atribución, no autenticación: frontera es acción deliberada de CLI del operador, como authorize. La skill no llama authorize/decide. No fingir separación técnica de procesos del mismo usuario. Decide valida referencia al trabajo/pregunta/revisión/autorización en transacción y publica revisión con respuesta y preguntas restantes; no auto-ready. Una respuesta fuera de referencia/scope estructural o que intenta incluir campos de permisos/objetivo extra se rechaza dejando historia/ficha igual. No fingir rechazo semántico universal de cualquier respuesta natural: la skill juzga alcance, y prepare exige objetivo/scope exactos del grant.

Prepare posterior usa decision_refs existentes y pertinentes del mismo trabajo/autorización/fuente. No permite inventar answers ni quitar una pregunta humana vigente para pasar a ready sin respuesta registrada. No permite cambiar texto/identidad de la pregunta bajo un mismo id para reutilizar una respuesta. Retriaging una fuente alterada con respuestas de la anterior requiere reconciliación no demostrada en U2: bloquear esa reutilización antes que fingir U3. Mantener replay existente cuando identidad/material no cambian y rechazar revisiones obsoletas. Una respuesta no se registra dos veces (repetición rechaza o devuelve resultado idéntico, sin nueva historia).

Resolution no accionable mínima para duplicate/already-present: referencia destino, evidencias con referencia y motivo/observación, explicación. Sin evidencia se rechaza la declaración concluyente y skill propone grounding, nunca entrevista técnica ni PR artificial. Con evidencia persiste motivo/referencias con preparation needs-triage/no implementación propuesta, acceptance puede vacía. Código comprueba presencia/forma, no veracidad semántica; skill/revisor contrastan fuentes. Panel muestra esta distinción sin equipararla a entrega integrada.

## Estructura y persistencia

Modelar variantes con una forma de datos y validación central, no múltiples flags ni condiciones desparramadas. Intake conserva ownership de SQLite/operaciones; separar validación/contratos en módulo profundo `isswf/contracts.py` si evita gigante intake, con 2-3 funciones públicas de parseo de documentos. No imports de diez helpers internos ni interfaces inventadas. Publicador transaccional único reutilizable por prepare/decide. Evitar duplicar reglas de preguntas entre lectura, propuesta y panel.

Actualizar ejemplos y todos llamadores al formato nuevo. Conservar lectura readonly de snapshots persistidos U1 sin añadirlos en disco, sin borrar historia ni anunciar revision nueva. Adaptación de lectura explícita y acotada; no API legacy paralela. Si cambian mensajes de error por nuevas variantes, ajustar tests preservando la intención: needs-info sin pregunta sigue inválido, acceptance vacía de ready sigue inválida.

## Archivos y commits

Permitidos isswf/, tests/, examples/u2/, examples/u1/proposal.json, .agents/skills/isswf-triage/SKILL.md, docs/u1-usage.md y docs/u2-usage.md. No cambiar README, visión/spec/plan/arquitectura ni audit heredado; padre los reconciliará. No modificar .gitignore salvo defecto imprescindible comunicado.

Dos unidades funcionales: 1 issue ambigua→ficha/panel con pregunta real; 2 decide→retriage→misma ficha nueva revisión, controles de autoridad y disposición con evidencia. Cada una debe pasar tests y tener commit local propio dentro de work/u2. Commits son candidatos WIP hasta review final, no aceptación. Si aparecen más de unas pocas centenas de líneas por unidad, buscar simplificación/subdivisión por resultado, no capas ni límite ciego. No squashear historia ni ff main. No modificar la versión estable mientras construyes.

## Verificación y entrega

Unittest real CLI/SQLite/HTTP y criterio skill: aceptación vacía waiting válida vs ready inválida; preguntas con IDs/owner/salida visibles; respuesta confiable sólo por decide; spoof answers/decision_refs rechazados; omisión de pregunta para ready rechazada; respuesta a pregunta/issue/revisión equivocada no cambia estado; alcance distinto rechazado; decide→needs-triage, prepare válido→ready mismo ID y revisiones/historia; fuente alterada no reutiliza respuestas; replay no duplica; duplicate sin evidencia inválido, con evidencia no accionable y renderizado; technical-question kind rechazado o delegada grounding según skill; snapshot U1 viejo sigue legible readonly; CSS y textos hostiles siguen seguros. Persistencia al reabrir y rollback ante fallo de publicación.

No forzar TDD global, sí regresiones de invariantes baratas cuando ayudan. Corre pruebas antes de cada commit. Escribe verificación resumida propia en `.audit/u2-owner-result.md` dentro de tu worktree (único archivo audit nuevo permitido), sólo al terminar; padre lo incorporará como evidencia, no lo comitees junto al código. Informe final <=300palabras con dos hashes, archivos, comandos/resultados y límites. Padre hará review independiente, triage en contexto fresco y prueba CLI/HTTP/navegador real antes de integrar.
