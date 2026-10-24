# Instalar y actualizar isSWF

[Inicio](../../README.es.md) · [English](../en/installation.md)

Instala isSWF una vez e inicializa cada repositorio donde quieras utilizarlo. Una instalación global comparte las herramientas de la factoría, no los registros de los proyectos.

## Antes de empezar

Necesitas:

- Git y una release ejecutable de confianza para tu sistema operativo y arquitectura. El núcleo de la factoría no necesita instalar Node.js ni Bun; Pi, Claude, los SDK y las comprobaciones del proyecto mantienen sus propios requisitos.
- Un proyecto Git existente.
- Pi o Claude Code ya instalado.
- Una cuenta de modelos compatible y autenticada antes de ejecutar encargos con agentes.
- Linux para el flujo instalado completo actual. Los workers aislados de Pi necesitan además bubblewrap.

Engram y Codegraph son opcionales. Los prototipos históricos de Python y SQLite no son necesarios.

## Conseguir una carpeta de versión preparada

El paquete completo se distribuye actualmente de forma local. Esta guía no anuncia una versión publicada en npm ni un marketplace público del plugin.

Utiliza una carpeta de versión de confianza facilitada por quien mantiene el proyecto o sigue los pasos para [preparar una versión local](development.md#preparar-una-versión-local). Clonar el repositorio no prepara por sí solo el paquete instalado completo.

El paquete incluye `bin/isswf`, o `bin/isswf.exe` en Windows, y los recursos de ambos hosts. Los archivos fuente se conservan para procedencia y snapshots de tareas. Se ha verificado Linux x64 nativo; el flujo instalado completo de mutaciones y workers sigue necesitando Linux. Construir otros destinos no demuestra compatibilidad equivalente.

Sustituye `/path/to/isswf-release` en los comandos siguientes por la ruta absoluta de esa carpeta.

## Instalar en Pi

Para instalarlo de forma global para tu usuario:

```bash
pi install /path/to/isswf-release
```

O, desde el repositorio de destino, instálalo solo para ese proyecto:

```bash
pi install /path/to/isswf-release --local
```

Elige un ámbito. Revisa la configuración del proyecto antes de concederle confianza en Pi. Reinicia Pi o recarga sus recursos tras la instalación.

## Instalar en Claude Code

Añade el marketplace local e instala el plugin para tu usuario:

```bash
claude plugin marketplace add /path/to/isswf-release
claude plugin install isswf@isswf --scope user
```

Para instalarlo en el ámbito del proyecto, utiliza este comando en su lugar:

```bash
claude plugin install isswf@isswf --scope project
```

Reinicia o recarga Claude Code tras la instalación. La configuración del proyecto no instala el plugin en el equipo de cada colaborador.

El plugin utiliza la delegación propia de Claude. No ofrece las mismas funciones de ejecución y recuperación que Pi. Consulta la [compatibilidad actual](reference.md#compatibilidad-actual) antes de utilizarlo para trabajo importante. Aquí se documentan los comandos; no se ha ejecutado Claude para verificar este cambio de documentación.

## Inicializar un proyecto

Abre el repositorio de destino e invoca la skill de configuración:

| Entorno | Comando |
| --- | --- |
| Pi | `/skill:isswf-setup` |
| Claude Code | `/isswf:isswf-setup` |

Pide configurar este proyecto. La configuración detecta la raíz del repositorio, los ajustes existentes y el runtime seleccionado antes de preguntar. Distingue entre configuración inicial, configuración existente, actualización disponible u operación interrumpida; no necesitas facilitar rutas ni hashes de commits que pueda resolver localmente. La migración y la recuperación siguen necesitando una petición explícita.

Elige seguimiento local o con GitHub si aún no hay una decisión registrada. La configuración también muestra los modelos y esfuerzos compatibles del asistente actual por rol, junto con las elecciones existentes o los valores predeterminados de la factoría. Elige los ajustes propuestos o pide cambios por rol. Un modelo que aparece en el asistente puede no ser compatible con un ejecutor concreto de isSWF; la configuración explica esa restricción en vez de sustituirlo en silencio. Las elecciones de Pi utilizan la configuración de modelos del proyecto; las opciones nativas de Claude se guardan por separado en el registro de configuración. Si el runtime seleccionado no permite descubrir o guardar las opciones, la selección de modelos queda explícitamente pendiente. Seleccionar modelos no llama a ningún proveedor ni autoriza costes. Seleccionar GitHub no concede permiso para publicar, hacer push ni fusionar cambios.

La configuración resuelve los límites estables de ejecución y correcciones, el runtime y aislamiento compatibles, las comprobaciones y la política de entrega antes del trabajo normal en funcionalidades. Para entregar mediante GitHub registra el repositorio y remoto, la base de integración y la política de ramas de funcionalidad. Una petición posterior real para iniciar una funcionalidad selecciona el recorrido cubierto de commit, push, PR y CI, no merge ni release; el registro de configuración por sí solo no autoriza esas acciones. Si faltan decisiones o evidencias de capacidad necesarias, la configuración queda parcial. Los valores iniciales no prueban que esté preparada, y las comprobaciones previas posteriores siguen verificando las condiciones que pueden cambiar. Las elecciones ya resueltas se reutilizan sin otra entrevista de configuración por funcionalidad.

La configuración también ofrece una carpeta externa para los worktrees de Git cuando aún no hay una elección local. Acepta la ubicación propuesta para cada repositorio dentro de tu carpeta de datos locales o elige otra carpeta externa. La elección utiliza la configuración local de Git del repositorio (`isswf.worktreeRoot`), por lo que tu ruta personal no se incluye en commits ni se comparte con GitHub. Se conservan las elecciones existentes. El coordinador utiliza esa ubicación para los futuros worktrees autorizados; los existentes no se trasladan automáticamente. Las copias de tareas nativas de Pi mantienen su estructura en el almacén de ejecuciones. Es un procedimiento para el agente, no un hook automático del asistente; si este no puede utilizar el checkout preparado, esa delegación queda bloqueada.

La configuración crea `.isswf/` y registra la versión de la factoría elegida para el proyecto. Las nuevas referencias Bun identifican el código y la versión del motor compartidos, mientras cada máquina conserva y verifica su artefacto de plataforma. La referencia no incluye un hash de binario nativo que los colaboradores deban cambiar al usar otra plataforma. Conserva los ajustes de modelos y las decisiones de configuración existentes salvo que apruebes cambios de forma explícita. La autenticación y los permisos de ejecución deberán seguir siendo válidos para el trabajo que solicites después.

Si el repositorio ya utiliza `.factory/`, pide inspeccionar y migrar ese estado existente. No crees una segunda carpeta de la factoría a su lado.

## Actualizar sin cambiar todos los repositorios

Primero actualiza el paquete o el plugin mediante el gestor de tu asistente. Para versiones locales, sustituye el registro anterior por la nueva carpeta de versión preparada. Una versión fijada no cambia hasta que selecciones otra.

Después pide a la skill de configuración:

> Comprueba qué cambiaría si actualizase este proyecto. No lo apliques todavía.

Actualizar el paquete instalado no actualiza los registros de todos los proyectos. Cada proyecto mantiene su versión elegida hasta que lo migres de forma explícita.

Antes de migrar, guarda los archivos afectados en Git y termina o reconcilia el trabajo en ejecución. La migración comprueba el cambio propuesto, conserva la versión anterior y registra cómo recuperarse. No borres versiones conservadas ni registros de operaciones interrumpidas para forzar una actualización.

La [guía técnica de instalación](../installation.md), en inglés, incluye los comandos exactos, la vuelta a una versión anterior y la recuperación.

## Retirar la integración

Utiliza `pi remove` o el gestor de plugins de Claude Code. Retirar la integración no elimina la carpeta `.isswf/` del proyecto, los registros de migración ni las versiones conservadas de la factoría.

Continúa con [tu primera petición](getting-started.md).
