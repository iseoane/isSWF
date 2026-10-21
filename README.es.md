# isSWF

[English](README.md) | Español de España

Una factoría de software personal para convertir ideas, errores e issues en cambios pequeños y comprobados con agentes de IA.

## Descripción

isSWF proporciona a tu asistente de programación una forma de organizar el trabajo. Un coordinador te ayuda a concretar qué necesitas, elige el apoyo adecuado y lleva el seguimiento del resultado.

Tú mantienes el control de las decisiones y los permisos. La factoría conserva los planes, los encargos y las evidencias de cada proyecto para que puedas ver qué ha cambiado, qué se ha comprobado y qué necesita tu atención.

## ¿Por qué este proyecto?

Trabajar con agentes puede acabar en cambios grandes sin terminar, explicaciones repetidas y dudas sobre si algo funciona de verdad.

isSWF busca que ese trabajo sea más fácil de seguir:

- Dividir una petición en cambios útiles que puedas revisar.
- Preguntar cuando falta una decisión, no a cada paso.
- Elegir investigación, planificación, pruebas y revisión según la tarea.
- Conservar las decisiones y el progreso del proyecto entre conversaciones.

Es una forma de trabajar que utilizas cuando la necesitas, no un servicio que gestione tus repositorios sin supervisión.

## ¿A quién está dirigido?

- Desarrolladores que ya utilizan Pi y quieren organizar mejor el trabajo en un proyecto Git existente.
- Responsables de proyectos que quieren entender un cambio y sus comprobaciones antes de aceptarlo.
- Personas que están explorando el desarrollo con agentes y quieren controlar qué pueden hacer.

Pi es el entorno de ejecución de referencia. También se incluye un plugin para Claude Code, con capacidades distintas de ejecución y recuperación.

## Instalación

Por ahora, utiliza una **carpeta de versión local preparada**. Estas instrucciones no dan por hecho que haya un paquete publicado en npm o en un marketplace público. Consulta la [instalación](docs/es/installation.md) si necesitas preparar esa carpeta.

### Pi

```bash
pi install /path/to/isswf-release
```

Así el paquete estará disponible de forma global. Añade `--local` para instalarlo solo en el proyecto actual.

### Claude Code

```bash
claude plugin marketplace add /path/to/isswf-release
claude plugin install isswf@isswf --scope user
```

Utiliza `--scope project` para una instalación por proyecto. La [guía de instalación](docs/es/installation.md) explica las diferencias entre los dos entornos.

### Dependencias

Necesitas Node.js 24 o posterior, Git y el asistente que elijas. Para ejecutar encargos con agentes también hace falta una cuenta de modelos compatible y con la autenticación configurada.

El flujo instalado completo requiere actualmente Linux. Los workers aislados de Pi necesitan además bubblewrap. Python y SQLite no son requisitos del flujo nativo; Engram y Codegraph son opcionales.

Instalar el paquete no arranca agentes ni crea el estado de la factoría en todos tus repositorios. Cada proyecto se inicializa de forma explícita.

## Primeros pasos

Abre tu proyecto en Pi e inicialízalo:

```text
/skill:isswf-setup
```

Después prueba una petición solo de preparación:

```text
/skill:isswf-coordinator Prepara una corrección para el filtro de búsqueda, que se reinicia al cambiar de página. Mantén el resto de su comportamiento. Muéstrame el alcance y las comprobaciones propuestas antes de cambiar código.
```

El coordinador debe explicar el siguiente paso, preguntar por las decisiones de producto que falten e indicar cómo se comprobará el resultado. Cuando la implementación esté autorizada, podrá utilizar los agentes adecuados y devolverte un resumen para que lo aceptes.

En Claude Code, utiliza `/isswf:isswf-setup` e `/isswf:isswf-coordinator`.

La [guía de primeros pasos](docs/es/getting-started.md) incluye ejemplos para corregir errores, añadir funcionalidades y consultar el progreso.

## Detalles

[Toda la documentación vigente](docs/es/index.md), incluido el mapa del código, el panel local y las posibles acciones futuras.


- [Instalación y actualizaciones](docs/es/installation.md): elige un entorno, inicializa un proyecto y actualízalo de forma explícita.
- [Primeros pasos](docs/es/getting-started.md): plantea tu primera petición y entiende la respuesta.
- [Cómo funciona la factoría](docs/es/reference.md): skills, agentes, registros del proyecto y límites actuales.
- [Desarrollo](docs/es/development.md): orientarte por el código y ejecutar las comprobaciones.

## Colaborar

Empieza por un problema concreto o una mejora pequeña. Explica el resultado esperado y cómo lo has comprobado. Lee la [guía de desarrollo](docs/es/development.md) antes de cambiar el comportamiento de la factoría.

## Licencia

Este proyecto se distribuye bajo la licencia MIT.
