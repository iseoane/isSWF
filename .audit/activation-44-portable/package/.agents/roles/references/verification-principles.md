# Principios de verificación

Carga esta referencia según el cambio y su riesgo; no ejecutes todas las revisiones o pruebas por defecto.

## Causa antes que parche
**Trigger:** defecto, regresión o fallo de recuperación. **Acción:** establece síntoma esperado/observado y una reproducción segura cuando sea posible; lee lo necesario para construirla antes de concluir causa. Formula hipótesis comprobables y llama causa confirmada solo a la que tenga evidencia que conecte mecanismo y síntoma. **Límite:** si no se reproduce o la superficie es inaccesible, informa intentos, evidencia y probe concreto pendiente; no inventes causa ni atribuyas correlación. Dos arreglos con una premisa común que fallen el mismo gate exigen cuestionar esa premisa antes de repetir el arreglo.

## Pruebas selectivas de comportamiento
**Trigger:** el operador/brief pide explícitamente TDD, o hay un bug con una regresión local barata, o lógica significativa tiene un test focal práctico. **Acción:** invoca el comportamiento como lo usa el consumidor y afirma el resultado observable concreto; usa TDD cuando esa ruta sea útil. **Límite:** el worker no inventa una exigencia TDD. Si el test es caro, ambiguo o ajeno al cambio, elige la comprobación funcional más cercana y explica el límite. No confundas test de implementación con prueba de comportamiento.

## Verifica el candidato exacto
**Trigger:** antes de declarar resultado listo o apoyar una conclusión en un artefacto. **Acción:** comprueba el checkout/base y candidato efectivos; ejecuta la superficie o lee el valor/evidencia pertinente. Reporta comando y resultado observado; fallo, inaccesibilidad o falta de revisión permanecen pendientes. **Límite:** una build o una respuesta del agente no demuestra comportamiento que no ejercita. La evidencia de un candidato anterior no cubre un candidato cambiado.

## Unidades coherentes
**Trigger:** cambio de varias fases, migración, sweep o acumulación que hace difícil revisar/recuperar. **Acción:** define unidades con resultado, dependencia y comprobación; verifica checkpoint antes de construir encima. Usa slices verticales si entregan comportamiento. **Límite:** no hay cuota universal de commits/líneas ni una PR por unidad; refactors mecánicos pueden tener otra secuencia. Un checkpoint parcial no es cierre.

## Producto, accesibilidad y riesgo
**Trigger:** decisión de producto, interfaz/API visible, datos, permisos, contrato compartido o afirmación cuantitativa. **Acción:** evalúa experiencia y accesibilidad pertinentes; selecciona revisión de seguridad/pérdida de datos o integración según superficie. Para cifras de rendimiento/eval, anota condiciones y evidencia que explique qué limita la medida. **Límite:** no impongas visuales, benchmarks ni paneles completos en cambios sin impacto; si no se midió, no afirmes quota, speedup ni causalidad cuantitativa.

## Prototipos
**Trigger:** interacción novedosa o decisión arquitectónica consecuencial sin precedente, con alternativas plausibles. **Acción:** compara 2–3 prototipos frente a criterios observables antes de comprometer producción. **Límite:** elige directamente si el contrato tiene una solución clara o las alternativas no afectan experiencia, riesgo ni arquitectura. Evita exploración nueva cuando el encargo es de alcance cerrado.
