# Lenguaje de isSWF

[English](GLOSSARY.md)

Términos para conversar sobre el producto, sus trabajos y sus entregas. El mismo lenguaje se aplica a issues, briefs y revisiones. Es vocabulario, no un contrato de ejecución ni una lista de funcionalidades.

## Lenguaje

**Operador**:
La persona que define prioridades, autoriza encargos y acepta entregas.
_Avoid_: cliente cuando se habla de quien dirige la factory.

**Coordinador**:
El responsable del contexto del proyecto, la selección de procedimientos y la supervisión de los trabajos delegados.
_Avoid_: jefe, encargado, orquestador como nombres alternativos del mismo rol.

**Encargo**:
Un objetivo autorizado con alcance y criterios de éxito que puede requerir uno o varios trabajos.

**Trabajo**:
Una unidad acotada de ejecución con brief, dependencias, resultado y comprobaciones propios.
_Avoid_: sesión para nombrar un trabajo.

**Slice**:
Una unidad funcional que entrega un comportamiento completo, acotado y verificable por sí mismo. Un trabajo puede abarcar una o varias slices; un encargo puede requerir varios trabajos.
_Avoid_: capa como unidad de entrega de una funcionalidad.

**Brief**:
El contrato de un trabajo: su objetivo, alcance, contexto, restricciones y criterios de éxito.

**Grounding**:
La comprobación del encargo contra el código y las fuentes pertinentes antes de actuar sobre él.
_Avoid_: research cuando se quiere dar por obligatorio un agente investigador adicional.

**Worker**:
Un agente responsable de ejecutar un trabajo dentro de su brief, usando las skills pertinentes.
_Avoid_: implementador cuando el trabajo es investigación u otra tarea sin cambios de código.

**Revisor**:
Un agente con contexto independiente que evalúa un candidato mediante criterios explícitos y devuelve hallazgos o un veredicto.

**Candidato**:
La versión concreta de una entrega sometida a verificación, revisión o aceptación.

**Evidencia**:
Un resultado observado y atribuible a un candidato o contexto concreto que respalda una afirmación.
_Avoid_: PASS sin indicar qué se comprobó.

**Cierre técnico**:
La condición de una entrega que cumple el encargo y las comprobaciones requeridas sin hallazgos bloqueantes abiertos.
_Avoid_: terminado cuando todavía falta aceptación o integración.

**Aceptación**:
La decisión del operador de admitir una entrega concreta como cumplimiento del encargo.
_Avoid_: merge como sinónimo de aceptación.

**Bloqueo**:
Una condición identificada que impide avanzar un trabajo hasta que se resuelve.

**Sesión de trabajo**:
Un conjunto de actividades que el operador delimita y cierra explícitamente para revisar sus resultados y pendientes.
_Avoid_: conversación o proceso como sinónimos de sesión de trabajo.

**Retrospectiva**:
El análisis de evidencias de un trabajo o sesión para proponer mejoras al proyecto o a la factory.
