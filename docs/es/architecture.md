# Dónde está cada cosa

[Inicio](../../README.es.md) · [Documentación](index.md) · [English](../en/architecture.md)

Esta guía describe la estructura actual del código, no una arquitectura propuesta. Para comprobar qué está implementado, empieza por el código y las pruebas. Un plan, una demostración antigua o una respuesta satisfactoria de un modelo no demuestran el comportamiento actual.

## Instrucciones e integraciones

Las instrucciones compartidas están en `.agents/skills/` y `.agents/roles/`. Las referencias de los roles explican cómo investigar, implementar, comprobar y revisar trabajos. Se utilizan cuando corresponden, no como una secuencia obligatoria.

Pi descubre las skills declaradas en `package.json`. Las carpetas `skills/`, `agents/` y `.claude-plugin/` adaptan las instrucciones compartidas a Claude Code. No deben mantener otra copia de la metodología. Un archivo de rol describe responsabilidades; no es un agente en ejecución ni un permiso para ejecutar.

## Herramientas ejecutables

| Área | Código |
| --- | --- |
| Preparar y verificar un paquete | `tools/build-release.mjs`, `tools/bun-release.mjs`, `tools/release-source.mjs`, `tools/factory-package.mjs` |
| Inicializar, seleccionar, actualizar y recuperar la instalación de un proyecto | `tools/isswf.mjs`, `tools/project-state.mjs`, `tools/state-migration.mjs` |
| Preparar planes y recibir issues | `tools/isswf-plan.mjs`, `tools/isswf-intake.mjs` |
| Leer registros y mostrar el panel local | `tools/isswf-status.mjs`, `tools/isswf-panel.mjs`, `tools/isswf-response.mjs` |
| Preparar y observar un worker | `tools/isswf-job.mjs`, `tools/pi-worker-task.mjs`, `tools/worker-lifecycle.mjs` |
| Investigación, planificación, diagnóstico y revisión | `tools/researcher-task.mjs`, `tools/planner-task.mjs`, `tools/diagnostic-task.mjs`, `tools/reviewer-task.mjs` |
| Capacidad, recuperación y registros de efectos externos | `tools/execution-capacity.mjs`, `tools/native-recovery.mjs`, `tools/recovery-review.mjs`, `tools/job-successor.mjs`, `tools/external-effect-journal.mjs` |

Estas herramientas tienen contratos distintos. No des por hecho que los comandos, modelos compatibles, recuperación o permisos de un rol se aplican a otro.

El compilador de releases integra las entradas de herramientas en un ejecutable Bun y proporciona a cada módulo su identidad original y las rutas de la raíz del paquete. Los archivos fuente se conservan como procedencia verificada, helpers dinámicos y snapshots inmutables de tareas. El desarrollo fuente sigue ejecutándose con Node.js. `tools/sdk-package.mjs` resuelve metadatos de dependencias del SDK sin depender de una API exclusiva de Node.

## Registros del proyecto y datos privados

Los repositorios nuevos utilizan `.isswf/`. Los existentes pueden seguir utilizando `.factory/` hasta una migración explícita. `tools/project-state.mjs` selecciona la carpeta de estado y rechaza que coexistan ambas de forma ambigua. No renombres referencias históricas para que parezcan registros nuevos.

Los planes, briefs y revisiones describen el trabajo. La referencia de instalación selecciona su runtime. Los recibos Bun de formato 2 separan la identidad portable del código y motor del hash del artefacto nativo verificado localmente. Las identidades y almacenes de formato 1 siguen siendo válidos. Los almacenes privados conservan los registros de ejecución y el código exacto de las versiones separados de los archivos compartidos del proyecto. Un estado guardado no demuestra que haya un proceso vivo.

En el repositorio de desarrollo, `.factory/models.json` y `.factory/templates/` también contienen valores iniciales que se distribuyen mediante listas explícitas de archivos. Sus iniciativas son registros del proyecto, no contenido del paquete. El código Python de `isswf/` y `examples/` pertenece a los prototipos anteriores de recepción de issues; el flujo nativo instalado no depende de SQLite.

## Pruebas y documentación

`tests/` contiene las comprobaciones JavaScript portables y las pruebas históricas. `tooling/quality/` contiene las herramientas de análisis estático, con versiones fijadas y exclusivas del desarrollo. `.github/workflows/quality.yml` ejecuta las comprobaciones portables, el lint y la detección de código sin utilizar. Las pruebas temporales y copias privadas van en `tooling/.local/`, excluida de Git, no en el paquete instalado.

[Desarrollo](development.md) explica cómo ejecutar las comprobaciones. [El glosario](../../GLOSSARY.es.md) define los términos del producto. Las guías vigentes están en `docs/en/` y `docs/es/`; el [catálogo histórico](../history/README.es.md) separa el diseño anterior de las instrucciones actuales.
