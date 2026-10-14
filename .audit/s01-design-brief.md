# Diseño acotado de S01

El usuario autorizó continuar con la concreción de S01 después de explicar que prepara una issue, sin implementar su código. Este paso entrega un contrato de construcción, no una aplicación, configuración Pi activa ni publicación GitHub. Solo modelos OpenAI GPT 6 o 6.1, sin fallback a otro proveedor.

Fuentes de producto: docs/vision.md, docs/spec-v1.md, docs/plan-v1.md y GLOSSARY.md. Arquitectura candidata: docs/arquitectura-candidata.md. Referencias de prácticas: docs/research/referencias.md. No nueva investigación remota ni copiar skills ajenas en este paso.

Diseñar el recorrido desde una issue de repositorio y encargo autorizados hasta categoría, preparación, brief y estado visible coherente entre panel y conversación. Triage proporcional, no entrevista ni TDD automáticos. Coordinador responsable, procedimiento en skill Markdown. Ningún worker de código ni supervisor de ejecución completo en S01.

Distinguir explícitamente preparación de autorización y de ejecución. Una etiqueta ready-for-agent no inicia código ni concede permiso. Información externa no se convierte en instrucciones del sistema. Los duplicados necesitan evidencia, no coincidencia superficial de títulos. Si no se pudo comprobar código o duplicados, conservar incertidumbre: no inventar que ya existe.

Comparar dos formas estructurales pequeñas. Candidato A, un documento autoritativo por trabajo y proyección de lectura. Candidato B, una fuente estructurada mínima autoritativa y brief como contenido versionado referenciado. Ambos evitan dos copias editables del estado. Valorar control de revisiones/idempotencia, facilidad de navegación, panel seguro, tamaño de soporte necesario y evolución a S02 sin prometer esa integración.

Cada candidato produce un solo archivo Markdown de máximo 600 palabras en su destino asignado. Incluir uso concreto, dueño de cambios, forma de datos a nivel conceptual, referencias y revisiones, límites, tres o cuatro unidades funcionales pequeñas con comprobación y punto de commit, alternativas descartadas y riesgos. No código ni firmas implementadas, no cambios de spec/visión, no instalar herramientas, no red, no subagentes.

Checkpoint de alcance: no repetir investigación de runtime. Cerrar una propuesta comparada, un diseño S01 y una revisión independiente. Autenticación/red de workers, Engram y A2A quedan fuera. Si falta repositorio autorizado, usar ejemplos ficticios identificados y declarar que no validan GitHub real. No requerir credenciales en panel ni usar html no escapado de issues.
