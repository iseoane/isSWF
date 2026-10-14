# Candidato B. Registro mínimo y brief versionado

## Uso y autoridad

En S01, el operador registra el repositorio y encargo autorizados y entrega una issue. El coordinador aplica triage mediante una skill Markdown, contrasta evidencias, elige tratamiento proporcional y deja un brief consultable. Ejemplo ficticio, no validado contra GitHub: una corrección clara recibe categoría `bug`, preparación `ready-for-agent` y aceptación observable; otra sin resultado esperado queda en `needs-info`. Ninguna inicia código.

El operador autoriza y decide cambios de producto. El coordinador solicita cambios de preparación y redacta briefs dentro de ese alcance. Un único dueño del registro valida y publica revisiones; issue, etiquetas y panel no escriben autorización ni estado. `ready-for-agent` expresa preparación, no permiso de ejecución. Las instrucciones externas son datos no confiables.

## Forma y revisiones

Un registro estructurado por trabajo contiene identidad local estable y origen `(repositorio, número de issue)`, referencia a autorización confiable, categoría, preparación y motivo, estado operativo S01, bloqueos y decisiones pendientes, referencia a la revisión vigente del brief, revisión monotónica y fecha de actualización. El brief versionado conserva objetivo, alcance y exclusiones, aceptación, origen, repositorio y base conocida, dependencias, riesgos, contexto, tratamiento elegido y su motivo, y comprobaciones previstas. Configuración, límites y checkpoints de ejecución quedan pendientes; no se inventan intentos ni workers.

Cada revisión del brief es inmutable e identificable; el registro solo apunta a la vigente. Una actualización publica conjuntamente nueva referencia, preparación y revisión del registro con control de revisión esperada. Releer el mismo origen reconcilia el mismo trabajo: si no cambia la información material, no crea otra revisión ni otro brief activo. Un cambio de alcance exige reconciliar autorización y emitir nueva revisión antes de declararlo listo. Si falla la publicación, se conserva la revisión previa visible; cualquier contenido nuevo no referenciado carece de autoridad y puede depurarse sin afectar la lectura.

Duplicados y comportamiento ya existente solo se declaran con referencias y evidencia suficiente; sin acceso o comprobación se registra «no comprobado», nunca «no existe». El panel y el resumen conversacional leen el mismo registro y la revisión de brief referenciada, mostrando fecha, antigüedad y decisiones pendientes. La vista escapa el texto de la issue, no solicita credenciales y no expone datos sensibles.

## Unidades comprobables

1. Ingesta autorizada y triage. Comprobar issue clara, ambigua y etiqueta hostil; sin autorización, no declarar trabajo ejecutable. Commit al pasar esos casos.
2. Registro y revisiones de brief. Comprobar relectura idempotente, conflicto de revisión y cambio de alcance sin dos briefs vigentes. Commit al comprobar la referencia autoritativa.
3. Panel y resumen de lectura. Comprobar igualdad de estado y antigüedad, decisiones pendientes y escape de contenido externo. Commit tras la demostración de ambos canales.
Una revisión independiente comprueba alcance, autorización, incertidumbre y exposición de datos; sus correcciones tienen comprobación y commit de cierre.

## Límites y elección

Se descartan Markdown mutable paralelo y sincronización bidireccional con etiquetas GitHub. Frente al documento único de A, el registro facilita revisiones y proyecciones, pero exige publicación coherente y navegación entre registro y brief. S02 podría fijar esa revisión al delegar; no se promete ejecución ni integración. Sin repositorio autorizado, los ejemplos ficticios no validan GitHub real. No se prescriben entrevistas, TDD ni pipeline de agentes.

Fuentes: `docs/spec-v1.md` (TRI-01–05, OPS-01, SEC-01–02), `docs/plan-v1.md` (S01), `docs/vision.md`, `GLOSSARY.md`, `docs/arquitectura-candidata.md` (datos y ownership), `docs/research/referencias.md` (triage y panel).
