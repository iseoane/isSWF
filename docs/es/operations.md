# Consultar el trabajo sin iniciar agentes

[Inicio](../../README.es.md) · [Documentación](index.md) · [English](../en/operations.md)

Utiliza el coordinador para entender el siguiente paso. Los comandos siguientes consultan el trabajo registrado o abren su panel local; no llaman a ningún modelo. Sustituye las rutas y los identificadores de iniciativa por valores existentes. No inicializan un repositorio ni crean un plan.

## Trabajo normal con delegación del host

Las tareas ordinarias nuevas utilizan la delegación del host con los roles compartidos de isSWF: Pi con la extensión `pi-subagents`, instalada por separado, o Claude Code con agentes nativos. Consulta el ejemplo de configuración y los límites en [compatibilidad de los hosts](../host-portability.md). Configura el modelo y el esfuerzo en el host elegido, no en el archivo de rutas del ejecutor heredado. Si falta la extensión, hace falta decidir su instalación, no construir otro supervisor.

El coordinador proporciona el alcance, el directorio de trabajo, el presupuesto y las comprobaciones, y verifica el cambio real. Para trabajos largos, un lanzamiento en segundo plano compatible con el host devuelve el control mientras continúa la conversación; el coordinador comunica la identidad real de la ejecución y consume su resultado antes de realizar acciones dependientes. La CI prolongada utiliza un aviso de finalización verificado o una única consulta diferida y acotada; nunca una observación continua ni sondeos del modelo. Los resultados duplicados o desfasados requieren reconciliación, no repetir acciones. En Claude Code, dirigir a un agente activo o continuar uno finalizado utiliza solo el identificador exacto del agente devuelto y la elegibilidad que expone el host, dentro de la autoridad y los presupuestos originales; consulta [dirección en vivo y continuación elegible](../../.agents/hosts/claude-code.md#live-direction-and-eligible-continuation). Esta vía no necesita un ejecutable compilado de la fábrica, un runtime fijado para el proyecto, un archivo externo de permisos ni un almacén de capacidad. Windows y Linux son destinos previstos; informa por separado de las evidencias reales de cada host y plataforma. No reclasifiques encargos interrumpidos del runtime como tareas nuevas para eludir sus reservas. Los comandos siguientes siguen disponibles para consultar el trabajo heredado registrado.

## Desde el código fuente

Ejecuta desde la raíz del repositorio de isSWF:

```bash
node tools/isswf-status.mjs --project /absolute/project --initiative I0001
node tools/isswf-snapshot.mjs --project /absolute/project
node tools/isswf-panel.mjs --project /absolute/project --port 0
```

El primer comando lee el plan de una iniciativa y sus registros de apoyo. El segundo muestra una instantánea JSON de todas las iniciativas abiertas; consulta [instantánea de iniciativas](#instantánea-de-iniciativas). El tercero inicia un servidor en primer plano en `127.0.0.1` y muestra su dirección. Deténlo con Ctrl-C. Permite consultar las iniciativas, sus trabajos, las evidencias y las decisiones registradas.

El panel puede guardar notas locales si las evidencias mostradas siguen coincidiendo. Una nota no se aplica automáticamente, no autentica la aceptación del operador ni permite despachar trabajo. No expongas el panel públicamente ni incluyas secretos en sus registros.

## Instantánea de iniciativas

`tools/isswf-snapshot.mjs` lee todas las iniciativas del directorio de estado activo (`.isswf` o `.factory`) y muestra un único objeto JSON con `schemaVersion: 1`, `project`, `stateDir`, `initiatives`, `unopened` y `skipped`. Es de solo lectura y no llama a ningún modelo ni a la red. Envuelve `tools/isswf-snapshot-core.mjs`, que no importa nada de Node y hace todas las lecturas, incluida la elección del directorio de estado, a través de un objeto inyectado con `exists`, `list`, `stat` y `read` asíncronos. Los entornos sin módulos integrados de Node importan el núcleo y llaman a `readSnapshot(project, fs)` con su propio `fs`. El `readSnapshot(project, fs)` del envoltorio de Node usa Node como `fs` por defecto y además aplica la comprobación de directorio regular de `tools/project-state.mjs`, que el núcleo no puede hacer.

- Se omiten las iniciativas cuyos trabajos están todos en `completed`. Las que tienen todos sus trabajos en `pending` y sin registros aparecen en `unopened` solo con `id` y `title`.
- Las demás iniciativas tienen `id`, `title`, `type`, `status` (`parsed` o `unparsed`) y `jobs`. Un plan que rechaza el analizador de planes queda como `unparsed` y sin trabajos.
- Cada trabajo tiene `id`, `status`, `objective`, `dependsOn`, `issues` y `prs` (números citados en su siguiente paso, sus evidencias o `delivery.md`), `recordCount` y `rounds`. Cada ronda tiene `round` (la revisión `brief-r<n>.md`), `reviewRound` y `entries`, y solo aparecen las rondas con registros. Cada registro va al brief que cita; si no cita ninguno, al último, y si no hay ninguno, a `unknown`. Dentro de un brief, `reviewRound` sale de una ronda indicada (el campo de la plantilla de revisión o `Review round: <n>`); si no la hay, la k-ésima revisión del brief es la ronda k y un intento es la ronda 1, así que un intento de corrección debería indicar su ronda. Un brief desconocido se etiqueta `r?`.
- Cada registro `A<nnn>`/`V<nnn>` tiene `id`, `kind` (`attempt` o `review`), `role`, `model`, `modelSource` (`actual`, `requested`, `approved` o `stated`), `effort`, `verdict` (`passed`, `changes-requested`, `failed`, `partial` o `running`), `outcome` (el valor `complete`, `partial`, `blocked`, `failed` o `cancelled` que indica el registro), `round` y `roundSource` (`stated` o `latest`). Los valores que el registro no indica explícitamente son `unknown`.
- Cada entrada tiene además `runs`: un `{ host, kind, id }` por cada [línea `Run:`](../durable-work.md#record-the-launch-identity) del registro (`claude`/`agent`, `claude`/`session` o `pi`/`child`), o una lista vacía. Las líneas mal formadas se ignoran. Este campo se añadió sin cambiar `schemaVersion: 1`, porque los campos existentes no cambian.
- `outcome` se lee de una línea `Reported status`, `Status`, `Outcome`, `Estado` o `Resultado` cuyo valor cierra la línea o la frase. `blocked`, `failed` y `cancelled` dan el veredicto `failed`, `partial` da `partial`, y un intento con otro resultado indicado queda `passed`; un intento sin resultado queda `unknown`. Por lo demás, los veredictos de revisión se leen de etiquetas en inglés o en español (`aggregate`/`agregado`, `verdict`/`veredicto`, `changes requested`/`cambios pedidos` o `cambios solicitados`).
- `role` prefiere el archivo de rol compartido que nombra una línea de identidad (`Profile`, `Role`, `Agent`, `Observer`), de modo que un diagnosticador ejecutado como agente worker aparece como `diagnostician`; una línea de identidad que nombra `isswf-coordinator/SKILL.md` o "coordinator acting as writer" aparece como `coordinator`; si no, vale el primer archivo de rol o nombre de agente `isswf-<rol>` del registro.
- Los veredictos `failed` y `partial`, `outcome`, el filtro de rondas, `reviewRound` y el rol `coordinator` se añadieron sin cambiar `schemaVersion: 1`; un lector debe tratar como `unknown` cualquier veredicto que no conozca.
- Los archivos de más de 1 MB o ilegibles se enumeran en `skipped`; un registro defectuoso nunca interrumpe la instantánea. Que existan ambos directorios de estado o ninguno, o que falte el directorio `initiatives`, es un error.

### Consumo de cada ejecución

`--usage` añade `usage` a cada entrada de `runs`; sin esa opción, la instantánea no abre ninguna transcripción:

```bash
node tools/isswf-snapshot.mjs --project /absolute/project --usage
```

Lee las transcripciones locales que ya escriben los hosts, en solo lectura y sin llamar a modelos. La lógica está en `tools/isswf-run-usage-core.mjs`, que no importa nada de Node; los entornos sin módulos integrados de Node llaman a `addRunUsage(snapshot, { fs, claudeDir, piDir, cache })` o a `resolveRunUsage(run, { fs, claudeDir, piDir, project, cache })` con su propio `fs`. El envoltorio usa `CLAUDE_CONFIG_DIR` o `~/.claude`, y `PI_CODING_AGENT_DIR` o `~/.pi/agent`.

- `claude agent=<id>`: `projects/*/*/subagents/agent-<id>.jsonl` dentro del directorio de Claude. `claude session=<id>`: `projects/*/<id>.jsonl`. Se buscan todos los directorios de proyecto, así que también se encuentran las ejecuciones lanzadas desde un worktree.
- `pi child=<id>`: el único `<id>_*_transcript.jsonl` de `sessions/*/subagent-artifacts` dentro del directorio de Pi o de `.pi/subagents/artifacts` del proyecto. No se encuentran los hijos escritos en el directorio temporal de artefactos de Pi.
- `usage` tiene `found`, `finished`, `model` (`mixed` si hay varios), `tokens` (`input`, `output`, `cacheRead`, `cacheWrite`), `durationMs` (de la primera a la última marca de tiempo de la transcripción), `skills` y `agentsReads` (recuentos por nombre de skill y por ruta desde `.agents/`).
- `costUsd` valora `tokens` con `tools/isswf-prices.mjs` (precios de la API propia de Anthropic que figuran en la referencia claude-api de Claude Code, con fecha 2026-11-03; escrituras de caché de 5 minutos; Claude Haiku 5.5 a su tarifa para prompts de hasta 100K tokens, por lo que los más largos quedan infravalorados). Es `unknown` cuando `model` no es una entrada exacta de esa tabla, lo que incluye los modelos de Pi y los que no son de Anthropic, `mixed` y `unknown`. Una ejecución con `tokensPartial` y coste conocido añade `costPartial: true`. Es una estimación a partir de los contadores registrados, no facturación.
- Los tokens de Claude salen del mismo analizador de transcripciones que `tools/token-native-claude-transcript.mjs`, cuentan cada petición una vez y suman las iteraciones adicionales que una petición registra por llamadas del servidor, como el advisor (su modelo se añade a `model`). Cubren solo la transcripción propia de esa ejecución: una sesión no incluye sus subagentes, y faltan las llamadas auxiliares de Claude que no escriben ninguna entrada en la transcripción (por ejemplo, llamadas pequeñas a Haiku). Los de Pi suman el consumo de cada mensaje de la transcripción del hijo.
- Una carga de skill es una llamada a la herramienta `Skill` (sin su prefijo `<plugin>:`) o una lectura de un archivo `SKILL.md` (con el nombre de su directorio). `agentsReads` cuenta solo las llamadas a las herramientas de lectura de archivos de los hosts; las lecturas por shell no se ven.
- Una ejecución ha terminado cuando su sesión `claude -p` tiene una entrada `cost-state` sin entradas `user` ni `assistant` posteriores, la respuesta final de su agente de Claude es `end_turn` o su hijo de Pi tiene un `_meta.json` con `exitCode`. En una transcripción demasiado grande, `finished` se decide igualmente a partir del fichero completo.
- Si no se encuentra la transcripción, el id no es válido o coinciden varias transcripciones de Pi, `found` es `false`, `reason` es `transcript-not-found`, `invalid-id` o `ambiguous-transcript`, y todos los demás campos son `unknown`. Una transcripción encontrada con líneas no válidas o de más de 64 MB sigue sumando sus entradas válidas (si los supera, solo sus líneas completas dentro de aproximadamente los primeros 64 MB; el límite cuenta caracteres, no bytes) y añade `tokensPartial: true` con la primera comprobación fallida en `reason`. Una transcripción encontrada pero ilegible tiene `found: true`, `reason` `unreadable-transcript` y todos los demás campos `unknown`. Se ignora una última línea incompleta.
- `cache` es un `Map` que pertenece a quien llama y que conserva entre llamadas; no se escribe nada en disco ni en los registros de la iniciativa. Una ejecución terminada se guarda por host, tipo e id junto con el tamaño de su transcripción, y se reutiliza mientras ese tamaño no cambie, porque continuar una ejecución añade líneas a su transcripción. Las ejecuciones sin terminar se leen siempre. La línea de comandos empieza con la caché vacía.

## Desde una instalación preparada

Aquí, `RELEASE` representa la ruta absoluta de un paquete ya preparado y de confianza. No es una dirección de descarga. No se presupone que exista una release pública.

En Windows, utiliza `bin/isswf.exe`. Para una release Node heredada conservada, sigue su guía de instalación y su requisito de Node. Estos comandos no demuestran soporte nativo de mutaciones ni aislamiento fuera de Linux.

```bash
RELEASE/bin/isswf inspect --project /absolute/project
RELEASE/bin/isswf locate --project /absolute/project
RELEASE/bin/isswf exec --project /absolute/project -- isswf-status --initiative I0001
RELEASE/bin/isswf exec --project /absolute/project -- isswf-panel --port 0
```

`inspect` muestra información de instalación y migración sin modificar el proyecto ni el almacén. Su lista `blockers` incluye los intentos heredados abiertos, cada uno con la versión fijada original con la que hay que reconciliarlo antes de migrar. `locate` verifica y localiza el runtime conservado que se ha seleccionado. `exec` utiliza el runtime fijado para ese proyecto, no necesariamente el paquete global más reciente. Si falta el código conservado o está dañado, la operación se bloquea.

## Crear un resumen local de tokens

`tools/token-report.mjs` genera informes únicamente a partir de resúmenes acotados que tú proporciones, incluido un recibo nativo de Claude capturado automáticamente después de convertirlo. No inspecciona sesiones del host, llama a modelos ni estima facturación. Los resúmenes de Pi y Claude transcritos manualmente se identifican como tales. Mantén los archivos de entrada depurados y en local.

Cada archivo JSON contiene `version: 1`, `mode: "window"` y `rows`. Cada fila representa una ventana independiente y no solapada; incluye un `id` opaco y acotado, `host` (`pi` o `claude`), `hostVersion`, `model`, `effort`, `taskClass`, `candidate`, `outcome`, el recuento no negativo `accepted`, la procedencia (`manual-pi`, `manual-claude`, `native-pi-summary` o `native-claude-summary`), `scope` (`agent`, `unattributed` o `tree`), `window` y `counters` con `input`, `output`, `cacheRead` y `cacheWrite`. Los identificadores y metadatos usan entre 1 y 128 caracteres ASCII: letras, números, `.`, `_`, `:`, `+` o `-`; utiliza identificadores opacos, nunca rutas ni texto privado. Los contadores son enteros seguros no negativos o `null` en JSON si se desconocen. Las categorías deben ser disjuntas. Las filas que comparten ventana y resultado repiten el mismo candidato y recuento de aceptación; el informe cuenta ese resultado una sola vez, no una vez por agente. Se rechazan las declaraciones contradictorias de ese grupo. Antes de introducir datos acumulativos, reiniciados, reanudados o de eventos, quien los suministra debe convertirlos en una ventana acotada y no solapada; se rechazan los modos no admitidos. No combines una fila de árbol con otras filas de la misma ventana. Añade una fila sin atribución cuando se desconozca la cobertura; nunca inventes proporciones por agente. Se rechazan los campos desconocidos y la salida solo contiene campos permitidos. Los campos opcionales `durationSeconds`, `requests`, `turns`, `corrections` y `reasoning` (no aditivo) se muestran por separado.

Indica un único resumen o archivos comparables anterior/posterior:

Este es un ejemplo mínimo válido de una fila:

```json
{
  "version": 1,
  "mode": "window",
  "rows": [
    {
      "id": "agent1",
      "host": "pi",
      "hostVersion": "1.0",
      "model": "model1",
      "effort": "high",
      "taskClass": "task1",
      "candidate": "candidate1",
      "outcome": "outcome1",
      "accepted": 1,
      "provenance": "manual-pi",
      "scope": "agent",
      "window": "window1",
      "counters": { "input": 100, "output": 20, "cacheRead": 30, "cacheWrite": 5 }
    }
  ]
}
```

Ejecuta un resumen o compara los archivos anterior y posterior:

```bash
node tools/token-report.mjs --input "summary.json"
node tools/token-report.mjs --before "before.json" --after "after.json"
```

El recuento de aceptaciones abarca toda la ventana suministrada, incluido el trabajo fallido, las revisiones y las correcciones. El informe muestra los componentes conocidos, el total procesado completo o un subtotal parcial identificado, la proporción de lecturas de caché solo si el denominador es conocido y positivo, y los tokens por resultado aceptado solo si se conocen todos los componentes y hay aceptaciones. El informe etiqueta los datos solo de árbol como `aggregate-only`, las filas individuales como `individual` y la atribución ausente como `unattributed` o `partial`; no presenta un total de árbol inclusivo como atribución por agente. La comparación empareja cada fila por ventana, identificador de agente e identidad del resultado; después exige coincidencia de host/versión, modelo/esfuerzo, clase de tarea, ámbitos, recuentos de aceptación y disponibilidad de categorías. El candidato puede diferir entre las ejecuciones anterior y posterior. Se necesita una base conocida positiva para calcular diferencias. En otro caso, las diferencias se indican explícitamente como incomparables o indefinidas. Una menor proporción de lectura de caché o un total menor no demuestran por sí solos calidad ni ahorro. El límite combinado de entrada es 1 MiB y 100 filas; cada fila admite hasta 4 KiB y la salida hasta 64 KiB. Son cálculos locales, no mediciones de hosts activos ni de facturación.

### Normalizar resúmenes nativos admitidos

`tools/token-native-summary.mjs` acepta un recibo explícito de Pi generado por la extensión fuente opcional o un JSON explícito del resultado final de Claude. Lee como máximo 1 MiB combinado y genera JSON normalizado y acotado; nunca busca almacenes de sesiones ni lee transcripciones. Un recibo o resultado aislado se emite como `mode: "snapshot"`, que el `token-report.mjs` sin modificar rechaza. Las capturas son acumulativas y no se pueden usar como ventanas de resultados aceptados.

Para obtener una ventana de Pi para el informe, proporciona ambas capturas acumulativas. El conversor exige la misma identidad opaca de sesión y versión del host, que la rama inicial sea prefijo de la rama final, contadores monotónicos de padre/hijos, identidades estables para los hijos existentes y que no haya filas eliminadas ni trabajos asíncronos sin resolver. Las filas de hijos nuevos aportan sus contadores de intento declarados. Si no se puede establecer la genealogía, conserva la captura etiquetada o rechaza la ventana; no sumes capturas.

Claude solo admite ventanas a partir de dos resúmenes finales explícitos con el mismo `session_id`, las mismas identidades de modelo y una versión del host conocida y declarada por quien llama (se rechaza la versión `unknown`). Los contadores se comparan por modelo y deben ser monotónicos; se rechaza cualquier reinicio/cambio de sesión o cambio del conjunto de modelos. Si falta una categoría en cualquiera de los límites, el delta de esa categoría queda desconocido. El informe contiene una sola fila inclusiva de árbol, nunca filas aditivas por modelo o agente. Un único resultado —también si es un resultado acumulado reanudado— sigue siendo una captura y `token-report.mjs` lo rechaza como ventana.

Los resúmenes de árbol de Claude usan solo `modelUsage`; nunca convierten `usage` del bucle principal en total ni suman los tokens de razonamiento. Las identidades de modelo se representan con un hash estable, no con sus nombres. Un resumen AgentOutput completado suministrado explícitamente como `{ "agentOutput": ... }` se normaliza por separado como una captura individual; cada categoría numérica ausente sigue siendo desconocida, los campos de caché anulables siguen siendo desconocidos y se rechazan los valores presentes malformados o los lanzamientos asíncronos. Se filtran o se convierten en hash el prompt, el contenido, el worktree y los ID de agente sin procesar. Las capturas individuales siguen separadas de las ventanas de árbol. Este adaptador se basa únicamente en la declaración local bloqueada de `@anthropic-ai/claude-code` 2.1.299; no demuestra compatibilidad con la salida de Claude 2.1.312 instalado ni disponibilidad en vivo. Ni las capturas individuales ni una captura de árbol por sí solas permiten afirmar que exista una ventana o calcular eficiencia por resultado aceptado.

```bash
node tools/token-native-summary.mjs --input "pi-receipt.json" --host pi > "pi-snapshot.json"
node tools/token-native-summary.mjs --input "pi-end.json" --start "pi-start.json" --host pi --id task --window task-window --host-version unknown --effort high --task-class implementation --candidate current --outcome task --accepted 1 > "native-window.json"
node tools/token-report.mjs --input "native-window.json"
node tools/token-native-summary.mjs --input "claude-final-result.json" --host claude --host-version 2.1.312 > "claude-snapshot.json"
node tools/token-native-summary.mjs --input "claude-end.json" --start "claude-start.json" --host claude --host-version 2.1.312 --id task --window task-window --effort unknown --task-class implementation --candidate current --outcome task --accepted 1 > "claude-window.json"
node tools/token-report.mjs --input "claude-window.json"
node tools/token-native-summary.mjs --input "claude-agent-output.json" --host claude --host-version 2.1.312 > "claude-agent-snapshot.json"
```

`tools/token-native-pi.mjs` puede cargarse como extensión del proyecto con habilitación explícita. Durante una configuración autorizada, resuelve por separado la raíz de la fábrica de confianza y el proyecto de destino, y añade la ruta absoluta `<raíz-de-fábrica-de-confianza>/tools/token-native-pi.mjs` a la lista `extensions` de `.pi/settings.json` del proyecto de destino; Pi resuelve estas rutas configuradas independientemente de la raíz del proyecto. Crea `<estado-seleccionado>/native-usage.json` con la decisión explícita de habilitación y `destination: "native-usage"` dentro de la raíz existente `.isswf` o `.factory`. Hace falta iniciar una sesión nueva o ejecutar `/reload`; esto no carga en caliente la instancia actual de la extensión. Si la captura está deshabilitada o falta/el archivo de aceptación no es válido, la extensión no solicita RPC de coste ni escribe datos de captura. Cuando está habilitada, toma una referencia inicial al comenzar la sesión y nuevas instantáneas en los límites `agent_settled` de Pi y `subagent:async-complete`; no consulta periódicamente ni pide a un modelo iniciar una captura. El archivo local `native-usage/<id-sesión-opaco>.json` conserva la referencia inicial, la última instantánea y un historial acotado de eventos (hasta 100 registros/1 MiB); los fallos automáticos muestran un estado genérico de Pi y no alteran el trabajo del producto. Una reserva transaccional exclusiva por sesión coordina instancias cooperantes; una reserva competidora falla de forma cerrada, y nunca se elimina ni recupera automáticamente una reserva que haya quedado tras una terminación abrupta. La creación inicial del archivo no sobrescribe nada. Estas protecciones cubren escritores ordinarios, no garantizan aislamiento del sistema operativo ni resistencia a fallos de alimentación. Los contadores están normalizados por el host, no certificados por el proveedor; se conserva la cobertura de hijos sin resolver. La instantánea guardada no es por sí sola un informe de resultados aceptados: pasa directamente el archivo de captura a `tools/token-native-summary.mjs --capture <archivo-de-captura>` con los metadatos reales de la ventana y, después, pasa la ventana resultante a `tools/token-report.mjs`. Esta implementación fuente tiene pruebas simuladas del ciclo de vida; no se afirma que se hayan probado el flujo automático nativo de Linux ni Windows.

### Leer el consumo de una sesión de Claude Code desde las transcripciones locales

Es la vía principal para obtener el consumo de Claude sin gastar tokens adicionales. `tools/token-native-claude-transcript.mjs` lee las transcripciones locales que Claude Code ya escribe en los lanzamientos normales de `claude`, por lo que no hace falta ningún helper, telemetría ni demonio. Solo lee el directorio del proyecto seleccionado bajo `--claude-dir`, `CLAUDE_CONFIG_DIR` o `~/.claude` y nunca escribe en él. Genera una ventana para `token-report.mjs` con una fila `unattributed` para la sesión principal y una fila `agent` por cada subagente, además de un registro de cobertura solo con recuentos en stderr.

```bash
node tools/token-native-claude-transcript.mjs --project "/absolute/project" > "claude-session.json"
node tools/token-report.mjs --input "claude-session.json"
```

Usa `--session <uuid>` para una sesión distinta de la más reciente. Solo se conservan contadores numéricos e identificadores acotados (modelo, esfuerzo, versión, identificadores de sesión y agente con hash, tipo de agente seguro); nunca se copian textos de mensajes, datos de herramientas ni rutas. Cada petición se cuenta una sola vez por `requestId`: una repetición con contadores idénticos, en el mismo archivo o en uno posterior, se cuenta una vez (las repeticiones en archivos posteriores aparecen como `crossFileDuplicates`), mientras que una repetición con contadores distintos invalida ese archivo. Las líneas mal formadas, la falta de uso y los límites de tamaño (64 MiB por archivo, 256 MiB en total, 4 MiB por línea medidos en bytes, 200.000 entradas) también invalidan ese archivo. Más de 99 archivos de subagentes, la falta de la transcripción principal de `--session` o la ausencia de transcripciones del proyecto detienen la ejecución con un error fijo y sin ventana. Un archivo inválido se convierte en una fila con contadores desconocidos, de modo que el informe muestra un `partial-subtotal` en lugar de un cero silencioso. Se tolera una última línea incompleta, que se cuenta en la cobertura. El formato no está documentado y se observó en Claude Code 2.1.312 en Linux; el tratamiento de rutas de Windows solo está cubierto por fixtures. Cuando un archivo no supera una comprobación de formato o la versión registrada no se reconoce, la cobertura recomienda abrir una incidencia en https://github.com/iseoane/isSWF/issues, mediante el flujo isswf-issue cuando esté disponible, indicando solo la versión de Claude Code (registrada también en archivos inválidos cuando existe) y los nombres de las comprobaciones fallidas. Los archivos ausentes, ilegibles o demasiado grandes se informan sin esa recomendación. Los totales son contadores registrados por el host, no facturación. La captura con OpenTelemetry descrita a continuación sigue siendo una vía secundaria opcional.

### Capturar métricas de Claude Code durante una sesión

La captura de Claude es opcional y requiere el archivo `<estado-seleccionado>/claude-native-usage.json`, gestionado por la configuración, con `version: 1`, `enabled: true` y un `destination` dentro del proyecto. Consulta las instrucciones de configuración de `isswf-setup`. Inicia el CLI instalado mediante el helper de la fábrica de confianza para capturar ese proceso:

```bash
node /absolute/trusted-factory-root/tools/token-native-claude.mjs -- --model sonnet
```

El helper conserva la entrada/salida interactiva, los permisos, las herramientas, el modelo y los argumentos de autenticación. Activa únicamente métricas OTLP HTTP/JSON para ese proceso y deshabilita logs/trazas; al salir guarda datos numéricos permitidos y acotados. Las sesiones iniciadas con `claude` directamente, fuera del helper, no se capturan. Los conflictos con variables de entorno OTEL/Claude provocan un fallo cerrado; no eludas políticas gestionadas. La compatibilidad con la política no se inspecciona antes de iniciar: la configuración gestionada o gestionada por servidor puede redirigir las exportaciones. Tras la ejecución, el recibo registra `exportStatus`: `export-observed` si el receptor local aceptó al menos una exportación validada y autenticada con series nativas de tokens de Claude, o `no-export-observed` si no llegó ninguna (causa desconocida, por ejemplo una redirección del endpoint o la falta de la exportación final; nunca consumo cero). Una exportación observada solo demuestra la entrega local en esa ejecución, no el cumplimiento de la política ni que ningún otro destino recibiera telemetría. El intervalo de exportación predeterminado es el nativo de 60 segundos; la configuración puede fijar `exportIntervalMs` entre 1000 y 60000. Las peticiones con ruta o credenciales incorrectas se ignoran y se cuentan en `ignoredRequests`. Una exportación mal formada, demasiado grande (`request-too-large`), que supera la concurrencia (`concurrency-limit`) o contradictoria invalida la captura, informa de su código de rechazo y no se conserva recibo. Un fallo del receptor o del hijo se informa por separado del código de salida de Claude. El recibo no contiene prompts ni resultados de herramientas y no acredita identidades individuales de agentes. Las categorías de consulta ausentes o desconocidas no se convierten en cero; cada serie nativa (recurso, ámbito de instrumentación y todos los atributos del punto) conserva su propio inicio y fin; las exportaciones acumulativas repetidas sustituyen el valor anterior de esa serie, una repetición idéntica se ignora y un conflicto, retroceso o cambio de inicio invalida la captura.

Convierte el recibo conservado en una instantánea de series observadas con metadatos explícitos de tarea y, después, genera el informe o compárala con una instantánea anterior:

```bash
node tools/token-native-summary.mjs --otel "claude-receipt.json" --effort unknown --task-class implementation --candidate current > "claude-snapshot.json"
node tools/token-report.mjs --input "claude-snapshot.json"
node tools/token-report.mjs --before "baseline-snapshot.json" --after "claude-snapshot.json"
```

La instantánea (`mode: "observed-snapshot"`) enumera cada serie observada y los valores por origen/modelo/categoría; `main`, `subagent` y `auxiliary` son categorías de origen de consulta, no identificadores individuales de agentes. Su `observedSubtotal` solo suma valores observados; `total` queda en `null` con `totalStatus: "unknown-coverage"`, porque no es un total del proceso, la sesión ni el flujo de trabajo, y no se calcula ninguna proporción por resultado aceptado. La comparación exige el mismo host, versión, esfuerzo y clase de tarea, y exportaciones observadas en ambas instantáneas; empareja valores por origen/modelo/categoría, enumera explícitamente los no emparejados y se etiqueta como `exploratory-coverage-limited`. Los identificadores nativos de captura y de serie son procedencia, no requisitos de igualdad. No cubre la ejecución normal de Claude fuera del helper ni pruebas de captura nativa en Windows. Nunca supongas cero para un contador ausente.

## Interpretar el resultado

`awaiting-human` significa que hace falta una decisión concreta, ya sea durante la definición, la configuración, la aceptación o la integración de una PR. El registro debe indicar la pregunta y qué respuesta permite continuar; una pregunta de definición no necesita una entrega previa. `blocked` describe una condición técnica pendiente de resolver, no necesariamente una petición de aprobación. Las notas del panel no aplican esas decisiones; el coordinador reconcilia tu instrucción real.

El estado de un plan describe trabajo registrado; no es una señal de actividad ni una consulta reciente a GitHub. Las evidencias ausentes o incoherentes siguen siendo desconocidas. Que un worker termine no demuestra revisión independiente, aceptación del operador, publicación ni merge.

Antes de reintentar un trabajo interrumpido, comprueba la identidad real de sus procesos y los archivos parciales. No liberes reservas, cambies de almacén ni inventes otro identificador para eludir un escritor sin reconciliar. Las herramientas de ejecución necesitan sus propios datos exactos, comprobaciones de modelo y presupuesto y permisos vigentes. Ni el comando de estado ni esta guía los conceden.

Para instalar o recuperar una instalación, consulta [instalación](installation.md). Los registros duraderos se describen en el contrato en inglés de [registros duraderos](../durable-work.md). El ejecutor heredado ya no se distribuye: un intento heredado existente se concilia con su runtime fijado original antes de migrar el proyecto, y ese runtime conserva sus propios contratos. Son contratos de implementación, no una lista de primeros pasos ni un permiso para repetir ejecuciones antiguas.
