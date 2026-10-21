# Posibles acciones futuras

[Inicio](../../README.es.md) · [Documentación](index.md) · [English](../en/future-actions.md)

Son propuestas, no funcionalidades implementadas, un calendario de entrega ni permisos para ejecutar trabajos. Antes de abordar una, comprueba el código actual y acuerda el alcance. Los planes existentes registran decisiones; no demuestran que esté implementado todo lo previsto.

## Distribución

Una vez comprobado y aceptado el trabajo local actual, acordar cómo publicar la primera release y sustituir los ejemplos de instalación desde una carpeta local por su origen real. Mantener la misma versión en el paquete de Pi, el núcleo y el plugin de Claude. Publicar y hacer nuevas pruebas reales con Claude siguen siendo decisiones separadas.

## Actualizaciones y recuperación

Añadir migraciones explícitas y deterministas de los datos del proyecto cuando un cambio real de esquema lo requiera. Actualmente, la actualización de instalación cambia la referencia del runtime; no inventa conversiones para esquemas desconocidos.

La recuperación tras reinicios, procesos supervivientes arbitrarios o respuestas externas perdidas necesita un diseño y unas pruebas propios. No presentar la recuperación acotada actual como una reanudación automática universal.

## Ejecución y visibilidad

Valorar si la capacidad compartida debe abarcar más vías de ejecución. Las reservas existentes son cooperativas y dependen de permisos concretos; no constituyen un planificador de toda la máquina.

Valorar la consulta reciente de procesos y estado remoto si los usuarios la necesitan. El panel actual lee registros del proyecto; la telemetría en directo y el despacho automático son funcionalidades distintas.

## Mantenimiento

Mantener las guías bilingües, los ejemplos y las comprobaciones alineados con el código. Consultar documentos históricos cuando hagan falta sus evidencias o datos de entrada; no convertir demostraciones antiguas en el manual vigente del producto.

Acordar un procedimiento de conservación y limpieza antes de borrar runtimes antiguos, reservas o evidencias. La desinstalación no realiza actualmente una limpieza automática de esos datos.
