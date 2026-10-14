# Encargo de diseño del ejecutor local

Entrega: un candidato de arquitectura en un único Markdown, con uso del coordinador, esquema de datos y firmas conceptuales, ownership, flujo, tradeoffs y pruebas pendientes. Es diseño, no implementación ni un módulo público fijado. Máximo 1200 palabras. Cada candidato conserva su archivo propio.

## Contexto que debes abrir

- `docs/vision.md`: autonomía, planning, checkpoints y PRs encadenadas deseadas; actualmente fuera de v1.
- `docs/spec-v1.md`: contratos y permisos, no pipeline codificado.
- `docs/research/pi-agentes.md`, `pi-runtime.md`: límites comprobados de Pi.
- `docs/research/a2a.md`, `a2a-js.md`: contrato, versiones, mecanismos y casos offline.

## Resultado buscado

Un coordinador Pi conversacional delega por referencia de trabajo. Los workers viven fuera del ciclo de vida del chat. Un único dueño conserva el estado operativo y limita escritores/intentos. Los procedimientos adaptativos y las rúbricas viven en skills y perfiles Markdown. Se reutilizan Pi, Git, gh, Engram y mecanismos existentes de Pstack donde encajen.

Compara al menos dos formas estructuralmente distintas: controlador externo con workers Pi RPC, y exposición A2A con executor Pi interno. Considera SDK in-process o Pstack existente como alternativas, sin asumir que delegar background ya cumple continuidad. Propón una base y explica qué complejidad ahorra al coordinador y qué necesita de verdad construir.

La interfaz conceptual debe ser pequeña y no exponer decenas de parámetros internos. Distingue trabajo, intento, resultado técnico, aceptación e integración. Una Task A2A o sesión Pi no reemplaza esas distinciones. Conserva una única autoridad de estado; explica si un TaskStore es autoridad o vista, sin sincronización manual de dos copias.

## Límites

Solo puedes escribir tu Markdown asignado. No implementes servicios, skills, configuración personal, repositorios remotos ni autenticación. Separa comportamiento probado, inferencia y propuesta. Indica qué garantías requieren una prueba integrada. La selección no autoriza merge, deploy, gastos extra ni cambios en los contratos vigentes.

## Finalización

El lector puede recorrer delegación, finalización, desconexión, cancelación y recuperación; localizar quién puede escribir cada dato; y ver qué falta demostrar. Un candidato que necesita un servidor por worker o un framework de procedimientos debe justificar esa complejidad frente a una entrada por proyecto.
