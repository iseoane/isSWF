## #49 — **FAIL**

Revisión de solo lectura; no hice cambios ni lancé subagentes. Excluí #44.

### Bloqueantes

1. **Propuesta 7 cambia una decisión de visión sin justificarlo.** Reduce la retrospectiva a cierres con evidencia reutilizable y rechaza hacerla obligatoria por tarea. Pero la visión acordó una retrospectiva al completar una feature o bug y una revisión conjunta al cerrar explícitamente una sesión de trabajo. La especificación precisa que esa revisión abarca la actividad desde la retrospectiva anterior e incluye trabajos pendientes. La recomendación no conserva ese análisis de sesión completa y no da un motivo para descartarlo.  
   Referencias: `docs/vision.md` § Acuerdos; `docs/spec-v1.md` § Retrospectiva y mejora.

2. **Propuesta 6 contradice la autorización de PRs ya acordada.** El título promete no automatizar la publicación y el texto subordina la acción externa a autorización propia. La visión permite crear o actualizar PRs draft dentro del repositorio y encargo aprobados, sin pedir permiso en cada operación; la especificación permite publicar una draft tras el primer commit verificable. Hay que distinguir esas acciones de aceptación, merge y despliegue, que sí siguen siendo humanos.  
   Referencias: `docs/vision.md` § Acuerdos y § Primer hito; `docs/spec-v1.md` § Cierre técnico y aceptación.

### Verificación de fuentes y alcance

- Las fuentes consultadas están fijadas a revisiones concretas. En la muestra revisada, las afirmaciones de las propuestas 1–6 y 8 concuerdan en general con las fuentes primarias: por ejemplo, Zazen documenta los trabajos por sesión y worktree, el dashboard y su polling, y sus revisores UX/UI; Gentle AI describe continuidad, memoria, revisión y separación entre revisión y entrega.
- **Hay enlaces con anclas incompletas:** en la propuesta 4, el texto atribuye al dashboard las líneas 267–277 y 385–407, pero el enlace ancla solo 267–277. En la propuesta 6, se citan dos rangos para los commits, pero el enlace solo ancla el primero. No encontré que esto vuelva falsa la afirmación; sí dificulta comprobar el rango omitido. En la propuesta 5, la separación entre revisión y autorización de entrega debería enlazar directamente el rango 294–305, no depender de otro enlace posterior.
- **Licencias:** la nota informa correctamente que Gentle AI declara MIT y que Zazen no declara licencia en el repositorio (`license: null`); el árbol de la revisión indicada no muestra licencia en la raíz ni en la carpeta de la factory. Es prudente no copiar código ni texto de Zazen.
- **Engram:** no debe confundirse integración de desarrollo con capacidad del producto. Engram está instalado/disponible en el entorno de desarrollo, pero la visión dice que aún no se usa como memoria de este desarrollo; la integración de producto sigue sin configurar ni probar. La nota acierta en no presentar esa capacidad como runtime implementado, aunque convendría explicitar esta distinción.
- **Reviewer:** la especificación ya contempla un perfil/revisor independiente. Sus especialidades pueden ser rúbricas o skills; no implican agentes nuevos ni aislamiento real. La nota debería presentar «experiencia» y «UI» como cobertura del revisor existente cuando corresponda, y separar ese rol previsto de capacidades del runtime aún no demostradas.

### Evaluación de las ocho propuestas

| Propuesta | Resultado |
|---|---|
| 1. Continuidad conversacional y trabajo en segundo plano | **PASS** |
| 2. Consentimiento proporcional | **PASS** |
| 3. Memoria y registro por trabajo | **PASS**, con aclaración sobre Engram |
| 4. Estado y visibilidad | **PASS**, corregir ancla incompleta |
| 5. Revisión proporcional ligada al candidato | **PASS**, aclarar revisor existente y corregir referencia |
| 6. PRs y estado de CI | **FAIL**, contradice autorización de draft PR |
| 7. Retrospectivas | **FAIL**, contradice retrospectiva de sesión completa |
| 8. Verificación de experiencia de usuario | **PASS**, aclarar que no requiere un perfil nuevo |

El resto de las recomendaciones se presenta razonablemente como propuestas, no como hechos de upstream ni capacidades instaladas. Las contradicciones de las propuestas 6 y 7 impiden aprobar el documento.
