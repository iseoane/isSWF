# isSWF

Definición de una software factory personal: un coordinador conversacional, agentes en background y procedimientos adaptativos expresados principalmente en skills y perfiles Markdown.

**Estado:** existe una entrada nativa de jobs con worker Pi, ejecución aislada y consulta posterior de resultados. Una issue real recorrió implementación, verificación y revisión hasta una PR integrada ([issue #1](https://github.com/iseoane/isSWF/issues/1), [PR #2](https://github.com/iseoane/isSWF/pull/2)). La recuperación soportada se limita al mismo arranque; el paralelismo es cooperativo, no un scheduler global. Esto no completa S01/S02 ni toda la v1. El [plan vigente](docs/plan-v1.md) distingue entregas, evidencia y pendientes; #66 sigue pausada tras dos respuestas HTTP 400, sin fallback real demostrado.

## Uso coordinado en Pi

Invoca `/skill:isswf-coordinator` para preparar un encargo autorizado con grounding, brief y unidades comprobables. Sigue la [activación por proyecto](docs/activacion-por-proyecto.md) y la [entrada normal de jobs](docs/local-worker-lifecycle.md#run-a-job-from-an-activated-project) para ejecutar con una versión fijada. La skill es una instrucción, no inicia por sí sola un modelo coordinador ni concede permisos. Los perfiles Markdown tampoco son roles nativos de Pi.

La entrada normal conecta el SDK de Pi con el runner local; no requiere la extensión Pstack para ejecutar ese worker. Necesita el SDK y la autenticación existentes, Node y las capacidades Linux/bubblewrap descritas en la guía. Conserva grants y límites explícitos y exige revisión independiente del candidato exacto antes de entregar. Un brief listo o un proceso terminado no prueban aceptación del producto. No repitas una operación de estado incierto ni infieras permisos de merge, despliegue o nuevas llamadas de pago.

Engram y Codegraph son opcionales. El coordinador contrasta sus resultados con código y decisiones vigentes; su ausencia no bloquea un encargo que tenga fuentes suficientes. Las issues y PRs se escriben en inglés. La CI debe estar verde antes de cada merge; esa comprobación es manual porque el plan actual de GitHub no permite proteger esta rama privada.

U1 y U2 son prototipos históricos locales de intake en Python, no requisitos de la entrada nativa. Sus guías de [triage](docs/u1-usage.md) y [decisiones pendientes](docs/u2-usage.md) conservan fixtures y límites; U3/U4 siguen pendientes. No se declara aislamiento exhaustivo ni preparación para proyectos cliente.

## Por dónde empezar

- [Visión](docs/vision.md): acuerdos y prioridades del usuario.
- [Especificación v1](docs/spec-v1.md): delegación, grounding, entrega, revisión, estado, seguridad, modelos y memoria.
- [Plan funcional](docs/plan-v1.md): ocho slices y transferencia progresiva de trabajo a la propia factory.
- [S01 concretada](docs/s01-intake.md): recorrido de issue a ficha visible; U1 y U2 locales comprobadas; U3 y U4 pendientes.
- [Glosario](GLOSSARY.md): términos compartidos.
- [Arquitectura candidata](docs/arquitectura-candidata.md): comparación histórica de alternativas; consulta las guías de activación y jobs para la entrada implementada.

El objetivo completo de S01 + S02 sigue siendo llevar encargos definidos hasta entregas revisadas. La prueba técnica integrada no sustituye aceptación de producto ni valida todos los criterios de esas slices.

## Investigación

- [Referencias](docs/research/referencias.md): Zazencodes, Matt Pocock, Pstack, Addy Osmani y Gentle AI.
- [Adaptación de prácticas y agentes propuestos](docs/research/adaptaciones-agentes.md): decisiones de adaptación y mapa provisional de candidatos.
- [Agentes y skills de Pstack](docs/research/pstack-agentes.md): mecanismos y diferencias entre original y port.
- [Evidencia del runtime Pstack](docs/research/evidencia-pstack-runtime.md): pruebas ejecutadas y sus límites.
- [Control de workers Pi](docs/research/pi-agentes.md) y [probe local](docs/research/pi-runtime.md): ciclo de vida, instrucciones y persistencia.
- [Spike local de continuidad y recuperación](docs/research/pi-lifecycle.md): clientes separados, crash activo, hijos escapados y bloqueo por identidad incierta.
- [Aislamiento offline](docs/research/pi-isolation.md): permisos con Pi RPC real, reviewer readonly y contención de procesos. Es evidencia histórica; la frontera actual del worker se describe en la guía de jobs.
- [Contrato A2A](docs/research/a2a.md): tareas, comunicación y responsabilidades que siguen siendo nuestras.
- [Pruebas del SDK A2A JS](docs/research/a2a-js.md): envío no bloqueante, desconexión, cancelación y mensajes repetidos.

Estas investigaciones registran etapas previas; no sustituyen los contratos y límites de la implementación vigente. La metodología no será un pipeline obligatorio ni una herramienta distinta por cada skill.

## Controles de calidad

Con Node.js 24 y Git disponibles, ejecuta `node tools/check-quality.mjs`. Esta etapa no instala dependencias ni usa credenciales de modelos. Comprueba sintaxis de `tools/` y tests `.mjs`, formato y enlaces de instrucciones `.agents/`, materialización y hashes del paquete de `HEAD` y admisión de rutas mediante el CLI público. Los archivos locales de sintaxis/instrucciones se comprueban tal como están; el paquete se verifica desde el commit, no desde cambios sin commit.

Para el análisis estático local, desde la raíz:

```sh
npm ci --prefix tooling/quality --ignore-scripts --no-audit --no-fund
node tooling/quality/node_modules/eslint/bin/eslint.js --config tooling/quality/eslint.config.mjs tools tests tooling/quality/*.mjs
node tooling/quality/node_modules/knip/bin/knip.js --config tooling/quality/knip.json --no-progress
```

ESLint comprueba errores y variables/imports sin usar. Knip busca archivos, exports de módulos internos, duplicados y referencias no resueltas en el JavaScript activo. Los entrypoints CLI y tests se declaran explícitamente; `check-quality.mjs` se alcanza desde el workflow. Los exports de entrypoints se conservan como API pública. No se analizan los archivos históricos de `.audit/`, el prototipo Python ni el código generado dentro de strings; tampoco se declara cobertura de dependencias npm. Las herramientas y su lockfile viven en `tooling/quality/`, fuera del paquete Pi sin dependencias.

El check `Quality / Portable checks` ejecuta ambas etapas en cada PR y en `main`. No hay paso de compilación: el runtime es JavaScript ejecutable. Esto no sustituye pruebas de Pi/bubblewrap o proveedores reales; la CI no consume llamadas a modelos. La instalación local/CI descarga las dependencias fijadas, con scripts de instalación desactivados.
