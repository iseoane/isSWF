# Comparación del padre

Estado: lectura de dos candidatos independientes completos y cross-judge recibido. Es valoración de diseño, no resultado de una prueba integrada.

## Rúbrica

Cada criterio se califica como cumple, parcial o falla: continuidad sin promesas implementadas; autoridad única e idempotencia; metodología Markdown adaptativa; interfaz pequeña; reutilización proporcional; permisos y recuperación comprobables.

| Criterio | A (GLM) | B (DeepSeek) |
| --- | --- | --- |
| Continuidad y separación del chat | Cumple como propuesta; falta demostración integrada. | Cumple como propuesta; falta demostración integrada. |
| Autoridad, idempotencia y barrera de escritor | Parcial: dueño claro; su flujo de entrega salta verificación/revisión. | Parcial: distingue resultado/cierre; ambigüedad sobre escritura del journal. |
| Metodología en Markdown | Cumple; no fija entrevista ni TDD. | Cumple; no fija entrevista ni TDD. |
| Interfaz pequeña | Parcial: seis verbos y flags duplican decisiones del brief. | Parcial: cuatro firmas, pero delegar recibe brief además de referencia. |
| Reutilización proporcional | Parcial: RPC tiene sentido, pero A2A no exige por sí mismo duplicar estado. | Parcial: descarta SDK por relación con chat que no es inherente al SDK. |
| Permisos y recuperación | Parcial: reconoce barreras y gaps, no concreta aislamiento del canal/secretos. | Parcial: reconoce incertidumbre, no concreta aislamiento del canal/secretos. |

## Base candidata

La topología compartida es un dueño de ejecución fuera del chat y Pi por proceso de intento. El padre prefería inicialmente A por explicar el dominio de fallo; el juez prefirió B1 por separar resultado del proceso y cierre técnico. Se acepta B1 como base conceptual, conservando de A la explicación de separación de fallos y el registro de intenciones. La síntesis reduce la interfaz por referencia y resuelve los fallos de ambos. No se adopta la sugerencia «bloqueo excluye intento activo»: un intento incierto puede seguir actuando y debe conservar su reserva.

No se aprueba ninguno literalmente. La síntesis debe:

- Resolver brief/perfil/configuración desde la referencia; el caller no los repite.
- Registrar resultado y volver al coordinador; esperar aceptación solo después de evidencia y revisión requeridas.
- Retirar primero entradas pendientes, abortar después y comprobar cese antes de liberar espacio.
- Permitir SDK en un host independiente como alternativa válida, con menor separación de fallos si comparte la autoridad.
- Describir A2A como contrato externo reutilizable, no como obligación de tener doble store ni servidor por worker.
- Dejar formato de almacenamiento e aislamiento pendientes de pruebas. Un worktree o socket poco visible no son sandbox.
- Impedir que el worker modifique registros de autorización, recursos fijados y canales de control, o bloquear si no se puede imponer esa frontera.

## Opciones que siguen abiertas

La propuesta más pequeña para el caso actual parece un supervisor local con RPC Pi, con panel de lectura y metodología Markdown. La elección del transporte coordinador–supervisor, almacenamiento y mecanismo OS de supervisión no está probada. A2A puede sustituir una interfaz externa cuando haya un segundo consumidor real, o ganar antes si un spike demuestra que ahorra código sin duplicar el estado operativo.

No se infiere del spike de handlers A2A que la factory sobreviva a reinicios. Tampoco se usa el fallo de ownership Python histórico como argumento: en 1.2.2 se comprobó su corrección.
