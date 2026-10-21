# Tu primera petición

[Inicio](../../README.es.md) · [English](../en/getting-started.md)

Empieza por un cambio pequeño en un repositorio que conozcas. No necesitas nombrar a todos los agentes ni diseñar tú todo el proceso.

## 1. Configura el proyecto

Completa la [instalación](installation.md), abre el repositorio de destino e invoca:

```text
/skill:isswf-setup
```

En Claude Code, utiliza `/isswf:isswf-setup`. Explica que quieres inicializar este repositorio. La configuración registra las decisiones del proyecto; no inicia la implementación.

## 2. Plantea un objetivo al coordinador

Para una primera prueba, pídele preparar el trabajo sin editar código:

```text
/skill:isswf-coordinator Prepara una corrección para el filtro de búsqueda, que se reinicia al cambiar de página. Mantén el resto de su comportamiento. Muéstrame el alcance y las comprobaciones propuestas antes de cambiar código.
```

En Claude Code, sustituye el prefijo por `/isswf:isswf-coordinator` y conserva la petición.

Una respuesta útil debe explicar:

- Qué ha entendido el coordinador del problema.
- Qué va a cambiar y qué dejará como está.
- Qué decisión de producto necesita de ti, si falta alguna.
- Cómo se comprobará el resultado y cuál es el siguiente paso.

Debe investigar las incógnitas técnicas dentro de sus permisos, en lugar de pedirte que expliques código que puede leer.

## 3. Autoriza el trabajo que necesitas

Revisa el alcance propuesto y sus límites antes de aprobar la ejecución. Indica si se permiten commits, acciones en GitHub o llamadas adicionales a modelos; no des por hecho que preparar un plan las autoriza.

Por ejemplo, puedes autorizar una implementación local acotada y sus pruebas, sin incluir la publicación ni la fusión de cambios. Si el permiso vigente ya cubre un paso, el coordinador no debería pedirte que lo confirmes una y otra vez.

## 4. Consulta el progreso

Pregunta al coordinador:

> ¿Qué se ha comprobado, qué está bloqueado y qué necesita una decisión mía?

La respuesta debe distinguir el progreso registrado de aquello que no pueda confirmar en ese momento. El panel local también puede mostrar planes, entregas y decisiones pendientes; hay que arrancarlo de forma explícita y no es una vista en directo de todos los agentes.

## 5. Revisa el resultado

Debes recibir un resumen del cambio, las comprobaciones realizadas, los límites que queden y la decisión que se te pide. Que una prueba pase o un proceso termine no equivale a tu aceptación.

Si falta algo, pide un cambio concreto. Si cumple el objetivo acordado, indica que lo aceptas. Publicar o fusionar cambios sigue necesitando el permiso correspondiente.

## Otras peticiones que puedes probar

### Un cambio pequeño y claro

> Prepara un cambio en el mensaje que aparece cuando no hay resultados. Mantén el diseño y el comportamiento. Muéstrame la pantalla afectada y cómo lo comprobarías.

Una tarea pequeña no debería exigir automáticamente una entrevista larga ni un agente de planificación.

### Una funcionalidad que necesita decisiones

> Quiero un visor de Markdown. Ayúdame a decidir qué archivos podrá abrir, qué formato debe admitir y qué hacer con el contenido inseguro antes de proponer el trabajo.

Aquí el coordinador debe aclarar las decisiones de producto e investigar las opciones técnicas cuando haga falta.

### Un error con una causa poco clara

> Investiga por qué al guardar a veces se pierde la última edición. Busca una señal reproducible antes de proponer una corrección y dime si no consigues reproducirlo.

El diagnóstico puede ir por separado cuando la incertidumbre lo justifique. Los errores sencillos pueden quedarse con el worker que los corrige.

La investigación, la planificación, TDD y las revisiones más profundas se eligen según la tarea. No son fases obligatorias para todas las peticiones. Consulta [cómo funciona la factoría](reference.md).
