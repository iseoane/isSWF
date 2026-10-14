# Hallazgos U2 antes de integrar

Candidato 363dd71; main permanece 7d2d593. La suite de 24 pruebas y los dos commits archivados pasan, pero no bastan.

1. P1: tras decide, prepare admite ready con decision_refs vacía y descarta el vínculo a la respuesta recibida. Reproducción independiente confirmó revisión3 lista sin referencias.
2. P1: nueva autorización del mismo issue más refs vacía copia answers del grant anterior; prepare publica éxito y show falla. Debe bloquearse en U2 antes de publicar, no corromper snapshot/historia.
3. P2: responder una de dos preguntas pone needs-triage; contrato exige seguir esperando mientras queden preguntas.

Evidencia: u2-engineering-review-initial.md. El revisor menciona verify-u1-live fuera del brief original: sí hubo ampliación explícita posterior por mensaje del padre, registrada en runtime-a2a.tsv y en verification-plan; ese archivo está autorizado y no es finding de alcance.

4. Producto: skill pide resumir source, incompatible con fingerprint exacto; review lo confirma. Debe conservar fuente y resumir sólo brief/motive.
5. Prueba fresca: skill tras respuesta humana válida devuelve needs-triage por grounding pendiente, aunque no quedan preguntas. Driver finish falla; conservar u2-live-initial.log y artefacto original. Ready debe significar preparado para grounding, no investigación completada. Otro caso sin evidencia no puede usar needs-triage sin refs/resolution: aclarar camino de investigación verificable sin inventar resolución.

Review producto no encontró brief porque buscó en candidato; brief absoluto está en main. Sus observaciones concretas siguen válidas, no es certificación global.

Revisión fresca dfc3bb7: los tres fallos iniciales corregidos y28tests+9liveU1 pasan. Persisten dos variantes incompatibles: reintroducir pregunta ya respondida la deja irrespondible; resolution con varias pendientes bloquea decide. Root fix: preguntas pendientes y respondidas disjuntas; resolución concluyente sólo sin pendientes. Brief u2-fix2-brief.md registra decisión conservadora, no implementación de U3. No hay integración ni certificación final. Census sobre d49e535 encuentra5 variantes ready con preguntas aceptadas: regresión al extraer helper. Restituir guard compartido de preparación, no debilitar census. Brief u2-ready-guard-brief.md y snapshot inicial u2-variants-final.json conservan fallo.
