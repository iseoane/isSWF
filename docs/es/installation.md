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

Pide configurar este proyecto. La configuración detecta la raíz del repositorio, los ajustes existentes y el runtime seleccionado antes de preguntar. Distingue entre configuración inicial, configuración existente, actualización disponible u operación interrumpida; no necesitas facilitar rutas ni hashes de commits que pueda resolver localmente. La migración y la recuperación siguen necesitando una petición explícita. Ante una petición explícita de configuración, también crea o reconcilia una sección pequeña y delimitada de isSWF en el `AGENTS.md` de la raíz del repositorio, conservando el contenido ajeno. La sección remite las peticiones explícitas al coordinador/coordinadora o a los flujos de isSWF al coordinador canónico y a la guía del host real; no convierte otras tareas en un flujo obligatorio ni concede acciones. Utiliza como referencia el único registro de configuración del proyecto seleccionado. El contenido conflictivo o inseguro se comunica para resolverlo manualmente, no se sobrescribe. Pi y Claude Code comparten esta entrada en `AGENTS.md`; no hace falta otro puente `CLAUDE.md`.

Elige seguimiento local o con GitHub si aún no hay una decisión registrada. La configuración también muestra los modelos y esfuerzos compatibles del asistente actual por rol, junto con las elecciones existentes o los valores predeterminados de la factoría. Elige los ajustes propuestos o pide cambios por rol. Un modelo que aparece en el asistente puede no ser compatible con un ejecutor concreto de isSWF; la configuración explica esa restricción en vez de sustituirlo en silencio. Las elecciones de Pi utilizan `.pi/settings.json` local del proyecto, no el archivo de modelos del ejecutor heredado; las opciones nativas de Claude utilizan la configuración nativa compatible y se guardan por separado en el registro de configuración. Si el runtime seleccionado no permite descubrir o guardar las opciones, la selección de modelos queda explícitamente pendiente. Seleccionar modelos no llama a ningún proveedor ni autoriza costes. Seleccionar GitHub no concede permiso para publicar, hacer push ni fusionar cambios.

Los recursos instalados incluyen un [preset portable de configuración](../../.agents/skills/isswf-setup/SKILL.md#confirm-portable-factory-defaults), en inglés, para Linux y Windows. Antes de cambiar la configuración, setup pregunta si quieres aceptarlo, conservar las elecciones existentes o personalizar los roles. Propone Opus/Sonnet/Haiku para Claude Code y GPT-6.1 Sol/GPT-6 Luna para Pi, con esfuerzo por rol. Por defecto permite hasta dos rondas de revisión por unidad funcional; no exige dos revisiones ni concede actores ilimitados. Los modelos o esfuerzos no compatibles quedan pendientes, nunca se sustituyen en silencio. La instalación por sí sola no cambia los valores del host ni llama a un modelo.

La configuración resuelve los límites estables de ejecución y correcciones, el runtime y aislamiento compatibles, las comprobaciones y la política de entrega antes del trabajo normal en funcionalidades. Para entregar mediante GitHub registra el repositorio y remoto, la base de integración y la política de ramas de funcionalidad. Una petición posterior real para iniciar una funcionalidad selecciona el recorrido cubierto de commit, push, PR y CI, no merge ni release; el registro de configuración por sí solo no autoriza esas acciones. Si faltan decisiones o evidencias de capacidad necesarias, la configuración queda parcial. Los valores iniciales no prueban que esté preparada, y las comprobaciones previas posteriores siguen verificando las condiciones que pueden cambiar. Las elecciones ya resueltas se reutilizan sin otra entrevista de configuración por funcionalidad.

La configuración también ofrece una carpeta externa para los worktrees de Git cuando aún no hay una elección local. Acepta la estructura hermana `../<repo>-worktrees/<feature>` o elige otra carpeta externa. Setup obtiene la raíz absoluta a partir del repositorio principal con rutas nativas en Linux y Windows. La elección utiliza la configuración local de Git del repositorio (`isswf.worktreeRoot`), por lo que tu ruta personal no se incluye en commits ni se comparte con GitHub. Se conservan las elecciones existentes salvo que pidas sustituirlas de forma explícita. El coordinador utiliza esa ubicación para los futuros worktrees autorizados; los existentes no se trasladan automáticamente. Las copias de tareas nativas de Pi mantienen su estructura en el almacén de ejecuciones. Es un procedimiento para el agente, no un hook automático del asistente. Durante la configuración de Claude Code, registra si se ha verificado que su interfaz nativa puede vincular workers paralelos al checkout preparado y aprobado; elegir una carpeta externa o usar worktrees del host no lo demuestra. Si la vinculación no está disponible o verificada, el trabajo secuencial puede utilizar el checkout asignado, pero una petición que exija paralelismo queda bloqueada, no se convierte en secuencial sin avisar. No instales ni configures hooks ni cambies la carpeta aprobada para afirmar que existe soporte.

La configuración crea `.isswf/` y registra la versión de la factoría elegida para el proyecto. Las nuevas referencias Bun identifican el código y la versión del motor compartidos, mientras cada máquina conserva y verifica su artefacto de plataforma. La referencia no incluye un hash de binario nativo que los colaboradores deban cambiar al usar otra plataforma. Conserva los ajustes de modelos y las decisiones de configuración existentes salvo que apruebes cambios de forma explícita. La autenticación y los permisos de ejecución deberán seguir siendo válidos para el trabajo que solicites después.

Si el repositorio ya utiliza `.factory/`, pide inspeccionar y migrar ese estado existente. No crees una segunda carpeta de la factoría a su lado.

## Evidencia Git vinculada para revisiones de Pi

El revisor nativo de Pi dispone de `isswf_git_identity`, `isswf_git_diff` e `isswf_git_content`. Inicia un revisor nuevo con `options.extensionBindings` explícitos, vinculados al repositorio canónico y a los identificadores completos de los commits base y candidato. El espacio de nombres de contenido `isswf.git-evidence.content/1` fija además una lista permitida de 1–64 rutas relativas únicas (máximo 1.024 bytes UTF-8 por ruta y 8.192 bytes en total). El modelo solo puede elegir una ruta autorizada y el espacio `base` o `candidate`; no puede elegir repositorio, revisión, ejecutable, comando, entorno ni límites. El contenido procede únicamente de árboles confirmados: devuelve los bytes exactos de blobs regulares en base64, con longitud y SHA-256; distingue `absent` de un blob vacío y rechaza enlaces simbólicos, submódulos y otros tipos. El límite bruto de contenido es 65.536 bytes, la respuesta completa de la CLI 96 KiB y el resultado nativo 192 KiB. El invocador verifica el base64 canónico, la longitud y el resumen, y proporciona una vista UTF-8 decodificada en modo estricto cuando es válida (conservando BOM y finales de línea); en otro caso deja explícitamente solo el base64. El espacio de nombres del diff permite como máximo 192.000 bytes de parche y una respuesta independiente de 256 KiB; su resultado nativo completo tiene un límite de 512 KiB. Las vinculaciones ausentes o malformadas se rechazan. El revisor debe invocar la herramienta pertinente y utilizar la evidencia exacta devuelta; los cálculos de integridad del invocador no se atribuyen al revisor. La CLI pública exige el JSON completo de vinculación y el fin de stdin en 2 segundos, con un máximo de 16.384 bytes. Las sesiones de Pi reanudadas no aceptan vinculaciones nuevas; inicia un proceso hijo nuevo. Consulta la [guía del host Pi](../../.agents/hosts/pi.md#bound-identity-committed-diff-and-file-content-for-pi-reviewers) para ver el formato de lanzamiento.

Usa estas herramientas solo en un repositorio aprobado por el coordinador, con el autor detenido y sin escritores no fiables que lo modifiquen. Deshabilitan el diff externo y la conversión de texto, y obtienen los atributos Git del commit candidato vinculado en vez de los atributos modificados del árbol de trabajo. Es un límite operativo de solo lectura, no un aislamiento impuesto por el sistema operativo: no garantiza protección frente a cambios concurrentes del sistema de archivos ni límites estrictos para llamadas bloqueantes al sistema. Un repositorio hostil o modificable de forma concurrente necesita una entrada protegida y verificada por separado; superar estas pruebas no demuestra aislamiento. La [guía del host Pi](../../.agents/hosts/pi.md#bound-identity-committed-diff-and-file-content-for-pi-reviewers) recoge este límite.

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
