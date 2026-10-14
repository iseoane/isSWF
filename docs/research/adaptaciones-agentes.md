# Adaptación de prácticas y candidatos de agentes

Este mapa distingue prácticas de referencia, propuestas para isSWF y perfiles que existen hoy. Las fuentes locales son [referencias](referencias.md) y [análisis de Pstack](pstack-agentes.md). Salvo esos análisis documentales fijados que allí se describen y la skill code-review de Matt citada abajo, las ideas de proyectos externos se presentan como evidencia secundaria e indirecta; sus fuentes originales no se releyeron durante esta corrección. Versiones, licencias y vigencia upstream siguen pendientes de revisión antes de copiar contenido.

## Candidatos de perfiles y prácticas

| Prioridad y candidato | Rol y trigger | Adaptación propuesta | Evidencia local y decisión |
| --- | --- | --- | --- |
| P0 Coordinator | Coordinar cualquier encargo | Fijar autorización, grounding, brief y siguiente paso; conservar decisión y estado | Perfil existente: [isswf-coordinator](../../.agents/skills/isswf-coordinator/SKILL.md). Basado en [referencias](referencias.md) y [Pstack](pstack-agentes.md). |
| P0 Worker | Cambio autorizado, incluido bug simple reproducible | Recibir perfil por ruta, brief, checkout exclusivo, permisos, contexto necesario y comprobaciones | Perfil existente: [worker](../../.agents/roles/worker.md). Pstack, [agentes y skills](pstack-agentes.md). |
| P0 Diagnostician | Causa desconocida, bug intermitente, transversal o de alto impacto | Reunir evidencia causal y recomendar el siguiente paso; no implementar por defecto | Perfil existente: [diagnostician](../../.agents/roles/diagnostician.md). Adaptación de diagnóstico de Pstack, [análisis](pstack-agentes.md). |
| P1 Reviewer | Cambio con aceptación que requiere revisión independiente | Un perfil evalúa por separado Standards y Spec, contrasta el candidato exacto con criterios de aceptación y estándares, y declara hallazgos con evidencia | Perfil existente: [reviewer](../../.agents/roles/reviewer.md) y su [guía de revisión](../../.agents/roles/references/review.md). Adaptación de [Matt, code-review](https://github.com/mattpocock/skills/blob/main/skills/engineering/code-review/SKILL.md), leída en esta entrega: conserva ambos ejes sin exigir fan-out. |
| P1 Planner de tickets | Solicitud amplia que necesita unidades verificables | Proponer slices verticales, dependencias y bloqueos; no convertirlas en autorización | Propuesta futura. Matt, `to-tickets` e `implement-spec`, [referencias](referencias.md). |
| P2 Architect | Requisito nuevo con varias formas viables | Comparar interfaces y tipos desde consumidores antes de implementar | Diferir hasta que el trabajo lo justifique. Pstack, [análisis de architect y arena](pstack-agentes.md). |
| P2 Verifier de entrega | Candidato con evidencia funcional requerida | Vincular verificaciones al candidato exacto y declarar límites | Práctica candidata, no perfil implementado. Gentle AI, RDD, [referencias](referencias.md). |
| P2 Reviewer de seguridad | Cambios que tocan permisos, límites o datos sensibles | Revisar amenazas y controles pertinentes, no ejecutar una rúbrica indiscriminada | Propuesta futura. Addy, skills de seguridad, [referencias](referencias.md). |
| P2 Custodio de memoria | Decisión útil para trabajos futuros | Usar Engram con proyecto explícito; contrastar recuerdos con fuentes actuales | Integración Engram auditada para isSWF, no un agente ni un flujo general probado. Gentle AI, [referencias](referencias.md); [auditoría](../../.audit/engram-integration.json). |
| P3 Retrospector | Cierre solicitado o incidente que deja aprendizaje | Proponer mejoras con evidencia y separar aceptadas, rechazadas y pendientes | Propuesta futura. Matt `retro` y Pstack `reflect`, [referencias](referencias.md) y [análisis](pstack-agentes.md). |
| P3 Curador de estado | Varios trabajos activos que necesitan visibilidad | Mantener vista de estados, bloqueos y evidencias; no imponer etapas fijas | Adaptar como práctica de interfaz, no como agente autónomo. Zazencodes, [referencias](referencias.md). |

Hoy existen únicamente los perfiles de coordinator, worker, diagnostician y reviewer con sus referencias base, más pruebas pequeñas del dispatcher. Reviewer es un perfil Markdown que se pasa por ruta, no un rol nativo de Pi. Un mismo contexto puede evaluar ambos ejes. Planner, architect, verifier, seguridad, memoria como agente y retro siguen siendo propuestas, no implementación actual. Los niveles indican orden de evaluación, no un plan aprobado.

## Adaptaciones de principios

Las 24 filas siguientes son selecciones concretas para las referencias base, no un censo exhaustivo de principios ni prácticas de los proyectos citados.

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

## Evidencia y límites

La lista de fuentes leídas por los investigadores está anclada en [referencias](referencias.md) y [Pstack](pstack-agentes.md). Esas notas registran los títulos y enlaces; Pstack también fija revisiones, recorridos y pruebas offline del port. La extracción portable de las transcripciones de investigación corresponde a la auditoría del parent.

El mapa resume decisiones locales y no acredita calidad de agentes en ejecución. La revisión upstream, versiones y licencias sigue pendiente. No atribuye exhaustividad a listas de principios y no convierte las propuestas futuras en capacidades implementadas.
