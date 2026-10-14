**Sin bloqueantes reproducibles** en la revisión incremental `d49e535..bf27d776`.

- La propuesta y el snapshot rechazan ahora `ready-for-agent` con preguntas pendientes o `resolution` no nula. La regresión cubre ambos puntos de entrada.
- Se conservan las validaciones previas de respuestas registradas y resolución; docs de uso y skill coinciden con el guard. El diff no incluye el checker.
- **31 tests pasaron**; census: **96 variantes, 0 incompatibles aceptadas**. `git diff --check` pasó.
- El único estado temporal en el worktree es el artefacto preexistente `.audit/u2-guard-result.md`; no lo modifiqué.

**Límites:** revisión del diff y contratos locales; no repetí CLI, HTTP ni browser, como pediste. El census cubre estructura de snapshots, no semántica universal ni el ciclo de vida completo.
