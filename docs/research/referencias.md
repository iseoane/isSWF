# Referencias para isSWF

## Alcance de la investigación

Esta nota compara las referencias con la intención expresada por el usuario. Se consultaron README y archivos representativos de sus ramas `main`. Los enlaces son mutables; no se ha fijado una versión para incorporar código. Esta comparación inicial es documental y de código fuente, no una evaluación de resultados de los agentes. Para Pstack se realizó después un [análisis profundo de composición de agentes y skills](pstack-agentes.md), con revisiones fijadas, recorridos completos y pruebas offline de mecanismos del port. La presente nota es el mapa inicial de las cinco referencias, no sustituye ese análisis.

La investigación delegada falló por un límite de uso del proveedor antes de devolver hallazgos. La consulta se continuó directamente. Ese fallo no es evidencia contra ninguno de los proyectos analizados.

## Requisitos acordados

- Uso personal inicialmente, con posibilidad de aplicarlo a clientes cuando demuestre calidad.
- Un proyecto y un coordinador conversacional inicialmente. La coordinación entre proyectos queda para más adelante.
- Ciclo completo de producto, con entradas que pueden ser ideas, issues definidas o bugs.
- Triage antes de ejecutar, con entrevista solo cuando falte información necesaria.
- Trabajos paralelos en background mientras el usuario conversa y prepara otros trabajos con el coordinador.
- Dependencias bloqueantes para los trabajos afectados.
- Participación humana especialmente al definir el trabajo y aceptar el resultado.
- TDD opcional según el trabajo. No hay un flujo fijo obligatorio.
- Verificación de comportamiento y revisiones con criterios específicos de producto y de ingeniería.

El usuario confirma una ficha breve por trabajo con el tratamiento elegido y su motivo, dependencias, comprobaciones y decisiones pendientes. Puede corregir ese tratamiento. También confirma notificar decisiones que solo él puede tomar, riesgos importantes y entregas listas para aceptar. Los avances normales quedan disponibles en el panel y en resúmenes bajo petición.

El usuario añade [Gentle AI](https://github.com/Gentleman-Programming/gentle-ai) como quinta referencia y señala que lo utiliza con frecuencia. Se consultaron su README y la documentación de componentes de `main`. No se ha comprobado qué versión utiliza el usuario.

## Zazencodes aporta un tablero funcional, pero un proceso fijo

El [README de la factory](https://github.com/zazencodes/zazencodes-season-3/blob/main/src/software-factory-claude-code/README.md) describe una skill, siete subagentes y estado persistido en archivos. Su [dashboard HTML](https://github.com/zazencodes/zazencodes-season-3/blob/main/src/software-factory-claude-code/factory/dashboard.html) consulta los directorios y los archivos `job.json`, muestra tarjetas por etapa y permite leer los informes Markdown. No es solamente un diagrama. La documentación indica que se sirve con `python3 -m http.server`.

La [skill factory](https://github.com/zazencodes/zazencodes-season-3/blob/main/src/software-factory-claude-code/.claude/skills/factory/SKILL.md) establece un proceso fijo de especificación, construcción, cuatro revisiones y aprobación. Cada sesión orquesta un trabajo. Para ejecutar varios trabajos, propone varias sesiones de Claude Code. Cada trabajo tiene su propia rama, worktree, puertos y archivo de estado.

La aprobación puede desembocar en merge automático; no hace push. La política de revisión fija y la aprobación automática no se deben trasladar sin adaptar a las decisiones del usuario.

**Propuesta para isSWF.** Adoptar la visibilidad de trabajos, evidencias y decisiones pendientes. No adoptar su proceso fijo ni asumir que ofrece ya un coordinador único que conversa y gestiona todos los trabajos.

## Matt Pocock aporta triage y separación entre especificación y estándares

La [skill triage](https://github.com/mattpocock/skills/blob/main/skills/engineering/triage/SKILL.md) distingue categorías de bug y mejora, y estados como `needs-info`, `ready-for-agent` y `wontfix`. Lee notas previas para no repetir preguntas. Comprueba si el comportamiento solicitado ya existe y si una petición similar fue rechazada. Para bugs, pide verificar la afirmación. La entrevista aparece expresamente como condicional.

No es un triage completamente desatendido: recomienda categoría y estado, y espera dirección del mantenedor. Adaptarlo a un coordinador que pueda arrancar encargos claros requiere definir esa autoridad.

La [skill code-review](https://github.com/mattpocock/skills/blob/main/skills/engineering/code-review/SKILL.md) separa dos revisores: cumplimiento de estándares y cumplimiento de la especificación. Incluye heurísticas sobre duplicación, abstracciones especulativas y wrappers que solo delegan. Las heurísticas no son automáticamente infracciones y los estándares del proyecto prevalecen.

El [README](https://github.com/mattpocock/skills/blob/main/README.md) presenta skills pequeñas y componibles, pero también recomienda entrevistar en cada cambio y describe implementación mediante TDD. La adaptación debe seleccionar mecanismos concretos, no adoptar todas sus recomendaciones como reglas globales.

**Propuesta para isSWF.** Adoptar triage con memoria, vocabulario compartido, briefs duraderos y revisión independiente de lo pedido. Ampliar esta última con comprobación de uso real; revisar un diff contra una spec no valida por sí solo el valor del producto.

## Pstack original y port tienen diferencias declaradas

El [README del port](https://github.com/michael-denyer/pstack-claude/blob/main/README.md) identifica el original de Lauren Tan, poteto, en [cursor/plugins/pstack](https://github.com/cursor/plugins/tree/main/pstack). El port ofrece soporte para Claude Code, Codex, Pi y GitHub Copilot. Su [registro de forks](https://github.com/michael-denyer/pstack-claude/blob/main/tools/forks.json) declara cambios de política y de adaptación. No es solo una copia del original.

El [README original](https://github.com/cursor/plugins/blob/main/pstack/README.md) describe workflows de ingeniería y revisiones. También aclara que `deslop` y los drivers de control pertenecen a `cursor-team-kit`, no al paquete Pstack original.

Las skills TDD del [original](https://github.com/cursor/plugins/blob/main/pstack/skills/tdd/SKILL.md) y del [port](https://github.com/michael-denyer/pstack-claude/blob/main/plugins/pstack/skills/tdd/SKILL.md) son explícitamente condicionales. Se aplican por petición o ante un bug con un test local barato. Si el test no es práctico, proponen otra comprobación ejecutable. Esto coincide con el requisito de no imponer TDD.

El [deslop del port](https://github.com/michael-denyer/pstack-claude/blob/main/plugins/pstack/skills/deslop/SKILL.md) tiene objetivos concretos: comentarios sobrantes, defensas impropias de código interno, casts para evitar errores de tipos y anidamiento innecesario. [No-comments](https://github.com/michael-denyer/pstack-claude/blob/main/plugins/pstack/skills/no-comments/SKILL.md) también puede activar correcciones y cambios de estructura. No se debe tratar como una lectura inocua ni importar como prohibición absoluta de comentarios.

No se ha comparado el historial de actualizaciones para determinar cuál está más al día. El original y el port deben evaluarse por capacidad y política, además de por versión.

**Propuesta para isSWF.** Adoptar selección de workflows y revisiones especializadas. Mantener separado el diagnóstico de los revisores de la autoridad para modificar código.

## Addy Osmani aporta criterios de calidad, con obligaciones que hay que adaptar

El [README](https://github.com/addyosmani/agent-skills/blob/main/README.md) describe skills para requisitos, arquitectura, interfaces, seguridad, rendimiento, documentación y entrega. Advierte que la instalación individual puede omitir referencias compartidas.

[Using-agent-skills](https://github.com/addyosmani/agent-skills/blob/main/skills/using-agent-skills/SKILL.md) afirma que no todos los trabajos necesitan todas las skills, pero establece comportamientos globales y pasos obligatorios dentro de las skills elegidas. El README describe `/build auto` como ejecución autónoma con cada tarea guiada por tests. Esto necesita adaptación al requisito de TDD opcional.

[Code-review-and-quality](https://github.com/addyosmani/agent-skills/blob/main/skills/code-review-and-quality/SKILL.md) revisa corrección, legibilidad, arquitectura, seguridad y rendimiento. Incluye reutilizar el helper canónico, evitar abstracciones sin necesidad y diferenciar hallazgos obligatorios de sugerencias. Su estándar no exige perfección: aprobar cuando el cambio mejora la salud del código y respeta sus convenciones.

**Propuesta para isSWF.** Adoptar criterios específicos, severidades y comprobación de las evidencias. No convertir su ciclo de vida completo en una secuencia obligatoria para cualquier trabajo.

## Gentle AI aporta memoria y procedimientos proporcionales

El [README](https://github.com/Gentleman-Programming/gentle-ai/blob/main/README.md) presenta Gentle AI como configuración para agentes existentes, no como un agente nuevo. Describe Engram para memoria entre sesiones y ODD, Organic Driven Development, para mantener trabajos claros y de riesgo contenido ligeros, y conservar un documento recuperable en trabajos sustanciales. La clasificación atiende a comprensión, riesgo y recuperación, no solo a cantidad de archivos.

La [documentación de componentes](https://github.com/Gentleman-Programming/gentle-ai/blob/main/docs/components.md) indica que, desde v4.0.0, SDD y las skills `sdd-*` se retiran en favor de ODD. Advierte que `main` puede contener cambios aún no publicados. No debemos equiparar lo consultado con la versión que el usuario usa ni ejecutar una actualización como parte de esta investigación.

El README describe desarrollo test-first por defecto cuando existe un test ejecutable relevante y un resultado esperado claro. Sin un test significativo, pide explicar la excepción y realizar comprobaciones funcionales. Es una política más condicional que imponer TDD siempre, pero todavía hay que contrastarla con la política propia de isSWF.

También describe RDD, Receipt-Driven Development, con evidencia vinculada al candidato concreto y profundidad de revisión proporcional al riesgo. El resultado es informativo y no autoriza por sí mismo commit, push o release. Estas descripciones documentales no prueban que todos los adaptadores tengan paridad de comportamiento.

El README separa Gentle Shell, una integración con runtime e interfaz propios para Pi, de Gentle AI. No se ha investigado Gentle Shell a fondo ni elegido como base. Engram y las skills específicas de frameworks también tienen repositorios separados según la documentación de componentes.

**Propuesta para isSWF.** Evaluar memoria entre sesiones, registros recuperables y evidencias asociadas a una versión exacta. La elección proporcional del procedimiento encaja con lo pedido. La regla que evita delegar trabajos pequeños debe adaptarse si ejecutarlos en el coordinador impide que el usuario siga conversando.

## Slices verticales y cierre progresivo

El usuario aclara que Pstack le interesa por workers que aplican skills según el trabajo, no solo por TDD. También pide comportamiento funcional desde las primeras slices verticales y señala que puede acumular unas 4000 líneas sin commit ni PR.

[To-tickets de Matt](https://github.com/mattpocock/skills/blob/main/skills/engineering/to-tickets/SKILL.md) exige que las slices recorran un camino completo y acotado, sean demostrables o verificables y declaren bloqueos. No obliga a tocar capas que el comportamiento no necesita. Reconoce excepciones para refactors mecánicos amplios.

[Implement-spec](https://github.com/mattpocock/skills/blob/main/skills/engineering/implement-spec/SKILL.md) trabaja sobre un grafo de tickets, con implementadores en background y worktrees propios. Propone un PR draft tras la primera integración cuando el tracker usa PRs o el usuario lo pide. Su implementación exige TDD: adoptar slices y entrega temprana no obliga a trasladar esa regla a isSWF.

El [worker de Pstack](https://github.com/michael-denyer/pstack-claude/blob/main/plugins/pstack/agents/poteto-agent.md) lee el estilo y los principios de poteto-mode. Su [playbook de feature](https://github.com/michael-denyer/pstack-claude/blob/main/plugins/pstack/skills/poteto-mode/playbooks/feature.md) delega con alcance y criterios concretos, aísla escritores y pide construir, verificar y commitear unidades pequeñas antes de continuar.

**Propuesta para isSWF.** Vincular cada slice a una comprobación y un commit, y publicar entregas revisables progresivamente. En esta comparación inicial, la autoridad para abrir PRs y el agrupamiento de slices aún requerían acuerdo. La [visión](../vision.md) recoge la autorización posterior para commits y draft PRs dentro del repositorio y encargo aprobados; la [especificación](../spec-v1.md) propone su agrupamiento. No imponer un límite arbitrario de líneas como sustituto de una entrega coherente.

## Navegabilidad y carga del lector

El usuario pide aplicar navegabilidad tanto a isSWF como a los proyectos generados. Se consultaron los cuerpos completos de las siguientes fuentes, no solo sus descripciones.

[Codebase-design de Matt](https://github.com/mattpocock/skills/blob/main/skills/engineering/codebase-design/SKILL.md) propone módulos con interfaces pequeñas que ocultan complejidad significativa. Su criterio es la capacidad que obtiene el consumidor y la concentración de cambios, conocimiento y verificación. Rechaza medir esa profundidad como un cociente de líneas. Su prueba de eliminación pregunta si borrar un wrapper elimina complejidad o simplemente la traslada a todos los consumidores.

[Improve-codebase-architecture](https://github.com/mattpocock/skills/blob/main/skills/engineering/improve-codebase-architecture/SKILL.md) busca fricción real, especialmente donde entender un concepto exige saltar entre muchos módulos, y prioriza zonas que cambian con frecuencia. Presenta candidatos con visuales antes y después, sin proponer una reestructuración global por defecto. Está informado por el glosario del dominio y las decisiones existentes.

El principio [minimize-reader-load de Pstack](https://github.com/michael-denyer/pstack-claude/blob/990cd7b02ac6f3e8f825716f7c72e2f06d8f4a92/plugins/pstack/skills/principle-minimize-reader-load/SKILL.md) separa dos costes: las capas que hay que seguir y el estado que el lector tiene que recordar. Pide colapsar wrappers sin utilidad, reducir el alcance del estado y justificar cada nueva capa por la complejidad que ahorra en otro lugar. Una implementación plana llena de estado global tampoco cumple ese objetivo.

La [lente de calidad de interrogate](https://github.com/michael-denyer/pstack-claude/blob/990cd7b02ac6f3e8f825716f7c72e2f06d8f4a92/plugins/pstack/skills/interrogate/references/code-quality-review.md) concreta reutilizar helpers canónicos, evitar abstracciones que solo delegan y bloquear complejidad evitable. Incluye una heurística de tamaño de archivo, pero no convierte el tamaño en prueba de comprensión.

**Propuesta para isSWF.** Incorporar estos criterios al diseño y a las revisiones pertinentes, y usar comprobaciones estructurales cuando el stack las permita. Un mapa de carpetas o AGENTS.md no compensa un código innecesariamente indirecto. No se ha demostrado todavía una implementación navegable, porque isSWF aún no tiene código de producto.

## Conclusión provisional

La combinación útil no es instalar cinco autoridades globales que elijan el proceso simultáneamente. La propuesta es tener una política de isSWF que seleccione prácticas según claridad, riesgo, dependencias y comprobaciones disponibles.

Zazencodes aporta un ejemplo de visibilidad del estado. Matt aporta triage y alineamiento con el encargo. Pstack aporta workflows adaptativos y revisiones especializadas. Addy aporta criterios de ingeniería y calidad. Gentle AI aporta memoria, recuperación y revisión ligada al candidato. Esta distribución es una propuesta de integración, no una capacidad de un sistema que ya hayamos construido.

El coordinador conversacional que gestiona varios trabajos en background sigue siendo un requisito propio. Ninguna de las lecturas realizadas demuestra por sí sola que esa experiencia completa ya esté resuelta.

## Licencias y límites pendientes

Se verificaron licencias MIT de [Matt](https://github.com/mattpocock/skills/blob/main/LICENSE), [Addy](https://github.com/addyosmani/agent-skills/blob/main/LICENSE) y del [port Pstack](https://github.com/michael-denyer/pstack-claude/blob/main/LICENSE). La licencia exige conservar los avisos correspondientes. El port también señala avisos de los componentes importados. No se verificó la licencia aplicable al subdirectorio de Zazencodes.

Antes de copiar contenido hay que fijar versiones y comprobar licencias y referencias completas. Antes de elegir runtime hay que comprobar que permita conversación disponible, ejecución background, persistencia y recuperación tras fallo. Pi se eligió posteriormente como runtime de agentes. Todavía no se han elegido ni probado el mecanismo de ejecución independiente del chat, el almacenamiento operativo o la arquitectura de implementación.
