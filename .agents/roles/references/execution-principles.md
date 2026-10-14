# Principios de ejecución

Carga esta referencia cuando haya trabajo paralelo, migración, reintentos, delegación o cambios repetibles; aplica solo las partes pertinentes.

## Ownership antes de paralelizar
**Trigger:** actores podrían escribir el mismo checkout, rama, archivo, estado o efecto externo. **Acción:** asigna dueño y espacio exclusivo; paraleliza unidades independientes y reúne resultados por una secuencia común. Si un recurso canónico debe compartirse, serializa con mecanismo estructural. **Límite:** instrucciones no son control de concurrencia; separar archivos no evita colisión en efectos remotos. No declares libre un recurso hasta confirmar que su escritor cesó.

## Autonomía dentro del encargo
**Trigger:** siguiente paso reversible, claro y autorizado. **Acción:** continúa sin pedir permiso rutinario y reporta estado, evidencia y pendientes de forma compacta. Mantén slots útiles disponibles: consume completion/resultados conforme llegan y no los dejes desatendidos hasta el siguiente ping del usuario. **Límite:** una cuota de modelo no se afirma sin medición; decisiones de producto, alcance nuevo y acciones sensibles vuelven al operador.

## Reintentar reconciliando
**Trigger:** reanudación, fallo parcial o efecto externo con respuesta incierta. **Acción:** inspecciona estado y efectos existentes antes de repetir; reconcilia, reintenta de forma convergente o bloquea con evidencia concreta. **Límite:** no prometas exactly-once ni repitas ciegamente operaciones remotas. Cancelar es una solicitud hasta comprobar cese; cancelar no revierte efectos ni garantiza detener descendientes.

## Migrar contratos con cuidado
**Trigger:** sustituir API interna y conocer sus consumidores. **Acción:** migra callers internos y elimina la API vieja en la misma unidad verificable. **Límite:** API pública, formato persistido o integración externa requieren política de compatibilidad/versionado y autorización; puede necesitarse adaptación temporal con retirada definida.

## Automatizar y codificar con umbral
**Trigger:** un procedimiento se repite o verificación manual no deja evidencia suficiente. **Acción:** crea la herramienta/check más pequeño que justifique su coste y sea reejecutable. Convierte errores mecánicos repetidos en estructura/check; deja juicio, excepciones y contexto proporcional en instrucciones. **Límite:** no hagas script, framework, tipo o lint por ritual ni conviertas una regla contextual en mandato universal.

## Riesgo operativo
En trabajos sensibles, identifica acceso, permisos, datos, posibilidad de pérdida, migración, recursos y estrategia de cancelación antes de ejecutar. Usa límites del runtime solo si se han observado. No publiques secretos ni datos de clientes. Si el sistema no puede imponer un límite autorizado, bloquea ese paso con el hecho concreto que falta.
