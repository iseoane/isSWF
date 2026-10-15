# Siguiente corte operativo: activación fijada y aislamiento mínimo

**Estado de este documento: propuesta histórica de diseño, no evidencia actual ni autorización de implementación.** Se redactó antes de los probes #64/#65 y de la prueba real del source #44. La unidad de instalación compartida/activación local se verificó después; véanse la [guía de activación](activacion-por-proyecto.md), el [cierre de #44](../.audit/activation-44-closure.md), el [proof del source comprometido](../.audit/activation-44-committed-proof.json) y el [cierre final de #65](../.audit/boundary-65-final-closure.md). Los resultados posteriores no convierten estas opciones históricas en decisiones implementadas ni cierran el runtime, aislamiento exhaustivo o readiness de cliente.

Corte candidato posterior a #62. La activación por proyecto y el runtime de workers son capacidades distintas: descubrir/cargar una factory no prueba que pueda ejecutar workers seguros.

## Resultado propuesto

Proponer cómo activar explícitamente, por proyecto, una versión fija de una instalación compartida de la factory, sin copiar toda la factory al proyecto ni sobrescribir su `AGENTS.md`; y definir un perfil de ejecución que permita a un worker escribir únicamente en su proyecto/candidato autorizado mientras niega accesos fuera del alcance. La aceptación de producto de esa dirección no aprueba un mecanismo de instalación.

Una activación satisfactoria no equivale a un worker disponible, y el trust de un paquete no es un sandbox. Un grant de texto, la obediencia del modelo o una allowlist de herramientas del modelo, por sí solos, no son una frontera técnica; una política de sistema efectivamente impuesta puede serlo, pero debe comprobarse en el entorno y actor previstos.

## Evidencia disponible y límites

- #61 es una demo supervisada con perfiles Markdown y transporte Pstack; declara expresamente que no probó sandbox ni aislamiento de clientes. #62 probó una skill de setup y preservación de elecciones; no instalador, runtime ni aislamiento hermético.
- La dirección de producto acordada en `docs/arranque-por-proyecto.md` es una instalación compartida de versión fija y activación explícita por proyecto. No implica copiar toda la factory a cada proyecto ni sobrescribir `AGENTS.md`. La prueba de paquete acredita carga de recursos Pi en dos proyectos, no protección de la fuente compartida contra escrituras ni un instalador.
- `docs/research/pi-isolation.md` compara un control con perfiles Bubblewrap. En el fixture Linux probado, el worker modificó `/work`, el reviewer no pudo escribirlo, y se negaron rutas privadas, enlaces escapados y red de prueba. No es prueba portable ni sandbox de producción; no valida mounts de clientes, procesos hostiles al kernel, límites generales de recursos, ni integración Pi+workers+modelo.
- `docs/research/pi-runtime.md` confirma que la allowlist de herramientas del modelo no bloquea `bash` del canal RPC del cliente. `docs/research/pi-lifecycle.md` favorece provisionalmente un dueño externo con Pi RPC, pero no demuestra recuperación ni aislamiento entre clientes.
- `systemd-run` aparece disponible, pero no fue ejecutado en el probe; cgroups solos no sustituyen restricciones de archivos. No hay evidencia suficiente para declararlo alternativa de aislamiento equivalente.
- `.factory/models.json` es la configuración canónica existente de rutas de modelo, con interpretación/preflight manual. No se ha aprobado `isswf.config.json` ni un almacén de estado. No se requiere SQLite, Python ni instalador concreto para este corte.

## Opciones mínimas a comparar en un probe acotado

1. **Bubblewrap con mounts explícitos y dueño externo.** Reutiliza el mecanismo ensayado: runtime readonly, proyecto desechable writable solo para el worker y recursos privados fuera del namespace. El probe debe determinar si sirve para el actor y filesystem reales previstos, cómo fijar el runtime y cómo gestionar red/autoridad sin exponer secretos. Es evidencia Linux del fixture, no soporte universal.
2. **`systemd-run`/sandbox de sistema existente con un dueño externo.** Es una alternativa de plataforma que consta como disponible localmente, pero no está probada aquí. Debe demostrar por separado escritura autorizada, denegaciones de archivos/rutas y efectos; cgroup o ciclo de vida por sí solos no cuentan como aislamiento. Si esos controles no están disponibles o no se verifican en el entorno objetivo, esta opción bloquea ese cliente.

No elegir de antemano un sandbox universal, un framework nuevo ni una combinación de características no probada. El probe compara solo lo necesario para decidir si existe un perfil mínimo utilizable; anota soporte desconocido y bloquea clientes donde no pueda probarse.

## Criterios de aceptación del diseño/probe

- Fijar por separado fuente/revisión de factory y proyecto destino; registrar ambas identidades. La versión activa anterior permanece estable y una actualización/candidata no cambia las instrucciones de intentos ya activos.
- Activar únicamente en un fixture desechable. Preservar `AGENTS.md`, settings y configuración preexistentes byte por byte; no tocar configuración global ni credenciales.
- Precondición de este corte: un propietario externo suministra un fixture desechable y garantiza un único actor escritor para ese proyecto/espacio de trabajo. Este corte no demuestra que el sistema deniegue técnicamente un segundo writer, ni diseña o implementa ciclo de vida/coordinación. La fuente/revisión de fábrica es readonly para el actor ensayado.
- Con el mismo actor, perfil y ejecución real, demostrar una escritura autorizada en el destino y denegaciones efectivas fuera del destino: secretos/archivos del cliente, symlinks y rutas absolutas, rutas de salida, comandos/herramientas no autorizados, subprocesses que intenten escapar, red y canal MCP/autoridad.
- Las denegaciones ensayadas deben proceder de controles técnicos efectivamente impuestos por el sistema, no solo de instrucciones, grants de texto, una allowlist de herramientas del modelo ni una afirmación del modelo. Una política de sistema puede contar si su aplicación se demuestra. Usar canarios ficticios y registrar evidencia positiva y negativa reproducible.
- Si una capacidad o denegación no puede observarse en la plataforma objetivo, el perfil no se declara soportado y el uso de clientes queda bloqueado; no se degrada silenciosamente a texto/readonly.
- Evidencia portable suficiente para revisar actor, perfil, fuente, destino, intentos permitidos/denegados y resultado. Limpieza del fixture solo con autorización separada; no asumir que la evidencia autoriza borrar.

## Alcance, checkpoint y decisiones

Incluye diseño; un probe de aislamiento de fixture solo podría ejecutarse con autorización separada y con el actor exclusivo suministrado como precondición. El siguiente checkpoint es presentar comparación, desconocidos y propuesta de perfil. La exclusión de segundo writer no queda probada en este corte; la barrera técnica multiwriter se difiere a una aceptación futura separada. Este corte no acredita readiness para clientes ni activa instalación en proyectos reales.

Excluye independencia del chat, fallback/recuperación, PR real, coordinación multiproyecto, producción, sandbox universal, nuevas dependencias/frameworks, autoimplementación de #44, resucitar el candidato Python o completar H1.

Al redactarse esta propuesta, #44 seguía pausada. La verificación posterior completó solo el subalcance de instalación/activación documentado en el [cierre de #44](../.audit/activation-44-closure.md); no valida el resto del alcance ni reactiva trabajo de implementación/lifecycle. Cualquier trabajo adicional requiere reconciliación explícita y grant separado. El push anterior autorizado no concede autorización para PR, merge, despliegue, instalación adicional ni nuevo push; este documento tampoco las autoriza.

**Preguntas abiertas para decisión tras el probe:** ¿qué plataformas/entornos de cliente se pretenden soportar primero? ¿Qué integración de modelo, red y credenciales puede quedar fuera del worker sin concederle autoridad? ¿Qué versión de factory se designa como estable y cuál como candidata para el ensayo? Una respuesta desconocida bloquea la afirmación de soporte, no se rellena por inferencia.
