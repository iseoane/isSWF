# Cómo funciona la factoría

[Inicio](../../README.es.md) · [English](../en/reference.md)

isSWF combina instrucciones para agentes con herramientas que registran, ejecutan y consultan trabajo autorizado. Un perfil Markdown por sí solo no crea un agente en ejecución.

## Skills que utilizas

| Skill | Para qué sirve |
| --- | --- |
| `isswf-setup` | Preparar un proyecto o inspeccionar una propuesta de actualización de la instalación. |
| `isswf-coordinator` | Concretar un encargo, elegir el siguiente paso, coordinar trabajo autorizado y explicar el resultado. |

En Pi se invocan con `/skill:`. En Claude Code, con `/isswf:`. También existe `isswf-triage` en el código fuente para los prototipos históricos de entrada de issues; no es una entrada habitual del paquete completo instalado.

## Personas y agentes

Tú decides el objetivo de producto y lo que está permitido. El coordinador mantiene el plan y elige apoyo cuando resulta útil:

| Rol | Qué aporta |
| --- | --- |
| Worker | Implementa un cambio acotado y lo comprueba. |
| Researcher | Investiga una cuestión técnica y devuelve evidencias. |
| Planner | Propone unidades de trabajo útiles y sus dependencias. |
| Diagnostician | Investiga un error cuya causa no está clara. |
| Reviewer | Evalúa el cambio y sus evidencias de forma independiente cuando hace falta ese juicio. |

Son responsabilidades, no una secuencia obligatoria ni una promesa de que todos los entornos puedan ejecutar todos los roles. Un encargo claro puede seguir un camino corto. Si hay más incertidumbre, puede necesitar preguntas o investigación antes de empezar.

## Qué se queda en cada proyecto

Las instalaciones nuevas conservan los registros compartidos del proyecto en `.isswf/`. Describen los planes, los encargos, las decisiones y la versión de la factoría seleccionada. Los registros locales privados se mantienen separados de los archivos que se pretende guardar en Git.

Los proyectos antiguos pueden seguir utilizando `.factory/`. La migración es explícita y conserva los registros existentes; no mantengas ambas carpetas como estados activos.

Engram puede ayudar a recuperar contexto útil, pero no es la base de datos de los encargos ni una fuente de permisos. Codegraph puede ayudar a localizar código. Ninguno es obligatorio cuando el repositorio aporta información suficiente.

## Versiones y actualizaciones

El paquete de Pi, el núcleo y el plugin comparten versión. Instalar un paquete nuevo no cambia de versión todos los proyectos de forma automática.

Un proyecto conserva la versión exacta elegida para su trabajo. Los hashes internos identifican ese código; reinstalar la misma versión preparada no crea una revisión de código distinta. El trabajo nuevo utiliza otra versión solo después de actualizar el proyecto correspondiente. Los encargos anteriores mantienen sus referencias originales.

La [guía de instalación y actualizaciones](installation.md) explica el uso habitual. La [guía técnica](../installation.md), en inglés, incluye los comandos exactos de recuperación.

## Compatibilidad actual

Pi es el entorno de ejecución de referencia. Sus workers aislados necesitan las herramientas Linux documentadas, acceso a modelos compatibles y autorización explícita para el encargo.

El plugin de Claude Code proporciona sus propias entradas y delegación nativa. Esto no acredita las mismas funciones que Pi. El nuevo flujo de instalación no afirma una validación real reciente en Claude.

El trabajo más reciente de instalación del paquete completo y migraciones se está preparando para su publicación. El número de versión del repositorio no demuestra que exista una publicación en npm o un marketplace público.

Siguen siendo importantes estos límites:

- El panel muestra trabajo registrado, no una comprobación en directo de cada proceso o cambio en GitHub.
- El trabajo paralelo necesita escritores separados y capacidad autorizada disponible; no es un planificador para toda la máquina.
- Hay que inspeccionar el trabajo interrumpido antes de repetirlo. No se promete reanudación automática tras cualquier fallo o reinicio.
- Los modelos y los límites de llamadas son explícitos. Que un modelo no esté disponible no permite improvisar otro ni gastar más.
- Un cambio comprobado no queda aceptado, publicado ni fusionado automáticamente.
- Los proyectos de clientes y los datos sensibles necesitan sus propias comprobaciones de acceso y aislamiento.

## ¿Salen datos de mi equipo?

Los archivos del proyecto y el panel local están en tu equipo, pero el asistente de programación puede enviar instrucciones y contenido del código a su proveedor de modelos. Las operaciones autorizadas de GitHub utilizan la cuenta configurada. Las integraciones opcionales tienen sus propios límites de datos.

No incluyas credenciales en encargos, notas ni evidencias compartidas. Un panel local no es un servicio seguro para publicarlo en Internet.

## ¿Dónde están los contratos técnicos?

Empieza por [consultar el trabajo](operations.md) para los comandos habituales. Los recursos detallados en inglés siguientes son contratos de implementación; consúltalos solo cuando hagan falta:

- [Instalación, migración y recuperación](../installation.md).
- [Ejecución de encargos e interrupciones](../local-worker-lifecycle.md).
- [Selección de modelos y presupuestos](../model-routing.md).
- [Planes, registros y conservación de evidencias](../durable-work.md).
- [Selección de revisión](../../.agents/roles/references/review.md).
