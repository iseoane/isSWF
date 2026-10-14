# Hallazgos del instrumento de aislamiento

## ISO-001. Errores de controles positivos aceptados como aislamiento

Estado: corregido y comprobado con la mutación temporal. Baseline y ambos perfiles vuelven a pasar. La revisión independiente de la fuente final confirmó la corrección y repitió la mutación y dos ejecuciones completas. Dictamen conservado en `.audit/isolation-technical-review.md`.

Reproducción previa: `.audit/isolation-control-check.py` cambia solo la ruta de escritura permitida de scratch para que su padre no exista. La versión inicial terminó con código 0 y registró `scratch-write`, `expected: true`, `actual: {errno: 2}`, `passed: true` tanto para worker como reviewer.

Causa: el helper aceptaba errno de denegación por el perfil global, incluso en operaciones que debían funcionar. No era una fuga demostrada del sandbox, sino un falso positivo del instrumento.

Corrección: cada caso declara explícitamente si espera éxito o un conjunto de errores. Las operaciones permitidas no aceptan excepciones como PASS. No se modifica la definición de la factory para justificar el instrumento. El tracker remoto no está autorizado; este registro local conserva el hallazgo.

## ISO-002. Evento RPC confundido con respuesta

Estado: corregido y repetido con Pi real. Worker y reviewer recibieron respuestas correlacionadas y completaron sus comprobaciones.

El primer caso Pi real falló con `type: bash_execution_update`, el mismo id del comando Bash y sin campo `success`. El probe trataba cualquier registro con id coincidente como respuesta. Eso no mostró un fallo del sandbox ni de Pi.

La corrección comprueba tanto `type == response` como el id. Los eventos se siguen consumiendo y no se evalúan como ACKs. Se conserva el fallo previo en el transcript. El log final contiene la repetición correcta con Pi y ambos perfiles, confirmada por la revisión independiente.

## ISO-003. Selección de un namespace de un ensayo anterior

Estado: corregido y comprobado con dos ejecuciones completas consecutivas. Cada ensayo observa solo el namespace de su bwrap actual; ambos caminos de parada y recolección terminaron.

`all` falló al esperar el cese de writers, mientras `lifecycle` aislado pasó. El census global incluía PID1 de sandboxes previos. Seleccionó PID 180476, namespace `4026532476`, en lugar del namespace `4026532484` que contenía al writer activo. No era evidencia de que matar el PID1 correcto dejara escapar ese writer.

La evidencia reducida está en `.audit/isolation-namespace-failure.json`. La corrección obtiene el árbol del bwrap del intento actual para elegir su namespace. El census global queda solo para observar y limpiar descendientes propios del instrumento. No se aumenta el timeout ni se añade un guard que anuncie éxito sin detener el intento correcto.

## ISO-004. Canario secreto introducido por argumentos de prueba

Estado: corregido y comprobado en cuatro lanzamientos aislados.

El instrumento inicial enviaba el valor de la credencial falsa como expectativa del helper en argv. Aunque fallara leer el archivo, eso no probaba ocultación de su valor. Los sandboxes reciben ahora rutas y `token: null`, nunca el valor generado. La comprobación de ausencia del valor ocurre fuera del sandbox antes de enviar el comando. Los controles baseline conservan el valor ficticio para demostrar accesibilidad deliberada. No se utilizaron secretos reales.

## ISO-005. Fixture documental sin destinos de evidencia

Estado: corregido y verificado por el padre y un revisor independiente. `.audit/definition-fixture-review.md` conserva el dictamen.

El verificador de documentos reales pasó, pero el baseline de `.audit/test-definition-checker.py` falló por un enlace a la revisión técnica. El fixture copiaba docs y solo el verificador dentro de `.audit`, omitiendo los destinos de evidencia ya existentes en el proyecto.

La corrección copia `.audit` junto a docs en el directorio temporal. No se omiten enlaces ni se suaviza su validación. Pasan baseline y restauración, y siguen rechazándose los cinco errores de documentación previstos.
