# Arquitectura candidata de isSWF

Estado: propuesta técnica revisada con spikes locales de ciclo de vida y aislamiento offline. La integración de la factory y el acceso seguro al modelo siguen pendientes. La primera unidad U1 tiene registro y panel locales; no implementa todavía el ejecutor propuesto. La [visión](vision.md) y la [spec](spec-v1.md) siguen definiendo el producto. Las pruebas actuales verifican piezas, no una factory integrada.

## Decisión que hay que tomar

Cómo permitir que el coordinador converse mientras ejecuta trabajos, sin convertir los procedimientos Markdown en un framework de código. El punto central es quién conserva procesos, permisos y estado cuando el chat desaparece, no el nombre del protocolo.

Dos candidatos independientes, GLM y DeepSeek, propusieron un dueño local de ejecución y workers Pi por proceso. Un cross-judge GLM contrastó ambos con la spec y señaló fallos que se corrigen en esta síntesis. Una revisión final DeepSeek no encontró bloqueantes de definición; sus aclaraciones se incorporan abajo. Estos juicios no demuestran la implementación.

## Alternativas comparadas

| Forma | Qué reutiliza | Qué falta y qué añade |
| --- | --- | --- |
| Pstack dentro de la sesión actual | Lanzamiento, perfiles, skills, modelos, background, mensajes y worktrees. | Su cierre detiene hijos en el snapshot analizado. No cumple continuidad fuera del chat por sí solo. |
| Supervisor externo con Pi RPC | Protocolo y procesos Pi existentes; prácticas y recursos Pstack compatibles. | Dueño local de estado y procesos, entrada pequeña, barreras y reconciliación. Separación de fallos entre worker y supervisor. |
| Supervisor externo con SDK Pi | API directa, sesiones y recursos Pi. | El SDK puede vivir fuera del chat. Si comparte proceso con la autoridad, reduce separación de fallos; no muere con el chat necesariamente. |
| Servicio A2A con executor Pi | Mensajes, consultas, artefactos y stores ya existentes. SDKs recientes añaden mecanismos de estado y eventos compartidos. | Adaptar autorización, intentos y aceptación de isSWF; supervisar Pi. Añade interfaz de servicio, autenticación y negociación de versión. No exige servidor por worker ni doble store. |

La base propuesta para el primer spike es supervisor externo + Pi RPC. Es una preferencia por alcance local y separación de fallos, no una demostración de menor coste ni una prohibición de A2A. Si una prueba integrada muestra que A2A ahorra implementación sin duplicar estado, se revisa esta preferencia.

## Forma propuesta

```text
Operador ↔ coordinador Pi
                 │ referencia de trabajo / consulta / decisión autorizada
                 ▼
       Un ejecutor local independiente del chat
          ├─ estado operativo y autorizaciones
          ├─ intentos y espacios exclusivos
          └─ Pi RPC por intento → perfil + brief + skills
                 │
                 └─ estado y artefactos → panel de lectura
```

Los procedimientos de producto, planificación, investigación, implementación, revisión y retrospectiva siguen en Markdown. El ejecutor no selecciona entrevista o TDD mediante un pipeline codificado. Impone las condiciones estructurales de ejecución, permisos y límites.

Pstack sigue siendo referencia y soporte de construcción. Se reutilizan perfiles, selección de skills y mecanismos comprobados donde sean compatibles. No se copia todo su runner suponiendo que su ownership de sesión ya encaje con el nuevo ciclo de vida. Tampoco se implementan de nuevo todos los comandos de Git, gh o Pi.

## Interfaz del coordinador

Solo como contrato conceptual, sin CLI o herramientas nuevos implementados:

```text
delegar(referenciaDeTrabajo) → referenciaDeIntento
consultar(referenciaDeTrabajo o proyecto) → estado y antigüedad
solicitar(referenciaDeTrabajo, intenciónAutorizada) → recibo de la solicitud
```

Una intención tiene variantes explícitas, como cancelar, reanudar o registrar una decisión humana. No es una bolsa libre de parámetros. El ejecutor comprueba identidad, alcance y revisión esperada antes de admitirla. Un ACK no significa que el worker terminó ni que una cancelación se confirmó.

El brief, perfil, base, modelos y límites se resuelven desde el trabajo. No se vuelven a pasar en cada delegación. Una solicitud repetida del mismo trabajo y revisión se reconcilia con el intento existente; un intento nuevo exige una transición válida y no solo repetir el mensaje.

El transporte de esta entrada sigue pendiente: no se elige ahora entre CLI local, socket o una fachada A2A. La interfaz de dominio no incluye tipos wire de Pi o A2A.

## Datos y ownership

| Dato | Contenido mínimo | Autoridad |
| --- | --- | --- |
| Trabajo | Identidad, brief vigente, autorización, estado, prioridad y condiciones de dependencia. | Ejecutor; el coordinador solicita cambios. |
| Intento | Identidad propia, revisión del trabajo, destino y effort, instrucciones fijadas, base, espacio y estado de proceso. | Ejecutor. |
| Resultado | Artefactos, candidato, comprobaciones, hallazgos, dudas y referencias de origen. | Agente produce artefacto; ejecutor valida referencias y registra recepción. |
| Decisión | Tipo, brief y candidato cubiertos, referencia al cierre técnico si acepta una entrega, o confirmación de integración con su revisión resultante. Actor autorizado y motivo. | Decisión del operador o del coordinador dentro de su autoridad; registro del ejecutor. |
| Efecto | Intención, trabajo/intento, identificadores conocidos, resultado confirmado o incierto. | Ejecutor. |

Cada intento distingue reservado, activo, detención solicitada, detenido e identidad o cese inciertos. La incertidumbre de un efecto remoto se registra aparte: no significa por sí misma que el proceso siga vivo. La identidad de proceso no se reduce a PID. Cada estado contiene los datos que lo justifican; no se usan booleanos independientes para declarar terminado, aceptado e integrado.

Las invariantes de la implementación futura son explícitas:

| Condición | Consecuencia |
| --- | --- |
| Resultado recibido sin revisión requerida | No hay cierre técnico ni paso a aceptación. |
| Aceptación humana | Referencia un cierre técnico, brief y candidato concretos. |
| Código integrado | Requiere confirmación humana de integración, además de aceptación vigente. |
| Detención solicitada o escritor incierto | Conserva reserva de espacio y capacidad potencial hasta comprobar cese. |
| Trabajo bloqueado sin ejecución activa | No consume slot de ejecución. |
| Configuración nueva | Se aplica a un intento nuevo, no al activo. |

Bloqueo del trabajo y actividad del intento son dimensiones distintas. No se adopta la regla «bloqueado implica ningún proceso activo»: ante incertidumbre sería insegura.

El formato de almacenamiento está pendiente. Hay una sola autoridad operativa; panel, GitHub y Engram no mantienen otras copias editables. Los JSONL de Pi conservan conversación, no reemplazan ese registro. El worker no escribe directamente la base operativa ni puede cambiar su autorización.

Una eventual fachada A2A debe definir primero su correspondencia: tarea por intento, trabajo u otra unidad. Su TaskStore debe leer de la autoridad o formar parte de ella, sin dos estados sincronizados manualmente. `COMPLETED` no se mapea a integración humana.

## Recorrido y fallos

1. El coordinador prepara un encargo autorizado. Aplica la skill de planificación o delega el planificador tras grounding proporcional. El plan define slices, unidades comprobables, puntos de commit y agrupación en PRs.
2. El ejecutor registra el intento antes de iniciarlo, fija recursos/configuración, reserva espacio y capacidad, y controla su proceso Pi. Mantiene sus canales fuera del ciclo de vida del chat.
3. El agente ejecuta el brief y produce evidencias. `agent_settled` solo dispara inspección de resultado y estado; no cierre técnico.
4. El coordinador contrasta alcance y evidencia, delega revisión independiente y gestiona correcciones. Solo tras las comprobaciones requeridas solicita cierre técnico y aceptación humana cuando corresponda.
5. La aceptación se vincula al candidato exacto. La integración del código sigue siendo humana. Una dependencia de código no se desbloquea por publicar un draft o aceptar sin merge.

Al cancelar se retiran entradas pendientes antes de abortar el run. Después se comprueba cese del proceso y descendientes y se reconcilian efectos. Una solicitud o snapshot `CANCELED` no libera por sí mismo el espacio.

Al recuperar o hacer fallback se reconcilian identidad, archivos, commits, candidato e intenciones. Un resultado remoto perdido no se repite sin buscar su efecto. Si no puede comprobarse que el escritor anterior dejó de actuar, el intento queda incierto y conserva su reserva. Otros trabajos compatibles avanzan dentro de la capacidad realmente disponible.

Un grupo de revisión registra cada participante como ejecución referenciada y comparte los límites globales. El grupo no es un proceso adicional que ocupe un slot esperando a sus revisores; el coordinador recoge resultados y puede programar participantes sucesivamente.

El panel visual observa la misma fuente y muestra antigüedad. Una conversación nueva no interpreta recuerdos Engram como prueba de ejecución ni cambia instrucciones de intentos activos.

## Fronteras que hay que demostrar

Ocultar un socket, disponer de un worktree o quitar edit/write no impide por sí solo acciones fuera de alcance. El ejecutor construye comandos RPC de una lista permitida tras validar la solicitud de dominio; no transmite directamente JSON RPC, nombres de método o comandos de shell aportados por el modelo. El texto del brief puede ser contenido de un prompt, pero no controla el método que lo envía. Hay que probar acceso a archivos, shell, red, credenciales y canal de control. El reviewer no puede modificar el candidato; sus comprobaciones pueden necesitar un entorno de prueba separado.

El modelo y los subprocesses que sus herramientas lancen no deben acceder a autoridad operativa, credenciales de publicación ni canales privilegiados. Las operaciones externas con esos permisos pasan por el dueño que valida el alcance y registra intención y resultado; no basta reconstruirlas desde un informe posterior. Debe imponerse esa separación o bloquear el perfil que no pueda cumplirla. No se presenta un sandbox elegido ni se promete protección contra cualquier código hostil.

Los recursos se fijan por intento, incluidas referencias de skills necesarias; no basta guardar un hash y permitir leer un archivo mutable distinto. El mecanismo de fijación también necesita una prueba. Las rutas de modelo respetan destinos autorizados, compatibilidad de effort y límites globales, incluyendo reintentos internos de Pi.

## Evidencia y síntesis

Se conservan [trazado y pruebas de Pi](research/pi-runtime.md), [contrato A2A](research/a2a.md) y [pruebas JS](research/a2a-js.md). La comparación usa snapshots fijados. El riesgo de ownership observado en Python histórico no se usa contra la versión actual: en 1.2.2 se contrastó su corrección.

Los candidatos A y B convergieron en ownership externo + RPC. El padre prefería inicialmente A por su explicación del dominio de fallo; el cross-judge prefirió B1 por separar resultado y cierre técnico. Tras contrastar ambos motivos, la síntesis usa B1 como base conceptual y conserva de A la separación de fallos y reconciliación de efectos. Reduce la interfaz a referencias y añade las invariantes anteriores.

Se rechazan brief duplicado en la llamada, entrega directa a aceptación, orden de cancelación invertido, generalización de SDK ligado al chat y supuesto de que A2A obliga a duplicar estado. Tampoco se implementa ahora una fachada A2A vacía. El control debe demostrarse inaccesible al worker; no se considera protegido por declararlo. La revisión final DeepSeek encontró solo aclaraciones sobre decisiones, incertidumbre, grupos de revisión y frontera RPC, incorporadas en esta versión. Sigue pendiente probar la propuesta integrada.

## Spike local y siguiente unidad

El [spike de ciclo de vida](research/pi-lifecycle.md) comprobó procesos cliente separados del dueño, Pi RPC real, consulta posterior, parada normal, crash activo, un writer separado de sesión e identidad esperada incorrecta. La recuperación observada detiene ejecuciones conocidas sin relanzarlas; no reengancha pipes ni mantiene Pi tras caer su dueño. No equivale a restaurar el chat real o a tener una factory integrada.

El hijo separado sobrevivió a abort y pérdida de pipes hasta reconciliar su identidad y detenerlo. El [spike de aislamiento offline](research/pi-isolation.md) comprobó ahora contención de un writer separado que ignora SIGTERM, restricciones de archivos y canales ficticios, y un reviewer readonly con scratch. Pi RPC real se usó para los permisos. La contención se ensayó con carga Python separada, no con un run de modelo. La revisión independiente no encontró bloqueantes para esos casos.

Bubblewrap queda como candidato local, no como sandbox adoptado para producción. La red aislada y el HOME vacío de la prueba impiden usar directamente la autenticación habitual de Pi. Antes de ejecutar código de clientes en S02 hay que resolver acceso al modelo sin exponer credenciales a herramientas, perfiles de mounts, recursos y ventanas de arranque. Activar red y montar auth.json no demuestra esa separación.

La primera unidad de S01 ya prepara y muestra encargos ficticios sin ejecutar código de clientes; su [guía](u1-usage.md) describe lo comprobado. Falta completar S01 y demostrar una issue real autorizada. La entrada A2A no bloqueante sigue como comparación pendiente, no como requisito ni opción descartada. La elección de almacenamiento, supervisión OS y transporte sigue pendiente de integración. Las PRs encadenadas siguen como capacidad deseada pendiente de ampliar explícitamente el contrato v1; este diseño no las habilita por accidente. Este documento no concede permisos de ejecución. El operador autorizó posteriormente construir U1 local; una issue externa sigue sin conceder permiso para ejecutar código ni publicar.
