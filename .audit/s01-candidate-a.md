# Candidato A. Documento autoritativo por trabajo

Propuesta de construcción de S01, no implementación ni autorización para construirla. Solo OpenAI GPT 6.1, sin fallback. Un documento Markdown por trabajo reúne brief y estado. Panel y conversación leen una proyección descartable del documento. No conservan copias editables.

## Uso y autoridad

Ejemplo ficticio, sin validación de GitHub real. El operador autoriza preparar la issue #17 de `ejemplo/factory`, que pide mostrar la antigüedad del estado. El coordinador registra ese permiso, clasifica `feature` y define aceptación observable. Si no pudo comprobar código o duplicados, registra ambos como desconocidos y explica su efecto sobre la preparación. Una coincidencia de títulos no acredita duplicación.

El operador decide alcance y permisos. El coordinador responde del triage y solicita cambios. Un único soporte local de persistencia escribe el documento, valida su estructura y conserva la decisión confiable que respalda cada autorización. El panel no escribe. Texto de issues, comentarios y referencias sigue siendo contenido externo, nunca instrucciones privilegiadas.

## Forma y revisiones

Ubicación propuesta, no creada, `trabajos/<id>/trabajo.md`. Una cabecera delimitada contiene identidad local estable, origen externo canónico, revisión, fecha, categoría, preparación, permiso referenciado, decisiones pendientes y bloqueo con condición de salida. El cuerpo contiene objetivo, alcance, exclusiones, aceptación, repositorio y base, dependencias, tratamiento y motivo, riesgos, contexto y evidencias. Declara comprobaciones, revisiones previstas, configuración permitida, límites y checkpoints pertinentes, sin inventar ejecuciones.

Cada referencia identifica fuente y revisión examinada cuando existe. Las comprobaciones distinguen observado, hipótesis y no comprobado. Las revisiones anteriores se recuperan mediante Git, sin briefs activos alternativos. Una modificación de alcance no hereda autorización por conservar el identificador.

La escritura exige revisión esperada y reemplazo atómico tras validar. Un conflicto rechaza la actualización, no mezcla silenciosamente decisiones. Releer el mismo origen canónico reconcilia su trabajo e ignora repeticiones sin cambios. Una entrada distinta presuntamente duplicada exige evidencia antes de enlazarla como tal.

## Preparación y observación

`needs-triage`, `needs-info`, `ready-for-agent` y `ready-for-human` describen preparación. Este último conserva el motivo de decisión humana. La ejecución muestra explícitamente "no iniciada en S01". `ready-for-agent` no concede permisos, encola workers ni inicia código.

La futura skill Markdown de triage elige comprobaciones según claridad y riesgo. No impone entrevista, TDD, investigador ni secuencia universal. La autorización de preparación no sustituye una autorización de ejecución.

Panel y resumen reciben la misma revisión, fecha y antigüedad. Una lectura obsoleta lo advierte. Documento inválido no produce estado aparentemente vigente. La proyección expone campos permitidos y texto escapado, sin HTML activo, recursos remotos, credenciales ni rutas arbitrarias.

## Unidades comprobables de construcción

Estas unidades entregan comportamiento, no fases obligatorias del triage:

- Registrar autorización y origen produce un trabajo identificable. Comprobar rechazo de permisos aportados por la issue y relectura sin duplicación. Commit tras ambos casos.
- Preparar el brief muestra categoría, aceptación e incertidumbres. Comprobar issue clara, ambigua y supuesto duplicado sin evidencia. Commit tras demostrar los resultados.
- Revisar el encargo conserva historia y rechaza escritura obsoleta. Comprobar repetición idempotente y conflicto de revisión. Commit tras verificarlos.
- Observar el trabajo muestra igualdad entre panel y conversación. Comprobar antigüedad, texto hostil escapado y revisión independiente de alcance y exposición. Commit con evidencia.

## Alternativas y límites

Frente a B, A facilita lectura conjunta y reduce soporte, pero exige validar formato y revisiones. Se descartan estado editable en panel y supervisor completo. Riesgos principales son edición manual inválida y conflictos en documentos crecientes. S02 podrá referenciar documento y revisión; su ejecución requiere diseño propio. Engram, A2A, autenticación de workers y recuperación quedan fuera.

## Fuentes

[Visión](../docs/vision.md), [spec](../docs/spec-v1.md), [S01 del plan](../docs/plan-v1.md), [glosario](../GLOSSARY.md), [ownership candidato](../docs/arquitectura-candidata.md) y [triage y procedimientos proporcionales](../docs/research/referencias.md).
