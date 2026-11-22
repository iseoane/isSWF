# Trabajar en isSWF

[Inicio](../../README.es.md) · [English](../en/development.md)

Esta página es para modificar la propia factoría. Si quieres utilizarla en otro proyecto, empieza por la [instalación](installation.md).

## Localizar el código relevante

| Ubicación | Contenido |
| --- | --- |
| `.agents/skills/` | Instrucciones compartidas de configuración, coordinación y triage exclusivo del código fuente. |
| `.agents/roles/` | Responsabilidades de los agentes y referencias de apoyo. |
| `tools/` | Herramientas ejecutables de la factoría. |
| `skills/`, `agents/`, `.claude-plugin/` | Archivos de integración con Claude Code. |
| `tests/`, `tooling/` | Comprobaciones de desarrollo y herramientas de mantenimiento. |
| `docs/en/`, `docs/es/` | Guías vigentes de uso y desarrollo con contenido equivalente. |
| Raíz de `docs/` | Recursos técnicos estables en inglés. |

El repositorio de desarrollo puede conservar sus propios registros en la carpeta heredada `.factory/`. Eso no es motivo para migrarlos como parte de un cambio de código o documentación que no tenga relación.

Lee [AGENTS.md](../../AGENTS.md) antes de hacer cambios. Mantén el alcance acotado y conserva las modificaciones previas del operador.

## Preparar una versión local

Si tienes acceso al repositorio, obtén el código fuente:

```bash
git clone https://github.com/iseoane/isSWF.git
cd isSWF
```

El archivo `.gitattributes` del repositorio mantiene los archivos de texto con LF en Windows y Linux, incluso con `core.autocrlf=true`; los archivos detectados como binarios no cambian. Así se conservan las comprobaciones exactas entre los bytes del runtime y Git y las cabeceras de los recursos. No normalices los bytes durante la verificación de integridad ni desactives sus comprobaciones. Añadir los atributos no reescribe una copia de trabajo existente: si un checkout anterior conserva archivos del runtime con CRLF, guarda el trabajo local y utiliza un clon nuevo de una revisión que contenga esta política. No restablezcas por la fuerza un checkout con cambios ni modifiques la configuración global de Git para ocultar la discrepancia.

Mantén el desarrollo fuente con Node.js y `.mjs`. Instala un compilador Bun de confianza solo para construir releases. Bun 1.4.3 es el compilador probado localmente. El generador usa Bun por defecto; `--runtime node` conserva el formato original para datos de prueba de desarrollo. Elige un commit que contenga las herramientas completas de distribución. El generador lee ese commit, no los cambios sin commit. Si el trabajo de instalación aún no está guardado en un commit de tu copia, no esperes encontrarlo en el commit anterior.

Sustituye `FULL_COMMIT_SHA` por el SHA completo del commit y utiliza una carpeta de salida que no exista, fuera del repositorio fuente:

```bash
node tools/build-release.mjs --source "$PWD" --revision FULL_COMMIT_SHA --output /path/to/isswf-release --runtime bun
```

Esa carpeta es la que utilizan los [comandos de instalación](installation.md). Prepararla no publica nada en npm, registra un marketplace ni cambia la versión de otro proyecto. El SHA identifica el código elegido; instalar la carpeta preparada no crea una nueva revisión del código fuente.

El compilador activa `--compile-autoload-package-json` para que las tareas generadas puedan resolver la entrada del SDK existente del host y las exportaciones de sus dependencias transitivas. Esto no incorpora ni instala ese SDK. El ejecutable también resuelve las rutas relativas de tareas `.mjs` desde el directorio de trabajo.

Usa `--target` para seleccionar un artefacto separado de Linux, macOS o Windows. La matriz nativa verifica un flujo de mutación instalado y acotado en Linux y Windows: inicializar un proyecto, invocar el planificador fijado para preparar/repetir un plan y rechazar un bloqueo de escritura incierto sin cambiar bytes protegidos. Esto no demuestra soporte completo de migración/recuperación ni de ejecución/aislamiento de trabajadores en Windows.

La [guía técnica de instalación](../installation.md), en inglés, explica cómo crear los paquetes y qué comprobaciones exactas se realizan.

## Controles de calidad

Utiliza Node.js 24 o posterior con npm y Git. Ejecuta las comprobaciones portables desde la raíz del repositorio:

```bash
node tools/check-quality.mjs
```
La comprobación portable incluye `node tooling/quality/check-docs.mjs`: comprueba los espejos de las guías vigentes, los enlaces locales, la cobertura de secciones y que los ejemplos de shell sean idénticos. También rechaza procedimientos de auditoría obsoletos copiados en las guías técnicas vigentes. No demuestra la calidad de la traducción ni ejecuta los ejemplos.

Para verificar un cambio en local, ejecuta las pruebas específicas del comportamiento modificado (`node tests/<name>.mjs .`) y `node tooling/quality/check-docs.mjs`. Ejecuta el `node tools/check-quality.mjs` completo, que incluye `tests/release-package.mjs`, una vez por iniciativa en su commit de cierre, y antes solo cuando el cambio afecta al empaquetado: `tools/build-release.mjs`, `tools/factory-package.mjs`, `tools/bun-release.mjs`, `tools/release-source.mjs`, `package.json`, los manifiestos de plugins o archivos distribuidos nuevos, renombrados o eliminados. CI ejecuta la comprobación completa en cada pull request, así que un fallo de empaquetado causado por cualquier cambio sigue bloqueando la entrega. Una ejecución local que omite la comprobación completa debe indicarlo en su informe.

Un cambio en un contrato documentado añade su enunciado antiguo a `tooling/quality/stale-statements.json` en el mismo cambio (`phrase`, `regex` y `scope` como glob opcionales, `reason`, `since`). `node tests/stale-statements.mjs .` busca después cada frase de la lista, tras normalizar CRLF, en todos los textos que el paquete puede distribuir, tal como los selecciona `packagedFileSet` en `tools/factory-package.mjs`, y `check-docs` aplica la misma lista a `docs/*.md`. `regex` es un indicador booleano (la frase pasa a ser una expresión regular), `scope` es un glob de rutas y la comparación ignora mayúsculas y minúsculas. Solo encuentra un enunciado escrito como indica la entrada: una paráfrasis del comportamiento antiguo no se detecta.

Cuando un brief selecciona TDD, cada commit RED de comportamiento contiene solo la prueba y falla intencionadamente; el siguiente commit GREEN contiene el cambio que la supera. Si `git bisect` llega a un commit RED, usa `git bisect skip`, ya que se espera que ese commit falle. Un fallo de sintaxis o de configuración de la prueba no es un resultado RED válido.

Los comandos Git que lanzan los hooks, las guardas, el panel y sus ejecutores establecen `GIT_OPTIONAL_LOCKS=0` (el hook de Claude, cuya llamada de proceso no admite aquí un entorno, pasa `--no-optional-locks`), de modo que una lectura nunca toma `index.lock` mientras alguien hace commit; `node tests/git-optional-locks.mjs .` falla ante un proceso Git de esas fuentes que no establece ninguno de los dos. Una prueba crea su repositorio de fixture con `initRepository` o `cloneRepository` de `tests/support/git-fixture.mjs`, que desactiva `core.fsmonitor` en el repositorio nuevo, y `node tests/fixture-repositories.mjs .` falla ante una prueba que ejecuta `git init` o `git clone` directamente. Ambas se ejecutan en `tools/check-quality.mjs`. Un `core.fsmonitor=true` global dejaría, si no, un `git fsmonitor--daemon` por fixture en ejecución. En Windows, este comando ejecuta la verificación del nivel de trabajo e informa, por ID de proceso, de cualquier daemon que no estuviera en ejecución antes y lo siga estando después; solo lista procesos y nunca detiene ninguno, y en otra plataforma imprime `not-applicable`:

```bash
node tooling/quality/fsmonitor-daemons.mjs --project /absolute/checkout
```

Ambos análisis son heurísticos y tienen límites conocidos. `tests/git-optional-locks.mjs` reconoce una llamada a Git solo como un comando `git` literal pasado a `execFile`, `execFileSync`, `spawn`, `spawnSync`, `run`, `runAsync` o `$.process.run`, y solo en las fuentes indicadas de hooks, guardas, panel, plan, intake, verify y record-check; no ve una llamada a Git mediante otro ejecutor ni con un ejecutable calculado. `tests/fixture-repositories.mjs` detecta un argumento `init` o `clone` entre comillas en la misma línea que un ejecutor con nombre tipo git, sh, run o command, así que no ve un repositorio creado con otra forma de línea.

`tooling/quality/fsmonitor-orphans.mjs` es una comprobación aparte. En Windows y Linux, lista, por ID de proceso, cualquier `git fsmonitor--daemon` cuyo worktree ya no existe y sale con 1 si encuentra alguno. Los coordinadores detienen un daemon con `git -C <worktree> fsmonitor--daemon stop` antes de `git worktree remove`; la guarda de comandos de shell no puede exigir ese orden porque ve un solo comando cada vez, así que este listado es la comprobación mecánica. Solo lee y nunca detiene un proceso. El directorio de trabajo del daemon no es su worktree en ninguna de las dos plataformas, así que la comprobación identifica su directorio Git por su punto de comunicación IPC: en Windows la tubería con nombre, en Linux el socket `fsmonitor--daemon.ipc` listado en `/proc/net/unix` y abierto en `/proc/<pid>/fd` del proceso. Un daemon de Linux con `fsmonitor.socketDir` no tiene ese socket y se informa como `unknown`, nunca como huérfano. Un daemon es huérfano cuando su directorio Git ya no existe o el archivo `gitdir` de un worktree enlazado nombra un checkout que ya no existe:

```bash
node tooling/quality/fsmonitor-orphans.mjs
```

Cuando Bun está disponible, la comprobación portable también construye e instala un paquete Bun real en directorios temporales. Prueba las exportaciones de paquetes externos similares a un SDK y sus dependencias transitivas, los scripts `.mjs` con rutas absolutas y relativas y el traspaso al binario fijado. Sin Bun, la prueba de artefacto indica SKIP. Asigna a `ISSWF_TEST_BUN` la ruta de un compilador para exigirla. CI instala el compilador Bun fijado y exige la prueba de artefacto. En local, `ISSWF_TEST_BUN_TMPDIR` permite ubicar los datos de prueba binarios grandes en otro disco. Estos datos de prueba no ejecutan Claude ni proveedores reales.

CI también ejecuta dos comprobaciones de host fuera de la comprobación portable: `tests/host-prerequisites.mjs` y `tests/source-host-isolation.mjs`. Ejecuta ambas en local con un solo comando:

```bash
node tooling/quality/host-checks.mjs
```

El comando nunca instala dependencias ni construye la salida de plataforma. Imprime `SKIPPED` con el motivo cuando falta un requisito previo y termina con código distinto de cero solo si falla una comprobación que se ejecutó, de modo que un SKIPPED no equivale a un resultado correcto. La comprobación de aislamiento necesita las dependencias de `tooling/host-tests` (`npm ci --prefix tooling/host-tests --ignore-scripts --no-audit --no-fund`) y que `ISSWF_PLATFORM_ROOT` apunte a una salida nueva de `tests/platform-package.mjs`.

Algunas comprobaciones utilizan los archivos actuales, mientras que las del paquete generado desde un commit utilizan una revisión de Git. Que la ejecución termine bien no significa que se hayan empaquetado todos los cambios sin commit ni probado todas las integraciones con modelos reales.

Si necesitas las herramientas separadas de análisis estático y todavía no están instaladas, prepara las dependencias de desarrollo:

```bash
npm ci --prefix tooling/quality --ignore-scripts --no-audit --no-fund
```

Después ejecuta:

```bash
node tooling/quality/node_modules/eslint/bin/eslint.js --config tooling/quality/eslint.config.mjs tools tests tooling/quality/*.mjs
node tooling/quality/node_modules/knip/bin/knip.js --config tooling/quality/knip.json --no-progress
```

`node tools/check-quality.mjs` ejecuta ambos comandos cuando están instalados y, si no, indica cada uno como `SKIPPED`. También falla cuando un archivo `tests/*.mjs` de primer nivel no lo ejecuta `check-quality` ni un workflow de CI ni lo importa o lo ejecuta por ruta otro test; un test que necesita una herramienta externa se exime, con su motivo, en `tooling/quality/unrun-tests.mjs`.

ESLint realiza el lint y las comprobaciones estáticas; Knip informa de archivos, dependencias y exportaciones sin utilizar y de referencias sin resolver dentro de su configuración. Ninguna demuestra que se hayan encontrado todas las rutas de código muerto. Las comprobaciones del código fuente no tienen un paso separado de compilación ni de comprobación de tipos. Construir una release autónoma añade el paso explícito de compilación con Bun.

Estas herramientas ayudan a encontrar errores y código sin utilizar. No sustituyen las comprobaciones necesarias para cada funcionalidad ni demuestran que una ejecución real de agentes haya terminado bien.

La comprobación portable de la guía de revisión verifica cuatro fixtures ejecutables: dos defectos de comportamiento con pruebas que pasan pero resultan insuficientes, y dos cambios válidos. Comprueba los resultados esperados de las fixtures, no la calidad de revisión de un modelo. Para conservar un paquete de evaluación, elige una carpeta inexistente fuera del repositorio:

```sh
node tests/review-guidance.mjs . /absolute/absent/review-fixtures
```

Excluye `oracle.json` y `probes/` del paquete de una revisión a ciegas. Las comparaciones reales requieren llamadas nativas autorizadas por separado con el mismo candidato, contexto, modelo y esfuerzo. Informa de los defectos omitidos y las falsas alarmas, conserva los resultados inconclusos y no deduzcas una mejora general a partir de una única muestra pequeña.

## CI por niveles para repositorios privados

Los repositorios privados pagan los minutos de ejecución, así que ejecuta la suite completa una vez en lugar de en cada push. Una organización por niveles mantiene el feedback rápido:

- **Nivel rápido, en cada pull request.** Ejecuta las comprobaciones centradas, como lint, la comprobación de documentación y los tests de las rutas que toca el cambio. Usa filtros `paths` para que un cambio solo de documentación omita los trabajos de código, y define `concurrency` con `cancel-in-progress: true` para que un push nuevo cancele la ejecución a la que sustituye. Una comprobación obligatoria con filtro de rutas necesita un diseño que contemple la omisión; consulta la documentación de GitHub sobre comprobaciones de estado obligatorias y filtros de rutas.
- **Nivel completo, en `main`, por despacho manual o programado.** Ejecuta la suite completa, el arnés de extremo a extremo y los trabajos de Windows y macOS mediante `push` a `main`, `workflow_dispatch` o `schedule`.
- **Minutos de ejecución.** GitHub factura los runners de Windows y macOS con multiplicadores por minuto superiores a los de Linux, así que coloca la matriz multiplataforma en el nivel completo. Consulta los multiplicadores vigentes en la [documentación de facturación de GitHub Actions](https://docs.github.com/en/billing/managing-billing-for-your-products/about-billing-for-github-actions); pueden cambiar.
- **Pushes solo de registros.** El disparador `push` del workflow `Quality` ignora un push cuyas rutas modificadas están todas bajo `.factory/initiatives/` o `.isswf/initiatives/`, así que un push solo de registros a `main` o `ci/**` no inicia ninguna ejecución. Los pull requests, y los pushes a `main` o `ci/**` que cambien cualquier otra ruta, siguen ejecutándolo, y el disparador `pull_request` no se filtra porque una comprobación obligatoria omitida quedaría pendiente.

`node tools/isswf-verify.mjs --project /absolute/project --base HEAD --table` imprime qué comprobaciones aprobadas exige cada tipo de cambio, como punto de partida para elegir los niveles rápido y completo. El cierre de iniciativa puede ejecutarse como un workflow lanzado a mano en lugar de en local. El workflow descarga la cabeza de cierre, ejecuta en ella la suite completa y E2E del proyecto, y después el coordinador registra la ejecución que pasa (`source: "ci"`, `runUrl` y SHA de cabeza) como describe "Ejecutor de verificación" en la guía de operaciones. Una forma mínima:

```yaml
on:
  workflow_dispatch:
jobs:
  close-suite:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: <launcher-fijado: el comando fijado del proyecto para isswf-verify> --project "$PWD" --tier initiative --record I0001
```

El marcador representa la forma del launcher fijado que la guía de operaciones describe para proyectos instalados; la ruta del checkout de código fuente no es un atajo para elegir versión. Un registro escrito en el runner se descarta con él: cuando la ejecución pasa, el coordinador escribe en el proyecto el registro `source: "ci"` y lo confirma. Usa los comandos propios del proyecto para la suite completa y E2E en lugar del paso `isswf-verify` cuando no encajen en las comprobaciones aprobadas, y añade trabajos de Windows o macOS solo cuando el cierre los necesite. El nivel rápido por pull request sigue siendo automático. Esta guía no modifica los workflows de este repositorio.

## Comprobaciones de plataforma y descubrimiento de skills

La comprobación de integración con el host utiliza las dependencias fijadas, un perfil aislado y un proveedor simulado en loopback. Descubre los roles empaquetados y comprueba el modelo y el esfuerzo del worker y del reviewer, las herramientas, los cambios en el directorio asignado, los errores y la cancelación sin llamadas a modelos reales. Los requisitos previos obligatorios ausentes del host se informan como `BLOCKED` estructurado con código de salida 2; las dependencias existentes pero defectuosas siguen siendo fallos. El modo solo Pi no requiere el ejecutable de Claude que no utiliza. El resumen portable de calidad marca explícitamente esta comprobación obligatoria y separada como `NOT_RUN`; la comprobación nativa del host en CI debe aprobarse y un resultado `BLOCKED` no puede aprobar su gate. No certifica la delegación real de Claude, la ejecución en segundo plano ni el aislamiento del sistema operativo.

```bash
npm ci --prefix tooling/host-tests --ignore-scripts --no-audit --no-fund
node tests/host-native-delegation.mjs .
```

El workflow Quality conserva el job completo de calidad de Linux y Bubblewrap. La matriz nativa Linux/Windows ejecuta las pruebas enfocadas de fallos del escritor fuente y compila e instala un artefacto Bun por plataforma. Cada artefacto instalado prueba la inicialización y la preparación/repetición correctas del planificador fijado, además del rechazo de un bloqueo incierto; un recorrido con el lanzador de release de Node comprueba la misma ruta compartida. Los registros de Windows vinculan PID, hora de creación del proceso y hora de arranque del sistema; la evidencia desconocida se rechaza de forma conservadora. Linux conserva su formato de propietario actual y los fallos de sincronización de directorio fatales. Windows omite esa operación no compatible y no promete la misma persistencia de las entradas del directorio ante una pérdida de energía. `tests/state-interruption.mjs` detiene en ambas plataformas un propietario real de `migrate-state` lanzado con el lanzador de release de Node en tres pasos de la migración, lo termina y ejecuta `recover-state` público, con controles de rechazo; no cubre el artefacto Bun compilado. Estas comprobaciones cubren la ruta CLI compartida por los recursos de Pi y Claude, no la ejecución de modelos reales, la durabilidad ante cortes de corriente, la ejecución de trabajadores ni el aislamiento del sistema operativo. La matriz también cubre los recibos exactos del artefacto, la versión e inspección de solo lectura de la CLI, rutas con espacios y Unicode, worktrees externos de Git y el descubrimiento nativo del host. En Windows no se comprueban los permisos POSIX.

La matriz instala asistentes exclusivos de desarrollo desde `tooling/host-tests/package-lock.json`, con los scripts de ciclo de vida desactivados. Pi 1.4.0 instala el paquete en los ámbitos temporales de usuario y proyecto; su cargador real de recursos debe descubrir las dieciséis skills del artefacto instalado, con un control vacío previo a la instalación. Claude Code 2.1.299 instala el marketplace y plugin locales y debe mostrar esas skills en su inventario nativo de componentes. La prueba invoca el binario nativo de la plataforma incluido en la dependencia opcional de Claude, sin ejecutar su script de instalación. No se proporciona ningún prompt, sesión de agente, inicio de sesión ni credencial de proveedor. Las carpetas temporales de usuario y configuración y la telemetría desactivada limitan la actividad incidental; no demuestran aislamiento de red. Son pruebas de instalación y descubrimiento, no evaluaciones de tareas o delegaciones reales.

Para ejecutar las comprobaciones adicionales en local, elige una carpeta de salida inexistente fuera del repositorio. Estos ejemplos utilizan una shell compatible con Bash; en Windows, indica una ruta absoluta de Windows para la carpeta de salida:

```sh
npm ci --prefix tooling/host-tests --ignore-scripts --no-audit --no-fund
export ISSWF_PLATFORM_ROOT="/absolute/absent/platform-output"
node tests/platform-package.mjs .
node tests/host-discovery.mjs .
```

El constructor del artefacto lee el HEAD confirmado, mientras que las comprobaciones estáticas del código leen el árbol de trabajo. Las pruebas requieren los asistentes fijados y Bun; si faltan herramientas o skills, fallan en vez de omitirse en silencio. Para repetirlas, utiliza una nueva ruta de salida. La CI conserva durante 14 días los informes de plataforma y descubrimiento y el inventario de skills observado en Claude. Configurar una matriz no demuestra que todas las plataformas hayan pasado; consulta la ejecución exacta antes de afirmar compatibilidad.

## Separar este checkout del código fuente de una release instalada

Este repositorio debe utilizar sus skills del código fuente, no otra copia de la release instalada. Su archivo compartido `.claude/settings.json` desactiva el plugin distribuido `isswf@isswf` solo aquí. Los demás proyectos y plugins conservan sus ajustes. Para inspeccionar explícitamente el plugin del código fuente, ejecuta Claude con `--plugin-dir` apuntando a este checkout. Los ajustes personales de `settings.local.json` pueden seguir teniendo prioridad.

Pi identifica un paquete local por su ruta de instalación, no por el nombre de su manifiesto. Una regla JSON compartida no puede identificar todas las posibles carpetas de las releases. El siguiente helper versionado utiliza el inventario de paquetes instalados del SDK fijado de Pi para generar filtros locales para los paquetes externos llamados `isswf-pi-resources`. No resuelve, descarga ni instala paquetes, ni cambia los ajustes de usuario. Rechaza los comandos personalizados del gestor de paquetes y las decisiones de proyecto que entren en conflicto, en vez de ejecutarlos o sobrescribirlas.

```sh
npm ci --prefix tooling/host-tests --ignore-scripts --no-audit --no-fund
node tooling/maintenance/source-host-isolation.mjs
node tooling/maintenance/source-host-isolation.mjs --apply
```

La primera invocación del helper muestra los cambios previstos; `--apply` escribe únicamente `.pi/settings.json`. Git ignora ese archivo porque contiene rutas específicas de cada máquina. La política compartida está en el helper y los ajustes de proyecto de Claude, no en esas rutas. Se conservan los ajustes y paquetes ajenos, y repetir una configuración ya aplicada no cambia ningún byte. Si no hay una instalación externa, no se crea un archivo de ajustes de Pi. Vuelve a ejecutar el helper después de registrar una release en una ubicación nueva, antes de iniciar Pi en este checkout. Los filtros de proyecto de Pi requieren que se confíe en el proyecto; esa confianza no se concede automáticamente. Los paquetes temporales y ajustes personales explícitos siguen bajo el control del asistente. Es selección de recursos, no una barrera de seguridad ni una actualización del runtime instalado.

La matriz de plataformas también ejecuta `tests/source-host-isolation.mjs` con repositorios temporales de código fuente y un proyecto vecino. Comprueba un control positivo de colisiones, la selección del código fuente, que no cambien los ajustes globales ni los del vecino, los recursos ajenos, el rechazo de ajustes inválidos y el descubrimiento explícito del código fuente en Claude. Conserva `source-isolation-report.json`; que pase en Linux local no demuestra una ejecución en Windows ni en la CI remota.

## Convenciones de documentación

Mantén en inglés las instrucciones activas de la factoría y sus recursos operativos. Las guías para usuarios tienen versiones equivalentes en inglés y español de España; actualiza ambas cuando cambien su significado o sus ejemplos. Conserva los registros del usuario y las evidencias históricas en su idioma original.

El README debe ser accesible. Deja las reglas exactas de ejecución, modelos y recuperación en sus guías operativas existentes, en lugar de repetirlas en varias páginas.

### Mantener el diagrama interactivo del flujo

[`docs/diagrams/flow.json`](../diagrams/flow.json) es la única fuente de las dos páginas interactivas `docs/en/workflow.html` y `docs/es/workflow.html` y de las dos imágenes del README `docs/en/workflow.svg` y `docs/es/workflow.svg`. Cada nodo, pregunta, control automático y flecha tiene un `id` estable y su texto en inglés y en español, y cada pregunta cita los archivos del repositorio que respaldan su respuesta. Edita los datos, nunca las páginas generadas, y mantén cada respuesta fiel al archivo citado. Los nombres exactos de roles, skills y archivos no cambian entre idiomas.

```sh
node tooling/maintenance/workflow-flow.mjs
node tooling/maintenance/workflow-flow.mjs --check
```

El primer comando reescribe ambas páginas y ambas imágenes. Las páginas son archivos únicos con CSS y JavaScript en línea y funcionan sin conexión; las imágenes se describen más abajo. El segundo solo necesita Node.js y git. No escribe nada y falla cuando a un campo le falta el texto en inglés o en español, se repite un ID, una flecha o el destino de una pregunta nombra un nodo desconocido, una ruta citada no existe en `HEAD`, o una página o una imagen difiere de lo que producen los datos. `node tools/check-quality.mjs` lo ejecuta y `tests/workflow-flow.mjs` prueba cada fallo con fixtures desechables. Estas comprobaciones no abren un navegador ni verifican que una traducción o una respuesta sea exacta: lee ambas páginas después de un cambio.

### Mantener los diagramas del flujo

El README muestra `docs/en/workflow.svg` o `docs/es/workflow.svg`, que el mismo comando escribe desde el mismo archivo de datos que las páginas interactivas. La imagen tiene una caja por nodo y una flecha por arista, y no incluye script, enlaces ni texto de las preguntas. Pinta su propio panel claro, así que se lee igual sobre los fondos claro y oscuro de GitHub. Edita `docs/diagrams/flow.json`, nunca un SVG a mano, y vuelve a ejecutar el generador tras cambiar el flujo.

`--check` falla cuando una imagen difiere de lo que producen los datos. `tests/workflow-flow.mjs` cubre una imagen desactualizada, el escapado del marcado y la ausencia de script, pero nada renderiza una imagen: una caja crece con su texto ajustado, así que una etiqueta larga puede chocar con el texto de una flecha. Abre ambos SVG en un navegador tras un cambio. `.github/workflows/pages.yml` publica solo las dos páginas interactivas y la página de inicio, nunca las imágenes.

### Mantener las animaciones de la primera sesión

[`docs/diagrams/first-session.json`](../diagrams/first-session.json) es la única fuente de cuatro imágenes del README: `docs/en/first-session.svg` y `docs/es/first-session.svg` (una sesión de terminal simulada) y `docs/en/initiatives-panel.svg` y `docs/es/initiatives-panel.svg` (un panel de iniciativas de Claude Code simulado). Cada paso tiene texto en inglés y en español, una demora y el archivo del repositorio que respalda lo que dice; los datos del panel enumeran sus trabajos, sus fotogramas y las etiquetas que copian de `hooks/register.tsx`. Un fotograma cuyo trabajo está pendiente muestra la iniciativa solo en No activas, como hace el panel, y se rechaza un pie demasiado largo para la imagen. Edita los datos, nunca una imagen, y mantén cada paso fiel a su archivo citado. Ambas imágenes llevan una etiqueta visible de "simulado", usan datos de demostración y no son grabaciones.

```sh
node tooling/maintenance/first-session.mjs
node tooling/maintenance/first-session.mjs --check
```

El primer comando reescribe las cuatro imágenes; el segundo solo necesita Node.js y git, no escribe nada y falla cuando a un campo le falta su texto en inglés o en español, se repite el ID de un paso, una ruta citada no existe en `HEAD` o una imagen difiere de lo que producen los datos. `node tools/check-quality.mjs` lo ejecuta y `tests/first-session.mjs` prueba cada fallo con fixtures desechables. Las imágenes se animan solo con CSS (sin script), siguen el ajuste claro u oscuro de quien las ve y, si se pide reducir el movimiento, muestran todos los pasos o el último fotograma del panel a la vez. Ningún test las renderiza: tras un cambio, abre ambos idiomas en un navegador, en claro y en oscuro.

Para medir los minutos de reloj de CI por rama de pull request y por push (solo desarrollo; el script no hace llamadas de red):

```sh
gh run list --limit 100 --json event,headBranch,conclusion,createdAt,updatedAt,databaseId | node tooling/maintenance/ci-minutes.mjs
```

Muestra el número de ejecuciones, las canceladas y los minutos totales de cada grupo `<evento> <rama>`, y un total general.

Para medir cuánto cuesta a un proyecto una lectura de la instantánea del panel de iniciativas (solo desarrollo; lecturas directas de Node, así que el panel de Claude, que enruta cada llamada por el host, es más lento):

```sh
node tooling/maintenance/snapshot-cost.mjs --project /absolute/project --runs 5
```

Muestra las llamadas al sistema de archivos por tipo y el tiempo mediano y mínimo de lectura en milisegundos.

## Fuente de la verdad e historial

Comprueba las herramientas, los manifiestos y las pruebas reales antes de documentar el comportamiento actual. El [mapa del código](architecture.md) ayuda a localizar al responsable. Distingue los objetivos aceptados de las pruebas de implementación y de las [propuestas futuras](future-actions.md).

La documentación retirada está disponible en el historial de Git.

## Antes de publicar

Comprueba el candidato real, la revisión necesaria y el permiso para publicar. Mantén alineada la versión del paquete, el núcleo y el plugin. No afirmes que existe una publicación en npm, equivalencia entre plataformas o integraciones reales satisfactorias sin evidencias.

El proyecto utiliza la licencia MIT. Publicar sigue siendo una acción que necesita autorización aparte.
