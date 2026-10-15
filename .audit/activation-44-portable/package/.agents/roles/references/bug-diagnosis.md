# Diagnóstico de bugs

Metodología compartida para investigar defectos con precisión proporcional. Un worker puede usarla directamente en un bug simple; solo se separa el diagnóstico cuando la incertidumbre, intermitencia o alcance lo justifica. Triage organiza la entrada y puede detectar que falta información, pero no demuestra una causa.

## Establecer el síntoma

- Escribe el resultado esperado y el observado, la superficie, las condiciones conocidas y la revisión examinada. Usa una señal que distinga este defecto de fallos vecinos.
- Intenta reproducir en la superficie real con comandos o acciones que otra persona pueda repetir. Conserva salida suficiente para comparar, redactando secretos y datos sensibles.
- Si es intermitente, repite o estrecha las condiciones solo cuando sea seguro y autorizado. Informa cantidad y resultado de intentos; la falta de reproducción no prueba ausencia.
- Si no se reproduce, enumera qué se intentó, qué no pudo observarse y el siguiente probe concreto. Lee el código y contexto necesarios para diseñar una reproducción segura y discriminante antes de concluir causa. Si el síntoma sigue sin observarse, marca el diagnóstico como inconcluso y no atribuyas una causa.

## Investigar causalidad

- Traza el camino desde la entrada hasta el efecto observado. Lee contratos, invariantes, consumidores y pruebas pertinentes en el baseline real.
- Formula hipótesis que predigan una observación distinta. Prioriza por impacto informativo y coste; un caso sencillo puede necesitar solo una hipótesis. Descarta cada una con evidencia o conserva su incertidumbre.
- Distingue correlación, indicio y mecanismo confirmado. Ninguna hipótesis pasa a causa confirmada sin evidencia que conecte el mecanismo con el síntoma en la misma ruta relevante.
- Busca instancias del mismo patrón donde el riesgo lo justifique. No conviertas una sospecha general en un barrido de alcance abierto.
- Usa instrumentación puntual para separar hipótesis. Limita ubicación, duración y datos; requiere autorización para cualquier superficie sensible. Registra qué añadiste y elimina lo temporal al terminar.

## Recomendar una corrección verificable

- Identifica la candidata a corrección más pequeña que actúa sobre el mecanismo confirmado. No prescribas cambios para hipótesis que siguen abiertas.
- Propón una prueba de regresión solo si hay un seam que reproduzca el patrón real. Nombra el seam y el comportamiento visible que probaría. Si no existe, indícalo como limitación; no fuerces una prueba superficial ni hagas TDD obligatorio.
- Delimita consumidores, rutas y contratos que podrían verse afectados. Distingue impactos observados de riesgos inferidos y explica la base de cada uno.
- Recomienda si el worker puede proceder con el brief actual, necesita grounding adicional o requiere decisión/autorización del coordinador. No amplíes el objetivo aprobado.

## Paquete de diagnóstico

Entrega en el resultado del trabajo:

- Síntoma esperado y actual, superficie, baseline y condiciones de reproducción.
- Comandos o acciones ejecutados, resultado relevante y rutas a artefactos redactados.
- Cadena causal con paths, símbolos y líneas; separa evidencia observada de interpretación.
- Hipótesis descartadas y abiertas, con evidencia o probe necesario.
- Candidata de regresión y seam, o motivo concreto por el que no hay uno adecuado.
- Blast radius, consumidores, riesgos, límites de autorización y bloqueos.
- Próximo paso recomendado y qué evidencia lo habilitaría.

No reportes resultado de comandos no ejecutados ni presentes ejemplos de fixtures como pruebas corridas. El paquete recomienda y fundamenta; el worker verifica el código vigente antes de editar.
