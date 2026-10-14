## Veredicto: **sin bloqueantes**

Revisión de definición (lectura, sin subagentes, sin writes). No encontré contradicción real entre `vision.md`, `spec-v1.md`, `plan-v1.md` y `arquitectura-candidata.md` en los ejes pedidos. Las pruebas integradas pendientes están marcadas como tales y no se presentan como capacidades implementadas.

**Spotcheck (sin escribir trail, por restricción de solo lectura):** los 61 criterios aparecen exactamente una vez en `plan-v1.md` (sin huérfanos ni duplicados); el grafo S01–S08 es acíclico; los enlaces locales a `docs/research/` y `GLOSSARY.md` resuelven.

**Ajustes recientes: conservan acuerdos.**
- *Slot incierto*: `spec-v1.md` §Límites propuestos («si la detención es incierta… conserva reserva… marcar bloqueado no acredita cese») coincide con `arquitectura-candidata.md` §Datos y ownership (invariante «detención solicitada o escritor incierto»), con OPS-08 y con `vision.md` (dos trabajos, configurable). Sin contradicción.
- *Planning MD*: `vision.md` §Planificación confirma plan/skill y deja las PRs encadenadas fuera de v1; `spec-v1.md` §Slices y §Producto y slices mantienen la base integrada; arquitectura §Siguiente unidad lo repite. Conservado.

**Cadena revisión/cierre/aceptación y cancelación:** las invariantes de arquitectura cubren «resultado sin revisión → sin cierre ni aceptación», «aceptación → brief+candidato+cierre», «CANCELED no libera espacio» y el orden retirar-pendientes → abortar → comprobar cese. Coherente con DEL/OPS y con `a2a-js.md` #4/#6.

**Sugerencias (no bloqueantes):**

1. `arquitectura-candidata.md` §Datos y ownership, tabla **Decisión**: el mínimo «qué brief y candidato cubre» omite la referencia al cierre técnico que exige la invariante «Aceptación humana», y no modela la confirmación de integración («Código integrado»). Riesgo de colapsar aceptación e integración. *Severidad: baja.*
2. Misma sección, estados de **Intento**: «escritor incierto» (identidad no confirmada tras caída del controlador, OPS-05) no figura como estado; solo «detención solicitada», «detenido» y «resultado incierto». *Severidad: baja*; aclarar el mapeo.
3. **«panel» está sobrecargado**: panel de lectura/observación (diagrama de arquitectura; `spec-v1.md` §Estado operativo) vs paneles multi-modelo que consumen slots (§Límites, MOD-07). La arquitectura no mapea un panel de revisión a intento(s)/slot, así que MOD-07 («slots sucesivos sin deadlock») queda sin tratamiento. El término no está en `GLOSSARY.md`. *Severidad: media-baja.*
4. **Canal de control / auth del cliente**: `pi-runtime.md` demuestra que `bash` por RPC es privilegio del cliente y que la allowlist del modelo no lo limita. La arquitectura nombra la frontera y exige probarla, pero no afirma explícitamente que el ejecutor nunca enruta entrada controlada por el modelo hacia métodos RPC, ni que el Pi worker carece de acceso RPC. Debe ser criterio de PASS del spike. *Severidad: media-baja (residual, ya declarado pendiente).*
5. **SDK que vive fuera del chat**: la arquitectura lo presenta como alternativa comparativa y con reserva («no muere… necesariamente»); `pi-runtime.md` no lo probó. Correcto dejarlo pendiente; mantenerlo como comparación, no como hecho.

**PRs apiladas en v1:** verificado que no se habilitan inadvertidamente — ni S05 del plan ni la arquitectura introducen dependencia sobre contratos no integrados; ambas remiten a ampliación explícita del contrato v1.

Fuera de alcance: no reaudité el ecosistema ni exijo diseño de API/storage. Los puntos 1–3 son de modelo de dominio, no de implementación.

— reviewer DeepSeek, independiente del autor padre.
