# isSWF

Definición de una software factory personal: un coordinador conversacional, agentes en background y procedimientos adaptativos expresados principalmente en skills y perfiles Markdown.

**Estado:** U1 y U2 de S01 están implementadas y verificadas localmente con issues ficticias. Hay una skill de triage, preguntas pendientes, respuestas del operador, registro SQLite y panel de lectura. Hay perfiles Markdown para coordinator, worker y diagnostician, además de pruebas pequeñas del dispatcher; todavía no hay runtime de workers para S02 ni integración GitHub real. S01 completa y el primer hito siguen pendientes.

Para probarla, sigue [U1: preparar y observar una issue](docs/u1-usage.md). La [captura del panel real](.audit/u1-panel.png) corresponde al fixture, no a un proyecto cliente. La [revisión independiente](.audit/u1-final-review.md), las [13 pruebas](.audit/u1-tests.log) y la [verificación CLI/HTTP/browser](.audit/u1-live.json) conservan el alcance comprobado.

Para resolver una entrada ambigua, sigue [U2: decisiones y retriage](docs/u2-usage.md). La [captura U2](.audit/u2-panel.png), la [prueba CLI/HTTP/browser](.audit/u2-live.json) y el [censo de variantes](.audit/u2-variants-final.json) muestran el alcance comprobado. El censo contrasta 96 combinaciones estructurales, no la verdad de cualquier respuesta o evidencia. Engram se verificó con el almacén real en [la auditoría de integración](.audit/engram-integration.json), registrada en el commit `0d81c5f`; esto no valida todos los usos futuros de memoria. Codegraph tiene un índice local de isSWF y una [verificación de navegación](.audit/codegraph-index-verify.json); demuestra navegación indexada, no un flujo completo de grounding. El [arranque por proyecto](docs/arranque-por-proyecto.md) propone una instalación compartida con versión fijada y activación local. Se probaron primitivas de carga y memoria con fixtures; falta el instalador antes de U3.

El proyecto usa Git local y tiene `origin` configurado en el repositorio. Esa configuración no demuestra conectividad, permisos ni publicación en GitHub.

## Uso coordinado en Pi

Invoca `/skill:isswf-coordinator` para preparar un encargo local con grounding, brief y unidades comprobables. El flujo del núcleo Markdown no requiere Python ni crea un runtime. La CLI existente de U1/U2 conserva su triage JSON y sí requiere su entorno Python. El perfil `.agents/roles/worker.md` es un documento de instrucciones, no un rol nativo de Pi; un worker real requiere que la herramienta `agent` y la extensión Pstack estén disponibles y que admitan `pstack:poteto-agent-high` con `openai-codex/gpt-6-luna` a esfuerzo `high` sin fallback. Si falta una capacidad, bloquea el despacho, no el brief. Un brief listo no equivale a implementación verificada. La integración completa, ejecución durable en background y una instalación portable siguen pendientes y no se prometen aquí.

## Por dónde empezar

- [Visión](docs/vision.md): acuerdos y prioridades del usuario.
- [Especificación v1](docs/spec-v1.md): delegación, grounding, entrega, revisión, estado, seguridad, modelos y memoria.
- [Plan funcional](docs/plan-v1.md): ocho slices y transferencia progresiva de trabajo a la propia factory.
- [S01 concretada](docs/s01-intake.md): recorrido de issue a ficha visible; U1 y U2 locales comprobadas; U3 y U4 pendientes.
- [Glosario](GLOSSARY.md): términos compartidos.
- [Arquitectura candidata](docs/arquitectura-candidata.md): comparación de ejecutor local, Pi RPC/SDK y A2A; propuesta pendiente de pruebas integradas.

El primer hito, S01 + S02, lleva una issue definida a una PR con grounding, verificación, revisión independiente y correcciones. Fallback automático, recuperación tras reinicio, paralelismo, definición de producto y retrospectivas completan la v1 después. La auditoría citada arriba verificó Engram para este proyecto y su aislamiento por proyecto; no implica una integración de runtime ni prueba recuperación en todos los flujos.

## Investigación

- [Referencias](docs/research/referencias.md): Zazencodes, Matt Pocock, Pstack, Addy Osmani y Gentle AI.
- [Adaptación de prácticas y agentes propuestos](docs/research/adaptaciones-agentes.md): decisiones de adaptación y mapa provisional de candidatos.
- [Agentes y skills de Pstack](docs/research/pstack-agentes.md): mecanismos y diferencias entre original y port.
- [Evidencia del runtime Pstack](docs/research/evidencia-pstack-runtime.md): pruebas ejecutadas y sus límites.
- [Control de workers Pi](docs/research/pi-agentes.md) y [probe local](docs/research/pi-runtime.md): ciclo de vida, instrucciones y persistencia.
- [Spike local de continuidad y recuperación](docs/research/pi-lifecycle.md): clientes separados, crash activo, hijos escapados y bloqueo por identidad incierta.
- [Aislamiento offline](docs/research/pi-isolation.md): permisos con Pi RPC real, reviewer readonly y contención de procesos. El acceso seguro a modelos aún no está resuelto.
- [Contrato A2A](docs/research/a2a.md): tareas, comunicación y responsabilidades que siguen siendo nuestras.
- [Pruebas del SDK A2A JS](docs/research/a2a-js.md): envío no bloqueante, desconexión, cancelación y mensajes repetidos.

La arquitectura, persistencia, aislamiento y composición de instrucciones se elegirán mediante pruebas acotadas antes de implementar. La metodología no será un pipeline obligatorio ni una herramienta distinta por cada skill.
