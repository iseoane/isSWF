# Auditoría del rastro del spike

Revisor: `openai-codex/gpt-6-sol`, contexto independiente. Alcance acotado a filas desde 17:15 y transcript activo desde la última petición del usuario. Sin revisión de código ni repetición de probes.

El entorno y los mensajes del tramo activo identifican al padre como `openai-codex/gpt-6.1-sol`. Las llamadas explícitas a agentes usan `openai-codex/gpt-6-sol` o `gpt-6.1-sol`; no consta fallback tras la petición del usuario.

Las filas 17:15, 17:28 y 17:31 registran el alcance, la observación que motivó reconciliar procesos escapados y la conservación del instrumento. No se encontró un giro arquitectónico sin registrar. El brief ya distinguía desconexión del cliente, caída del dueño y bloqueo por identidad incierta.

El padre ejecutó los cinco casos y los repitió con la fuente final `b994ae4f`; guardó `docs/research/probes/pi-lifecycle.py` y `.log`. La fila 17:28 aún apunta a `/tmp`, referencia volátil que conviene complementar con el log retenido. Las observaciones respaldan este experimento, no durabilidad de producción, continuidad tras caída del dueño ni seguridad general. No se probaron una factory, carga LLM real, chat Pi TUI, sandbox, reinicio de máquina ni pérdida de energía.

El instrumento creció por encima del tamaño aproximado previsto y hubo una revisión de comentarios adicional, pero siguió siendo un probe desechable. No consta implementación de factory. La revisión técnica `aa29dfa121bbf1a03` estaba pendiente al emitir esta auditoría y no se contó como aprobación.
