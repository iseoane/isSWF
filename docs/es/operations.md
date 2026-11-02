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

`tools/token-report.mjs` genera informes únicamente a partir de resúmenes que tú proporciones. No inspecciona sesiones del host, recopila eventos nativos, llama a modelos ni estima facturación. Los resúmenes de Pi y Claude transcritos manualmente se identifican como tales; no se afirma compatibilidad con sus formatos nativos. Mantén los archivos de entrada depurados y en local.

Cada archivo JSON contiene `version: 1`, `mode: "window"` y `rows`. Cada fila representa una ventana independiente y no solapada; incluye un `id` opaco y acotado, `host` (`pi` o `claude`), `hostVersion`, `model`, `effort`, `taskClass`, `candidate`, `outcome`, el recuento no negativo `accepted`, la procedencia (`manual-pi`, `manual-claude` o resumen nativo declarado), `scope` (`agent`, `unattributed` o `tree`), `window` y `counters` con `input`, `output`, `cacheRead` y `cacheWrite`. Los contadores son enteros seguros no negativos o `null` en JSON si se desconocen. Las categorías deben ser disjuntas. Antes de introducir datos acumulativos, reiniciados, reanudados o de eventos, quien los suministra debe convertirlos en una ventana acotada y no solapada; se rechazan los modos no admitidos. No combines una fila de árbol con otras filas de la misma ventana. Añade una fila sin atribución cuando se desconozca la cobertura; nunca inventes proporciones por agente. Se rechazan los campos desconocidos y la salida solo contiene campos permitidos. Los campos opcionales `durationSeconds`, `requests`, `turns`, `corrections` y `reasoning` (no aditivo) se muestran por separado.

Indica un único resumen o archivos comparables anterior/posterior:

```bash
node tools/token-report.mjs --input "summary.json"
node tools/token-report.mjs --before "before.json" --after "after.json"
```

El recuento de aceptaciones abarca toda la ventana suministrada, incluido el trabajo fallido, las revisiones y las correcciones. El informe muestra los componentes conocidos, el total procesado completo o un subtotal parcial identificado, la proporción de lecturas de caché solo si el denominador es conocido y positivo, y los tokens por resultado aceptado solo si se conocen todos los componentes y hay aceptaciones. La comparación requiere coincidencia de host/versión, modelo/esfuerzo, clase de tarea, identificadores y ámbitos de actores, recuentos de aceptación y disponibilidad de categorías, además de una base conocida positiva. En otro caso, las diferencias se indican explícitamente como incomparables o indefinidas. Una menor proporción de lectura de caché o un total menor no demuestran por sí solos calidad ni ahorro. El límite combinado de entrada es 1 MiB y 100 filas; cada fila admite hasta 4 KiB y la salida hasta 64 KiB. Son cálculos locales, no mediciones de hosts activos ni de facturación.

## Interpretar el resultado

`awaiting-human` significa que hace falta una decisión concreta, ya sea durante la definición, la configuración, la aceptación o la integración de una PR. El registro debe indicar la pregunta y qué respuesta permite continuar; una pregunta de definición no necesita una entrega previa. `blocked` describe una condición técnica pendiente de resolver, no necesariamente una petición de aprobación. Las notas del panel no aplican esas decisiones; el coordinador reconcilia tu instrucción real.

El estado de un plan describe trabajo registrado; no es una señal de actividad ni una consulta reciente a GitHub. Las evidencias ausentes o incoherentes siguen siendo desconocidas. Que un worker termine no demuestra revisión independiente, aceptación del operador, publicación ni merge.

Antes de reintentar un trabajo interrumpido, comprueba la identidad real de sus procesos y los archivos parciales. No liberes reservas, cambies de almacén ni inventes otro identificador para eludir un escritor sin reconciliar. Las herramientas de ejecución necesitan sus propios datos exactos, comprobaciones de modelo y presupuesto y permisos vigentes. Ni el comando de estado ni esta guía los conceden.

Para instalar o recuperar una instalación, consulta [instalación](installation.md). Los recursos detallados de ejecución del coordinador siguen estando en inglés: [ciclo de los workers](../local-worker-lifecycle.md), [selección de modelos](../model-routing.md), [registros duraderos](../durable-work.md), [admisión de dependencias](../worker-admission.md) y [evidencia original de revisión](../review-original-evidence.md). Son contratos de implementación, no una lista de primeros pasos ni un permiso para repetir ejecuciones antiguas.
