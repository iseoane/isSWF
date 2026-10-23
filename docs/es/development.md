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

Mantén el desarrollo fuente con Node.js y `.mjs`. Instala un compilador Bun de confianza solo para construir releases. Bun 1.4.3 es el compilador probado localmente. El generador usa Bun por defecto; `--runtime node` conserva el formato original para datos de prueba de desarrollo. Elige un commit que contenga las herramientas completas de distribución. El generador lee ese commit, no los cambios sin commit. Si el trabajo de instalación aún no está guardado en un commit de tu copia, no esperes encontrarlo en el commit anterior.

Sustituye `FULL_COMMIT_SHA` por el SHA completo del commit y utiliza una carpeta de salida que no exista, fuera del repositorio fuente:

```bash
node tools/build-release.mjs --source "$PWD" --revision FULL_COMMIT_SHA --output /path/to/isswf-release --runtime bun
```

Esa carpeta es la que utilizan los [comandos de instalación](installation.md). Prepararla no publica nada en npm, registra un marketplace ni cambia la versión de otro proyecto. El SHA identifica el código elegido; instalar la carpeta preparada no crea una nueva revisión del código fuente.

El compilador activa `--compile-autoload-package-json` para que las tareas generadas puedan resolver la entrada del SDK existente del host y las exportaciones de sus dependencias transitivas. Esto no incorpora ni instala ese SDK. El ejecutable también resuelve las rutas relativas de tareas `.mjs` desde el directorio de trabajo.

Usa `--target` para seleccionar un artefacto separado de Linux, macOS o Windows. Son destinos de compilación, no paridad de plataforma verificada. El flujo instalado completo de mutaciones y aislamiento sigue siendo exclusivo de Linux.

La [guía técnica de instalación](../installation.md), en inglés, explica cómo crear los paquetes y qué comprobaciones exactas se realizan.

## Controles de calidad

Utiliza Node.js 24 o posterior con npm y Git. Ejecuta las comprobaciones portables desde la raíz del repositorio:

```bash
node tools/check-quality.mjs
```
La comprobación portable incluye `node tooling/quality/check-docs.mjs`: comprueba los espejos de las guías vigentes, los enlaces locales, la cobertura de secciones y que los ejemplos de shell sean idénticos. También rechaza procedimientos de auditoría obsoletos copiados en las guías técnicas vigentes. No demuestra la calidad de la traducción ni ejecuta los ejemplos.


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

## Comprobaciones de plataforma y descubrimiento de skills

El workflow Quality conserva el job completo de calidad de Linux y Bubblewrap. Una matriz independiente define comprobaciones nativas en Linux y Windows de compilación con Bun, instalación del tarball npm, inventarios exactos de recursos, versión e inspección de solo lectura de la CLI, rutas con espacios y Unicode, y worktrees externos de Git. En Windows no se comprueban los permisos POSIX. Estas pruebas no demuestran soporte de mutación, recuperación ni aislamiento de trabajadores en Windows.

La matriz instala asistentes exclusivos de desarrollo desde `tooling/host-tests/package-lock.json`, con los scripts de ciclo de vida desactivados. Pi 1.4.0 instala el paquete en los ámbitos temporales de usuario y proyecto; su cargador real de recursos debe descubrir las seis skills del artefacto instalado, con un control vacío previo a la instalación. Claude Code 2.1.299 instala el marketplace y plugin locales y debe mostrar esas skills en su inventario nativo de componentes. La prueba invoca el binario nativo de la plataforma incluido en la dependencia opcional de Claude, sin ejecutar su script de instalación. No se proporciona ningún prompt, sesión de agente, inicio de sesión ni credencial de proveedor. Las carpetas temporales de usuario y configuración y la telemetría desactivada limitan la actividad incidental; no demuestran aislamiento de red. Son pruebas de instalación y descubrimiento, no evaluaciones de tareas o delegaciones reales.

Para ejecutar las comprobaciones adicionales en local, elige una carpeta de salida inexistente fuera del repositorio. Estos ejemplos utilizan una shell compatible con Bash; en Windows, indica una ruta absoluta de Windows para la carpeta de salida:

```sh
npm ci --prefix tooling/host-tests --ignore-scripts --no-audit --no-fund
export ISSWF_PLATFORM_ROOT="/absolute/absent/platform-output"
node tests/platform-package.mjs .
node tests/host-discovery.mjs .
```

El constructor del artefacto lee el HEAD confirmado, mientras que las comprobaciones estáticas del código leen el árbol de trabajo. Las pruebas requieren los asistentes fijados y Bun; si faltan herramientas o skills, fallan en vez de omitirse en silencio. Para repetirlas, utiliza una nueva ruta de salida. La CI conserva durante 14 días los informes de plataforma y descubrimiento y el inventario de skills observado en Claude. Configurar una matriz no demuestra que todas las plataformas hayan pasado; consulta la ejecución exacta antes de afirmar compatibilidad.

## Convenciones de documentación

Mantén en inglés las instrucciones activas de la factoría y sus recursos operativos. Las guías para usuarios tienen versiones equivalentes en inglés y español de España; actualiza ambas cuando cambien su significado o sus ejemplos. Conserva los registros del usuario y las evidencias históricas en su idioma original.

El README debe ser accesible. Deja las reglas exactas de ejecución, modelos y recuperación en sus guías operativas existentes, en lugar de repetirlas en varias páginas.

## Fuente de la verdad e historial

Comprueba las herramientas, los manifiestos y las pruebas reales antes de documentar el comportamiento actual. El [mapa del código](architecture.md) ayuda a localizar al responsable. Distingue los objetivos aceptados de las pruebas de implementación y de las [propuestas futuras](future-actions.md).

La documentación retirada está disponible en el historial de Git.

## Antes de publicar

Comprueba el candidato real, la revisión necesaria y el permiso para publicar. Mantén alineada la versión del paquete, el núcleo y el plugin. No afirmes que existe una publicación en npm, equivalencia entre plataformas o integraciones reales satisfactorias sin evidencias.

El proyecto utiliza la licencia MIT. Publicar sigue siendo una acción que necesita autorización aparte.
