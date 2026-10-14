# Cerrar variantes incompatibles U2

Exclusivo nuevo worktree /tmp/isswf-u2-final-tree desde dfc3bb7, work/u2-final. Modelo delegado sólo Luna high; no subagents/red/instalaciones/remoto/merge/main. Lee absolute main /home/iseoane/Work/isSWF/.audit/u2-build-brief.md, u2-fix-brief.md, u2-fixed-review.md. Dos P2 reproducidos requieren fix antes integración.

La raíz es que la forma dict permite variantes solapadas. Invariantes centralizadas en contracts, no otro sistema paralelo:
- questions significa SOLO preguntas sin respuesta. ID que existe en answers NO puede volver a questions, ni con mismo texto. Validar al read/publish y rechazar prepare antes escribir. No romper la respuesta histórica; seguimiento requiere otra pregunta concreta con nuevo ID, no reactivar anterior.
- resolución concluyente no accionable y preguntas humanas pendientes NO se pueden combinar en U2. Elegimos variante conservadora: parse_proposal y parse_snapshot rechazan resolution !=null con questions no vacías, antes cualquier write. Mientras falten respuestas conservar needs-info/ready-for-human y resolution null. Después registrar disposición evidenciada sólo sin pendientes. No borrarlas para cerrar: control prepare ya impide. No implementar clear respuestas o reconciliación fuente/grant propia de U3.
- Aclara docs y skill decide con varias preguntas permanece espera; needs-triage cuando no quedan. Mantener refs de TODAS respuestas actuales. Sigue source exacta al retriage. Ready es preparado para siguiente grounding, no su finalización ni permiso.
- Eliminar _strings y _timestamp en intake si sin callers (review los identifica muertos), no refactor amplio.

Regresiones rojas primero para ambos casos; probar que rechazos mantienen snapshot/history y que seguimiento legítimo nuevoID es respondible. Probar resolución sinquestions sigue válida. Mantener28 anteriores. Paths sólo isswf/, tests/, .agents/skills/isswf-triage/SKILL.md, docs/u2-usage.md. Un commit local con tests, no reescribir historia. Informe uncommitted .audit/u2-fix2-result.md. No sobrecertificar seguridad/modelo. Padre revisará artefacto final y prueba live.
