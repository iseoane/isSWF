# Posibles acciones futuras

[Inicio](../../README.es.md) · [Documentación](index.md) · [English](../en/future-actions.md)

Son propuestas, no funcionalidades implementadas, un calendario de entrega ni permisos para ejecutar trabajos. Antes de abordar una, comprueba el código actual y acuerda el alcance. Los planes existentes registran decisiones; no demuestran que esté implementado todo lo previsto.

## Recuperación

La recuperación tras reinicios, procesos supervivientes arbitrarios o respuestas externas perdidas necesita un diseño y unas pruebas propios. No presentar la recuperación acotada actual como una reanudación automática universal.

## Calidad de la revisión

Construir un conjunto de regresión del revisor con los defectos que una revisión no detectó y que se confirmaron después, como reversiones o fallos de plataforma que se escaparon. Cada caso conserva el candidato exacto, el brief aceptado y el defecto confirmado. Volver a ejecutar el perfil de revisión sobre el conjunto cada vez que cambien su metodología, su modelo o su esfuerzo, y conservar un cambio solo cuando encuentre más defectos confirmados sin más hallazgos marcados después como erróneos. Ejecutarlo también sobre candidatos limpios conocidos para contar las falsas alarmas. Las resoluciones de hallazgos registradas en los informes de revisión aportan los datos de ruido.

Probar la verificación formal con un invariante de alto riesgo, tras el modo de revisión empírico (I0033). Un candidato es «nunca cambiar el pin de un proyecto mientras haya una ejecución registrada activa» en el lanzador (`tools/isswf.mjs`), donde caídas, reintentos y recuperaciones pueden intercalarse en órdenes que los tests rara vez alcanzan. Modelarlo con un comprobador de modelos como TLA+, demostrar que la comprobación falla con una variante sin la protección y registrar qué archivos y commit cubre el modelo para que se vea cuándo queda desfasado. Antes de empezar, valorar la dependencia de desarrollo de Java/TLC y el riesgo de que el modelo se separe del código.

Permitir que un proyecto destino declare umbrales numéricos de calidad para el código cambiado en su `REVIEW.md` o en su registro de configuración: una puntuación de complejidad como CRAP, duplicación y tests de mutación diferenciales. El worker los ejecutaría antes de la entrega y el revisor comprobaría los resultados. Costes: nuevas dependencias de desarrollo fijadas, ejecuciones de mutación lentas con ruido de mutantes equivalentes y umbrales que se pueden manipular. Probarlo primero en `tools/`. Fuente: [unclebob/ub-mode](https://github.com/unclebob/ub-mode) (3da62bf3) y [unclebob/swarm-forge](https://github.com/unclebob/swarm-forge) (f4f5fbca).

Ofrecer una asignación opcional de refactorización cuando los tests pasen, que el coordinador seleccionaría para funcionalidades grandes, con el comportamiento fijado por los tests existentes. Costes: una llamada adicional al modelo y más cambios en el código. Nunca sería una fase obligatoria. Fuente: los mismos repositorios.
