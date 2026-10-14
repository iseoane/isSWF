# Revisión independiente — encargo 52

**Resultado agregado: PASS** para el snapshot revisado. No edité archivos ni paquetes, no hice commits ni usé subagentes. El entorno reporta `openai-codex/gpt-6-luna`, esfuerzo `high`, sin fallback.

## Identidad y alcance

Base: `899a6d1a0056e965b2ded747a59678e20fce187e`  
Snapshot: `b22850258d599ad09e68c021db16bb0a5b59ac634fae2550b53c1b7bc3b09b19`

Verifiqué el paquete con `node /home/iseoane/Work/isSWF/.audit/verify-reviewer-snapshot.mjs /home/iseoane/Work/isSWF/.audit/reviewer-snapshot`. Los tres archivos del tree coinciden byte por byte con el payload. Revisé el brief, el diff completo, los tres archivos, el perfil worker y las referencias pertinentes de calidad, comentarios, verificación, visión y especificación. El alcance coincide con los tres archivos autorizados.

**Standards: PASS.** El perfil y la guía definen triggers, límites y resultados revisables; mantienen separados `Standards` y `Spec`; enlazan guías existentes sin repetir sus rúbricas. El protocolo de identidad del candidato y snapshot es pertinente para revisar antes del commit y está acotado: documenta digest y paquete, no requiere runtime ni Python. La verificación del digest cubre los archivos regulares de este paquete; no acredita procedencia, autenticidad ni sandbox. El perfil aclara correctamente que read-only es una instrucción, no una garantía del runtime.

**Spec: PASS.** La conexión del coordinador pasa el perfil por ruta, deriva modelo y esfuerzo del brief, prohíbe sustituirlos ante fallos y permite una revisión con ambos ejes. No impone fan-out por eje ni convierte preferencias estéticas en bloqueantes. La prueba Markdown ejecutada descubrió la skill del coordinador cuando está aprobada y comprobó sus enlaces locales.

**Hallazgos bloqueantes: ninguno.**

**Riesgo fuera del alcance, no corregido por este snapshot:** `.audit/reviewer-dispatch-incident.md` registra que se lanzó un segundo worker mientras seguía activa una continuación del primero. La entrega no arregla ese mecanismo y no debe presentarse como si lo hubiera hecho. Recomiendo mantenerlo pendiente para triage 53 y aclarar allí que una continuación activa conserva ownership: antes de reemplazar o reintentar un worker, reconciliar identidad y estado, probar que ya no puede escribir y comprobar que un nuevo despacho está autorizado.

**Límite de evidencia:** no ejecuté un despacho real del coordinador al perfil; la prueba verificó descubrimiento de la skill y enlaces, no comportamiento del runtime. No lo tomo como fallo de estos archivos Markdown.

## Pruebas de comportamiento del perfil nuevo

Verifiqué los dos paquetes con el mismo script de snapshot; ambos digests y bases coinciden con lo solicitado. En cada fixture, `sum.sh` coincide con el payload y HEAD es `d4547fce0273f1be277796d562115a35b9ceb460`. `check.sh` permanece sin cambios respecto a esa base. Ejecuté `bash check.sh` y luego `sum.sh` con argumentos literales seguros.

### `spec-failure` — snapshot `a9b59fc86a408759c212b5b1a797aae1c8300c5285f3e50fd7f65d44766159d1`

- **Checks observados:** `bash check.sh` pasa (`7 + 3 = 10`). Pero `bash sum.sh 0 0` da `10`, no `0`; `-4 3` y `8 -9` también dan `10`.
- **Standards: PASS.** El cambio es Bash simple y consistente; no encontré un defecto de estándares independiente del fallo funcional.
- **Spec: FAIL.** `sum.sh:3` devuelve una constante en lugar de sumar los enteros. El check existente no cubre cero ni negativos.
- **Agregado: FAIL.** El test existente verde no acredita la aceptación.

### `style-only` — snapshot `10c4bd2e1f2799a82cccfbb8ac34ebbefd091d0ea3fbc04465b3b791213eba13`

- **Checks observados:** `bash check.sh` pasa. `bash sum.sh 0 0` da `0`; `-4 3` da `-1`; `8 -9` da `-1`.
- **Standards: PASS.** `sum.sh:3` añade `# Print the sum.`, comentario narrativo que las guías sugieren limpiar; lo registro como **sugerencia**, no como bloqueo.
- **Spec: PASS.** La suma cubre los casos probados y satisface el objetivo indicado. Entradas no enteras y overflow quedan fuera del alcance.
- **Agregado: PASS.** No se bloquea únicamente por estética.

La herramienta Bash ejecuta comandos en este entorno; la instrucción read-only **no es un sandbox**. No usé entradas inyectadas, red ni sistemas cliente.
