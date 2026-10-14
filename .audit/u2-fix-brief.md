# Corregir U2 sin integrar main

Contexto: usuario autoriza U2 y Git local, sólo openai-codex/gpt-6-luna high sin fallback. Trabaja exclusivamente /tmp/isswf-u2-fix-tree rama work/u2-fix desde363dd71, no main/otro worktree. Lee brief original absoluto /home/iseoane/Work/isSWF/.audit/u2-build-brief.md, findings y dos reviews initial de ese mismo directorio. No subagents, red, instalaciones, remotos ni merge. Un commit local de correcciones con regresiones, sin reescribir candidatos previos.

## Fallos reproducidos
1 refs omitidas después decide permite ready sin vincular respuesta. Exigir conjunto de decision_refs coherente con todas respuestas actuales del trabajo/fuente/autorización; no permite retirarlas en ninguna transición. No falsificar validación semántica del texto.
2 nueva autorización del mismo issue con answers existentes copia respuestas viejas y publica snapshot ilegible. Bloquear cambio de grant cuando answers existen en U2 (reconciliación más amplia U3) ANTES de publish. Publicador puede parse_snapshot(snapshot) antes de write para defensa de invariantes central, no sólo esconder error show. No silencio/migración inventada.
3 varias preguntas: decide conserva needs-info/ready-for-human mientras quedan preguntas, motive/next_step adecuados; needs-triage sólo cuando no quedan. Historial coherente.

Tests baratos reproduzcan fallos antes fix, luego pasen, confirmando current/history no cambian en rechazos y snapshot legible. Mantener 24 tests U1/U2.

## Fallos producto evidenciados
- Skill paso2 pide resumir source; debe conservar exactamente campos observados, resúmenes/inferencias sólo brief/motive. Mantener observed_at exacto al retriage, no nuevo reloj. Cambios fuente+answers se bloquean U2.
- Fresh skill reconciliación (main .audit/u2-triage-reconciled.json) devolvió needs-triage por grounding pendiente pese a criterio producto aclarado. Aclarar ready-for-agent significa listo para siguiente paso acotado, como grounding; no grounding completado/ejecución/entrega. Si criterio ya definido, sin preguntas, no hace falta needs-triage perpetuo por hechos investigables. Sin modelo cambiado ni edición del artefacto histórico.
- Sin evidencia de supuesto duplicado: NO crear resolution concluyente ni entrevista técnica ni inventar refs. Proponer grounding listo para agente con aceptación observable de INVESTIGACIÓN que contraste supuesto, dentro del grant, sin certificar entrega; o conservar espera si realmente falta decisión humana. Contrato needs-triage exige refs o resolution (no se admite inventar refs). Añade ejemplo técnico/sospecha sin evidencia con formato vigente y una comprobación por CLI. El review textual proponía needs-triage vacía: no es aceptado por parser; corregir documentación/skill explícitamente. No ampliar estados a ciegas.
- No prometer permisos, integración ni entrega; next_step es propuesto dentro del grant, no autorización de ejecutar.

## Alcance
Sólo isswf/, tests/, .agents/skills/isswf-triage/SKILL.md, docs/u1-usage.md/u2-usage.md, examples/u2/. Puedes simplificar duplicaciones puras claras pero no refactor general ni capas. Verificar 2-3 funciones públicas de contracts; eliminar helpers intake ya muertos si realmente no hay callers. README/spec/audit del padre NO modificar. Puedes crear exclusivamente .audit/u2-fix-result.md sin commit para entregar resultado final breve. Registra commit y tests, límites. Padre revisará en contexto fresco y hará prueba real. No certificar modelo por autodicho.
