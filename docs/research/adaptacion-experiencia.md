# Propuestas para adaptar la experiencia de uso

Esta nota propone cómo adaptar prácticas de Gentle AI y la Software Factory de Zazen a la experiencia de isSWF. Las fuentes describen proyectos distintos y no demuestran que isSWF ya tenga ninguna de estas capacidades. Las citas distinguen lo que el upstream implementa o prescribe de lo que recomiendo para isSWF. No propongo instalar ninguno de los proyectos ni copiar sus interfaces o automatizaciones.

## Revisión de las fuentes

Las URLs iniciales son las registradas en [referencias.md](referencias.md): [Gentle AI](https://github.com/Gentleman-Programming/gentle-ai) y el [README de la Software Factory de Zazen](https://github.com/zazencodes/zazencodes-season-3/blob/main/src/software-factory-claude-code/README.md). Consulté sus fuentes primarias sin clonar ni instalar nada y fijé la revisión para que se puedan repetir las citas:

| Fuente | Revisión consultada | Licencia observada |
| --- | --- | --- |
| Gentle AI | [`09e4e4aef14e87199784fcf4edb667017d70b9b3`](https://github.com/Gentleman-Programming/gentle-ai/tree/09e4e4aef14e87199784fcf4edb667017d70b9b3) | El archivo [`LICENSE`](https://github.com/Gentleman-Programming/gentle-ai/blob/09e4e4aef14e87199784fcf4edb667017d70b9b3/LICENSE) declara MIT. La licencia no cubre marcas ni implica respaldo, según el aviso del README. |
| Zazen, `software-factory-claude-code` | [`555467c365e6750278efba09349369109f62f65f`](https://github.com/zazencodes/zazencodes-season-3/tree/555467c365e6750278efba09349369109f62f65f) | Pendiente. La API del repositorio no declara licencia (`license: null`) y el árbol revisado no contiene un archivo `LICENSE` en la raíz ni dentro de `src/software-factory-claude-code/`. No copiar su código ni texto hasta aclararlo. |

Gentle AI declara que su documentación sigue `main` y puede incluir cambios inéditos. Por eso las observaciones siguientes describen exactamente las revisiones citadas, no necesariamente una versión publicada o la que utiliza el operador.

## Propuestas

### 1. Mantener una conversación principal mientras los trabajos avanzan en segundo plano

**Hecho upstream.** Gentle AI describe un orquestador que conserva un hilo de conversación y lanza tareas acotadas en segundo plano. Tras terminar el worker, el orquestador continúa el trabajo autorizado sin pedir al usuario que escriba «continúa» ([ODD, identidad y continuidad, líneas 70–80](https://github.com/Gentleman-Programming/gentle-ai/blob/09e4e4aef14e87199784fcf4edb667017d70b9b3/internal/assets/skills/_shared/odd-orchestrator-sections.md#L70-L80)). Zazen, en cambio, crea una factoría por sesión de Claude Code; varias sesiones ejecutan varios trabajos a la vez ([README, líneas 37–48](https://github.com/zazencodes/zazencodes-season-3/blob/555467c365e6750278efba09349369109f62f65f/src/software-factory-claude-code/README.md#L37-L48)).

**Recomendación para isSWF.** El coordinador conserva la conversación como lugar para crear trabajos, discutir decisiones y recibir resultados. Cada trabajo puede avanzar fuera del turno conversacional, con identidad y estado recuperables. Cuando termina un paso, el coordinador resume el resultado y prosigue automáticamente solo por la ruta autorizada; mantiene visibles fallos y decisiones que sí requieren al operador.

**Rol y activación.** Coordinador por defecto. Arranca el trabajo background después del triage y de confirmar que su alcance está autorizado. Un worker solo recibe una unidad delimitada cuando la topología del proyecto y la autorización lo permiten.

**Diferir o rechazar.** No adoptar «una sesión por trabajo» como modelo de producto ni afirmar que Pi mantiene procesos o conversaciones en background al margen de lo que el runtime probado permita. No convertir delegar en condición para todo trabajo. Gentle AI deriva la delegación a motivos concretos, y sus fuentes dicen que algunas capacidades dependen del cliente ([README, líneas 141–157](https://github.com/Gentleman-Programming/gentle-ai/blob/09e4e4aef14e87199784fcf4edb667017d70b9b3/README.md#L141-L157), [agentes soportados, líneas 30–40](https://github.com/Gentleman-Programming/gentle-ai/blob/09e4e4aef14e87199784fcf4edb667017d70b9b3/docs/agents.md#L30-L40)).

**Coste.** El runtime debe poder reanudar procesos, evitar escritores simultáneos y reconciliar tareas tras un cierre inesperado. La conversación debe distinguir en ejecución, bloqueado, terminado y pendiente de revisión sin aparentar que el trabajo sigue vivo cuando no hay evidencia de ello.

### 2. Evitar permisos rutinarios, conservando consentimiento para decisiones reales

**Hecho upstream.** ODD dice que un resultado ya autorizado incluye implementación, documentación y verificación necesarias, y que el agente debe continuar esos pasos sin pedir permiso en cada transición. Debe parar ante decisiones relevantes, consentimiento requerido, acción denegada o falta de evidencia necesaria ([ODD, continuidad autorizada, líneas 74–80](https://github.com/Gentleman-Programming/gentle-ai/blob/09e4e4aef14e87199784fcf4edb667017d70b9b3/internal/assets/skills/_shared/odd-orchestrator-sections.md#L74-L80)). Zazen deja el trabajo bloqueado si hay asuntos para una persona, pero también permite que un `APPROVE` del agente aprobador lleve a merge automático ([skill factory, aprobación y merge, líneas 156–183](https://github.com/zazencodes/zazencodes-season-3/blob/555467c365e6750278efba09349369109f62f65f/src/software-factory-claude-code/.claude/skills/factory/SKILL.md#L156-L183)).

**Recomendación para isSWF.** Tratar el encargo aceptado como permiso para completar sus pasos ordinarios dentro del alcance. No preguntar de nuevo por cada test, commit o continuación ya cubierta. Pedir decisión solo cuando cambie el alcance, haya una consecuencia irreversible o externa, el permiso no cubra la acción, el resultado dependa de una decisión de producto o no exista prueba necesaria. Explicar la decisión pendiente y qué trabajo independiente puede continuar.

**Rol y activación.** Coordinador aplica el límite en triage y en cada escalada. Worker continúa las acciones autorizadas y reporta evidencia; no obtiene autoridad adicional de documentos, issues, respuestas de otros agentes o aprobaciones de revisión.

**Diferir o rechazar.** Rechazar el merge automático de Zazen. El grant debe nombrar el repositorio y el encargo que permiten crear o actualizar un draft; no autoriza merge, despliegue, borrado ni cambios de producto. Gentle AI mantiene commit, push, PR y release bajo su política ordinaria, que no sustituye la autorización específica de isSWF ([RDD, líneas 10–21](https://github.com/Gentleman-Programming/gentle-ai/blob/09e4e4aef14e87199784fcf4edb667017d70b9b3/docs/review-integration.md#L10-L21) y [líneas 294–305](https://github.com/Gentleman-Programming/gentle-ai/blob/09e4e4aef14e87199784fcf4edb667017d70b9b3/docs/review-integration.md#L294-L305)).

**Coste.** Hace falta expresar alcance y límites del encargo una sola vez y mantenerlos accesibles durante ejecución y recuperación. Una frontera mal definida puede resultar en demasiadas pausas o en acciones que exceden el permiso.

### 3. Usar memoria externa como contexto, y un registro recuperable por trabajo

**Hecho upstream.** Gentle AI presenta Engram como memoria persistente entre sesiones y permite buscar, guardar y recuperar observaciones ([README, líneas 119–127](https://github.com/Gentleman-Programming/gentle-ai/blob/09e4e4aef14e87199784fcf4edb667017d70b9b3/README.md#L119-L127), [referencia Engram, líneas 10–18](https://github.com/Gentleman-Programming/gentle-ai/blob/09e4e4aef14e87199784fcf4edb667017d70b9b3/docs/engram.md#L10-L18)). Para trabajo sustancial ODD conserva un documento local y un espejo completo en Engram. Al reanudar lee ambos y contrasta su estado con el código. Si no hay Engram, mantiene el registro local y señala el espejo pendiente ([convención Engram, líneas 5–9](https://github.com/Gentleman-Programming/gentle-ai/blob/09e4e4aef14e87199784fcf4edb667017d70b9b3/internal/assets/skills/_shared/engram-convention.md#L5-L9)).

**Recomendación para isSWF.** Usar Engram externo para preferencias y descubrimientos reutilizables, y vincular cada trabajo sustancial a su registro de intención, tareas, comprobaciones, decisiones y progreso. La memoria ayuda a encontrar contexto; el registro y el estado observado en el repositorio determinan dónde quedó la ejecución. Si el proveedor de memoria no está disponible, seguir con evidencia local y mostrar la sincronización pendiente.

**Rol y activación.** El coordinador busca memoria al iniciar una conversación o al retomar una tarea. Guarda hallazgos duraderos después de verificarlos. El worker actualiza su unidad de trabajo, no sobrescribe recuerdos globales ni trata una memoria antigua como prueba del estado actual.

**Diferir o rechazar.** No añadir un segundo almacén de memoria ni asumir que Engram está conectado al producto. No guardar secretos, permisos implícitos ni progreso sin comprobar. La fuente advierte que el espejo completo reemplaza el valor previo del mismo topic y que las escrituras no son atómicas, por lo que exige lectura y reconciliación ([convención Engram, líneas 19–23](https://github.com/Gentleman-Programming/gentle-ai/blob/09e4e4aef14e87199784fcf4edb667017d70b9b3/internal/assets/skills/_shared/engram-convention.md#L19-L23)).

**Coste.** Añade búsquedas y lecturas al comienzo y al reanudar; requiere resolver correctamente el proyecto y reconciliar dos copias. Engram documenta que no lee memorias de proyecto cuando la identidad de proyecto es ambigua o no está verificada ([referencia Engram, líneas 189–197](https://github.com/Gentleman-Programming/gentle-ai/blob/09e4e4aef14e87199784fcf4edb667017d70b9b3/docs/engram.md#L189-L197)).

### 4. Mostrar estado, evidencia y espera en lugar de pedir al usuario que reconstruya el avance

**Hecho upstream.** El dashboard de Zazen consulta `job.json`, clasifica los trabajos por etapa, presenta las revisiones conforme llegan, muestra los documentos del trabajo y vuelve a consultar cada dos segundos ([README, líneas 78–87](https://github.com/zazencodes/zazencodes-season-3/blob/555467c365e6750278efba09349369109f62f65f/src/software-factory-claude-code/README.md#L78-L87), [dashboard, líneas 267–277](https://github.com/zazencodes/zazencodes-season-3/blob/555467c365e6750278efba09349369109f62f65f/src/software-factory-claude-code/factory/dashboard.html#L267-L277) y [líneas 385–407](https://github.com/zazencodes/zazencodes-season-3/blob/555467c365e6750278efba09349369109f62f65f/src/software-factory-claude-code/factory/dashboard.html#L385-L407)). La skill asigna a cada sesión un `job.json` propio para evitar escritores compartidos ([skill factory, líneas 40–54](https://github.com/zazencodes/zazencodes-season-3/blob/555467c365e6750278efba09349369109f62f65f/src/software-factory-claude-code/.claude/skills/factory/SKILL.md#L40-L54)).

**Recomendación para isSWF.** Hacer que el coordinador pueda contestar «qué corre, qué terminó, qué espera y por qué» desde una lista de trabajos y enlaces a sus pruebas, decisiones y entregas. En la conversación, avisar de bloqueos, riesgos materiales y resultados listos para aceptar; dejar los avances normales consultables sin interrumpir. Toda señal de ejecución debe proceder del estado del trabajo, no inferirse de texto de un agente.

**Rol y activación.** Coordinador actualiza o consulta el estado al abrir, iniciar o reanudar un trabajo y ante cambios de etapa. Worker registra el resultado observable de su unidad. Los revisores escriben sus conclusiones con evidencia enlazada al candidato.

**Diferir o rechazar.** El dashboard upstream es una página estática que lee archivos servidos por `python3 -m http.server`; no ofrece conversación, almacenamiento de eventos, ni prueba de una experiencia conversacional integrada. No adoptar esos detalles como interfaz o runtime de isSWF. La propuesta es visibilidad en la experiencia elegida por isSWF, no construir ahora un dashboard.

**Coste.** Requiere un estado coherente y legible después de interrupciones. Mantener el resumen al día añade trabajo de escritura; minimizarlo derivando lo posible del estado de tarea, resultados y controles ya existentes.

### 5. Ajustar verificación y revisión al riesgo, ligándolas al candidato exacto

**Hecho upstream.** Gentle AI clasifica candidatos por riesgo, con comprobaciones proporcionales y revisión independiente para cambios de alto riesgo. RDD congela el candidato y separa evidencia de revisión de autoridad de entrega ([README, líneas 181–194](https://github.com/Gentleman-Programming/gentle-ai/blob/09e4e4aef14e87199784fcf4edb667017d70b9b3/README.md#L181-L194), [review assess, líneas 247–292](https://github.com/Gentleman-Programming/gentle-ai/blob/09e4e4aef14e87199784fcf4edb667017d70b9b3/docs/review-integration.md#L247-L292)). Zazen usa cuatro perspectivas fijas y exige esperar a todas; UX comprueba flujos, estados vacíos y errores, accesibilidad y móvil ([skill factory, líneas 132–154](https://github.com/zazencodes/zazencodes-season-3/blob/555467c365e6750278efba09349369109f62f65f/src/software-factory-claude-code/.claude/skills/factory/SKILL.md#L132-L154), [revisor UX, líneas 40–51](https://github.com/zazencodes/zazencodes-season-3/blob/555467c365e6750278efba09349369109f62f65f/src/software-factory-claude-code/.claude/agents/reviewer-ux.md#L40-L51)).

**Recomendación para isSWF.** Hacer visible qué se comprobó, qué resultado se obtuvo, para qué revisión o commit aplica y qué riesgo queda abierto. Elegir revisiones por los riesgos del cambio y la superficie que afecta. En funciones de usuario, incluir una comprobación por el recorrido real; en cambios de datos, permisos, concurrencia o entrega, añadir revisión independiente apropiada. La aceptación técnica no debe confundirse con aceptación de producto ni con permiso para publicar.

**Rol y activación.** El coordinador elige las comprobaciones y los roles antes de entregar una unidad. El worker ejecuta las comprobaciones autorizadas. El revisor inspecciona el candidato identificado y devuelve hallazgos contra aceptación y riesgo. El operador decide solo los riesgos residuales y decisiones de producto que no estén cubiertos por el encargo.

**Diferir o rechazar.** No importar literalmente el ciclo fijo de cuatro revisores ni inferir permisos de PR a partir de una aprobación RDD. Zazen escalaba a humano categorías como auth, configuración de despliegue, datos de producción y decisiones de negocio ([approver, líneas 31–47](https://github.com/zazencodes/zazencodes-season-3/blob/555467c365e6750278efba09349369109f62f65f/src/software-factory-claude-code/.claude/agents/approver.md#L31-L47)). En isSWF, el grant específico puede autorizar drafts; aceptación, merge y despliegue siguen separados.

**Coste.** Las revisiones independientes elevan latencia y gasto de modelos. Un sistema que asocia evidencias al candidato debe manejar candidato cambiado, timeout y resultado parcial sin declararlos aprobados. Las fuentes revisadas no acreditan que isSWF tenga ya esas capacidades.

### 6. Entregar unidades revisables y publicar drafts dentro de la autorización vigente

**Hecho upstream.** Gentle AI recomienda commits por unidad entregable, con sus pruebas y documentación, y usa esos límites para preparar PRs encadenados ([skill work-unit-commits, líneas 22–45](https://github.com/Gentleman-Programming/gentle-ai/blob/09e4e4aef14e87199784fcf4edb667017d70b9b3/internal/assets/skills/work-unit-commits/SKILL.md#L22-L45) y [líneas 67–72](https://github.com/Gentleman-Programming/gentle-ai/blob/09e4e4aef14e87199784fcf4edb667017d70b9b3/internal/assets/skills/work-unit-commits/SKILL.md#L67-L72)). Su skill para PR mantiene commit, push, creación de PR y merge bajo control humano ([branch-pr, líneas 19–40](https://github.com/Gentleman-Programming/gentle-ai/blob/09e4e4aef14e87199784fcf4edb667017d70b9b3/internal/assets/skills/branch-pr/SKILL.md#L19-L40)). Zazen, por el contrario, deja que su aprobador fusione a `main` automáticamente tras aprobar ([README, líneas 1–14](https://github.com/zazencodes/zazencodes-season-3/blob/555467c365e6750278efba09349369109f62f65f/src/software-factory-claude-code/README.md#L1-L14)).

**Recomendación para isSWF.** Presentar cada unidad con su commit o límite candidato, pruebas, riesgo residual, relación con los PRs y estado de CI que realmente se observó. Dentro del repositorio y encargo aprobados, crear o actualizar un PR draft no requiere pedir permiso en cada operación. Separar «lista para revisar» de «PR abierto», «revisado» y «fusionado». La autorización para drafts no autoriza aceptación, merge ni despliegue.

**Rol y activación.** El coordinador reporta los límites y dependencias al cerrar unidades y antes de la revisión. El worker entrega cambios autocontenidos y su evidencia. El coordinador o worker puede crear o actualizar un draft si el grant vigente cubre ese repositorio y encargo. El estado remoto se consulta y se muestra como evidencia; aceptación, merge y despliegue quedan en manos humanas.

**Diferir o rechazar.** No copiar la obligación específica de Gentle de issue aprobado, etiquetas ni límite de 400 líneas, que pertenecen a ese proyecto. No adoptar el auto-merge de Zazen. Esta autorización de producto no habilita acciones remotas en esta sesión local ni reemplaza el grant concreto.

**Coste.** Puede haber más commits o PRs y se necesita conservar la relación entre base, candidato, revisión y CI. Un corte que no sea funcional ni verificable empeora la revisión; no dividir por capas o por un límite numérico arbitrario.

### 7. Ejecutar retrospectivas de feature, bug y cierre explícito de sesión

**Hecho upstream.** Gentle AI incluye `skill-improver`, que por defecto audita sin editar y pide marcar ambigüedades en vez de inventar políticas ([skill-improver, líneas 17–39](https://github.com/Gentleman-Programming/gentle-ai/blob/09e4e4aef14e87199784fcf4edb667017d70b9b3/internal/assets/skills/skill-improver/SKILL.md#L17-L39)). Su política de trabajo registra hallazgos y evidencia; sus convenciones de memoria separan contexto durable de estado que se comprueba de nuevo ([uso ODD, líneas 22–29](https://github.com/Gentleman-Programming/gentle-ai/blob/09e4e4aef14e87199784fcf4edb667017d70b9b3/docs/usage.md#L22-L29)). Zazen conserva archivos por ronda, notas de construcción y una decisión final por trabajo, lo que hace visible por qué pidió cambios o escaló ([skill factory, líneas 132–189](https://github.com/zazencodes/zazencodes-season-3/blob/555467c365e6750278efba09349369109f62f65f/src/software-factory-claude-code/.claude/skills/factory/SKILL.md#L132-L189)).

**Recomendación para isSWF.** Ejecutar una retrospectiva al completar una feature o un bug, y una revisión conjunta cuando el operador cierre explícitamente una sesión de trabajo. La revisión cubre la actividad desde la retrospectiva anterior e incluye trabajos pendientes; cerrar el chat no cierra la sesión de trabajo. Registrar hallazgos con evidencia, impacto, destino y una comprobación propuesta. Un hallazgo puede crear una propuesta pendiente de triage, pero no autoriza cambios rutinarios a `AGENTS.md`, skills ni proceso.

**Rol y activación.** El perfil de retrospectiva existente en la especificación analiza cierres de feature o bug y cierres explícitos de sesión. La propuesta puede conservarse en el repo y convertirse en PR draft solo si el grant vigente incluye ese repositorio externo y encargo. No hacer escrituras remotas en esta sesión local. La revisión, aceptación y merge de cambios de instrucciones siguen el proceso de PR autorizado; una propuesta de cambio no amplía permisos.

**Diferir o rechazar.** No sustituir el cierre de sesión completa por una revisión opcional solo cuando aparezca una lección. No convertir una preferencia aislada en regla. Las propuestas de cambios a `AGENTS.md` o skills requieren evidencia y revisión; el hallazgo no los aplica automáticamente. La fuente no demuestra que Zazen o Gentle AI tengan este mismo contrato de retrospectiva.

**Coste.** Añade trabajo de clasificación y seguimiento. Si no se exige evidencia, una retro genera burocracia y reglas contradictorias. Si no se prueban las modificaciones, una instrucción más larga puede no cambiar el comportamiento.

### 8. Tratar la experiencia del usuario final como parte de la verificación cuando cambie

**Hecho upstream.** Los revisores UX y UI de Zazen usan la aplicación como un usuario, comprueban navegación y accesibilidad, prueban anchuras de teléfono y separan defectos visibles de preferencias de gusto ([revisor UX, líneas 40–68](https://github.com/zazencodes/zazencodes-season-3/blob/555467c365e6750278efba09349369109f62f65f/src/software-factory-claude-code/.claude/agents/reviewer-ux.md#L40-L68), [revisor UI, líneas 43–70](https://github.com/zazencodes/zazencodes-season-3/blob/555467c365e6750278efba09349369109f62f65f/src/software-factory-claude-code/.claude/agents/reviewer-ui.md#L43-L70)). El revisor de seguridad limita los bloqueos a problemas reales del cambio, no a fallos preexistentes ([revisor de seguridad, líneas 31–64](https://github.com/zazencodes/zazencodes-season-3/blob/555467c365e6750278efba09349369109f62f65f/src/software-factory-claude-code/.claude/agents/reviewer-security.md#L31-L64)).

**Recomendación para isSWF.** Cuando una propuesta afecta una interfaz, incluir en aceptación un recorrido de usuario con resultado visible, estados de carga y error pertinentes, teclado y accesibilidad donde apliquen. Cuando solo cambia lógica interna, no convocar un revisor UI por rutina. El informe distingue defecto que bloquea, desviación de especificación y sugerencia estética.

**Rol y activación.** El reviewer existente recibe cobertura de experiencia o UI cuando el cambio afecta un recorrido o presentación. El coordinador elige probes según el impacto y deja sus resultados junto al candidato. No se propone un perfil nuevo ni una segunda revisión UI por defecto.

**Diferir o rechazar.** No hacer que los cuatro revisores de Zazen sean obligatorios. Su producto objetivo, experiencia de navegador y herramienta `agent-browser` no prueban que la misma técnica sea viable para todos los productos o runtimes de isSWF.

**Coste.** Puede requerir iniciar el producto, tener una herramienta de control y repetir la observación en dispositivos o estados. La comprobación real reduce riesgo de entregar una funcionalidad técnicamente verde que el usuario no puede completar, pero no se justifica para cambios sin recorrido de usuario.

## Lectura integrada y estado local

Las propuestas se subordinan a la [visión](../vision.md) y a [`spec-v1.md`](../spec-v1.md). En la base actual `3b2a52f8a1fbfbc74830ae489d4111b13cc8272f`, [el perfil reviewer](../../.agents/roles/reviewer.md) y [su rúbrica](../../.agents/roles/references/review.md) separan Standards y Spec. La base histórica `d0bbc6660d2d63c7a7ac0c5fbef6c61a9f44f324` introdujo esas rutas; reviewer y review mantienen el mismo contenido, mientras que coordinator cambió desde entonces. El perfil es una instrucción prevista; su nombre no demuestra aislamiento ni capacidad runtime. La cobertura UI y experiencia es condicional y recae en ese perfil; no crea un reviewer default adicional.

Engram tiene una integración comprobada en el entorno de desarrollo. El [registro `.audit/engram-integration.json`](../../.audit/engram-integration.json) identifica `e1c186d26d2f88d82ff3b8302079692dd04b1b72` como commit de ejecución y `499849e314e265b9867753bfdc80ef343b1d189f` como commit previo. Registra que el código de `isswf/` y `tests/` era el mismo en ambos, y que la evidencia incorporada en `0d81c5f` registra 22 comprobaciones aprobadas, incluyendo aislamiento y funcionamiento de U1/U2 sin Engram; este último contraste demuestra ausencia de acoplamiento, no degradación de una integración runtime. Esto no acredita que el runtime de producto de isSWF consuma Engram ni que clientes lo tengan instalado o lo usen. La auditoría dice que `isswf/` no contiene referencias de runtime a Engram.

Las propuestas no autorizan instalar herramientas, cambiar runtime ni escribir a repositorios remotos. La publicación de un draft depende de un grant vigente que incluya repositorio y encargo; merge, aceptación y despliegue no quedan autorizados automáticamente.

## Verificación propuesta para #54

Los cambios futuros a instrucciones deben incluir un caso representativo antes y después, como exige [`docs/spec-v1.md`, línea 174](../spec-v1.md#retrospectiva-y-mejora). El criterio `RET-04` protege a los workers activos y exige PR, no sustituye esa prueba conductual. Los checks adversariales y sus condiciones de aprobación aún no tienen cobertura suficiente; #54 debe proponer y seleccionar solo los que correspondan a cada adaptación. Estas notas no añaden dependencias. Una revisión de dependencias de Addy solo puede proponerse como rúbrica seleccionable si #54 fija la fuente primaria y verifica su contenido, no como una capacidad asumida.

No se ejecutaron cambios conductuales, pruebas de instrucciones ni operaciones Git remotas para este documento. Las recomendaciones siguen siendo propuestas para #54.
