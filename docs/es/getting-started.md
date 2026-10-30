# Tu primera petición

[Inicio](../../README.es.md) · [English](../en/getting-started.md)

Empieza con un cambio pequeño en un repositorio que conozcas. No necesitas nombrar a cada agente ni diseñar todo el procedimiento.

## 1. Configura el proyecto

Completa la [instalación](installation.md), abre el repositorio de destino e invoca:

```text
/skill:isswf-setup
```

En Claude Code, utiliza `/isswf:isswf-setup`. La configuración resuelve el runtime, los modelos y esfuerzos, los límites de ejecución, la política de espacios de trabajo, las comprobaciones y el destino de entrega antes del trabajo normal en funcionalidades. Para entregar mediante GitHub registra el repositorio, la base y la política de ramas de funcionalidad. Ante esta petición explícita de configuración, también prepara la entrada acotada del coordinador en el `AGENTS.md` raíz. Una vez preparada, dirige explícitamente la petición al coordinador/coordinadora o solicita un flujo de isSWF para activar el coordinador canónico y la guía del host real; las peticiones ajenas no activan un flujo obligatorio. Si faltan decisiones o evidencias de capacidad necesarias, la configuración queda parcial, no se da por preparada. Los registros de configuración por sí solos no inician trabajo ni autorizan acciones futuras.

## 2. Inicia una funcionalidad con el coordinador

Por ejemplo:

```text
/skill:isswf-coordinator Implementa un botón para borrar el filtro que restaure la lista sin filtrar existente. Conserva el comportamiento actual de la paginación.
```

En Claude Code, sustituye el prefijo por `/isswf:isswf-coordinator` y conserva la petición.

En un proyecto preparado, iniciar esa funcionalidad selecciona el recorrido acotado por defecto: definir el resultado, implementar, probar, obtener la revisión necesaria, corregir hallazgos, hacer commit en la rama de funcionalidad, subir esa rama, abrir o actualizar su PR, verificar la CI requerida y entregar la PR. No necesitas añadir esas operaciones a cada petición. El coordinador registra la autorización actual, el destino y los presupuestos finitos; iniciar la funcionalidad no autoriza integrarla en `main`, activar auto-merge, desplegar ni publicar una release.

Si falta una decisión que solo tú puedes tomar, el trabajo afectado queda en `awaiting-human` con la pregunta concreta y la respuesta necesaria para continuar. Puede ocurrir durante la definición, antes de que exista una implementación o entrega. Investigar los hechos técnicos accesibles es tarea del coordinador, no un cuestionario inicial para ti.

## 3. Indica cualquier límite más estrecho

Puedes modificar el recorrido por defecto, por ejemplo:

> Prepara el alcance y las comprobaciones de esta funcionalidad. No edites código todavía.

O bien:

> Implementa y prueba esta funcionalidad en local. No hagas commit, push ni crees una PR.

Conversar, diagnosticar, preparar planes y redactar una PR no equivale a iniciar una funcionalidad. Un bug u otro encargo utiliza el mismo recorrido hasta PR solo cuando lo seleccionas. Las restricciones existentes del proyecto y un modo explícitamente local siguen vigentes; elegir GitHub por sí solo nunca autoriza publicar. El coordinador no debe volver a preguntarte por pasos ya cubiertos por tu petición actual.

## 4. Sigue el progreso sin dirigir cada fase

El coordinador recoge los resultados de los workers y las revisiones y continúa con las acciones cubiertas sin esperar a tu siguiente mensaje. Cuando te interese, pregunta:

> ¿Qué se ha comprobado, qué está bloqueado técnicamente y qué decisión me corresponde?

Una incidencia posterior, una comprobación fallida, la capacidad de ejecución ocupada o un estado de proceso desconocido pueden detener un paso afectado. El coordinador registra el motivo técnico real y avanza en trabajo independiente cuando es posible. Te pregunta solo por una decisión concreta o una acción no cubierta, no por un permiso genérico para continuar. Que caduque una credencial no demuestra que haya que repetir toda la configuración inicial.

El panel local muestra planes, evidencias y decisiones registrados. No es telemetría de procesos en vivo, un planificador automático ni un modo de autorizar trabajo mediante una nota.

## 5. Decide qué hacer con la PR entregada

Debes recibir la URL real de la PR y sus referencias de cabeza y base, las comprobaciones y revisiones observadas, el riesgo, los límites y la siguiente decisión. Que exista una PR publicada no demuestra que haya pasado la CI requerida. Tras entregar la PR verificada, integrarla en `main` queda en `awaiting-human`; iniciar la funcionalidad no aprueba merge, auto-merge ni push directo a la rama de integración.

Pide una corrección concreta si falta algo. La aceptación del producto y el permiso para integrarlo siguen siendo decisiones distintas. El coordinador conduce el procedimiento mientras su sesión y sus herramientas estén disponibles; las interrupciones se reconcilian mediante los mecanismos existentes, sin prometer un servicio de recuperación en segundo plano.

## Otras peticiones que puedes probar

### Una funcionalidad que necesita decisiones

> Quiero un visor de Markdown. Ayúdame a decidir qué archivos puede abrir y qué hacer con el contenido inseguro antes de proponer el trabajo.

Es trabajo de definición. Las decisiones de producto sin resolver te corresponden; las opciones técnicas deben investigarse dentro del alcance. La petición no publica una PR por sí sola.

### Un bug cuya causa no está clara

> Investiga por qué al guardar a veces se pierde la última edición. Busca una señal reproducible antes de proponer una solución y avisa si no puedes reproducirlo.

El diagnóstico puede separarse cuando la incertidumbre lo justifica. Los bugs sencillos pueden quedarse con el worker. La investigación, la planificación, TDD, E2E y las revisiones más profundas se eligen según la tarea, no son fases obligatorias. Consulta [cómo funciona la factoría](reference.md).
