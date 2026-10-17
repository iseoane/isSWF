# Visión de isSWF

Estado reconciliado el 17 de octubre de 2026. isSWF es una factory personal para trabajar en un proyecto local con Pi y GitHub. La visión describe el producto deseado; el [plan](plan-v1.md) ordena lo que queda por valor aportado. Cerrar las tareas recientes no significa haber completado la [especificación v1](spec-v1.md).

## Experiencia buscada

El operador entrega una idea, issue o bug. El coordinador aclara solo las decisiones necesarias, contrasta el código y prepara un encargo verificable. Un worker implementa cambios pequeños; pruebas y revisión independiente preceden a la entrega para aceptación.

El operador puede seguir conversando y consultar trabajos, bloqueos y decisiones pendientes mientras se ejecuta otro trabajo. No debe reconstruir el estado leyendo logs ni repetir decisiones ya registradas. Una entrada clara conserva el camino corto; entrevista, investigador separado, TDD, paneles de revisores y benchmarks se usan cuando aportan evidencia necesaria, no por defecto.

La propia factory es el primer proyecto de uso. Una issue de isSWF puede pedir una mejora de isSWF y servir para comprobar el flujo. No hace falta un proyecto cliente ni una issue artificial. La preparación inicial puede usar el soporte existente, pero no se atribuye a una capacidad nueva antes de verificarla.

## Qué funciona y dónde termina la evidencia

| Capacidad | Evidencia y límite actual |
| --- | --- |
| Activación y ejecución nativa | Versión compartida fija, activación explícita por proyecto y entrada normal con SDK Pi, worker aislado y resultados consultables. Véanse [activación](activacion-por-proyecto.md) y [ciclo de vida](local-worker-lifecycle.md). No exige Pstack para ejecutar ese worker. |
| Entrega propia real | La [issue #1](https://github.com/iseoane/isSWF/issues/1) produjo la [PR #2](https://github.com/iseoane/isSWF/pull/2), revisada e integrada. Es el corte técnico de H1, no todo S01/S02 ni autonomía general del producto. |
| Recuperación | #68 está cerrada para los casos soportados en el mismo arranque. Incluye cese comprobado, revisión del candidato y sucesor autorizado. Los cortes de efectos GitHub usan transporte simulado; no acreditan recuperación general tras reiniciar la máquina. Véase [S04 del plan](plan-v1.md#s04-recuperar-un-trabajo-interrumpido). |
| Concurrencia | La [PR #6](https://github.com/iseoane/isSWF/pull/6) verificó trabajos aislados y una dependencia retenida hasta integrar su artefacto. La coordinación es cooperativa, no una cola o scheduler global automatizados. |
| Investigación y fallback | El investigador completó una ejecución real GLM/high con fuente citada. #66 está cerrada con alcance aceptado: ruta aprobada, presupuestos acumulativos, indisponibilidad controlada y un envelope Go de cuota conocido. Los errores desconocidos bloquean. El contrato de cuota se prueba offline; no es un clasificador universal ni prueba del formato desplegado actualmente. Véanse [guía](model-routing.md) y [evidencia](../.audit/fallback-66-quota-proof.json). |
| Contexto opcional | La [PR #4](https://github.com/iseoane/isSWF/pull/4) añadió uso opcional de Engram y Codegraph por el coordinador y hechos contrastados en el brief. No es un puente MCP general para workers ni validación exhaustiva entre proyectos. |
| Calidad y entrega | Hay comprobaciones portables, ESLint, Knip y CI real en GitHub. El alcance de los analizadores está en el [README](../README.md#controles-de-calidad). La CI verde se comprueba manualmente antes del merge porque el plan actual de GitHub no permite proteger esta rama privada. |

U1 y U2 conservan valor como prototipos históricos de preparación de entradas; su CLI Python no es la arquitectura objetivo ni un requisito del flujo nativo. U3/U4 siguen como necesidades funcionales de reconciliación y entrada real, no como una orden de completar aquel backend.

## Prioridades por valor para el operador

1. **Preparar una issue propia sin trabajo duplicado.** Consolidar una entrada clara autorizada, un brief durable y una relectura segura. Permite usar la factory sin preparar a mano cada encargo.
2. **Consultar el estado desde una misma fuente.** Responder qué está activo, bloqueado, pendiente de decisión o listo para revisar. Empezar con una vista de lectura y el resumen del coordinador; el panel visual completo sigue siendo un objetivo, no el primer paso.
3. **Comprobar el camino de una idea ambigua.** Producir decisiones y slices aprobables sin convertir una issue clara en una entrevista. Reutilizar perfiles y skills existentes.
4. **Convertir una retrospectiva en una mejora concreta.** Proponer una issue respaldada por evidencia, sin duplicarla ni modificar reglas activas automáticamente.
5. **Automatizar más concurrencia cuando el uso lo justifique.** Resolver capacidad y dependencias visibles antes de diseñar una cola o scheduler nuevos.
6. **Ampliar recuperación a reinicios de máquina.** Sigue siendo una capacidad deseada de v1. Su ausencia se declara; no impide usar el corte local soportado ni autoriza reanudar efectos inciertos.
7. **Completar garantías de contexto y mantenimiento pendientes.** Separación entre proyectos, recuperación y degradación de memoria según uso real; traducción gradual de instrucciones existentes. No instalar herramientas externas para cumplir una lista.

Este orden no cambia los criterios de la especificación. Una necesidad de seguridad tiene prioridad sobre conveniencia. Antes de trabajar con clientes deben verificarse sus fronteras de datos, herramientas y efectos autorizados; no basta con que el caso de isSWF funcione.

## Principios que se mantienen

### Autorización y aceptación

La autorización nombra repositorio, encargo, alcance y efectos permitidos. Una issue, etiqueta, brief, recuerdo o ruta configurada no la amplía. El coordinador actúa dentro de lo autorizado sin preguntar cada paso reversible. Una nueva decisión de producto, coste o efecto sensible vuelve al operador.

Cierre técnico, aceptación, publicación, merge y despliegue son estados distintos. El operador puede autorizar merges concretos, como en los trabajos de esta factory; no se convierte por ello el merge autónomo en una capacidad general. No hay autorización implícita de despliegue, force-push, borrado ni gasto API adicional.

### Skills, perfiles y soporte de ejecución

La mayor parte del procedimiento vive en skills y perfiles Markdown. El coordinador elige el procedimiento proporcional; el investigador no es un implementador encubierto ni el planificador otro jefe permanente. Un mapa de grounding señala fuentes reales, contratos, consumidores y pruebas vigentes. Código y decisiones actuales prevalecen sobre memorias o índices antiguos.

El soporte ejecutable se limita a lo que necesita comprobaciones estructurales: iniciar y observar trabajos, conservar identidad y artefactos, aislar escritores y aplicar límites. Se reutilizan Pi, Git y GitHub. No se crea una herramienta por especialidad, otro dispatcher o una memoria alternativa a Engram.

El objetivo inicial sigue siendo dos trabajos concurrentes, configurable. Los límites de intentos, reintentos y rondas de corrección son explícitos; agotarlos bloquea el trabajo sin activar costes adicionales. La coordinación cooperativa actual no demuestra un scheduler que imponga todos esos límites globalmente.

Los trabajos usan instrucciones y entradas fijadas. Cambiar una skill candidata o un default no cambia retroactivamente un worker activo. Un resultado incierto conserva su bloqueo; no libera automáticamente otro intento. Los perfiles Markdown no son por sí solos servicios persistentes ni garantías de independencia del chat.

### Unidades pequeñas y evidencia

Una slice entrega un comportamiento observable. Una unidad de implementación deja un cambio coherente y verificable; una PR agrupa una entrega revisable. Los checkpoints preservan progreso antes del final sin confundir WIP con aceptación. No hay un límite universal de líneas ni una obligación de abrir una PR por commit.

Toda entrega requiere pruebas de comportamiento y revisión independiente proporcional. Un cambio posterior invalida las comprobaciones y revisiones afectadas. La CI verde no sustituye revisión ni aceptación. Las PRs encadenadas siguen siendo una capacidad posterior opcional; no se necesitan para el siguiente corte.

### Formato de las PRs

Issues y PRs se redactan en inglés. El formato propio lo define la [referencia de publicación](../.agents/roles/references/delivery.md), aplicada por el [perfil delivery](../.agents/roles/delivery.md). Sus apartados son `Why the change`, `Change outline`, `Special things to note`, `Risk Assessment` y `Testing`, omitiendo secciones vacías. Un visual explica el cambio real cuando ayuda; no se exige una captura para un cambio sin interfaz.

La [plantilla de entrega](templates/delivery.md) es el registro local detallado de evidencia, no el cuerpo obligatorio de cada PR. El perfil prepara texto y no publica por sí solo. El coordinador comprueba la autorización y usa el mecanismo GitHub existente para publicar. Las skills de Pstack pueden ayudar, pero no reemplazan este contrato ni son una dependencia obligatoria del formato.

### Contexto, recuperación y mejoras

Engram y Codegraph se usan si están instalados y aportan contexto útil. Se inicia el índice del proyecto autorizado cuando proceda; no se exige una instalación nueva. Su ausencia no bloquea un encargo con fuentes suficientes. No se guardan secretos ni se cruza contexto de otros proyectos.

Cerrar una conversación no equivale a cerrar un trabajo. La visión mantiene la separación entre conversación y ejecución y la recuperación tras interrupciones. El cierre soportado actual sigue limitado por la evidencia de la tabla anterior; no promete backup ni exactly-once en sistemas externos.

La retrospectiva produce propuestas revisables. No cambia reglas de workers en curso y no se autoautoriza para ejecutar su propia mejora. Una limitación observada durante el uso justifica la siguiente issue; una posibilidad teórica no justifica otra plataforma.

## Fuentes y alcance futuro

La [especificación v1](spec-v1.md) conserva los criterios de producto. El [plan priorizado](plan-v1.md) identifica entregas, próximos cortes y condiciones para posponer trabajo. Las referencias de Matt Pocock, Pstack, Addy Osmani y Gentle AI siguen en el [contraste de referencias](research/referencias.md).

Siguen fuera de v1 la coordinación entre proyectos, varios operadores, despliegues automáticos y un servicio alojado permanente. Usar la factory con clientes requiere comprobar primero sus fronteras; esta actualización documental no declara que estén resueltas ni concede permisos para implementar el backlog.
