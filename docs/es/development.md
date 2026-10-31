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

Cuando un brief selecciona TDD, cada commit RED de comportamiento contiene solo la prueba y falla intencionadamente; el siguiente commit GREEN contiene el cambio que la supera. Si `git bisect` llega a un commit RED, usa `git bisect skip`, ya que se espera que ese commit falle. Un fallo de sintaxis o de configuración de la prueba no es un resultado RED válido.

Cuando Bun está disponible, la comprobación portable también construye e instala un paquete Bun real en directorios temporales. Prueba las exportaciones de paquetes externos similares a un SDK y sus dependencias transitivas, las tareas `.mjs` con rutas absolutas y relativas, el traspaso al binario fijado y, cuando está disponible, Bubblewrap en Linux con un SDK simulado. Sin Bun, la prueba de artefacto indica SKIP. Asigna a `ISSWF_TEST_BUN` la ruta de un compilador para exigirla; `ISSWF_TEST_BUN_WORKER=1` exige además la comprobación del aislamiento. CI instala el compilador Bun fijado y exige las pruebas de artefacto y aislamiento Linux. En local, `ISSWF_TEST_BUN_TMPDIR` permite ubicar los datos de prueba binarios grandes en otro disco sin cambiar la política de la raíz de evidencias de diagnóstico. Estos datos de prueba no ejecutan Claude ni proveedores reales.

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

ESLint realiza el lint y las comprobaciones estáticas; Knip informa de archivos, dependencias y exportaciones sin utilizar y de referencias sin resolver dentro de su configuración. Ninguna demuestra que se hayan encontrado todas las rutas de código muerto. Las comprobaciones del código fuente no tienen un paso separado de compilación ni de comprobación de tipos. Construir una release autónoma añade el paso explícito de compilación con Bun.

Estas herramientas ayudan a encontrar errores y código sin utilizar. No sustituyen las comprobaciones necesarias para cada funcionalidad ni demuestran que una ejecución real de agentes haya terminado bien.

La comprobación portable de la guía de revisión verifica cuatro fixtures ejecutables: dos defectos de comportamiento con pruebas que pasan pero resultan insuficientes, y dos cambios válidos. Comprueba los resultados esperados de las fixtures, no la calidad de revisión de un modelo. Para conservar un paquete de evaluación, elige una carpeta inexistente fuera del repositorio:

```sh
node tests/review-guidance.mjs . /absolute/absent/review-fixtures
```

Excluye `oracle.json` y `probes/` del paquete de una revisión a ciegas. Las comparaciones reales requieren llamadas nativas autorizadas por separado con el mismo candidato, contexto, modelo y esfuerzo. Informa de los defectos omitidos y las falsas alarmas, conserva los resultados inconclusos y no deduzcas una mejora general a partir de una única muestra pequeña.

## Comprobaciones de plataforma y descubrimiento de skills

La comprobación de integración con el host utiliza las dependencias fijadas, un perfil aislado y un proveedor simulado en loopback. Descubre los roles empaquetados y comprueba el modelo y el esfuerzo del worker y del reviewer, las herramientas, los cambios en el directorio asignado, los errores y la cancelación sin llamadas a modelos reales. No certifica la delegación real de Claude, la ejecución en segundo plano ni el aislamiento del sistema operativo.

```bash
npm ci --prefix tooling/host-tests --ignore-scripts --no-audit --no-fund
node tests/host-native-delegation.mjs .
```

El workflow Quality conserva el job completo de calidad de Linux y Bubblewrap. La matriz nativa Linux/Windows ejecuta las pruebas enfocadas de fallos del escritor fuente y compila e instala un artefacto Bun por plataforma. Cada artefacto instalado prueba la inicialización y la preparación/repetición correctas del planificador fijado, además del rechazo de un bloqueo incierto; un recorrido con el lanzador de release de Node comprueba la misma ruta compartida. Los registros de Windows vinculan PID, hora de creación del proceso y hora de arranque del sistema; la evidencia desconocida se rechaza de forma conservadora. Linux conserva su formato de propietario actual y los fallos de sincronización de directorio fatales. Windows omite esa operación no compatible y no promete la misma persistencia de las entradas del directorio ante una pérdida de energía. Estas comprobaciones cubren la ruta CLI compartida por los recursos de Pi y Claude, no la ejecución de modelos reales, la migración/recuperación general de Windows, la ejecución de trabajadores ni el aislamiento del sistema operativo. La matriz también cubre los recibos exactos del artefacto, la versión e inspección de solo lectura de la CLI, rutas con espacios y Unicode, worktrees externos de Git y el descubrimiento nativo del host. En Windows no se comprueban los permisos POSIX.

La matriz instala asistentes exclusivos de desarrollo desde `tooling/host-tests/package-lock.json`, con los scripts de ciclo de vida desactivados. Pi 1.4.0 instala el paquete en los ámbitos temporales de usuario y proyecto; su cargador real de recursos debe descubrir las catorce skills del artefacto instalado, con un control vacío previo a la instalación. Claude Code 2.1.299 instala el marketplace y plugin locales y debe mostrar esas skills en su inventario nativo de componentes. La prueba invoca el binario nativo de la plataforma incluido en la dependencia opcional de Claude, sin ejecutar su script de instalación. No se proporciona ningún prompt, sesión de agente, inicio de sesión ni credencial de proveedor. Las carpetas temporales de usuario y configuración y la telemetría desactivada limitan la actividad incidental; no demuestran aislamiento de red. Son pruebas de instalación y descubrimiento, no evaluaciones de tareas o delegaciones reales.

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

### Mantener los diagramas del flujo

Las imágenes de los README y los diagramas interactivos completos comparten [una fuente bilingüe](../diagrams/workflow.json). Mantén juntos los identificadores de los nodos, las ramas, las citas de fuentes y las traducciones. Cuando cambie el flujo, fija la revisión del repositorio y las citas al commit que respalda el nuevo comportamiento. Los nombres exactos de roles, skills y archivos no cambian entre idiomas. El resumen omite las ramas detalladas y las referencias; el HTML las conserva.

Para regenerar ambos idiomas, utiliza una CLI de Archify 3.2 ya instalada. Sustituye `/path/to/archify/bin/archify.mjs` por su ruta de instalación. El comando utiliza un navegador local para validar, escribe los HTML y SVG en `docs/en/` y `docs/es/`, y conserva los candidatos y comprobaciones locales en `.archify/`. No instala herramientas, activa GitHub Pages ni publica archivos.

```sh
node tooling/maintenance/workflow-diagrams.mjs /path/to/archify/bin/archify.mjs
node tooling/maintenance/workflow-diagrams.mjs --check
```

El segundo comando solo necesita Node.js. Comprueba los campos de traducción, las referencias del resumen, los bytes de los SVG generados y los hashes de los HTML contra el manifiesto generado portable. La suite de calidad portable también prueba esas comprobaciones con fixtures desechables que omiten traducciones, dejan la fuente desactualizada, incluyen referencias inválidas o identificadores duplicados y modifican los artefactos. No repite la validación en navegador ni verifica el significado de las traducciones. Inspecciona ambas imágenes y revisa las traducciones después de regenerar. Los recibos locales de entrega de Archify contienen rutas de la máquina y se ignoran; el manifiesto portable se conserva con los diagramas.

## Fuente de la verdad e historial

Comprueba las herramientas, los manifiestos y las pruebas reales antes de documentar el comportamiento actual. El [mapa del código](architecture.md) ayuda a localizar al responsable. Distingue los objetivos aceptados de las pruebas de implementación y de las [propuestas futuras](future-actions.md).

La documentación retirada está disponible en el historial de Git.

## Antes de publicar

Comprueba el candidato real, la revisión necesaria y el permiso para publicar. Mantén alineada la versión del paquete, el núcleo y el plugin. No afirmes que existe una publicación en npm, equivalencia entre plataformas o integraciones reales satisfactorias sin evidencias.

El proyecto utiliza la licencia MIT. Publicar sigue siendo una acción que necesita autorización aparte.
