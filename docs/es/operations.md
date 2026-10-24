# Consultar el trabajo sin iniciar agentes

[Inicio](../../README.es.md) · [Documentación](index.md) · [English](../en/operations.md)

Utiliza el coordinador para entender el siguiente paso. Los comandos siguientes consultan el trabajo registrado o abren su panel local; no llaman a ningún modelo. Sustituye las rutas y los identificadores de iniciativa por valores existentes. No inicializan un repositorio ni crean un plan.

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

## Interpretar el resultado

`awaiting-human` significa que hace falta una decisión concreta, ya sea durante la definición, la configuración, la aceptación o la integración de una PR. El registro debe indicar la pregunta y qué respuesta permite continuar; una pregunta de definición no necesita una entrega previa. `blocked` describe una condición técnica pendiente de resolver, no necesariamente una petición de aprobación. Las notas del panel no aplican esas decisiones; el coordinador reconcilia tu instrucción real.

El estado de un plan describe trabajo registrado; no es una señal de actividad ni una consulta reciente a GitHub. Las evidencias ausentes o incoherentes siguen siendo desconocidas. Que un worker termine no demuestra revisión independiente, aceptación del operador, publicación ni merge.

Antes de reintentar un trabajo interrumpido, comprueba la identidad real de sus procesos y los archivos parciales. No liberes reservas, cambies de almacén ni inventes otro identificador para eludir un escritor sin reconciliar. Las herramientas de ejecución necesitan sus propios datos exactos, comprobaciones de modelo y presupuesto y permisos vigentes. Ni el comando de estado ni esta guía los conceden.

Para instalar o recuperar una instalación, consulta [instalación](installation.md). Los recursos detallados de ejecución del coordinador siguen estando en inglés: [ciclo de los workers](../local-worker-lifecycle.md), [selección de modelos](../model-routing.md), [registros duraderos](../durable-work.md), [admisión de dependencias](../worker-admission.md) y [evidencia original de revisión](../review-original-evidence.md). Son contratos de implementación, no una lista de primeros pasos ni un permiso para repetir ejecuciones antiguas.
