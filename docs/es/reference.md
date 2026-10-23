# Cómo funciona la factoría

[Inicio](../../README.es.md) · [English](../en/reference.md)

isSWF combina instrucciones para agentes con herramientas que registran, ejecutan y consultan trabajo autorizado. Un perfil Markdown por sí solo no crea un agente en ejecución.

## Skills que utilizas

| Skill | Para qué sirve |
| --- | --- |
| `isswf-setup` | Preparar un proyecto o inspeccionar una propuesta de actualización de la instalación. |
| `isswf-coordinator` | Concretar un encargo, elegir el siguiente paso, coordinar trabajo autorizado y explicar el resultado. |
| `isswf-writing` | Crear, revisar o mejorar documentos con el enfoque adecuado para humanos o agentes, en cualquier proyecto. |
| `isswf-understanding` | Comprender un tema o sistema, aclarar una explicación o aprender mediante práctica y feedback. |
| `isswf-pr` | Preparar descripciones de PR y actualizaciones autorizadas con evidencias y evaluación obligatoria del riesgo. |
| `isswf-issue` | Reportar bugs independientes o proponer funcionalidades y mejoras, con destino verificado y `needs-triage` obligatorio. |
| `isswf-e2e` | Crear, ejecutar o mantener pruebas ejecutables de recorridos críticos de usuario, con Playwright u otro controlador adecuado para la interfaz real. |
| `isswf-debug` | Reproducir defectos, investigar causas y devolver un diagnóstico causal o incertidumbre explícita. |
| `isswf-review` | Revisar un candidato exacto frente a Standards y Spec con evidencias proporcionadas al riesgo. |
| `isswf-retrospective` | Aprender de funcionalidades o errores terminados, o de un cierre explícito de sesión, mediante borradores locales de mejora. |
| `isswf-tdd` | Aplicar un ciclo observado de rojo-verde-refactorización cuando se solicita TDD o se selecciona una prueba de regresión útil. |

En Pi se invocan con `/skill:`. En Claude Code, con `/isswf:`. También existe `isswf-triage` en el código fuente para los prototipos históricos de entrada de issues; no es una entrada habitual del paquete completo instalado.

La skill de redacción determina la audiencia a partir de la petición y del contexto del documento. Te pregunta cuando la audiencia no está clara y sigue las convenciones de idioma y documentación del proyecto de destino. Utiliza `/skill:isswf-writing` en Pi o `/isswf:isswf-writing` en Claude Code. No requiere activar el proyecto.

La skill de comprensión elige entre reformular, explicar o aprender con práctica según tu petición. Se adapta a los conocimientos que muestras y pregunta solo cuando una ambigüedad cambiaría la respuesta. Utiliza `/skill:isswf-understanding` en Pi o `/isswf:isswf-understanding` en Claude Code. Sirve para distintos temas y proyectos sin crear cursos ni registros de progreso por defecto.

La skill de PR funciona directamente o desde Delivery. Inspecciona el candidato, explica el alcance y los límites de verificación, y evalúa el riesgo incluso en cambios solo de documentación. Delivery aporta sus identidades y evidencias y reutiliza la misma evaluación. Utiliza `/skill:isswf-pr` en Pi o `/isswf:isswf-pr` en Claude Code. Redactar no autoriza publicar ni fusionar.

La skill de issues distingue los hallazgos independientes de los errores de la implementación actual. Dirige un reporte saneado al repositorio del proyecto o de la factoría, comprueba duplicados y exige la etiqueta existente `needs-triage` antes de crear la issue. La falta de acceso al destino, permiso de publicación o soporte de la etiqueta deja un borrador o un bloqueo explícito. Utiliza `/skill:isswf-issue` en Pi o `/isswf:isswf-issue` en Claude Code. Crear un reporte no autoriza implementarlo.

La skill E2E inspecciona las herramientas de prueba existentes del proyecto y selecciona unos pocos recorridos de usuario útiles. Admite navegador, CLI, terminal y API; Playwright es opcional, no una dependencia para todos los proyectos. Crea pruebas ejecutables, fixtures, un mapa de recorridos y comandos locales y de CI, en vez de depender de que un agente haga las comprobaciones manualmente. Utiliza `/skill:isswf-e2e` en Pi o `/isswf:isswf-e2e` en Claude Code. Instalar dependencias, utilizar cuentas reales, llamar a proveedores o publicar sigue necesitando su propio permiso. Las pruebas sin ejecutar son cobertura propuesta, no una suite verificada.

Las skills de depuración, revisión, retrospectiva y TDD dan acceso a los procedimientos existentes sin convertirlos en etapas obligatorias. El coordinador y los perfiles correspondientes las seleccionan según la tarea. Usa `/skill:isswf-debug`, `/skill:isswf-review`, `/skill:isswf-retrospective` o `/skill:isswf-tdd` en Pi; Claude Code ofrece los mismos nombres bajo `/isswf:`. La revisión independiente sigue requiriendo un contexto separado y autorizado. Las retrospectivas conservan los trabajos activos y generan borradores, no cambios de política ni permisos de ejecución.

Los workers instalados reciben las skills fijadas de depuración y TDD como metodología de solo lectura junto con E2E cuando la versión las incluye. Los callers nativos de diagnóstico y revisión incluyen su skill desde el mismo checkpoint de metodología que su perfil; los pins históricos conservan sus recursos originales. Los callers de solo texto no reciben herramientas, skills globales ni integraciones del coordinador. Estos recursos no añaden un dispatcher de retrospectivas ni cambian las garantías de aislamiento del asistente.

Las skills ofrecen tareas que se pueden solicitar por separado y tienen un resultado observable. Las referencias de los roles aportan orientación condicional dentro de esas tareas, como los principios de diseño, la calidad de las pruebas o los permisos. Se mantienen como referencias, en vez de convertirse en flujos independientes obligatorios. Si una guía incorpora más adelante una entrada propia, conserva sus reglas detalladas en un único recurso canónico, sin copiarlas a una segunda skill.

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
