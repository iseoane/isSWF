# Adaptación de prácticas y candidatos de agentes

Este mapa separa instrucciones actuales, prácticas que ya están adoptadas y propuestas que #54 puede evaluar. La base local actual es `3b2a52f8a1fbfbc74830ae489d4111b13cc8272f`. La base histórica `d0bbc6660d2d63c7a7ac0c5fbef6c61a9f44f324` introdujo el perfil reviewer y su referencia; ambos permanecen sin cambios en esas rutas, mientras que coordinator sí cambió desde entonces. Las notas [Matt](adaptacion-matt.md), [Pstack y Addy](adaptacion-pstack-addy.md) y [experiencia](adaptacion-experiencia.md) fijan fuentes, revisiones, licencias, límites y recomendaciones. No copiar texto upstream sin revisar sus condiciones. El estado de un perfil Markdown no demuestra capacidad ni aislamiento del runtime.

## Candidatos de perfiles y prácticas

| Prioridad y candidato | Rol y trigger | Adaptación propuesta | Evidencia local y decisión |
| --- | --- | --- | --- |
| P0 Coordinator | Coordinar cualquier encargo | Fijar autorización, grounding, brief y siguiente paso; conservar decisión y estado | Perfil existente: [isswf-coordinator](../../.agents/skills/isswf-coordinator/SKILL.md). Basado en [referencias](referencias.md) y [Pstack](pstack-agentes.md). |
| P0 Worker | Cambio autorizado, incluido bug simple reproducible | Recibir perfil por ruta, brief, checkout exclusivo, permisos, contexto necesario y comprobaciones | Perfil existente: [worker](../../.agents/roles/worker.md). Pstack, [agentes y skills](pstack-agentes.md). |
| P0 Diagnostician | Causa desconocida, bug intermitente, transversal o de alto impacto | Reunir evidencia causal y recomendar el siguiente paso; no implementar por defecto | Perfil existente: [diagnostician](../../.agents/roles/diagnostician.md). Adaptación de diagnóstico de Pstack, [análisis](pstack-agentes.md). |
| P0 Reviewer, Standards y Spec | Revisión independiente asignada por el brief | Comparar el candidato exacto con el objetivo y estándares en ejes separados; informar inconcluso si falta evidencia | Perfil y rúbrica incorporados en la base histórica `d0bbc6660d2d63c7a7ac0c5fbef6c61a9f44f324` y sin cambios en esas rutas en la base actual `3b2a52f8a1fbfbc74830ae489d4111b13cc8272f`: [reviewer](../../.agents/roles/reviewer.md) y [review](../../.agents/roles/references/review.md). La instrucción no demuestra aislamiento runtime ni exige dos ejecutores. [Matt](adaptacion-matt.md), [Pstack y Addy](adaptacion-pstack-addy.md). |
| P1 Planner de tickets | Solicitud amplia que necesita unidades verificables | Proponer slices verticales, dependencias y bloqueos; no convertirlas en autorización | Propuesta futura. Matt, `to-tickets` e `implement-spec`, [referencias](referencias.md). |
| P2 Architect | Requisito nuevo con varias formas viables | Comparar interfaces y tipos desde consumidores antes de implementar | Diferir hasta que el trabajo lo justifique. Pstack, [análisis de architect y arena](pstack-agentes.md). |
| P1 Cobertura de experiencia y UI | Cambio que modifica un recorrido o presentación | El reviewer existente aplica probes de uso real y accesibilidad pertinentes | Rúbrica condicional, no nuevo perfil default. La especificación exige revisión por riesgo; la nota de [experiencia](adaptacion-experiencia.md) enlaza fuentes y límites. |
| P2 Reviewer de seguridad | Cambios que tocan permisos, límites o datos sensibles | Revisar amenazas y controles pertinentes, no ejecutar una rúbrica indiscriminada | Propuesta futura. Addy, skills de seguridad, [referencias](referencias.md). |
| P2 Custodio de memoria | Decisión útil para trabajos futuros | Usar Engram con proyecto explícito; contrastar recuerdos con fuentes actuales | Integración Engram auditada para isSWF, no un agente ni un flujo general probado. Gentle AI, [referencias](referencias.md); [auditoría](https://github.com/iseoane/isSWF/blob/7678f6476501c410245d0056a1e1c5e262ff8c21/.audit/engram-integration.json). |
| P3 Retrospector | Cierre solicitado o incidente que deja aprendizaje | Proponer mejoras con evidencia y separar aceptadas, rechazadas y pendientes | Propuesta futura. Matt `retro` y Pstack `reflect`, [referencias](referencias.md) y [análisis](pstack-agentes.md). |
| P3 Curador de estado | Varios trabajos activos que necesitan visibilidad | Mantener vista de estados, bloqueos y evidencias; no imponer etapas fijas | Adaptar como práctica de interfaz, no como agente autónomo. Zazencodes, [referencias](referencias.md). |

Hoy existen instrucciones para coordinator (`.agents/skills/isswf-coordinator/SKILL.md`), worker, diagnostician y reviewer con sus referencias. El reviewer ya cubre Standards y Spec. Su presencia documental no prueba dispatch, aislamiento ni ejecución independiente en runtime. Planner, architect, verifier como agente separado, seguridad como agente separado, memoria como agente y otros perfiles especializados siguen siendo propuestas, no perfiles actuales. Engram sí se probó y usó en el entorno de desarrollo, pero eso no significa que la factory de producto lo consuma ni que clientes lo tengan instalado. Las prioridades ordenan evaluación, no autorizan implementación.

## Adaptaciones de principios

Las 24 filas registran principios ya presentes en las referencias base locales. Su presencia no demuestra que una skill externa se haya instalado ni que cada principio se aplique en toda tarea. No son un censo exhaustivo de principios ni prácticas upstream.

| Principio | Destino de referencia | Rol | Adaptación |
| --- | --- | --- | --- |
| Build the Lever | `execution-principles.md`, Automatizar | coordinator, worker | Automatiza si el mecanismo repetible o verificable compensa su coste. |
| Encode Lessons in Structure | `execution-principles.md`, Automatizar | coordinator, worker | Codifica fallos mecánicos repetidos; mantiene juicio contextual en instrucciones. |
| Guard the Context Window | `execution-principles.md`, Autonomía | coordinator, worker | Brief referenciado y carga selectiva; no delega todo el contexto por defecto. |
| Make Operations Idempotent | `execution-principles.md`, Reintentar | coordinator | Reconcilia antes de reintentar; no promete exactly-once. |
| Migrate Callers Then Delete Legacy APIs | `execution-principles.md`, Migrar contratos | worker | Aplicar a API interna; respetar compatibilidad pública y persistida. |
| Never Block on the Human | `execution-principles.md`, Autonomía | coordinator, worker | Actuar con autonomía solo dentro del brief y la autorización vigentes. |
| Outcome-Oriented Execution | `verification-principles.md`, Unidades coherentes | coordinator, worker | Converger en el resultado sin conservar estados intermedios como contrato. |
| Separate Before Serializing Shared State | `execution-principles.md`, Ownership | coordinator, worker | Asignar escritor exclusivo; paralelizar solo con ownership separado. |
| Foundational Thinking | `design-principles.md`, Modelar primero | worker | Definir forma de datos y ownership antes de la lógica. |
| Model the Domain | `design-principles.md`, Modelar primero | worker | Representar estados y transiciones cuando reduzca ramas. |
| Type System Discipline | `design-principles.md`, Modelar primero | worker | Ajustar tipos al contrato, sin capas por ritual. |
| Minimize Reader Load | `design-principles.md`, Simplificar | worker, reviewer | Reducir saltos y estado oculto; mantener comportamiento localizable. |
| Laziness Protocol | `design-principles.md`, Simplificar | worker | Hacer el mínimo cambio que cumpla el contrato, no minimalismo ciego. |
| Subtract Before You Add | `design-principles.md`, Simplificar | worker | Retirar lo muerto o redundante antes de construir encima. |
| Boundary Discipline | `design-principles.md`, Validar en límites reales | worker | Validar entradas no confiables y no asumir vigencia del estado recuperado. |
| Redesign From First Principles | `design-principles.md`, Integrar requisitos | coordinator, worker | Reconciliar requisito y consumidores afectados sin rediseño global. |
| Attack the Premise | `verification-principles.md`, Causa antes que parche | diagnostician, coordinator | Tras dos fixes fallidos con la misma premisa, comprobarla antes de otro. |
| Exhaust the Design Space | `verification-principles.md`, Prototipos | coordinator, worker | Comparar prototipos ante incertidumbre novedosa y consecuencial. |
| Experience First | `verification-principles.md`, Producto, accesibilidad y riesgo | coordinator, reviewer | Priorizar experiencia y revisar accesibilidad según la superficie. |
| Explain the Number | `verification-principles.md`, Producto, accesibilidad y riesgo | worker, reviewer | Sustentar métricas; no reportar cuotas o rendimiento sin medir. |
| Fix Root Causes | `verification-principles.md`, Causa antes que parche | diagnostician, worker | Confirmar mecanismo por evidencia o declarar inconcluso. |
| Test Behavior, Not Implementation | `verification-principles.md`, Pruebas selectivas | worker | Probar el resultado del usuario, sin imponer TDD universal. |
| Prove It Works | `verification-principles.md`, Verifica el candidato exacto | worker, reviewer | Verificar el candidato efectivo y afirmar solo lo observado. |
| Sequence Work into Verifiable Units | `verification-principles.md`, Unidades coherentes | coordinator, worker | Usar checkpoints comprobables, sin cuotas universales. |

## Prioridades propuestas para #54

Estas selecciones siguen siendo propuestas, no cambios aprobados ni implementación:

1. **P0.** Reconciliar la rúbrica existente de Standards y Spec con las prácticas de revisión de Matt y Addy. Separar corrección técnica de cumplimiento del objetivo. No duplicar el reviewer ni sus listas locales.
2. **P0.** Seleccionar preguntas de seguridad cuando el cambio cruce permisos, datos, secretos, entradas externas o dependencias. Tratar cada guía upstream como rúbrica de riesgo, no como gate global.
3. **P1.** Evaluar triage, entrevista condicional y slices verificables de Matt para el coordinator y worker. Mantener autoridad y autorización separadas.
4. **P1.** Evaluar blast-radius como probe dirigido a una premisa material y elegir probes profundos de Thermo solo ante riesgo o complejidad. Upstream presume bloqueo al cruzar de menos de 1000 a más de 1000 líneas, con dispensa por una razón estructural convincente. Para isSWF, el cruce es solo una señal de riesgo que puede motivar inspección, no un gate automático ni un máximo. No adoptar un gate exhaustivo.
5. **P1.** Aplicar retrospectivas al completar features y bugs, y al cierre explícito de sesión desde la retrospectiva anterior, incluyendo trabajo pendiente. Conservar hallazgos y propuestas sin modificar instrucciones automáticamente.
6. **P1.** Mantener la creación o actualización de PR draft dentro de la autorización vigente por repositorio y encargo. Merge, aceptación y despliegue siguen siendo humanos.
7. **P2.** Aplicar cobertura de experiencia/UI mediante el reviewer existente solo si cambia un recorrido o presentación. No crear un perfil default adicional.
8. **P2.** Diferir wayfinder y revisión arquitectónica amplia hasta demostrar fricción o necesidad de planificación multisesión.
9. **P2.** Para cambios de dependencias, considerar una rúbrica seleccionable de Addy basada en la sección [Dependency Security de `security-checklist.md`](https://github.com/addyosmani/agent-skills/blob/aeac41d4d005999432bb7312f7ff06383a91d59d/references/security-checklist.md). La nota [Pstack y Addy](adaptacion-pstack-addy.md) fija revisión y límites. No aplicar como gate a cambios que no alteren dependencias.

Para cambiar instrucciones, #54 debe probar un caso representativo antes y después según [`docs/spec-v1.md`, línea 174](../spec-v1.md#retrospectiva-y-mejora), y validar formato si hay validador. El criterio `RET-04` protege las instrucciones de workers activos y exige PR. Los checks adversariales todavía no tienen cobertura suficiente. Seleccionar y justificar cada uno por riesgo. Estas propuestas documentales no añaden dependencias.

## Fuentes, revisiones y límites

- [Matt Pocock](adaptacion-matt.md) fija el commit `49dd158d1076134a641b33efb035946536778336`, licencia MIT y límites de adaptación. La evidencia primaria y cada skill revisada están enlazadas en esa nota.
- [Pstack y Addy](adaptacion-pstack-addy.md) fija Pstack `94f5ce95abe8a9dec976967d79941f631cf477cd` y Addy `aeac41d4d005999432bb7312f7ff06383a91d59d`, ambos con licencia MIT observada. Los enlaces Pstack son upstream y públicos. Los enlaces Addy a `hardening-patterns` y `security-checklist.md` se fijan al commit completo; el primero devolvió HTTP 200. Sus límites y criterios no adoptados están detallados en la nota.
- [Experiencia](adaptacion-experiencia.md) fija Gentle AI `09e4e4aef14e87199784fcf4edb667017d70b9b3`, con licencia MIT, y Zazen `555467c365e6750278efba09349369109f62f65f`, sin licencia declarada en el repositorio revisado. No copiar código ni texto de Zazen sin resolver la licencia.
- La integración Engram está documentada en [`.audit/engram-integration.json`](https://github.com/iseoane/isSWF/blob/7678f6476501c410245d0056a1e1c5e262ff8c21/.audit/engram-integration.json) y fue probada en el entorno de desarrollo. No acredita uso por la factory de producto ni adopción por clientes.
- La base histórica `d0bbc6660d2d63c7a7ac0c5fbef6c61a9f44f324` introdujo el reviewer y su referencia; esas rutas permanecen iguales en la base actual `3b2a52f8a1fbfbc74830ae489d4111b13cc8272f`, mientras que coordinator cambió. Las notas son investigación y no certifican calidad de agentes en ejecución ni mecanismos runtime.
