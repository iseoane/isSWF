# Cómo funciona la factoría

[Inicio](../../README.es.md) · [English](../en/reference.md)

isSWF combina instrucciones para agentes con herramientas que registran, ejecutan y consultan trabajo autorizado. Un perfil Markdown por sí solo no crea un agente en ejecución.

## Cómo se decide el trabajo y quién decide

Tú decides el objetivo, lo que la factoría puede hacer y si aceptas el resultado. El coordinador decide el camino: lee tu petición, comprueba el código y los registros del proyecto, y elige la ruta más corta que encaje. Puede empezar el trabajo, investigar antes, entrevistarte o diagnosticar un error de causa desconocida. Una decisión que solo puedes tomar tú detiene el paso que la necesita, no el trabajo seguro de alrededor, y queda registrada como `awaiting-human` con la pregunta exacta.

| Decisión | Quién la toma |
| --- | --- |
| El objetivo, lo que está permitido y aceptar el resultado | Tú |
| El camino, el plan y el brief de cada trabajo | El coordinador |
| Hacer el trabajo y comprobarlo | Un worker |
| Un juicio independiente, cuando el riesgo lo pide | Un revisor, en un contexto separado |
| Integrar la pull request (PR) terminada en la rama base | Tú |

El diagrama interactivo muestra esas mismas decisiones paso a paso, con las preguntas que se hace cada paso: [Español](https://iseoane.github.io/isSWF/docs/es/workflow.html) o [English](https://iseoane.github.io/isSWF/docs/en/workflow.html). Para leerlo sin conexión, abre [la página en español](workflow.html) o [la página en inglés](../en/workflow.html); la [imagen de resumen](workflow.svg) muestra el mismo flujo en una sola figura. El diagrama sirve de orientación, no es la autoridad sobre el comportamiento actual: lo son las guías que cita. El sitio se publica de forma manual, y el [índice de documentación](index.md#sitio-publicado) explica cómo.

## Dividir el trabajo en trabajos por tamaño

El coordinador divide un encargo en trabajos: porciones pequeñas que entregan algo que puedes verificar. Cada trabajo recibe un tamaño, S, M o L, según lo costoso que sea verificarlo. Lo deciden cuatro preguntas:

1. ¿Cuántos flujos o pantallas visibles para el usuario debe comprobar el revisor?
2. ¿El cambio tiene riesgo de concurrencia, de tiempos o de seguridad?
3. ¿Puede un revisor independiente leer todo el cambio de una vez?
4. ¿Tendría el worker que improvisar decisiones de diseño?

| Tamaño | Qué significa | Qué ocurre |
| --- | --- | --- |
| S | Un flujo, sin riesgo especial, una pasada de revisión. | Se despacha tal cual. |
| M | Dos o tres flujos relacionados, o un riesgo especial bien acotado. | Se despacha tal cual. |
| L | Cualquier otro caso. | Se divide en partes útiles por sí mismas, o el plan registra por qué no puede dividirse. |

Ningún número de líneas ni otra cifra decide el tamaño, y en caso de duda se elige el más pequeño. El tamaño forma parte del texto del plan y no añade ningún paso de aprobación. Consulta la [guía de planificación](../../.agents/roles/references/planning.md#size-units-by-verification-cost), en inglés.

## Qué pruebas se ejecutan y cuándo

Las comprobaciones se eligen según el riesgo del cambio; no se ejecuta todo en bloque. En este repositorio la regla tiene tres niveles, y la configuración de cada proyecto registra sus propias comprobaciones:

| Cuándo | Qué se ejecuta |
| --- | --- |
| En cada trabajo | Las pruebas específicas del comportamiento modificado y la comprobación de documentación, más la verificación de nivel de trabajo. |
| Al cerrar una iniciativa | La comprobación de calidad completa, una vez, en el commit de cierre. Antes, solo si el cambio afecta al empaquetado. |
| En cada PR | Cuando el proyecto entrega con GitHub, la comprobación completa en integración continua (CI), que debe superarse en la cabeza exacta antes de una fusión autorizada. |

Una ejecución local que omite la comprobación completa lo indica en su informe.

La configuración propone las comprobaciones de cada proyecto y tú las apruebas. Inspecciona cinco áreas de calidad (lint, pruebas, compilación, código muerto y lógica duplicada) sin ejecutar scripts no confiables. Con lo que encuentra propone un archivo, `verification.json`, que enumera las comprobaciones, y lo escribe solo si lo apruebas. `tools/isswf-verify.mjs` ejecuta esas comprobaciones por nivel (`job` o `initiative`) y, tras una ejecución limpia en la que todas se superan, escribe un sello que comprueba la puerta de integración (y que exige en el modo `enforce`). La configuración también propone una tabla de comprobaciones para el `AGENTS.md` del proyecto, según el tipo de cambio; conservas tus reglas, tomas la propuesta o combinas ambas. Consulta los [controles de calidad](development.md#controles-de-calidad) y el [verificador](operations.md#ejecutor-de-verificación).

## Tres formas de verificar

El coordinador elige la forma menos costosa de verificar que cubra los criterios de aceptación y el riesgo. La [selección de revisión](../../.agents/roles/references/review.md#choose-sufficient-verification), en inglés, define cada forma, y el [glosario](../../GLOSSARY.es.md) los nombra.

| Forma | Qué comprueba | Uso habitual |
| --- | --- | --- |
| Mecánica (también llamada determinista) | Un procedimiento fijo da el mismo resultado siempre: bytes, hashes, enlaces, referencias y salida de herramientas. | Archivos movidos, índices generados, sustitución de enlaces. También la ejecutan herramientas y guardas. |
| Empírica | Pruebas o recorridos de usuario, ejecutados sobre el candidato exacto, observan cada criterio de aceptación. Cada prueba relevante también debe haber fallado una vez ante un fallo deliberado. | Comportamiento que se puede ejecutar. |
| Semántica | Un revisor lee el cambio y sus consumidores y lo juzga. | Decisiones de producto, permisos, contratos compartidos, texto de metodología, afirmaciones que ejecutar no puede demostrar. |

Un cambio puede combinarlas. Un resultado mecánico o empírico puede cerrar un cambio cubierto sin llamar a un modelo, salvo que el riesgo o una regla explícita exijan un revisor independiente. Las comprobaciones de quien hizo el cambio nunca cuentan como independientes.

Los hooks y las guardas también vuelven deterministas algunas reglas. El plugin de Claude Code y las extensiones de Pi rechazan, antes de que ocurra, un commit en la rama equivocada, un registro escrito fuera del checkout del worker, una delegación que incumple sus condiciones o un comando de shell que espera a la CI en un bucle. Consulta la [guarda de despacho](operations.md#guarda-de-despacho), la [guarda de comandos de shell](operations.md#guarda-de-comandos-de-shell), la [guarda de rama](operations.md#guarda-de-ramas), la [guarda de ubicación de registros](operations.md#guarda-de-ubicación-de-registros), la [guarda de commit del plan](operations.md#guarda-de-commits-de-planes) y la [guarda de push de registros](operations.md#guarda-de-pushes-de-registros). Son reglas de proceso, no permisos.

## Trabajo en paralelo con worktrees

Los trabajos independientes pueden ejecutarse a la vez, cada uno en su propio worktree de Git (un segundo checkout del mismo repositorio) y en su propia rama. Un trabajo que depende de otro espera. La configuración ofrece una carpeta para los worktrees, por defecto junto al repositorio como `../<repo>-worktrees/<feature>`, guardada en tu configuración local de Git como `isswf.worktreeRoot`.

Cuántos workers se ejecutan a la vez es un límite local de tu clon: `git config --local isswf.maxParallelWorkers`, que vale 2 cuando falta o no es válido. La configuración te lo pregunta. En el modo `observe`, que es el predeterminado, un despacho por encima del límite se permite con un aviso; con `isswf.parallelWorkersMode` en `enforce`, la guarda de despacho lo rechaza. A cada worker en segundo plano se le indica su checkout y su rama, y la guarda de rama rechaza sus commits en cualquier otro sitio. Cada rama se comprueba y se revisa por separado, y después se integra como una PR por trabajo o una PR agrupada.

Esto se observó con workers en segundo plano de Claude Code en Windows. No se observaron workers en primer plano, Linux en directo ni Pi. Consulta el [trabajo en paralelo](operations.md#trabajo-en-paralelo), [el límite de workers](operations.md#límite-de-workers-en-paralelo), la [guía de instalación](installation.md#inicializar-un-proyecto) y la sección «Parallel jobs» de la [skill del coordinador](../../.agents/skills/isswf-coordinator/SKILL.md#parallel-jobs), en inglés.

## Cómo llegan los cambios a main

Lo que ocurre con un cambio terminado depende de la opción de entrega registrada en la configuración. Iniciar una funcionalidad nunca incluye integrarla en la rama base (`main` por defecto), salvo por la autorización opcional de abajo.

| Modo | Qué ocurre |
| --- | --- |
| Predeterminado, con GitHub | El coordinador sube la rama de la funcionalidad y abre una pull request (PR). La integración continua (CI) debe superarse en la cabeza exacta, y tú decides si se fusiona. |
| Push directo de solo registros (opcional) | La configuración lo ofrece como una autorización aparte y registra `- Records-only direct push: granted` en `project-setup.md` solo si respondes que sí. Los registros de cierre de trabajos e iniciativas, y otros cambios solo bajo `initiatives/`, van entonces directamente a la rama base. El código, la documentación, las instrucciones, las plantillas y las pruebas siguen siempre el camino de PR y CI. |
| Modo local, sin remoto | La configuración registra el seguimiento local: no hace falta cuenta de GitHub, repositorio, etiquetas ni llamadas remotas. Los planes y los trabajos siguen en `initiatives/`, y nada sale de tu equipo hasta que lo publiques. |

La guarda de pushes de registros hace cumplir la segunda fila: rechaza un push a la rama base que lleve cualquier otra ruta o carezca de la autorización. Como las demás guardas, es una regla de proceso, no una autoridad. Consulta [entrega](../../.agents/roles/references/delivery.md), [configuración](../../.agents/skills/isswf-setup/SKILL.md) y la [guarda de pushes de registros](operations.md#guarda-de-pushes-de-registros), en inglés salvo la última.

## Skills, roles, referencias y principios

Las instrucciones de `.agents/` son de cuatro tipos, cada uno en su carpeta:

| Tipo | Qué es | Dónde |
| --- | --- | --- |
| Skill | Una tarea que puedes pedir por su nombre o que el coordinador puede seleccionar. Tiene un resultado observable. | [`.agents/skills/`](../../.agents/skills/) |
| Rol | La responsabilidad que asume un agente delegado: worker, researcher, planner, diagnostician, reviewer, delivery o retrospective. | [`.agents/roles/`](../../.agents/roles/) |
| Referencia | Reglas detalladas que una skill o un rol leen solo cuando se aplican, como [revisión](../../.agents/roles/references/review.md) o [planificación](../../.agents/roles/references/planning.md). | [`.agents/roles/references/`](../../.agents/roles/references/) |
| Principio | Una referencia con criterio general en vez de un procedimiento: [diseño](../../.agents/roles/references/design-principles.md), [ejecución](../../.agents/roles/references/execution-principles.md) y [verificación](../../.agents/roles/references/verification-principles.md). El coordinador aporta uno solo cuando se aplica; ninguno es una lista de comprobación. | `.agents/roles/references/` |

Las guías de host de [`.agents/hosts/`](../../.agents/hosts/) describen cómo Pi y Claude Code lanzan cada rol. La sección siguiente enumera las skills.

## Skills que utilizas

| Skill | Para qué sirve |
| --- | --- |
| `isswf-setup` | Preparar un proyecto o inspeccionar una propuesta de actualización de la instalación. |
| `isswf-coordinator` | Concretar un encargo, elegir el siguiente paso, coordinar trabajo autorizado y explicar el resultado. |
| `isswf-writing` | Crear, revisar o mejorar documentos con el enfoque adecuado para humanos o agentes, en cualquier proyecto. |
| `isswf-understanding` | Comprender un tema o sistema, aclarar una explicación o aprender mediante práctica y feedback. |
| `isswf-howto` | Averiguar qué skill, rol o flujo encaja con tu situación y obtener un prompt para el coordinador o un comando directo de la skill, sin iniciar trabajo. |
| `isswf-pr` | Preparar descripciones de PR y actualizaciones autorizadas con evidencias y evaluación obligatoria del riesgo. |
| `isswf-issue` | Reportar bugs independientes o proponer funcionalidades y mejoras, con destino verificado y `needs-triage` obligatorio. |
| `isswf-triage` | Clasificar issues existentes en briefs nativos: listas para un agente, faltan datos, duplicadas o requieren investigación técnica. |
| `isswf-interview` | Entrevista opcional que hace una pregunta cada vez, con una respuesta recomendada (dos o tres alternativas con sus contrapartidas y una recomendación cuando el hueco está abierto), para cerrar huecos de alcance, intención de producto o aceptación. |
| `isswf-e2e` | Crear, ejecutar o mantener pruebas ejecutables de recorridos críticos de usuario, con Playwright u otro controlador adecuado para la interfaz real. |
| `isswf-debug` | Reproducir defectos, investigar causas y devolver un diagnóstico causal o incertidumbre explícita. |
| `isswf-review` | Revisar un candidato exacto frente a Standards y Spec con evidencias proporcionadas al riesgo. |
| `isswf-retrospective` | Aprender de funcionalidades o errores terminados, o de un cierre explícito de sesión, mediante borradores locales de mejora. |
| `isswf-tdd` | Aplicar un ciclo observado de rojo-verde-refactorización cuando se solicita TDD o se selecciona una prueba de regresión útil. |
| `isswf-security` | Modelar amenazas, evaluar una superficie de seguridad acotada o implementar refuerzos autorizados explícitamente. |
| `isswf-performance` | Diagnosticar lentitud medida, evaluar un presupuesto de rendimiento u optimizar un cuello de botella demostrado. |
| `isswf-observability` | Diseñar, evaluar o implementar logs, métricas, trazas y alertas concretos con límites de privacidad y coste. |

En Pi se invocan con `/skill:`. En Claude Code, con `/isswf:`.

La skill de redacción determina la audiencia a partir de la petición y del contexto del documento. Te pregunta cuando la audiencia no está clara y sigue las convenciones de idioma y documentación del proyecto de destino. Utiliza `/skill:isswf-writing` en Pi o `/isswf:isswf-writing` en Claude Code. No requiere activar el proyecto.

La skill de comprensión elige entre reformular, explicar o aprender con práctica según tu petición. Se adapta a los conocimientos que muestras y pregunta solo cuando una ambigüedad cambiaría la respuesta. Utiliza `/skill:isswf-understanding` en Pi o `/isswf:isswf-understanding` en Claude Code. Sirve para distintos temas y proyectos sin crear cursos ni registros de progreso por defecto.

La skill howto responde a «¿qué recurso de isSWF encaja aquí?» sin gastar una ejecución. Lee el archivo canónico de la skill, el rol o el flujo antes de señalarlo, comprueba el estado activo `.isswf/` o `.factory/` y el registro de configuración solo cuando cambian la respuesta, y termina con un prompt que puedes enviar al coordinador, además de un comando directo `/skill:` o `/isswf:` cuando esa skill documenta el uso directo. Una petición de trabajo se trata como una tarea del coordinador, no la ejecuta la skill. Se distingue de la skill de comprensión, que explica un tema. Utiliza `/skill:isswf-howto` en Pi o `/isswf:isswf-howto` en Claude Code. No autoriza implementación, cambios de configuración ni publicación.

La skill de entrevista es opcional. Primero investiga el código, la documentación y el glosario; después hace una pregunta cada vez, en orden de dependencia, cada una con una respuesta recomendada (o dos o tres alternativas con sus contrapartidas y una recomendación cuando el hueco está abierto) y sin un número fijo de preguntas. Las respuestas se registran en el plan de la iniciativa como confirmadas por el operador, y la planificación y los briefs se preparan a partir de ese registro; si la detienes («basta, decide»), los puntos restantes se registran como supuestos explícitos. El coordinador la propone en una línea para funcionalidades nuevas, cambios de comportamiento visibles para el usuario, conceptos que faltan en el glosario o aceptación no escrita; no hace falta cuando la especificación no tiene huecos, es decir, cuando el agente no tiene que presuponer, inferir ni decidir nada. Utiliza `/skill:isswf-interview` en Pi o `/isswf:isswf-interview` en Claude Code en cualquier momento. No autoriza implementación ni publicación.

La skill de PR funciona directamente o desde Delivery. Inspecciona el candidato, explica el alcance y los límites de verificación, y evalúa el riesgo incluso en cambios solo de documentación. Delivery aporta sus identidades y evidencias y reutiliza la misma evaluación. Utiliza `/skill:isswf-pr` en Pi o `/isswf:isswf-pr` en Claude Code. Redactar no autoriza publicar ni fusionar.

La skill de issues distingue los hallazgos independientes de los errores de la implementación actual. Dirige un reporte saneado al repositorio del proyecto o de la factoría, comprueba duplicados y exige la etiqueta existente `needs-triage` antes de crear la issue. La falta de acceso al destino, permiso de publicación o soporte de la etiqueta deja un borrador o un bloqueo explícito. Utiliza `/skill:isswf-issue` en Pi o `/isswf:isswf-issue` en Claude Code. Crear un reporte no autoriza implementarlo.

La skill E2E inspecciona las herramientas de prueba existentes del proyecto y selecciona unos pocos recorridos de usuario útiles. Admite navegador, CLI, terminal y API; Playwright es opcional, no una dependencia para todos los proyectos. Crea pruebas ejecutables, fixtures, un mapa de recorridos y comandos locales y de CI, en vez de depender de que un agente haga las comprobaciones manualmente. Utiliza `/skill:isswf-e2e` en Pi o `/isswf:isswf-e2e` en Claude Code. Instalar dependencias, utilizar cuentas reales, llamar a proveedores o publicar sigue necesitando su propio permiso. Las pruebas sin ejecutar son cobertura propuesta, no una suite verificada.

Las skills de depuración, revisión, retrospectiva y TDD dan acceso a los procedimientos existentes sin convertirlos en etapas obligatorias. El coordinador y los perfiles correspondientes las seleccionan según la tarea. Usa `/skill:isswf-debug`, `/skill:isswf-review`, `/skill:isswf-retrospective` o `/skill:isswf-tdd` en Pi; Claude Code ofrece los mismos nombres bajo `/isswf:`. La revisión independiente sigue requiriendo un contexto separado y autorizado. Las retrospectivas conservan los trabajos activos y generan borradores, no cambios de política ni permisos de ejecución.

La revisión de código parte del comportamiento aceptado y de las pruebas pertinentes antes de seguir la implementación y sus consumidores. Examina la estructura resultante, prioriza los hallazgos respaldados por evidencias según su impacto y comprueba los cambios de dependencias en su ámbito de instalación. Un experimento puntual de inyección de fallos es opcional y requiere una copia desechable autorizada; nunca modifica el candidato revisado ni proporciona herramientas a un revisor de solo texto. Una carencia de cobertura es distinta de un defecto en el candidato sin modificar.

Los workers instalados reciben las skills fijadas de depuración y TDD como metodología de solo lectura junto con E2E cuando la versión las incluye. Los callers nativos de diagnóstico y revisión incluyen su skill desde el mismo checkpoint de metodología que su perfil; los pins históricos conservan sus recursos originales. Los callers de solo texto no reciben herramientas, skills globales ni integraciones del coordinador. Estos recursos no añaden un dispatcher de retrospectivas ni cambian las garantías de aislamiento del asistente.

Seguridad, rendimiento y observabilidad son procedimientos especializados opcionales, no etapas adicionales para todos los trabajos. Usa `/skill:isswf-security`, `/skill:isswf-performance` o `/skill:isswf-observability` en Pi, o los mismos nombres bajo `/isswf:` en Claude Code. Seguridad parte de los activos, las fronteras de confianza y los abusos plausibles; no autoriza ataques ni certifica cumplimiento normativo. Rendimiento requiere una línea base con resultados correctos y mediciones comparables antes de afirmar una aceleración. Observabilidad parte de preguntas operativas y limita los campos sensibles, la cardinalidad de métricas, la exportación y la retención. No convierte la telemetría en prueba del estado actual de un proceso.

El coordinador y los perfiles correspondientes seleccionan estos recursos según la tarea. El coordinador entrega a cada agente los recursos seleccionados desde el mismo checkpoint que su perfil. Los checkpoints históricos conservan sus recursos originales. Recibir una skill no añade herramientas, acceso a producción ni permiso para llamar a proveedores.

La referencia compartida de diseño también cubre el lenguaje del dominio, las interfaces útiles, la complejidad resultante y los registros de decisiones significativas. Conserva el glosario y el mecanismo de decisiones de cada proyecto; no exige otra skill de arquitectura, un ADR para cada elección ni renombrar campos persistidos.

Las skills ofrecen tareas que se pueden solicitar por separado y tienen un resultado observable. Las referencias de los roles aportan orientación condicional dentro de esas tareas, como los principios de diseño, la calidad de las pruebas o los permisos. Se mantienen como referencias, en vez de convertirse en flujos independientes obligatorios. Si una guía incorpora más adelante una entrada propia, conserva sus reglas detalladas en un único recurso canónico, sin copiarlas a una segunda skill.

## Entrega de funcionalidades por defecto

En un proyecto preparado, una petición real del operador para iniciar o implementar una funcionalidad selecciona el recorrido dirigido por el coordinador: implementación, comprobaciones, revisión necesaria y correcciones, commit y push de la rama de funcionalidad, creación o actualización de la PR, CI requerida sobre su cabeza exacta y entrega de la PR. No necesitas autorizar de nuevo esos mismos pasos cubiertos en cada fase. La petición actual aporta la autorización acotada; la política de configuración, una etiqueta o una prueba que pasa no la conceden por sí solas. Las restricciones de solo preparación, solo lectura, trabajo local y las políticas explícitas del proyecto prevalecen. Otros tipos de encargo usan este recorrido solo cuando se selecciona.

La configuración resuelve las elecciones estables de runtime y modelos, presupuestos de ejecución, espacios de trabajo, comprobaciones y destino antes del trabajo normal. Siguen siendo necesarias las comprobaciones posteriores de disponibilidad e integridad. Una decisión de definición o configuración que solo resuelve una persona queda en `awaiting-human` con una pregunta concreta; una espera técnica se registra como bloqueo técnico, no como aprobación genérica. La PR verificada y entregada también queda en `awaiting-human` para integrarla en `main` o la base seleccionada. No se incluyen merge, auto-merge, push directo a la rama de integración, despliegues ni releases.

El coordinador mantiene esa continuidad mediante las herramientas existentes; que termine un ayudante limitado a preparar material no es motivo para esperar otro mensaje. No se añade un servicio en segundo plano, un planificador automático ni una promesa de recuperación con la sesión cerrada. Consulta [tu primera petición](getting-started.md) y el [contrato para agentes](../../.agents/roles/references/feature-delivery.md).

## Personas y agentes

Tú decides el objetivo de producto y lo que está permitido. El coordinador mantiene el plan y elige apoyo cuando resulta útil:

| Rol | Qué aporta |
| --- | --- |
| Worker | Implementa un cambio acotado y lo comprueba. |
| Researcher | Investiga una cuestión técnica y devuelve evidencias. |
| Planner | Propone unidades de trabajo útiles, cada una con un tamaño S/M/L según lo costoso que sea verificarla, y sus dependencias. |
| Diagnostician | Investiga un error cuya causa no está clara. |
| Reviewer | Evalúa el cambio y sus evidencias de forma independiente cuando hace falta ese juicio. |

Setup configura la composición de agentes además de los modelos y el esfuerzo. Registra los roles habilitados o condicionales, sus condiciones de selección, los ejecutores compatibles y límites de herramientas, los máximos de actores totales y simultáneos, los presupuestos de corrección y revisión y los requisitos de independencia en el registro de configuración existente del proyecto. Las combinaciones incompatibles quedan pendientes en vez de usar otro dispatcher sin avisar. La composición acordada se reutiliza; cada encargo sigue necesitando su autorización concreta.

Son responsabilidades, no una secuencia obligatoria ni una promesa de que todos los entornos puedan ejecutar todos los roles. Un encargo claro puede seguir un camino corto. Si hay más incertidumbre, puede necesitar preguntas o investigación antes de empezar.

## Qué se queda en cada proyecto

Las instalaciones nuevas conservan los registros compartidos del proyecto en `.isswf/`. Describen los planes, los encargos, las decisiones y la versión de la factoría seleccionada. Los registros locales privados se mantienen separados de los archivos que se pretende guardar en Git.

Los proyectos antiguos pueden seguir utilizando `.factory/`. La migración es explícita y conserva los registros existentes; no mantengas ambas carpetas como estados activos.

Cuando están instalados y disponibles, Engram se usa para recuperar y guardar el contexto del proyecto y Codegraph se usa primero para localizar y entender el código. Ninguno es obligatorio, y ninguno es la base de datos de los encargos ni una fuente de permisos.

## Cómo se registra una iniciativa

Una iniciativa es una pieza de trabajo con seguimiento y un ID estable, como `I0042`. El coordinador escribe sus registros como archivos Markdown normales en el directorio de estado del proyecto, de modo que puedes leerlos y Git conserva su historial. Las tareas pequeñas no necesitan planificador ni un paquete fijo de archivos.

```text
<state>/
  templates/
  initiatives/
    I0042/
      plan.md
      jobs/
        J001/
          brief-r1.md
          brief-r2.md
          A001.md
          V001.md
          delivery.md
        J002/
          brief-r1.md
```

| Registro | Qué contiene |
| --- | --- |
| `plan.md` | Un plan vigente por iniciativa, con una sección por trabajo: estado, objetivo, dependencias, aceptación, bloqueo, siguiente paso y evidencias. |
| `jobs/J001/` | Un trabajo, una porción pequeña que entrega algo verificable. Su carpeta contiene los registros de ese trabajo. |
| `brief-r1.md` | El brief elaborado del trabajo: qué hacer, el alcance, la aceptación y las comprobaciones. Cuando cambian los criterios, la nueva revisión es `brief-r2.md` y la anterior se conserva. |
| `A001.md` | Un registro de intento: qué hizo, comprobó y no pudo hacer un worker. Lo escribe el worker. |
| `V001.md` | Un registro de revisión: el veredicto y los hallazgos de una ronda de revisión. Lo escribe el revisor, o el coordinador cuando el revisor no tiene herramienta para escribir archivos. |
| `delivery.md` | Un resumen local del trabajo entregado, para el panel y para ti. No publica nada. |

Las plantillas de `.factory/templates/` (en un proyecto, `<state>/templates/`) definen dos tipos más de registro, que se escriben solo cuando hacen falta: una bandeja de correcciones `C001.md` en la carpeta del trabajo, para una corrección que envías a un coordinador en ejecución, y una retrospectiva en `<state>/retrospectives/`. Un trabajo preparado desde una issue tiene además un `intake.json`. Los estados son `pending`, `in-progress`, `blocked`, `in-review`, `awaiting-human` y `completed`. El coordinador es responsable del plan y de los briefs, el worker de su intento, el revisor de su revisión (el coordinador la deja por escrito cuando el revisor no puede), y tú registras la aceptación en el plan a través del coordinador. Consulta [planes, registros y conservación de evidencias](../durable-work.md#project-records) y la [guía de planificación](../../.agents/roles/references/planning.md), en inglés.

## Abrir issues en otros repositorios

Mientras trabajas en un repositorio puedes encontrar un error, o una idea, que pertenece a otro sitio. La skill `isswf-issue` lo reporta sin ampliar el encargo actual y sin empezar a corregirlo. Primero decide si el hallazgo pertenece a tu producto o a la factoría, con evidencias y no según la carpeta desde la que la ejecutaste, y comprueba el repositorio exacto y tu acceso. Busca duplicados, elimina el material privado y exige la etiqueta `needs-triage` en cada issue nueva. Sin permiso para publicar, te entrega un borrador. Una issue pide una evaluación; no aprueba la implementación. Una posible vulnerabilidad nunca se publica abiertamente. Consulta la [skill](../../.agents/skills/isswf-issue/SKILL.md) y [enrutamiento y publicación](../../.agents/skills/isswf-issue/references/routing-and-publication.md), en inglés.

## El panel de iniciativas

Claude Code tiene un panel de iniciativas opcional, desactivado por defecto, que muestra el trabajo registrado en tarjetas. Lee los archivos de tu proyecto y no inicia agentes; su interruptor opcional AutoWakeUp, desactivado por defecto, puede programar un prompt que pide al coordinador conciliar el estado. Pronto habrá un panel similar para Pi. Actívalo con **Initiatives pane** del plugin `isswf` en `/config`. Se abre cuando se carga la skill del coordinador, y `/isswf-initiatives` lo vuelve a abrir. Tiene tres pestañas:

- **Initiatives.** Una tarjeta por iniciativa con sus trabajos y rondas de revisión. El borde de un registro muestra su resultado: verde para una revisión superada o un intento completo, amarillo para cambios solicitados o trabajo parcial, rojo para fallido, bloqueado o cancelado, y gris cuando no indica ninguno.
- **Files.** El plan, los briefs y los registros de la iniciativa como árbol, cada uno legible como Markdown.
- **Agents.** El coordinador y una fila por rol delegado, con el número de ejecuciones y qué skills y referencias usaron.

Una fila bajo el título indica si Engram y Codegraph están disponibles en la sesión. El panel muestra trabajo registrado, no una prueba en directo de cada proceso. Todo lo que hace se describe en el [panel de iniciativas](installation.md#panel-de-iniciativas). Un panel local distinto en el navegador (`tools/isswf-panel.mjs`) muestra los mismos planes como un tablero Kanban; consulta [consultar el trabajo](operations.md).

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
- [Planes, registros y conservación de evidencias](../durable-work.md).
- [Selección de revisión](../../.agents/roles/references/review.md).
