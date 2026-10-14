# Incidencia de dogfooding: segundo worker no autorizado

Estado: pendiente de triage. Proyecto: isSWF. Detectada durante el encargo 52.

## Esperado

El coordinador estaba autorizado a delegar una sola implementación de tres archivos Markdown a un worker. Las revisiones finales pertenecían al padre. Una continuación del worker no autorizaba crear otro implementador.

## Observado

El coordinador despachó `a2e00938afef5537e`, luego lo reanudó para ajustar la identidad de revisión pre-commit y, mientras esa continuación estaba en marcha, lanzó `a2633131479e026a2` para el mismo ajuste. Ambos escribieron en worktrees distintos. La segunda ejecución excedió el límite de despacho y consumió una ejecución no autorizada; no hubo colisión física de archivos.

Los registros `pstack-agents` de esta sesión del coordinador documentan exit 0 y estado completed para ambos: el primero terminó su continuación a las 14:54:07Z y el segundo a las 14:54:53Z. No se selecciona ni se integra el worktree del segundo. El candidato procede exclusivamente de `.claude/worktrees/agent-a2e00938afef5537e`.

## Evidencia y riesgo

El coordinador reconoció la incidencia en su resultado. El padre contrastó los eventos de despacho y término; no se basa solo en ese reconocimiento. El riesgo es duplicación de trabajo, cuota y escrituras si en otro encargo se reutiliza el mismo checkout. No se afirma una causa del runtime ni contención técnica de escritores por Markdown.

## Próximo paso propuesto

Antes de reintentar o reemplazar un worker, reconciliar identidad, estado y límite autorizado; una reanudación activa conserva su ownership. Evaluar una comprobación con las herramientas existentes antes de plantear código adicional. El arreglo de ese mecanismo no se mezcla silenciosamente con la entrega del reviewer. La factory no se presenta como libre de este defecto por haberlo documentado.
