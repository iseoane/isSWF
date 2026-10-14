# Hallazgos U1

Estado: corregidos y revisados en el candidato local U1, sin bloqueantes para esa unidad. Las nueve pruebas originales no cubrían los defectos siguientes. Reproducción inicial conservada en `.audit/u1-parent-reproduction.json` y fuente en `.audit/u1-first-candidate.tar.gz`. Las 13 pruebas finales pasan; `.audit/u1-final-review.md` conserva la revisión independiente. Esto no cierra S01 completa.

## U1-001. Consulta que crea estado

`show` llama `_connect`, que llama `_database`: crea directorio, base y tablas y cambia permisos. Una consulta de un estado inexistente devolvió `[]` y creó la base. No respalda panel de solo lectura ni distingue desaparición de estado de lista legítimamente vacía. Corregir separando conexión de publicación y lectura, con lectura que rechaza ausencia sin crear datos.

## U1-002. Ficha visible incompleta

El HTML omite revisión, siguiente paso y riesgos del snapshot. La comprobación directa del HTML devolvió false para los tres. El operador no obtiene el recorrido de ficha previsto y no puede contrastar qué revisión está viendo. Exponer campos pertinentes con escape, revisión y condiciones, sin publicar grant privado.

## U1-003. JSON incompleto presentado como snapshot

Se escribió un snapshot incompleto en una base temporal de prueba. `show` lo devolvió como válido y `_page` produjo KeyError. Hay que validar el snapshot en la frontera de lectura y mostrar indisponibilidad, no entregar API aparentemente correcta ni ocultar excepción de render.

## U1-004. Origin malformado sin respuesta controlada

El primer revisor reprodujo `Origin: http://[` con excepción de parseo y desconexión. Se corrigió en la frontera HTTP: devuelve 403 antes de leer el estado. La regresión y el recorrido HTTP del padre vuelven a comprobarlo.

## Verificación y clasificación

El primer revisor clasificó los cuatro hallazgos como suggestions. El padre los trató como condiciones de cierre de U1 porque contradicen lectura sin efectos, ficha observable y error explícito ante datos inválidos. No se entregó ese candidato.

El builder registró tres fallos y un error al añadir las cuatro regresiones antes del cambio. El padre reejecutó la suite final sobre la fuente inicial archivada: cuatro fallos y un error. El fallo adicional corresponde a la nueva expectativa CSP para el estilo local añadido, no a un quinto defecto previo. La salida real está en `.audit/u1-regression-before.log`, frente a `.audit/u1-tests.log` después. El resumen manual del builder contiene un typo en la ruta de su copia; no se usa como sustituto de estas ejecuciones.

La revisión inicial informó que discovery fallaba desde su entorno. El padre repitió el comando desde la copia correcta y desde el proyecto integrado: pasa. No se cambia código por ese diagnóstico de entorno.

El instrumento de comprobación live usaba inicialmente HTTPConnection como context manager. Una comprobación directa mostró que no lo implementa; se cambió a contextlib.closing antes de ejecutarlo. El recorrido final de CLI, HTTP y Chromium pasa y recoge el cese del panel en `.audit/u1-live.json`.

## U1-005. Fixture documental con destinos omitidos

El verificador del proyecto real pasó, pero su copia de prueba omitía `.agents` y falló al seguir el nuevo enlace a la skill. Ya había ocurrido con `.audit`: se reemplazó la selección manual por copia estructural del árbol, excluyendo Git y caches. La validación de enlaces no se suprime. El revisor no encontró bloqueantes; la reserva sobre TMPDIR quedó protegida con una aserción probada. `.audit/u1-fixture-review.md` conserva el detalle.

No son defectos de Pi ni escapes de un sandbox. No se publicó una issue remota porque aún no hay repositorio autorizado.
