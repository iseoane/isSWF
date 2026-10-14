# Cierre del primer núcleo Markdown

## Entrega local

- `d63ffd9`: worker, especialista diagnóstico y siete referencias compartidas.
- `b777ab2`: skill coordinadora adaptativa para Pi y README actualizado.
- `6530416`: mapa de 24 principios adaptados y 12 candidatos de prácticas/perfiles.
- `c09e7e6`: verificador repetible, evidencia de comportamiento, modelos y revisiones.

La metodología nueva no necesita Python. La CLI anterior de U1/U2 sí lo conserva. No se integró el candidato de instalador/distribución Python ni se ejecutó publicación remota.

## Evidencia final

El padre repitió el verificador desde un archive del HEAD `c09e7e6`: enlaces, frontmatter y catálogo Pi con trust y sin trust pasaron. El worker integrado corrigió un fixture real después de observar el fallo y sin ampliar alcance. El coordinador, cargado manualmente, preparó y despachó un único worker mediante la herramienta real. El padre y un revisor independiente confirmaron el resultado. Un diagnóstico con acceso ausente declaró incertidumbre y pidió evidencia concreta redactada.

Los informes y los límites están en `markdown-core-proof.json`, `markdown-core-behavior.md` y `markdown-core-review.md`. Los metadatos de ocho actores, incluido el hijo despachado, confirman OpenAI GPT-6 Luna con esfuerzo high; no se usó fallback. La diversidad de modelos de la revisión es reducida.

## Qué no se declara cerrado

- La factory v1 completa, S01/S02 completos, instalación portable, recuperación durable, contención hostil y fallback operativo.
- Expansión nativa de `/skill:isswf-coordinator` con LLM en una sesión interactiva. El catálogo reconoce el comando, pero el subagente RPC usado en la prueba leyó la skill manualmente.
- La investigación primaria complementaria de todos los catálogos externos. El mapa actual declara evidencia indirecta; la tarea 49 sigue pendiente. Las tareas 48, 50 y 51 se cierran en su alcance entregado.

Los worktrees y el borrador de arranque previos se conservan, sin incluirse en estos commits. No se borraron archivos del usuario ni se modificó configuración global.

## Uso

En Pi, recarga las skills con `/reload` y usa `/skill:isswf-coordinator` para un encargo. Si el runtime no expande el comando, lee `.agents/skills/isswf-coordinator/SKILL.md` y sigue sus instrucciones. La delegación real necesita la herramienta `agent` de Pstack; los perfiles Markdown se pasan por ruta, no se ejecutan como roles nativos de Pi.
