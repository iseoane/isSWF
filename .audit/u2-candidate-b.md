# U2, candidato B: publicar respuesta y brief juntos

## Datos y ownership

`work` conserva su identidad estable por repositorio e issue, la autorización vigente, revisión local y snapshot completo. El snapshot incorpora el estado de preparación, brief y preguntas pendientes. Cada pregunta tiene un `question_id` estable, decisión requerida, responsable y condición de salida. Una respuesta queda ligada a ese ID y a la revisión del trabajo; no es un campo libre que pueda aplicarse a otra pregunta.

El coordinador aplica la skill y propone preguntas y brief reconciliado. Solo el operador aporta la decisión y aprueba el paquete por el canal local confiable existente. No se confía en un campo `actor` escrito en JSON como prueba de identidad. Esto no promete separar usuarios del mismo host. El soporte de intake sigue siendo el único escritor del registro; panel, skill y propuestas no publican estado. No se crea otra autorización: el paquete referencia la ya registrada y no puede ampliar su objetivo ni alcance.

## Uso e invariantes

El operador revisa, en una sola pantalla o entrada CLI, las respuestas que aporta junto al brief reconciliado. Aprueba o deja el trabajo pendiente. Una aprobación publica una sola revisión con respuestas, brief, preparación y motivo en una transacción; la historia conserva snapshots completos. Revisión esperada y referencias a preguntas se validan antes de escribir. Un conflicto o fallo deja intacta la revisión previa.

Una respuesta sin aprobación del paquete no modifica el trabajo. Preguntas bloqueantes sin respuesta mantienen `needs-info`; una duda técnica investigable propone grounding, no entrevista humana. El runtime verifica referencias, autorización estructural y concurrencia. La skill y el coordinador juzgan si la respuesta y el brief bastan; no hay criterio semántico universal en código. Panel y CLI muestran pregunta, responsable, condición de salida, respuesta aprobada y revisión del mismo registro. Una respuesta no inicia ejecución.

Para duplicados, sin evidencia se conserva la incertidumbre y se propone comprobarla. Con evidencia se registra referencia y motivo como no accionable, sin fingir una entrega ni crear PR. El código no certifica la veracidad de la evidencia.

## Dos unidades pequeñas

1. **Conservar información pendiente.** Extender el snapshot y su vista para preguntas identificables, estado `needs-info` y condición de salida. Pruebas de comportamiento comprueban que una ambigüedad se ve en CLI y panel, y que no aparece como `ready-for-agent`.
2. **Aprobar reconciliación conjunta.** Añadir el flujo de operador que publica respuestas y brief en una revisión atómica. Comprobar respuesta cruzada a otra pregunta, autorización o revisión obsoleta, repetición idempotente, publicación fallida, pregunta aún sin resolver y duplicado con y sin evidencia. En cada rechazo, verificar que la revisión e historia anteriores siguen intactas.

La forma de datos y estas pruebas son un sketch, no implementación ni certificación independiente. El modelo seleccionado para este trabajo es el padre, GPT-6 Luna high. No se propone fallback ni autocertificación.