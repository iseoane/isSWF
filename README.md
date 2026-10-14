# isSWF

Definición de una software factory personal: un coordinador conversacional, agentes en background y procedimientos adaptativos expresados principalmente en skills y perfiles Markdown.

**Estado:** U1 de S01 implementada y verificada localmente con una issue ficticia. Hay skill de triage, registro SQLite y panel de lectura; no workers ni integración GitHub real. S01 completa y el primer hito siguen pendientes. No hay repositorio GitHub autorizado.

Para probarla, sigue [U1: preparar y observar una issue](docs/u1-usage.md). La [captura del panel real](.audit/u1-panel.png) corresponde al fixture, no a un proyecto cliente. La [revisión independiente](.audit/u1-final-review.md), las [13 pruebas](.audit/u1-tests.log) y la [verificación CLI/HTTP/browser](.audit/u1-live.json) conservan el alcance comprobado.

El proyecto se versiona con Git local en la rama `main`, sin remoto configurado. El código de U1 y la definición/investigación se conservan en commits separados. No se publica en GitHub.

## Por dónde empezar

- [Visión](docs/vision.md): acuerdos y prioridades del usuario.
- [Especificación v1](docs/spec-v1.md): delegación, grounding, entrega, revisión, estado, seguridad, modelos y memoria.
- [Plan funcional](docs/plan-v1.md): ocho slices y transferencia progresiva de trabajo a la propia factory.
- [S01 concretada](docs/s01-intake.md): recorrido de issue a ficha visible; U1 local comprobada y tres unidades posteriores pendientes.
- [Glosario](GLOSSARY.md): términos compartidos.
- [Arquitectura candidata](docs/arquitectura-candidata.md): comparación de ejecutor local, Pi RPC/SDK y A2A; propuesta pendiente de pruebas integradas.

El primer hito, S01 + S02, lleva una issue definida a una PR con grounding, verificación, revisión independiente y correcciones. Fallback automático, recuperación tras reinicio, paralelismo, definición de producto y retrospectivas completan la v1 después. Engram es la integración de memoria propuesta, pendiente de validar su separación por proyecto y recuperación.

## Investigación

- [Referencias](docs/research/referencias.md): Zazencodes, Matt Pocock, Pstack, Addy Osmani y Gentle AI.
- [Agentes y skills de Pstack](docs/research/pstack-agentes.md): mecanismos y diferencias entre original y port.
- [Evidencia del runtime Pstack](docs/research/evidencia-pstack-runtime.md): pruebas ejecutadas y sus límites.
- [Control de workers Pi](docs/research/pi-agentes.md) y [probe local](docs/research/pi-runtime.md): ciclo de vida, instrucciones y persistencia.
- [Spike local de continuidad y recuperación](docs/research/pi-lifecycle.md): clientes separados, crash activo, hijos escapados y bloqueo por identidad incierta.
- [Aislamiento offline](docs/research/pi-isolation.md): permisos con Pi RPC real, reviewer readonly y contención de procesos. El acceso seguro a modelos aún no está resuelto.
- [Contrato A2A](docs/research/a2a.md): tareas, comunicación y responsabilidades que siguen siendo nuestras.
- [Pruebas del SDK A2A JS](docs/research/a2a-js.md): envío no bloqueante, desconexión, cancelación y mensajes repetidos.

La arquitectura, persistencia, aislamiento y composición de instrucciones se elegirán mediante pruebas acotadas antes de implementar. La metodología no será un pipeline obligatorio ni una herramienta distinta por cada skill.
