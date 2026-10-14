# Elección del diseño U2

Revisor `a1baaf7c574358c0c`, destino OpenAI GPT6 Luna high, sin cambios ni red. Comparó dos candidatos de la misma familia/modelo por petición del usuario; no hay diversidad de modelos.

| Criterio, 0 a 2 | A | B |
| --- | --- | --- |
| Autonomía sin permisos repetitivos | 2 | 0 |
| Separación operador/propuesta | 2 | 1 |
| Coherencia snapshot/historia | 2 | 2 |
| Complejidad/navegación | 2 | 1 |
| Casos de aceptación U2 | 1 | 2 |

Juez y padre eligen A. Se aclara que decide publica una revisión de la misma ficha con la respuesta confiable; cuando no quedan preguntas pasa a needs-triage, no a ready. Prepare posterior reconcilia el brief usando refs de respuestas. Un único módulo es dueño de ambas publicaciones, sin juntar estados de otra autoridad durante una consulta.

Se conserva de B la validación de revisión/referencias, publicación atómica e historia íntegra ante fallos. Se rechaza obligar a aprobar un brief completo después de cada respuesta. El código valida vínculos y permisos; el criterio semántico de alcance y suficiencia de respuesta queda en skill/coordinador.

Dos unidades de construcción verificables: pregunta humana visible y conservada; después respuesta registrada/retriage y disposición respaldada con evidencia. Commits candidatos locales separados y review antes de integrar main. No workers ni GitHub real en U2. Implementación pendiente al escribir esta decisión.
