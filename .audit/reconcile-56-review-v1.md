## Gate 56 — revisión de solo lectura

**Veredicto: no aprobar sin aclarar dos puntos de la secuencia/terminología.** El resto refleja bien el estado y los límites comprobados.

### Hallazgos materiales

1. **Confunde construir perfiles con ejecutar trabajos.** En ambos documentos, “hacer planificación y research [...] en paralelo” puede leerse como planificar y hacer research de un encargo simultáneamente. El acuerdo para después de #55 es **construir en paralelo los perfiles de planner y researcher**. No debe sugerir que el research de un encargo pueda usar un plan desactualizado: los cambios materiales requieren reconciliar el plan antes de continuar.

2. **Asocia `.factory/` con la instalación.** En `docs/vision.md`, “La propuesta de instalación en `.factory/`” puede mezclar el directorio propuesto para artefactos durables de spec/plan/jobs con la instalación runtime #44, que sigue pausada. Conviene llamarlo **propuesta de ubicación del espacio de trabajo de artefactos**, y distinguirlo expresamente de #44. En el plan también conviene aclarar qué propuesta de ubicación se somete a #55.

### Standards / Spec

- **Standards: PASS con esas aclaraciones.** Prosa legible, estado y límites generalmente explícitos; los enlaces Markdown relativos comprobados resuelven y `git diff --check` no reporta errores.
- **Spec: PASS en lo sustantivo, con los dos bloqueos de claridad anteriores.** No veo cambios a la autoridad de producto ni a la especificación v1. La distinción entre pruebas locales y capacidades runtime está bien conservada.

### Evidencia de estado

El candidato en `.claude/worktrees/agent-a6d89a75994a4ef30` parte de `d8581f7`; el diff contiene **exactamente** `docs/vision.md` y `docs/plan-v1.md`, sin otros cambios en ese worktree. La evidencia de Codegraph respalda índice y consulta exploratoria, pero no grounding completo para un encargo. La comprobación de Engram respalda lectura/escritura acotadas por proyecto, pero no integración runtime. Los cierres Markdown, #54 y #49 tampoco acreditan S01/S02/H1 completos. `origin` está configurado; eso no equivale a autorización para operar remotamente, y no infiero permiso adicional.

**Sugerencias, no bloqueantes:** hacer que la secuencia distinga visualmente la construcción de capacidades de su uso en un encargo; mantener explícito que las sesiones Markdown fueron manuales; conservar las afirmaciones acotadas de Codegraph/Engram como están. No edité archivos, lancé subagentes ni hice investigación nueva.
