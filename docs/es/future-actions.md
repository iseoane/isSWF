# Posibles acciones futuras

[Inicio](../../README.es.md) · [Documentación](index.md) · [English](../en/future-actions.md)

Son propuestas, no funcionalidades implementadas, un calendario de entrega ni permisos para ejecutar trabajos. Antes de abordar una, comprueba el código actual y acuerda el alcance. Los planes existentes registran decisiones; no demuestran que esté implementado todo lo previsto.

## Distribución

Una vez comprobado y aceptado el trabajo local actual, acordar cómo publicar la primera release y sustituir los ejemplos de instalación desde una carpeta local por su origen real. Mantener la misma versión en el paquete de Pi, el núcleo y el plugin de Claude. Publicar y hacer nuevas pruebas reales con Claude siguen siendo decisiones separadas.

### Evaluar ejecutables con Node SEA y Bun

Registro histórico de evaluación: los resultados siguientes describen los hashes de prototipos fijados, no la implementación posterior. Después, el operador eligió Bun y autorizó implementarlo en I0006. El comportamiento actual de construcción y ejecución se documenta en [instalación](installation.md) y [desarrollo](development.md). El desarrollo sigue con Node.js y `.mjs`; publicación, pruebas con SDK o proveedores reales, revisión independiente y ejecución fuera de Linux siguen siendo aspectos separados.

Usar el mismo código confirmado en Git y los mismos datos de prueba para tres candidatos: el paquete actual con Node.js como referencia, un ejecutable Node SEA y otro Bun. Entregar el ejecutable junto con los recursos que leen los agentes, no un binario que oculte las skills. Mantener alineadas las versiones de Pi, núcleo y plugin de Claude. Esta propuesta no modifica el alcance aceptado de I0005 ni su aceptación pendiente.

#### 1. Fijar entradas e inspeccionar los puntos de adaptación

Registrar el SHA del código, los hashes de los datos de prueba, las versiones exactas de Node.js y Bun, las versiones del empaquetador, las opciones de compilación, la versión del SDK, el sistema operativo, la arquitectura, la CPU, la memoria y el sistema de archivos. Elegir una versión de Node.js con soporte para SEA. Consultar su documentación específica en vez de asumir que Node.js 24 tiene las funciones descritas en la documentación más reciente. Registrar los requisitos y las máquinas no disponibles antes de empezar.

Inspeccionar estos puntos de adaptación actuales, observados en la revisión `bceb0e6b6c8e8a67fe6cf1d7e64d84c516261f1f`:

- `tools/isswf.mjs` resuelve recursos mediante `import.meta.url`, importa dinámicamente módulos del runtime conservado y lanza herramientas mediante `process.execPath`.
- `tools/isswf-job.mjs` lanza scripts de preparación, ciclo de vida y reconciliación mediante `process.execPath`.
- `tools/pi-worker-task.mjs` genera una tarea JavaScript, carga un SDK externo mediante `createRequire` y monta el ejecutable del runtime en un entorno aislado de Linux.
- `tools/worker-lifecycle.mjs` lanza scripts copiados, usa grupos de procesos y lee identidades de Linux en `/proc`. `tools/native-recovery.mjs` también depende de `/proc` y Bubblewrap.
- `tools/build-release.mjs`, `package.json` y `docs/installation.md` definen la entrada mediante script, la lista de archivos permitidos, los recibos, los runtimes conservados y las referencias fijadas por proyecto. Cambiar el artefacto exige adaptar conjuntamente la verificación y la selección de versión.
- Empezar la selección de pruebas por `tests/release-package.mjs`, `tests/factory-tools-install.mjs` y las pruebas de workers. Clasificar cada comprobación como portable, específica de Linux, limitada a datos simulados o dependiente de proveedores reales.

El resultado es un inventario de compatibilidad con el archivo responsable, el contrato observable, el cambio necesario, la prueba y la incertidumbre de cada elemento. Volver a abrir el código si cambia la base.

#### 2. Construir candidatos acotados

Tras una autorización de ejecución independiente, crear espacios de trabajo exclusivos para SEA y Bun. Empezar por `inspect`, `locate` y el estado, y después probar `exec` con versión fijada, el panel y una tarea generada de worker. Un ejecutable que solo muestra la ayuda no es un prototipo satisfactorio.

Mantener idénticos los cambios compartidos entre candidatos. Registrar por separado los parches específicos de cada candidato. Indicar si cada candidato ejecuta los hijos mediante subcomandos compilados, scripts integrados o un runtime externo. Un ejecutable que necesita Node.js del sistema sin declararlo no es autónomo. Un paquete que incluye un Node.js privado es una alternativa independiente, no un éxito de SEA o Bun.

Limitar la primera investigación de compatibilidad a dos jornadas de ingeniería por candidato. Detenerse ante un bloqueo en vez de ampliar el alcance sin indicarlo. Conservar el caso fallido, el trabajo parcial y la estimación revisada. No debilitar las comprobaciones de aislamiento, recuperación, integridad o versiones fijadas para hacer funcionar un candidato.

#### 3. Verificar el comportamiento antes de medir la velocidad

Comparar los resultados JSON, los códigos de salida, las categorías de error, los archivos creados y los bytes de los recursos de cada candidato con la referencia. Cubrir rutas con espacios y Unicode, invocación fuera del directorio instalado, recursos instalados de solo lectura, recursos ausentes, recibos corruptos y SDK no disponibles. Conservar las referencias anteriores y los runtimes retenidos en las pruebas de actualización y reversión. Comprobar que un launcher nuevo ejecuta realmente el runtime antiguo fijado, no su código integrado más reciente.

Probar el panel mediante su API de loopback, no solo el arranque del proceso. En los subprocesos, probar trabajo correcto, fallo, tiempo límite, límites de salida, terminación y recuperación acotada. Probar que la ausencia de capacidades de plataforma produce rechazos explícitos sin ejecución parcial. Verificar que los artefactos no contienen credenciales ni datos de prueba privados.

Usar primero SDK simulados. Distinguir una carga de SDK real de un resultado simulado, y una ejecución con proveedor de la mera carga del SDK. Siguen vigentes las restricciones existentes de integración con Pi y Claude. Una instalación real en el host o una ejecución de modelos exige un nuevo permiso explícito. Probar los artefactos en un entorno limpio sin Node.js ni Bun en PATH, indicando las dependencias legítimas como Git, la aplicación anfitriona, los SDK externos o Bubblewrap.

#### 4. Ejecutar un benchmark reproducible

Crear un único script de medición que pueda repetirse y conservar su código, muestras sin procesar, aserciones de corrección y hashes de los artefactos. No implementar el script durante este encargo limitado a planificación. Se proponen estas cargas:

| Carga | Intervalo medido y prueba de trabajo |
| --- | --- |
| Arranque del CLI | Desde la creación del proceso hasta validar la salida de `inspect` y su finalización. Incluir la ayuda por separado solo como microbenchmark de arranque. |
| Estado | Desde la creación del proceso hasta analizar el estado y finalizar, con datos fijos de 1, 25 y 100 iniciativas. Verificar los recuentos y los hashes de los registros. |
| Ejecución con versión fijada | Desde el arranque del launcher hasta validar la salida del hijo y su finalización, incluyendo un proyecto fijado a una release antigua conservada. |
| Panel | Desde el arranque hasta la primera respuesta correcta de la API de loopback. Medir por separado una secuencia fija de 100 peticiones y verificar cada respuesta. |
| Ciclo de vida del worker en Linux | Preparación, lanzamiento, trabajo determinista con SDK simulado y reconciliación terminal. Verificar la salida de la tarea y el cese del proceso. Excluir la latencia de modelos reales de la comparación de runtimes. |
| Empaquetado | Tiempo total de construcción, pico de memoria durante la construcción, bytes del ejecutable, bytes del paquete completo comprimido, espacio instalado y espacio con dos versiones conservadas. |

Medir tiempo transcurrido, tiempo de CPU y pico de memoria del árbol de procesos cuando la plataforma permita obtenerlos de forma fiable. Indicar las métricas no disponibles. Medir por separado la memoria estable del panel. Usar la misma máquina, datos, concurrencia, captura de salida y configuración de producción para cada opción. Incluir el ejecutable Node en el cómputo de espacio de la referencia al comparar entregas autónomas. Mostrar por separado el tamaño normal del paquete.

Tras tres calentamientos no medidos por candidato, recoger al menos 30 muestras por carga corta y cinco ejecuciones completas de construcción o ciclo de vida. Rotar el orden de referencia, SEA y Bun para compensar la deriva. Registrar la carga de la máquina y los núcleos disponibles. No comparar tiempos absolutos entre máquinas o sistemas operativos distintos. Un proceso nuevo con caché de archivos caliente no es una ejecución con caché fría. Si se mide el primer arranque, indicar por separado el estado de las cachés y el método de restablecimiento, sin cambios privilegiados de caché por defecto.

Mostrar mediana y rango de cada carga. Mostrar p95 solo para las cargas cortas con al menos 30 muestras e indicar su precisión limitada. Contar todos los errores, tiempos agotados y reintentos. Mantener visibles los fallos y excluir las comparaciones inválidas de la clasificación por velocidad. Verificar que el trabajo esperado ocurrió dentro del intervalo medido. Analizar los cuellos de botella en ejecuciones separadas no incluidas en los tiempos. Si la variación se solapa con la mejora afirmada o se desconoce el trabajo limitante, indicar que no hay diferencia medible o que el resultado no es concluyente, en vez de elegir un ganador.

#### 5. Comprobar la matriz de plataformas

Fijar como objetivo Linux x64 y ARM64, macOS x64 y ARM64, y Windows x64. Evaluar Windows ARM64 por separado. Registrar la libc de Linux y las versiones mínimas de sistema operativo de cada artefacto. La compilación cruzada solo demuestra que se ha creado el artefacto. Exigir ejecución en cada destino declarado, usando la referencia en ese mismo destino. Una máquina no disponible implica no probado, no aprobado. Separar los resultados de WSL de los de Windows nativo.

Separar el CLI portable y la integración de recursos en el host del aislamiento y la recuperación nativa de workers. El comportamiento de Bubblewrap y `/proc` en Linux no se vuelve portable al compilar. En Windows y macOS, probar primero que las operaciones de worker no admitidas se rechazan de forma segura. Un port completo de workers nativos exige un diseño independiente de aislamiento e identidad de procesos, verificación independiente y autorización propia. Evaluar los requisitos de firma y notarización de macOS, pero no adquirir certificados ni usar servicios de firma durante la comparación sin permiso.

#### 6. Estimar el esfuerzo y elegir con pruebas

Estas son estimaciones de planificación, no esfuerzo medido ni un compromiso de entrega. Una jornada de ingeniería equivale a ocho horas de trabajo concentrado de alguien familiarizado con el código. Presuponen acceso a las máquinas objetivo y que no se reescribe el SDK externo. No incluyen aprovisionamiento de máquinas, esperas de certificados, servicios de pago ni aislamiento nativo de Windows o macOS.

| Trabajo | Estimación inicial |
| --- | --- |
| Inventario compartido, datos de prueba y script de benchmark | 2–3 jornadas |
| Prototipo de compatibilidad SEA | 1–2 jornadas |
| Prototipo de compatibilidad Bun | 1–2 jornadas |
| Matriz de comportamiento, mediciones e informe comparativo | 2–4 jornadas |
| Evaluación total, esfuerzo secuencial | 6–11 jornadas |
| Adaptación para producción si se elige SEA, tras evaluar | 5–10 jornadas adicionales |
| Adaptación para producción si se elige Bun, tras evaluar | 5–12 jornadas adicionales |

Los rangos de producción incluyen despacho de hijos y tareas generadas, resolución de recursos, recibos y versiones conservadas, empaquetado multiplataforma del CLI, actualización de entradas de los hosts, pruebas de regresión, CI y documentación bilingüe. No incluyen paridad completa de workers nativos fuera de Linux. Reservar una investigación de diseño independiente de 2–4 jornadas para esa paridad antes de estimar su implementación. El solapamiento de los rangos expresa incertidumbre, no demuestra que un candidato requiera menos trabajo.

Durante la evaluación, registrar el tiempo real dedicado a trabajo compartido, trabajo específico de SEA, trabajo específico de Bun, empaquetado y portabilidad. Volver a estimar cada elemento pendiente con un valor optimista, probable y pesimista, bloqueos identificados y confianza. Distinguir la adaptación inicial de la construcción del mantenimiento continuo de releases y actualizaciones de seguridad.

Descartar primero los candidatos que incumplan comportamiento exigido, integridad, versiones fijadas o rechazo seguro de capacidades no disponibles. Entre los candidatos válidos, comparar latencia de recorridos completos, memoria, tamaño del paquete completo, esfuerzo de adaptación y mantenimiento. Considerar que una diferencia de velocidad inferior al 10 % o dentro de la variación de las ejecuciones no basta por sí sola para justificar un cambio de runtime. Es una regla de decisión propuesta, no un resultado previsto. Si el rendimiento está empatado en la práctica, preferir el menor coste demostrado de adaptación y mantenimiento. Mantener el paquete Node o incluir un runtime Node privado sigue siendo válido si ningún ejecutable compensa su coste.

La entrega final es un único informe comparativo con identidades de artefactos, resultados aprobados, fallidos o no probados por plataforma y función, muestras del benchmark, esfuerzo real, estimaciones revisadas de adaptación y recomendación. Mantener las pruebas privadas sin procesar fuera de los paquetes publicados. La aprobación del operador de la recomendación sigue separada de la implementación y la publicación.

Consultar la documentación específica de versión de [Node SEA](https://nodejs.org/api/single-executable-applications.html) y la de [ejecutables Bun](https://bun.sh/docs/bundler/executables) cuando se autorice la ejecución.

#### Resultados de la evaluación local, 22 de octubre de 2026

Estado: evaluación parcial, no aceptación. Ambos prototipos compilan y ejecutan operaciones portables del CLI en Linux x64. Un prototipo SEA revisado supera la prueba de worker aislado con SDK simulado. Bun sigue incumpliendo un contrato de código de error exacto del aislamiento. Ninguno cumple las condiciones para elegirlo para producción sin las pruebas pendientes de SDK, ciclo de vida, traspaso de versión y plataformas. No se ha cambiado código del runtime, referencias de proyectos instalados, instalación global, integración con hosts ni configuración de proveedores.

El código medido es `bceb0e6b6c8e8a67fe6cf1d7e64d84c516261f1f`, con Node.js 26.8.1, Bun 1.4.3, Linux 7.2.5-3-omarchy y un Intel N100 de cuatro núcleos con 16,5 GB de RAM. Estos resultados no demuestran soporte de SEA en Node.js 24. Ambos usan el mismo código copiado y los mismos cambios compartidos de despacho del prototipo. SEA usa Bun solo como empaquetador ESM durante la construcción con destino Node, no como runtime de ejecución.

| Comprobación | Referencia Node | Prototipo SEA | Prototipo Bun |
| --- | --- | --- | --- |
| Equivalencia de salida de estado, inspect y locate | Pasa | Pasa | Pasa |
| Espacios, Unicode e invocación fuera de la instalación | Pasa | Pasa | Pasa |
| Inspect sin Node ni Bun en PATH | No procede | Pasa | Pasa |
| Estado fijado mediante despacho de hijos sin adaptar | Pasa | Falla | Falla |
| Estado fijado con despacho explícito de scripts externos | Pasa | Pasa con puente CJS externo | Pasa directamente o mediante puente |
| Rechazo de opción inválida y recurso ausente o modificado | Pasa | Pasa | Pasa |
| Panel loopback, 100 peticiones correctas y rechazo de Origin externo | Pasa | Pasa | Pasa |
| Preparación de worker offline generado desde brief fijado | Pasa | Pasa | Pasa |
| Inicialización de SDK simulado en tarea generada | Pasa | Pasa | Pasa |
| Primera prueba de aislamiento y archivos mutables del worker | Pasa | Falla en el primer comando aislado | Falla en el primer comando aislado |
| Despacho hermético revisado con comprobaciones de aislamiento intactas | Pasa | Pasa con SDK simulado | Falla el código de error exacto, aunque deniega el acceso |
| SDK real, ciclo completo, recuperación y traspaso a release antigua | No evaluado aquí | No evaluado | No evaluado |
| Otros sistemas operativos o arquitecturas | No evaluado aquí | No evaluado | No evaluado |

El primer empaquetado activó las entradas CLI de los módulos importados porque sus valores de `import.meta.url` pasaron a ser iguales. El prototipo desactiva esas entradas en los módulos copiados e incorpora despacho explícito. También proporciona una raíz de recursos específica de evaluación. Ambas adaptaciones necesitan un diseño para producción. SEA rechaza la carga ESM directa mediante URL de archivo desde su entrada integrada con `ERR_UNKNOWN_BUILTIN_MODULE`. Un módulo CJS externo cargado mediante `createRequire` permite acceder al cargador ESM del sistema de archivos. Esto demuestra una alternativa funcional, no una solución integrada en la release.

La prueba de worker usa un SDK expresamente simulado, sin autenticación real ni acceso a proveedores. El control con Node supera las comprobaciones reales de aislamiento Bubblewrap y modifica un archivo propio. Ambos candidatos compilados inicializan ese SDK, pero devuelven `partial` en la primera comprobación del puente aislado. Un segundo prototipo elimina la dependencia del despacho de hijos seleccionado mediante entorno. Para SEA, crea un puente CJS exclusivo con modo 0600 en un directorio temporal, también dentro del aislamiento, y lo elimina después de cargarlo. El control Node original y el artefacto SEA revisado superan entonces las comprobaciones intactas del worker generado. Esto respalda el diagnóstico del despacho para SEA. Bun sigue devolviendo un resultado parcial. Una tarea instrumentada por separado muestra que Bun deniega la escritura en la factoría con `EACCES`, mientras que el contrato exige `EROFS`. La lectura y escritura externas devuelven `ENOENT`, la escritura en el SDK devuelve `EROFS` y la red devuelve `ECONNREFUSED`; el archivo de control permanece intacto. Es una diferencia observable de compatibilidad, no una prueba de fuga del aislamiento. No se ha ampliado el contrato de producción para aceptar el error distinto. Los PID de hijos aislados registrados en las pruebas iniciales y revisadas ya no estaban en `/proc` en la comprobación posterior. No se ha probado el ciclo completo ni la recuperación.

La siguiente tabla muestra medianas y rangos observados de tiempo transcurrido en milisegundos para los hashes de los artefactos del primer estudio. Los artefactos posteriores de workers herméticos tienen hashes distintos y no se ha repetido su benchmark. No aplicar estos tiempos a los artefactos revisados. Cada celda contiene 30 muestras en orden rotatorio tras tres calentamientos, sin salidas inválidas. La referencia Node invoca las entradas originales de la release. Los candidatos compilados incluyen el panel en el paquete incluso para peticiones CLI. Se comparan los prototipos construidos, no una ventaja intrínseca del runtime. Estado lee una iniciativa en un proyecto con 100 datos de prueba. No procesa los 100 planes. La comprobación del panel es una ejecución funcional, no un benchmark repetido de peticiones por segundo.

| Carga | Node mediana [mín., máx.] ms | SEA mediana [mín., máx.] ms | Bun mediana [mín., máx.] ms |
| --- | --- | --- | --- |
| Estado | 62.4 [54.5, 67.3] | 78.7 [74.1, 83.8] | 37.0 [34.5, 41.2] |
| Inspect | 76.7 [70.3, 81.2] | 98.8 [94.1, 102.3] | 47.0 [43.4, 49.9] |
| Locate | 69.8 [66.9, 72.6] | 90.2 [86.2, 116.2] | 43.0 [38.8, 45.4] |

Bun registra tiempos de comandos inferiores en estas muestras. El veredicto causal sobre velocidad del runtime sigue sin ser concluyente porque no se han analizado por separado el arranque, la carga de módulos, el trabajo de subprocesos Git y la verificación de recibos. No se ha medido tiempo de CPU ni pico de memoria del árbol de procesos. Estas muestras no permiten afirmar nada sobre latencia de modelos, rendimiento de workers prolongados ni velocidad general de las plataformas.

Cinco construcciones alternadas por candidato dan una mediana de 3,285 segundos para SEA, incluyendo su empaquetado ESM, con un rango de 3,226–3,288 segundos. Bun da 0,370 segundos con un rango de 0,347–0,406 segundos. Los ejecutables ocupan 150,55 MB para SEA y 90,92 MB para Bun. Los archivos comprimidos del prototipo con el árbol completo de la release original y el ejecutable ocupan 47,04 MB para SEA y 42,24 MB para Bun. El archivo de referencia con un ejecutable Node privado ocupa 49,25 MB. Estos tamaños decimales incluyen recursos `.mjs` conservados. Los prototipos no han demostrado una distribución sin archivos `.mjs` de runtime. La compresión se ha medido una vez por archivo y no constituye un benchmark de velocidad de construcción.

Los hashes de los candidatos fijados y las muestras sin procesar están en el archivo privado `tooling/.local/binary-evaluation/results.json`. `followup-results.json` registra las cinco construcciones, la preparación de tareas generadas y los hashes de paquetes. `worker-results.json` y `cessation.json` conservan los fallos iniciales de workers y las observaciones de procesos. `hermetic-artifacts.json` y `hermetic-worker-results.json` identifican los candidatos revisados y sus comprobaciones intactas de workers. `bun-diagnostic.json` registra el diagnóstico del código de error instrumentado por separado. Los programas locales que permiten repetir la prueba son `evaluate.mjs`, `followup.mjs` y `worker-probe.mjs` de ese directorio, ejecutados en ese orden desde la raíz del repositorio. Crean datos temporales nuevos, ejecutan compiladores locales y servicios loopback, y usan únicamente SDK simulados. El experimento hermético posterior ejecuta `hermetic-probe.mjs` y después `worker-probe.mjs hermetic`. Revisar esos programas antes de repetirlos. Son utilidades de evaluación, no herramientas instaladas. Los resultados sin procesar y los artefactos siguen siendo privados y quedan excluidos de los paquetes. Los árboles de datos finales y los binarios se conservan en la carpeta `retained` de ese directorio para que la caducidad del directorio temporal no destruya las pruebas. Las marcas de tiempo registran ejecuciones transcurridas, no esfuerzo de ingeniería por categoría.

El éxito de SEA con el worker simulado reduce una incertidumbre de compatibilidad, pero el trabajo con SDK real y ciclo de vida sigue sin estimarse en detalle. No hay esfuerzo de ingeniería medido suficiente para asignar una diferencia defendible entre candidatos. Sustituir los rangos anteriores de producción por las siguientes estimaciones provisionales de trabajo pendiente para cualquiera de las opciones. Los valores son jornadas de ingeniería optimistas, probables y pesimistas. Presuponen máquinas objetivo disponibles y excluyen aislamiento nativo completo de workers fuera de Linux, adquisición de certificados, publicación y costes de proveedores reales.

| Adaptación pendiente para producción | Optimista | Probable | Pesimista |
| --- | --- | --- | --- |
| Despacho hermético de comandos y ubicación de recursos | 1 | 2 | 3 |
| Aislamiento de workers Linux, compatibilidad SDK y ciclo de vida | 1 | 2 | 5 |
| Recibos, versiones conservadas, referencias antiguas y migración | 1 | 2 | 4 |
| Empaquetado del CLI multiplataforma y CI | 1 | 2 | 3 |
| Cobertura de regresión, entradas de hosts y guías bilingües | 1 | 1 | 2 |
| Total por opción seleccionada | 5 | 9 | 17 |

La confianza sigue siendo baja hasta superar las pruebas de SDK real, ciclo completo y traspaso de versión. Son previsiones, no esfuerzo de adaptación medido. El experimento local no demuestra que ningún candidato esté listo. Preferir SEA provisionalmente para el siguiente experimento de integración porque conserva Node y supera las comprobaciones intactas de aislamiento simulado. Bun tiene una carga de scripts probada más sencilla y tiempos inferiores en los comandos del primer estudio, pero su diferencia de código de error necesita una evaluación explícita de compatibilidad. Es una recomendación conservadora, no una selección de producción terminada. No publicar ninguno hasta resolver la compatibilidad pendiente de workers, el traspaso exacto a una versión antigua, las mediciones sobre los artefactos revisados y las pruebas en plataformas objetivo. Mantener mientras tanto la distribución actual con Node.

## Actualizaciones y recuperación

Añadir migraciones explícitas y deterministas de los datos del proyecto cuando un cambio real de esquema lo requiera. Actualmente, la actualización de instalación cambia la referencia del runtime; no inventa conversiones para esquemas desconocidos.

La recuperación tras reinicios, procesos supervivientes arbitrarios o respuestas externas perdidas necesita un diseño y unas pruebas propios. No presentar la recuperación acotada actual como una reanudación automática universal.

## Ejecución y visibilidad

Valorar si la capacidad compartida debe abarcar más vías de ejecución. Las reservas existentes son cooperativas y dependen de permisos concretos; no constituyen un planificador de toda la máquina.

Valorar la consulta reciente de procesos y estado remoto si los usuarios la necesitan. El panel actual lee registros del proyecto; la telemetría en directo y el despacho automático son funcionalidades distintas.

## Mantenimiento

Mantener las guías bilingües, los ejemplos y las comprobaciones alineados con el código. Consultar documentos históricos cuando hagan falta sus evidencias o datos de entrada; no convertir demostraciones antiguas en el manual vigente del producto.

Acordar un procedimiento de conservación y limpieza antes de borrar runtimes antiguos, reservas o evidencias. La desinstalación no realiza actualmente una limpieza automática de esos datos.
