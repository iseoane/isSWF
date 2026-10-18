# S01. Preparar una issue y verla en el panel

Este documento conserva el contrato y la evidencia histórica U1/U2. El corte nativo siguiente prepara y relee un brief local; no cierra S01 completa ni sustituye el panel histórico. El estado general y las capacidades verificadas están en el [plan vigente](plan-v1.md), no en las limitaciones originales de U1/U2. La [spec](spec-v1.md) permanece sin cambios.

## Preparación nativa de una issue

Desde un checkout fuente autorizado, el coordinador usa `tools/isswf-intake.mjs`; el paquete de recursos Markdown no contiene este ejecutable. Esta ruta no requiere Pstack, Python, SQLite, un modelo ni un worker. Recibe una observación GitHub obtenida mediante una lectura autorizada, un grant externo confiable limitado a preparación y una propuesta curada por el coordinador. No consulta GitHub ni interpreta etiquetas como permisos. La propuesta clara conserva `questions: []`; una decisión pendiente queda como pregunta, no como respuesta inventada.

```sh
node tools/isswf-intake.mjs prepare --project /absolute/project --repository owner/repo --issue 21 --source /absolute/observation.json --grant /trusted/outside-project/prepare.json --proposal /absolute/proposal.json
node tools/isswf-intake.mjs read --project /absolute/project --repository owner/repo --issue 21
```

La observación contiene `{ observedAt, issue }`; `issue` conserva los campos `number`, `title`, `body`, `state`, `url`, `labels` (objetos con `name`) y `updatedAt` de `gh issue view`. El grant contiene exactamente `version: 1`, `project` (raíz Git canónica absoluta), `repository`, `issue`, `reference` y `permissions: ["prepare"]`. Su procedencia debe corresponder a una decisión real del operador. Un archivo fuera del proyecto no autentica por sí solo esa decisión: esta herramienta valida vínculos y forma, no ofrece un servicio de autorización. La propuesta contiene `objective`, `scope`, `exclusions`, `acceptance`, `questions`, `nextStep` y `targetBase` (SHA completo de un commit existente). Las cuatro listas son arrays de texto. Una propuesta sin preguntas exige aceptación observable.

La identidad canónica repositorio/issue deriva un ID legible con prefijo `S01-<número>-` y hash completo, único dentro del proyecto. Preparar escribe exclusivamente `.factory/jobs/<ID>/brief-r1.md` e `intake.json`; es una modificación local visible para Git, no una autorización de commit o ejecución. El Markdown es el brief autoritativo. El registro enlaza sus bytes, fuente, propuesta, grant y base. Un claim de directorio exclusivo impide dos preparaciones del mismo origen. `intake.json`, publicado por enlace exclusivo tras sincronizar los archivos, es también la señal de publicación completa; no hay un tercer marcador. Una publicación incompleta o corrupta bloquea sin reparar ni sobrescribir automáticamente.

Repetir la misma preparación devuelve `reused` y conserva los mismos bytes. El fingerprint incluye título, hash del cuerpo, etiquetas ordenadas, estado y `updatedAt`; no incluye la hora de lectura. Cualquier diferencia en esos campos, el grant o la propuesta bloquea conservadoramente con `reconciliation-required`. La preparación no decide si una diferencia es inocua ni publica otra revisión. El coordinador puede usar `reconcile` explícitamente; no se borra un claim para eludir un bloqueo.

`read` no crea directorios, actualiza registros ni hace llamadas de red. Puede recibir `--source` y `--grant` para contrastar una observación y autorización suministradas. Sin ellos muestra solo lo último observado y la autorización como no recontrastada. Incluso con ellos la frescura es la de esa observación, no una consulta viva a GitHub. El resumen conserva preguntas y bloqueos, pero siempre declara `executionAuthorized: false`. Solo una delegación posterior, con grant e inputs Git propios, podría consumir el brief ya revisado y comprometido. Este corte no cambia el JSON ni los comandos históricos U1/U2 de `isswf-triage`.

## Conciliación nativa explícita

`reconcile` recibe los mismos inputs que `prepare`, más `--revision N` y `--reconciliation /trusted/outside-project/reconcile.json`. La atestación externa contiene exactamente `version: 1`, `project`, `repository`, `issue`, `reference`, `reason`, `permissions: ["reconcile"]`, `revision` y `expected: { recordSha256, briefSha256 }`. Los hashes identifican el registro íntegro y brief de N−1. La procedencia debe ser una decisión real del operador, no texto de la issue ni un archivo autoautorizado.

La revisión 1 conserva `intake.json` y `brief-r1.md`. Cada revisión posterior publica `brief-rN.md` y después `intake-rN.json` sin modificar los anteriores. El registro enlaza su predecesor y la atestación. Una repetición idéntica reutiliza esa revisión; inputs distintos, predecesor obsoleto, claim ocupado o publicación parcial bloquean sin limpieza automática. El claim es cooperativo dentro del mismo almacén, no una garantía frente a escritores externos.

`read` sigue seleccionando r1 por defecto; `--revision N` selecciona otra revisión expresamente. No hay puntero a «latest». En iniciativas, la propuesta de `isswf-plan.mjs` puede indicar `briefRevision: N` para ese job; omitirlo conserva r1. Revisar el plan requiere su checkpoint Git y permiso propio. El estado consulta el registro de la revisión fijada en el plan, no adopta la más nueva. Este corte no enlaza todavía peticiones duplicadas ni completa S01.

## Contrato histórico y objetivo completo de S01

## Experiencia del operador

El operador registra el repositorio y autoriza preparar una issue. El coordinador aplica triage, devuelve una ficha breve y permite consultar la misma información en el panel local.

Ejemplo ficticio: "Prepara la issue 17, mostrar la fecha de última actualización". Si el objetivo y la aceptación están claros, el coordinador no abre una entrevista. Si falta decidir qué significa "actualizado", pregunta esa decisión y conserva la ficha pendiente. No inicia implementación en ninguno de los casos.

La ficha muestra categoría, preparación, objetivo, aceptación, tratamiento propuesto y motivo, riesgos, dependencias y siguiente paso. El panel también muestra cuándo se leyó la issue y cuándo se actualizó el trabajo. No afirma que GitHub o el código sigan iguales desde entonces.

`ready-for-agent` significa que la preparación permite abordar el siguiente paso indicado, por ejemplo grounding. No significa grounding completado, permiso de ejecutar código ni capacidades de S02 disponibles. En S01 la ejecución figura como "no disponible en esta versión".

## Responsabilidades

- El operador registra autorización confiable y resuelve decisiones de producto o ampliaciones de permisos.
- El coordinador aplica la skill de triage y solicita cambios del trabajo dentro de esa autorización. No necesita un agente de triage permanente.
- La skill define qué contrastar y qué resultado devolver. No escribe directamente el registro ni decide permisos por etiquetas externas.
- Un soporte local pequeño valida identidad, autorización y revisión esperada y conserva el trabajo. Es el único escritor operativo. No lanza workers en S01.
- Panel y resumen conversacional leen una vista del mismo registro. No conservan otros estados editables.

La consulta de GitHub reutiliza `gh` cuando exista autorización y acceso configurado. S01 no instala etiquetas, comenta issues ni publica briefs por defecto. Leer una issue no autoriza ningún efecto remoto. Sin repositorio autorizado solo se pueden usar fixtures ficticios para desarrollar y comprobar, nunca declarar validada la integración real.

## Skill de triage

La [skill de triage](../.agents/skills/isswf-triage/SKILL.md) produce propuestas claras o pendientes de decisión y reconcilia respuestas registradas por el operador. Se probó con carga explícita en agentes frescos y registro real mediante CLI. U2 conserva `needs-info` y respuestas; bloquea reutilizarlas si cambia la fuente o la autorización. Esa reconciliación más amplia pertenece a U3. Los procedimientos siguientes también incluyen capacidades de S01 completa todavía pendientes. No se modificaron settings globales de Pi.

El trigger es preparar o reconciliar una entrada autorizada. Recibe referencia de trabajo, fuente externa y revisión observada, autorización y decisiones previas pertinentes. Su salida propone categoría, preparación con motivo, brief, evidencias, incertidumbres y siguiente paso. La configuración no se repite como una bolsa de parámetros en cada llamada.

El procedimiento adapta sus comprobaciones:

- Una issue clara conserva el camino corto y una aceptación observable.
- Una incertidumbre de producto imprescindible pasa a `needs-info` o `ready-for-human` con decisión y responsable explícitos.
- Una incógnita técnica investigable propone grounding. No se pregunta al operador un hecho que puede comprobarse dentro del alcance autorizado.
- Un bug distingue comportamiento esperado, síntoma reportado, reproducción observada e hipótesis. Prepararlo no exige ejecutar una reproducción sin capacidades comprobadas.
- Un duplicado o petición ya resuelta necesita referencia y evidencia suficiente. Una coincidencia de títulos no basta.

Las comprobaciones de código preliminares solo usan capacidades autorizadas y comprobadas. Sin ellas, el resultado indica "no comprobado" y propone el grounding posterior. No inventa que una petición existe o no existe. TDD, entrevista, researcher y revisión especializada no son pasos universales.

Las categorías y preparaciones son las de la spec. `ready-for-human` incluye su motivo. Un resultado duplicado, ya resuelto o descartado conserva evidencia y deja de recomendar implementación, sin confundirlo con una entrega de código integrada. Las etiquetas GitHub son correspondencias externas pendientes de revisar, no otra máquina de estados.

## Registro y revisiones

U1 conserva en SQLite un snapshot estructurado por revisión, incluido el brief como campos JSON en la misma revisión. El padre aceptó esta aclaración de representación tras la revisión independiente: la metodología sigue en Markdown, sin otro brief activo editable. La publicación del snapshot y su historia usa una transacción; las consultas abren la base readonly y no crean estado ausente.

El registro contiene:

| Grupo | Contenido |
| --- | --- |
| Identidad | Id local estable, repositorio canónico y número de issue. |
| Fuente | Revisión o fingerprint del contenido leído, fecha de lectura y referencias de evidencia. |
| Autoridad | Referencia a decisión confiable del operador, alcance y efectos permitidos. Nunca secretos. |
| Revisión | Número de revisión local, fecha y actor del cambio, contenido anterior recuperable. |
| Preparación | Categoría, estado de preparación, motivo, tratamiento propuesto y siguiente paso. |
| Brief | Objetivo, alcance, exclusiones, aceptación, repositorio, base conocida y contexto. |
| Condiciones | Riesgos, dependencias con condición de salida, incertidumbres y decisiones pendientes. |
| Plan previsto | Comprobaciones, revisiones necesarias y motivo, configuración prevista, límites y cadencia de checkpoints. |

Una base no consultada figura como desconocida. Configuración, límites y checkpoints todavía no resueltos se declaran pendientes, no efectivos. Antes de cualquier delegación futura S02 tendrá que resolver y fijar esos datos, autorización e instrucciones. El triage no los fabrica para completar una plantilla.

Los agentes devuelven propuestas. El soporte registra una modificación solo con autorización vigente y revisión esperada coincidente. La publicación conserva conjuntamente brief, preparación y revisión. Un fallo deja visible la revisión anterior válida o un error explícito, nunca una mezcla de contenido nuevo y estado viejo.

Releer el mismo origen devuelve el mismo trabajo. Sin cambios materiales no genera otra revisión. Si cambia la issue, se contrasta contra el brief autorizado; no se sustituye silenciosamente el alcance. Si hay una nueva propuesta material se conserva como pendiente de reconciliar. Una actualización obsoleta se rechaza y el coordinador vuelve a leer. Cambiar alcance o permisos requiere una nueva decisión confiable antes de usar esa ampliación.

La historia no depende de que el proyecto ya esté en Git. La primera implementación debe demostrar unicidad de origen, conservación de la revisión previa y rechazo de conflictos. Reemplazo atómico y control de revisión no equivalen por sí solos a exclusión de escritores.

## Panel y conversación

El panel mínimo contiene lista de trabajos y detalle de la ficha, no un editor de permisos ni botones de ejecución. Puede mostrar los informes como texto o Markdown restringido. No acepta HTML de la issue, scripts, recursos remotos ni lectura de rutas arbitrarias. Los enlaces se limitan a destinos permitidos.

Su acceso es local y de lectura. No se sirve la raíz del repositorio con un servidor estático que exponga configuración o datos privados. La implementación debe definir host, endpoints, control de origen y campos publicados. No se presupone que localhost resuelva por sí solo toda la seguridad.

Cada consulta obtiene revisión y fecha junto al estado. El resumen del coordinador usa esa misma consulta. Si panel y conversación leyeron en momentos distintos, muestran sus revisiones y antigüedad; solo se exige igualdad al comparar el mismo snapshot. Una caída o dato inválido produce aviso de indisponibilidad, no progreso inferido ni una ficha antigua presentada como actual.

Propuesta visual, no captura de una aplicación:

```text
Issue 17 · feature · ready-for-agent
Objetivo: mostrar cuándo cambió el estado
Siguiente paso: grounding del comportamiento actual
Decisiones pendientes: ninguna
Revisión local: 2 · issue leída hace 4 min · ficha actualizada hace 1 min
Ejecución: no disponible en S01
```

## Unidades funcionales pequeñas

Cada unidad recorre entrada, decisión, conservación y observación. No se divide en terminar almacenamiento, luego API y luego interfaz. La seguridad mínima existe desde U1, no se aplaza hasta la última unidad.

| Unidad | Resultado visible | Comprobación y punto de commit |
| --- | --- | --- |
| U1. Preparar una issue clara | Con autorización registrada, la skill produce una ficha conservada que panel y coordinador consultan. | Fixture claro, rechazo sin autorización, aceptación observable, ninguna implementación iniciada y comparación del mismo snapshot. Commit tras comportamiento comprobado y revisión independiente. |
| U2. Resolver información insuficiente | Una issue ambigua muestra la decisión pendiente; una respuesta autorizada actualiza el mismo trabajo y revisión. | No pregunta hechos investigables al humano; no inventa datos; no ejecuta código. Comprobar respuesta fuera de alcance y resultado duplicado con y sin evidencia. Commit con esos casos. |
| U3. Reconciliar una relectura | Releer o actualizar la issue no crea trabajos duplicados ni sobrescribe una decisión vigente. | Mismo origen sin cambios, fuente modificada, autorización revisada, actualización obsoleta y publicación fallida. Conservar historia y mostrar revisión actual. Commit con evidencia de esos resultados. |
| U4. Contrastar la entrada real y exposición | Un repositorio autorizado aporta una issue real y la ficha se observa sin exponer datos privados. | Revisar texto hostil, etiquetas que pretenden conceder permiso, campos publicados, acceso local, error de lectura y antigüedad. Sin acceso autorizado a GitHub esta unidad queda bloqueada, no se sustituye por un PASS del fixture. Commit y demostración cuando se cumpla. |

Se propone una PR draft de S01 tras el primer commit verificable, solo cuando exista repositorio y permiso de publicación. Puede agrupar estas unidades si sigue siendo revisable. Si crece, se divide por resultado observable; no se encadenan PRs dependientes sin ampliar el contrato v1. Los checkpoints preservan progreso parcial y lo identifican como tal.

## Evidencia necesaria para cerrar S01

Las unidades demuestran los seis escenarios del plan y sus criterios TRI, OPS y SEC asignados. El revisor independiente contrasta objetivo, decisiones, autorización, idempotencia, visibilidad y exposición de datos. También comprueba que skill y registro tienen responsabilidades claras y que las correcciones se verifican.

La demostración incluye issue real autorizada, ficha clara y ambigua, evidencia de duplicado o comportamiento existente cuando se afirme, relectura sin duplicación, contenido externo incapaz de ampliar permisos y panel y resumen del mismo snapshot. Los fixtures y la revisión de este documento no acreditan S01 funcionando.

No se entrega aquí fallback, workers independientes del chat, ejecución de código cliente, PR de un worker, Engram, A2A, recuperación tras reinicio ni paralelismo. S01 prepara esos encargos; S02 sigue condicionada a capacidades y fronteras comprobadas.

## Elección y revisión del diseño

Se compararon [documento autoritativo](../.audit/s01-candidate-a.md) y [registro con brief versionado](../.audit/s01-candidate-b.md). La [comparación independiente](../.audit/s01-design-comparison.md) recomienda B como base. Se conserva de A la lectura conjunta y el rechazo de datos inválidos. El brief se incluye en la misma revisión para evitar publicación coordinada de dos artefactos. En U1 sus campos son estructurados en JSON, no un cuerpo Markdown separado. Se rechaza usar Git como única historia en un workspace sin repositorio y un supervisor completo para esta slice.

La [revisión independiente del contrato](../.audit/s01-design-review.md) no encontró bloqueantes de diseño. U1 usa Python estándar y SQLite, sin framework ni dependencias nuevas. La [revisión del candidato implementado](../.audit/u1-final-review.md) no encontró bloqueantes para esa unidad. Se comprobaron 13 pruebas y el recorrido de una propuesta producida por la skill hasta CLI, HTTP y navegador real. Las guías de [U1](u1-usage.md) y [U2](u2-usage.md) permiten probarlo. U2 añade decisiones pendientes, respuestas confiables y retriage sin auto-ready. Se comprobaron [31 tests](../.audit/u2-final-archive.log), [96 variantes estructurales](../.audit/u2-variants-final.json) y un recorrido real CLI/HTTP/browser con propuestas de agentes frescos. La [evidencia U2](../.audit/u2-live.json) no acredita workers, acceso real a GitHub ni veracidad universal de evidencias. Antes de U3 se definirá y probará el arranque por proyecto, incluyendo Engram y Codegraph. Los criterios y casillas de S01 no se marcan completos por este primer corte.

## Initiative-scoped issue jobs

For new initiative jobs, pass `--initiative I0042 --job J001 --type enhancement` to both native issue `prepare` and `read`. The canonical initiative plan must already name the job. The brief and intake binding then live under `.factory/initiatives/I0042/jobs/J001/`, and the initial brief includes bounded read-only discovery for lint, tests, build, dead code and duplication. `configured-unverified` means evidence of configuration only; `not-detected` includes recommendations and is neither PASS nor proof that no custom check exists. The legacy no-initiative CLI remains available for existing records. Do not prepare the same logical issue again under a new initiative merely to bypass an existing record or a reconciliation block. This command still needs a real authorized GitHub observation; local requests use a curated template brief without inventing remote issues.
