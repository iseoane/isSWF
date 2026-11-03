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
node tools/isswf-panel.mjs --project /absolute/project --port 0
```

El primer comando lee el plan de una iniciativa y sus registros de apoyo. El segundo inicia un servidor en primer plano en `127.0.0.1` y muestra su dirección. Deténlo con Ctrl-C. Permite consultar las iniciativas, sus trabajos, las evidencias y las decisiones registradas.

El panel puede guardar notas locales si las evidencias mostradas siguen coincidiendo. Una nota no se aplica automáticamente, no autentica la aceptación del operador ni permite despachar trabajo. No expongas el panel públicamente ni incluyas secretos en sus registros.

## Desde una instalación preparada

Aquí, `RELEASE` representa la ruta absoluta de un paquete ya preparado y de confianza. No es una dirección de descarga. No se presupone que exista una release pública.

En Windows, utiliza `bin/isswf.exe`. Para una release Node heredada conservada, sigue su guía de instalación y su requisito de Node. Estos comandos no demuestran soporte nativo de mutaciones ni aislamiento fuera de Linux.

```bash
RELEASE/bin/isswf inspect --project /absolute/project
RELEASE/bin/isswf locate --project /absolute/project
RELEASE/bin/isswf exec --project /absolute/project -- isswf-status --initiative I0001
RELEASE/bin/isswf exec --project /absolute/project -- isswf-panel --port 0
```

`inspect` muestra información de instalación y migración sin modificar el proyecto ni el almacén. `locate` verifica y localiza el runtime conservado que se ha seleccionado. `exec` utiliza el runtime fijado para ese proyecto, no necesariamente el paquete global más reciente. Si falta el código conservado o está dañado, la operación se bloquea.

## Crear un resumen local de tokens

`tools/token-report.mjs` genera informes únicamente a partir de resúmenes acotados que tú proporciones, incluido un recibo nativo de Claude capturado automáticamente después de convertirlo. No inspecciona sesiones del host, llama a modelos ni estima facturación. Los resúmenes de Pi y Claude transcritos manualmente se identifican como tales. Mantén los archivos de entrada depurados y en local.

Cada archivo JSON contiene `version: 1`, `mode: "window"` y `rows`. Cada fila representa una ventana independiente y no solapada; incluye un `id` opaco y acotado, `host` (`pi` o `claude`), `hostVersion`, `model`, `effort`, `taskClass`, `candidate`, `outcome`, el recuento no negativo `accepted`, la procedencia (`manual-pi`, `manual-claude`, `native-pi-summary`, `native-claude-summary` o `native-claude-otel`), `scope` (`agent`, `unattributed` o `tree`), `window` y `counters` con `input`, `output`, `cacheRead` y `cacheWrite`. Los identificadores y metadatos usan entre 1 y 128 caracteres ASCII: letras, números, `.`, `_`, `:`, `+` o `-`; utiliza identificadores opacos, nunca rutas ni texto privado. Los contadores son enteros seguros no negativos o `null` en JSON si se desconocen. Las categorías deben ser disjuntas. Las filas que comparten ventana y resultado repiten el mismo candidato y recuento de aceptación; el informe cuenta ese resultado una sola vez, no una vez por agente. Se rechazan las declaraciones contradictorias de ese grupo. Antes de introducir datos acumulativos, reiniciados, reanudados o de eventos, quien los suministra debe convertirlos en una ventana acotada y no solapada; se rechazan los modos no admitidos. No combines una fila de árbol con otras filas de la misma ventana. Añade una fila sin atribución cuando se desconozca la cobertura; nunca inventes proporciones por agente. Se rechazan los campos desconocidos y la salida solo contiene campos permitidos. Los campos opcionales `durationSeconds`, `requests`, `turns`, `corrections` y `reasoning` (no aditivo) se muestran por separado.

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

### Capturar métricas de Claude Code durante una sesión

La captura de Claude es opcional y requiere el archivo `<estado-seleccionado>/claude-native-usage.json`, gestionado por la configuración, con `version: 1`, `enabled: true` y un `destination` dentro del proyecto. Consulta las instrucciones de configuración de `isswf-setup`. Inicia el CLI instalado mediante el helper de la fábrica de confianza para capturar ese proceso:

```bash
node /absolute/trusted-factory-root/tools/token-native-claude.mjs -- --model sonnet
```

El helper conserva la entrada/salida interactiva, los permisos, las herramientas, el modelo y los argumentos de autenticación. Activa únicamente métricas OTLP HTTP/JSON para ese proceso y deshabilita logs/trazas; al salir guarda datos numéricos permitidos y acotados. Las sesiones iniciadas con `claude` directamente, fuera del helper, no se capturan. Los conflictos con variables de entorno OTEL/Claude provocan un fallo cerrado; no eludas políticas gestionadas ni supongas que la exportación es local cuando se desconoce la política del host. Un fallo del receptor o del hijo se informa por separado del código de salida de Claude. El recibo no contiene prompts ni resultados de herramientas y no acredita identidades individuales de agentes. Las categorías de consulta ausentes o desconocidas no se convierten en cero; las exportaciones acumulativas repetidas sustituyen el valor anterior de esa serie.

Convierte el recibo nativo conservado en una ventana de informe con metadatos explícitos de tarea/resultado y, después, utiliza el consumidor determinista existente:

```bash
node tools/token-native-summary.mjs --otel "claude-receipt.json" --id task --window task-window --effort unknown --task-class implementation --candidate current --outcome task --accepted 1 > "claude-window.json"
node tools/token-report.mjs --input "claude-window.json"
```

Las filas usan la procedencia distinta `native-claude-otel` y el ámbito `unattributed`; `main`, `subagent` y `auxiliary` son categorías de origen de consulta, no identificadores individuales de agentes. Esta ruta usa los contadores acumulados de un único proceso como ventana acotada; no agrega una sesión interactiva más amplia ni demuestra cobertura de hijos a partir de métricas solo principales. No cubre la ejecución normal de Claude fuera del helper ni pruebas de captura nativa en Windows. Nunca supongas cero para un contador ausente.

## Interpretar el resultado

`awaiting-human` significa que hace falta una decisión concreta, ya sea durante la definición, la configuración, la aceptación o la integración de una PR. El registro debe indicar la pregunta y qué respuesta permite continuar; una pregunta de definición no necesita una entrega previa. `blocked` describe una condición técnica pendiente de resolver, no necesariamente una petición de aprobación. Las notas del panel no aplican esas decisiones; el coordinador reconcilia tu instrucción real.

El estado de un plan describe trabajo registrado; no es una señal de actividad ni una consulta reciente a GitHub. Las evidencias ausentes o incoherentes siguen siendo desconocidas. Que un worker termine no demuestra revisión independiente, aceptación del operador, publicación ni merge.

Antes de reintentar un trabajo interrumpido, comprueba la identidad real de sus procesos y los archivos parciales. No liberes reservas, cambies de almacén ni inventes otro identificador para eludir un escritor sin reconciliar. Las herramientas de ejecución necesitan sus propios datos exactos, comprobaciones de modelo y presupuesto y permisos vigentes. Ni el comando de estado ni esta guía los conceden.

Para instalar o recuperar una instalación, consulta [instalación](installation.md). Los recursos detallados de ejecución del coordinador siguen estando en inglés: [ciclo de los workers](../local-worker-lifecycle.md), [selección de modelos](../model-routing.md), [registros duraderos](../durable-work.md), [admisión de dependencias](../worker-admission.md) y [evidencia original de revisión](../review-original-evidence.md). Son contratos de implementación, no una lista de primeros pasos ni un permiso para repetir ejecuciones antiguas.
