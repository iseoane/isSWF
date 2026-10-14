# Codegraph en el arranque por proyecto

Estado: servidor y CLI disponibles; el repositorio isSWF no está indexado. No se ha demostrado aquí navegación ni grounding mediante Codegraph. Investigación del padre, sin modificar índices o configuración global.

## Fuentes y comprobación

- Instrucciones del servidor MCP `codegraph`, consultadas el 14 de octubre de 2026: un índice de símbolos, relaciones y archivos, navegación `codegraph_explore`, resolución entre archivos best-effort, avisos de antigüedad y ausencia de validación de corrección.
- Esquema MCP observado: `codegraph_explore({ query, maxFiles?, projectPath? })`. No se añade una herramienta propia por tipo de consulta.
- `command -v codegraph` devuelve `/home/iseoane/.local/bin/codegraph`.
- Consulta real única: query `parse_proposal prepare decide _publish`, maxFiles3, projectPath `/home/iseoane/Work/isSWF`. El servidor devolvió que no encuentra `.codegraph/` y pidió usar herramientas integradas y no consultar de nuevo este proyecto en la misma sesión. No hubo fuente de símbolos ni mapa de llamadas recuperados.

El servidor establece que indexar corresponde a una decisión del usuario. Se informó del comando `codegraph init` desde el proyecto; el padre no lo ejecutó. Este requisito impide cerrar una prueba real de grounding Codegraph, pero no las pruebas de empaquetado o memoria aislada.

## Papel propuesto, no implementación

La skill de grounding usa el índice antes de reconstruir navegación por búsquedas manuales cuando está disponible. Devuelve una pregunta de investigación, hallazgos, símbolos, rutas y rangos de líneas que el worker debe inspeccionar, relaciones relevantes, riesgos y qué no pudo confirmar. No declara correcta una funcionalidad solo porque hay un símbolo de nombre parecido.

El proyecto consultado debe fijarse explícitamente a su checkout autorizado; un nombre parecido o un índice de otro cliente no es contexto válido. El servidor informa de cambios pendientes o de autosync deshabilitado/recuperándose. Ante esos avisos, leer los archivos afectados o contrastar con el checkout actual antes de editar. Un mapa histórico o números de línea no sustituyen a código y pruebas actuales.

Sin índice, el grounding conserva la misma responsabilidad con lectura/búsqueda del repositorio y declara la falta de Codegraph. No crea permisos, otra memoria operativa ni un bloqueo artificial de toda la factory. La ausencia de una relación en el grafo no prueba que no exista: la resolución entre archivos es best-effort.

El índice pertenece a Codegraph. SQLite de isSWF conserva el estado operativo; no copia ni mantiene por su cuenta el grafo. No se incluye cloud, sincronización entre clientes, un indexador propio o nuevas herramientas de exploración.

## Prueba pendiente

Después de indexación decidida por el usuario y en una sesión que pueda volver a consultar el proyecto: recuperar un flujo real `prepare → _publish`, obtener archivos/rangos de líneas, contrastar el snapshot actual y demostrar que un archivo cambiado se identifica sin usar un mapa obsoleto. Una prueba negativa debe rechazar consultas al proyecto equivocado sin leer datos de otro cliente. No se sustituye este recorrido por leer la documentación del servidor.
