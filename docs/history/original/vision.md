# Visión de isSWF

Estado reconciliado el 21 de octubre de 2026. isSWF es una factory personal para trabajar en un proyecto local con Pi y GitHub. El [plan canónico I0001](../.factory/initiatives/I0001/plan.md) registra sus 14 jobs completados y la aceptación del operador. El [cierre de v1](../.factory/initiatives/I0001/jobs/J008/delivery.md) conserva los límites de las entregas y no afirma un PASS semántico global de la [especificación](spec-v1.md). La visión describe la experiencia buscada; el [plan](plan-v1.md) resume las entregas y cómo escoger mejoras sin reabrir trabajo aceptado.

## Experiencia buscada

El operador entrega una idea, issue o bug. El coordinador aclara solo las decisiones necesarias, contrasta el código y prepara un encargo verificable. Un worker implementa cambios pequeños; pruebas y revisión independiente preceden a la entrega para aceptación.

El operador puede seguir conversando y consultar trabajos, bloqueos y decisiones pendientes mientras se ejecuta otro trabajo. No debe reconstruir el estado leyendo logs ni repetir decisiones ya registradas. Una entrada clara conserva el camino corto; entrevista, investigador separado, TDD, paneles de revisores y benchmarks se usan cuando aportan evidencia necesaria, no por defecto.

La propia factory es el primer proyecto de uso. Una issue de isSWF puede pedir una mejora de isSWF y servir para comprobar el flujo. No hace falta un proyecto cliente ni una issue artificial. La preparación inicial puede usar el soporte existente, pero no se atribuye a una capacidad nueva antes de verificarla.

## Qué funciona y dónde termina la evidencia

El plan canónico enlaza aceptación y evidencia por job. Esta tabla resume ese estado, no lo duplica como otro registro editable.

| Capacidad | Entrega aceptada y límite actual |
| --- | --- |
| Activación, instalación y ejecución nativa | J011/J014 y la entrada normal permiten delegación nativa y herramientas instaladas bajo `.factory/tools`. Los perfiles Markdown solos no aportan runtime. Véanse [activación](activacion-por-proyecto.md) y [ciclo de vida](local-worker-lifecycle.md). |
| Preparación y producto | J002 cubre revisiones de intake y duplicados. J003 recorre una idea ambigua hasta entrega aceptada. Entrevista, researcher y planner se eligen por las decisiones e incertidumbres del encargo. |
| Observación | J001/J009 entregan CLI y panel local sobre registros canónicos, con evidencia y decisiones de aceptación. El servidor requiere arranque manual. |
| Recuperación | J006 añade reinicio físico con preservación y bloqueo seguro ante identidad incierta. No hay reanudación automática. Los cortes de efectos remotos conservan pruebas con transporte simulado. |
| Concurrencia | J005 cubre capacidad, dependencias y slots de revisión para callers ligados al mismo pool y política. El panel se verifica con fixtures. No hay garantía global sobre callers ajenos o todos los procesos de la máquina. |
| Investigación y fallback | #66 mantiene su alcance aceptado de ruta aprobada, presupuestos acumulativos e indisponibilidad/cuota conocida. Los errores desconocidos bloquean. El envelope controlado no es un clasificador universal ni prueba del formato actual del proveedor. |
| Contexto opcional | J007 contrasta contexto y verifica un perfil sintético de stores/procesos separados. El contraejemplo de metadatos de otros proyectos en resúmenes del store compartido permanece. Cada uso cliente exige verificar su frontera real. |
| Retrospectiva y auditoría | J004 valida propuestas sin duplicarlas ni autoaplicarlas. J013 fija retención sin borrado de historia. La auditoría histórica de desarrollo no es parte del runtime instalado. |
| Calidad y entrega | Comprobaciones portables, ESLint, Knip y CI real. El modo de revisión depende del riesgo, según la [referencia de revisión](../.agents/roles/references/review.md#choose-sufficient-verification). La CI del head exacto precede al merge autorizado; no prueba aceptación ni reemplaza juicio independiente cuando es necesario. |

U1 y U2 conservan valor como prototipos históricos de preparación de entradas; su CLI Python no es la arquitectura objetivo ni un requisito del flujo nativo. Los contratos actuales se describen en [entrada nativa](s01-intake.md) y [trabajo durable](durable-work.md).

## Prioridades por valor para el operador

La construcción de I0001 está aceptada dentro de los límites publicados. El siguiente beneficio consiste en usar la factory con encargos reales y contrastar escenarios, no en repetir una auditoría global.

El [plan](plan-v1.md#próximo-trabajo-por-valor) distingue cuatro resultados de ese contraste. Una capacidad existente puede necesitar mejor aplicación; una instrucción ausente puede necesitar corrección; una carencia reproducida de runtime puede justificar implementación; una garantía nueva requiere decidir su alcance. La omisión de un rol en una explicación no demuestra que falte implementarlo.

El escenario de botón, tarjetas y visor Markdown queda clasificado en ese plan como capacidad existente que debe aplicarse mejor. Es una simulación, no una ejecución verificada de las tres issues. Triage, preguntas de producto, researcher/planner condicionales y trabajo del worker se explicitan sin imponer TDD o un panel de revisión a todos los casos.

Antes de trabajar con clientes deben verificarse sus fronteras reales de datos, herramientas y efectos autorizados. El perfil sintético aislado no autoriza un despliegue cliente. Las nuevas garantías de recuperación o proveedores necesitan un alcance propio.

## Principios que se mantienen

### Autorización y aceptación

La autorización nombra repositorio, encargo, alcance y efectos permitidos. Una issue, etiqueta, brief, recuerdo o ruta configurada no la amplía. El coordinador actúa dentro de lo autorizado sin preguntar cada paso reversible. Una nueva decisión de producto, coste o efecto sensible vuelve al operador.

Cierre técnico, aceptación, publicación, merge y despliegue son estados distintos. El operador puede autorizar merges concretos, como en los trabajos de esta factory; no se convierte por ello el merge autónomo en una capacidad general. No hay autorización implícita de despliegue, force-push, borrado ni gasto API adicional.

### Skills, perfiles y soporte de ejecución

La mayor parte del procedimiento vive en skills y perfiles Markdown. El coordinador elige el procedimiento proporcional; el investigador no es un implementador encubierto ni el planificador otro jefe permanente. Un mapa de grounding señala fuentes reales, contratos, consumidores y pruebas vigentes. Código y decisiones actuales prevalecen sobre memorias o índices antiguos.

El soporte ejecutable se limita a lo que necesita comprobaciones estructurales: iniciar y observar trabajos, conservar identidad y artefactos, aislar escritores y aplicar límites. Se reutilizan Pi, Git y GitHub. No se crea una herramienta por especialidad, otro dispatcher o una memoria alternativa a Engram.

El objetivo inicial sigue siendo dos trabajos concurrentes, configurable. Los límites de intentos, reintentos y rondas de corrección son explícitos; agotarlos bloquea el trabajo sin activar costes adicionales. La capacidad compartida aceptada exige callers vinculados al mismo pool y política; no impone límites a toda la máquina.

Los trabajos usan instrucciones y entradas fijadas. Cambiar una skill candidata o un default no cambia retroactivamente un worker activo. Un resultado incierto conserva su bloqueo; no libera automáticamente otro intento. Los perfiles Markdown no son por sí solos servicios persistentes ni garantías de independencia del chat.

### Unidades pequeñas y evidencia

Una slice entrega un comportamiento observable. Una unidad de implementación deja un cambio coherente y verificable; una PR agrupa una entrega revisable. Los checkpoints preservan progreso antes del final sin confundir WIP con aceptación. No hay un límite universal de líneas ni una obligación de abrir una PR por commit.

Toda entrega requiere evidencia que cubra su aceptación y una selección de revisión proporcional al riesgo. Una comprobación mecánica suficiente no exige llamar a un modelo por defecto. Las exigencias explícitas de independencia se mantienen; cuando hace falta juicio independiente, el autor no se revisa a sí mismo. Un cambio posterior invalida las comprobaciones y revisiones afectadas. La CI verde no sustituye el juicio requerido ni la aceptación. Las PRs encadenadas siguen siendo una capacidad posterior opcional; no se necesitan para el siguiente corte.

### Formato de las PRs

Issues y PRs se redactan en inglés. El formato propio lo define la [referencia de publicación](../.agents/roles/references/delivery.md), aplicada por el [perfil delivery](../.agents/roles/delivery.md). Sus apartados son `Why the change`, `Change outline`, `Special things to note`, `Risk Assessment` y `Testing`, omitiendo secciones vacías. Un visual explica el cambio real cuando ayuda; no se exige una captura para un cambio sin interfaz.

La [plantilla de entrega](../.factory/templates/delivery.md) es el registro local detallado de evidencia, no el cuerpo obligatorio de cada PR. El perfil prepara texto y no publica por sí solo. El coordinador comprueba la autorización y usa el mecanismo GitHub existente para publicar. Las skills de Pstack pueden ayudar, pero no reemplazan este contrato ni son una dependencia obligatoria del formato.

### Contexto, recuperación y mejoras

Engram y Codegraph se usan si están instalados y aportan contexto útil. Se inicia el índice del proyecto autorizado cuando proceda; no se exige una instalación nueva. Su ausencia no bloquea un encargo con fuentes suficientes. No se guardan secretos ni se cruza contexto de otros proyectos.

Cerrar una conversación no equivale a cerrar un trabajo. La visión mantiene la separación entre conversación y ejecución y la recuperación tras interrupciones. El cierre aceptado sigue limitado por la evidencia de la tabla anterior; no promete reanudación automática, backup ni exactly-once en sistemas externos.

La retrospectiva produce propuestas revisables. No cambia reglas de workers en curso y no se autoautoriza para ejecutar su propia mejora. Una limitación observada durante el uso justifica la siguiente issue; una posibilidad teórica no justifica otra plataforma.

## Fuentes y alcance futuro

La [especificación v1](spec-v1.md) conserva los criterios de producto. El [plan reconciliado](plan-v1.md) identifica entregas aceptadas, límites y criterios para proponer el siguiente trabajo. Las referencias de Matt Pocock, Pstack, Addy Osmani y Gentle AI siguen en el [contraste de referencias](research/referencias.md).

Siguen fuera de v1 la coordinación entre proyectos, varios operadores, despliegues automáticos y un servicio alojado permanente. Usar la factory con clientes requiere comprobar primero sus fronteras; esta actualización documental no declara que estén resueltas ni concede permisos para implementar el backlog.
