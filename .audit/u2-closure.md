# Cierre local U2

Integrado por fast-forward desde main7d2d593 hasta bf27d776, sin remoto. Commits por resultado: ee11772 pregunta visible;363dd71 respuesta/retriage;dfc3bb7 vínculos y espera parcial;d49e535 variantes disjuntas;bf27d776 guard ready restaurado. Se conserva historia de candidatos y errores, no se reescribe como una primera versión perfecta.

## Resultado y evidencia

- CLI decide registra respuesta del operador en mismo snapshot/historia; nunca auto-ready. Si hay preguntas restantes mantiene espera. prepare reconcilia usando todas las refs confiables del trabajo/grant/fuente.
- Pendientes y respondidas tienen IDs disjuntos. Resolución concluyente sólo sin preguntas. Cambiar fuente/grant con respuestas se bloquea conservadoramente hasta U3.
- 31 tests pasan en un archivo de commit final fresco: u2-final-archive.log. Driver U1 real también pasa9checks: u2-u1-regression.json.
- 96 variantes estructurales con0 incompatibles aceptadas: check-u2-variants.py y u2-variants-final.json. Census detectó9 incompatibilidades en dfc3bb7 y5 en d49e535, mientras suites pasaban; evidencia inicial se conserva.
- 12 checks reales CLI/SQLite/HTTP/Chromium: u2-live.json y u2-panel.png (captura leída por padre). Propuesta ambigua generada por skill, respuesta ficticia deliberada, retriage por agente fresco, tres revisiones y misma historia. Panel parado al finalizar.
- Capacidad ya existente contrastada leyendo panel.py/tests, no referencia inventada src/status.py del ejemplo: u2-triage-existing.json. Sospecha sin evidencia usa ejemplo canónico grounding-proposal.json; no es una generación LLM independiente.
- Revisiones independientes reproducen errores; última revisión incremental bf27d776 sin bloqueantes: u2-final-review.md. Todos actores U2 verificados por metadatos de la sesión padre como GPT6 Luna high, sin fallback: u2-agent-models.json. No diversidad de modelos.

## Límites y riesgo

Son issues ficticias, sin GitHub real, código cliente, worker autónomo ni entrega/PR. El CLI es una frontera de operación deliberada local, no autenticación por actor ni aislamiento contra otro proceso del mismo usuario. La estructura no prueba veracidad de evidencia ni adecuación semántica de respuestas. Los textos LLM siguen necesitando contraste: en u2-triage-reconciled.json se describe una pregunta respondida en revisión1, pero answer.source_revision1 identifica el origen de la pregunta; la respuesta fue publicada en snapshot2. El campo operativo y la historia conservan ese hecho correcto. No se toma ese texto como autoridad ni como certificación de progreso.

U3/U4, S01 completa y H1 siguen pendientes. Usuario pide antes de U3 definir/probar instalación versionada y activación por proyecto, Engram y Codegraph; hasta este cierre no hay integración activa de ninguna de ambas herramientas.
