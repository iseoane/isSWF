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

`tools/token-report.mjs` genera informes únicamente a partir de resúmenes que tú proporciones. No inspecciona sesiones del host, llama a modelos ni estima facturación. Los resúmenes de Pi y Claude transcritos manualmente se identifican como tales. Mantén los archivos de entrada depurados y en local.

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

`tools/token-native-summary.mjs` acepta un recibo explícito de Pi generado por la extensión fuente opcional o un JSON explícito del resultado final de Claude. Lee como máximo 1 MiB combinado y genera el mismo formato acotado que `token-report.mjs`; nunca busca almacenes de sesiones ni lee transcripciones. El adaptador de Claude utiliza solo `modelUsage` y genera una única fila inclusiva de árbol (`tree`) para todos los modelos, con la identidad `model-mix`; no convierte el `usage` del bucle principal en uso de todo el árbol ni inventa repartos por agente. Los contadores ausentes siguen siendo desconocidos.

Para una ventana de Pi, proporciona ambas capturas acumulativas. El conversor exige la misma identidad de sesión opaca, que la rama inicial sea prefijo de la rama final, contadores monotónicos de padre/hijos, identidades estables para los hijos existentes y que no haya filas eliminadas ni trabajos asíncronos sin resolver. Las filas de hijos nuevos aportan sus contadores de intento declarados. Si no se puede establecer la genealogía, utiliza una captura acumulativa aislada y etiquetada, o rechaza la ventana; no sumes capturas.

```bash
node tools/token-native-summary.mjs --input "pi-receipt.json" --host pi --id task --window task-window --host-version 1.5.0 --effort high --task-class implementation --candidate current --outcome task --accepted 1 > "native-summary.json"
node tools/token-native-summary.mjs --input "pi-end.json" --start "pi-start.json" --host pi --id task --window task-window --host-version 1.5.0 --effort high --task-class implementation --candidate current --outcome task --accepted 1 > "native-window.json"
node tools/token-native-summary.mjs --input "claude-final-result.json" --host claude --id task --window task-window --host-version 2.1.312 --effort unknown --task-class implementation --candidate current --outcome task --accepted 1 > "claude-summary.json"
node tools/token-report.mjs --input "native-summary.json"
```

`tools/token-native-pi.mjs` es código fuente opcional, no se carga ni registra automáticamente. Desde la raíz del repositorio, el usuario puede cargarlo explícitamente con `pi -e ./tools/token-native-pi.mjs` e invocar `/token-native-snapshot --out <new-file>`. Comprueba la capacidad `ping` del bus de eventos de `pi-subagents` y después solicita una sola vez el RPC documentado `cost`. Escribe únicamente contadores normalizados permitidos e identidades opacas, registra la versión del host Pi como `unknown` porque la API admitida no la expone, crea el archivo de forma exclusiva y falla sin exponer errores RPC ni rutas privadas. Indica al conversor una versión observada de forma independiente cuando se conozca. Esta implementación fuente solo tiene pruebas de fixtures: no constituye activación real del host ni demuestra el comportamiento de la versión instalada o de otras plataformas. No la habilites sin revisar el código y elegir el destino.

## Interpretar el resultado

`awaiting-human` significa que hace falta una decisión concreta, ya sea durante la definición, la configuración, la aceptación o la integración de una PR. El registro debe indicar la pregunta y qué respuesta permite continuar; una pregunta de definición no necesita una entrega previa. `blocked` describe una condición técnica pendiente de resolver, no necesariamente una petición de aprobación. Las notas del panel no aplican esas decisiones; el coordinador reconcilia tu instrucción real.

El estado de un plan describe trabajo registrado; no es una señal de actividad ni una consulta reciente a GitHub. Las evidencias ausentes o incoherentes siguen siendo desconocidas. Que un worker termine no demuestra revisión independiente, aceptación del operador, publicación ni merge.

Antes de reintentar un trabajo interrumpido, comprueba la identidad real de sus procesos y los archivos parciales. No liberes reservas, cambies de almacén ni inventes otro identificador para eludir un escritor sin reconciliar. Las herramientas de ejecución necesitan sus propios datos exactos, comprobaciones de modelo y presupuesto y permisos vigentes. Ni el comando de estado ni esta guía los conceden.

Para instalar o recuperar una instalación, consulta [instalación](installation.md). Los recursos detallados de ejecución del coordinador siguen estando en inglés: [ciclo de los workers](../local-worker-lifecycle.md), [selección de modelos](../model-routing.md), [registros duraderos](../durable-work.md), [admisión de dependencias](../worker-admission.md) y [evidencia original de revisión](../review-original-evidence.md). Son contratos de implementación, no una lista de primeros pasos ni un permiso para repetir ejecuciones antiguas.
