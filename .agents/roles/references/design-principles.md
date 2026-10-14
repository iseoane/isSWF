# Principios de diseño

Carga esta referencia cuando el encargo cambie modelos, contratos, límites o estructura; no es una checklist obligatoria para toda edición.

## Modelar primero
**Trigger:** lógica con estados, ramas, concurrencia o supuestos de forma repetidos. **Acción:** nombra los datos, dueño, transiciones y accesos antes de la lógica; elige una forma que evite estados contradictorios. Usa tipos, tabla o máquina de estados solo si aclaran el dominio. **Límite:** similitud superficial no justifica una abstracción; no diseñes para concurrencia hipotética.

## Simplificar para navegar
**Trigger:** wrappers, reglas duplicadas, capas nuevas, estado oculto o comportamiento difícil de localizar. **Acción:** elimina lo muerto y redundante primero; conserva una fuente por decisión; reutiliza el helper canónico si satisface el contrato. Añade una capa solo si oculta complejidad real o reduce ramas/estado. **Límite:** menos líneas no es objetivo. Respeta convenciones y no reorganices un repo sin causa dentro del alcance.

## Validar en límites reales
**Trigger:** entrada de CLI, config, red, almacenamiento, proceso, tracker, memoria o agente. **Acción:** analiza y valida datos no confiables al cruzar la frontera; convierte a conceptos del dominio y propaga errores concretos. **Límite:** no revalidez sin razón invariantes ya establecidas, pero tampoco confíes ciegamente en estado persistido, resultados de workers o recuperación parcial. La tipificación interna no prueba que el dato externo sea actual o completo.

## Integrar requisitos desde el contrato
**Trigger:** un requisito nuevo toca consumidores, datos, documentación, compatibilidad o aceptación. **Acción:** reconcilia brief y grounding; piensa el contrato como fundacional, propaga el cambio a los consumidores afectados y entrega en pasos verificables. **Límite:** no rediseñes el sistema entero por un cambio local ni amplíes alcance/autorización. Distingue API interna de contrato público o persistido.

## Límites compartidos
Permisos, privacidad, secretos, retención y acceso a datos se comprueban en la frontera adecuada. Redacta secretos y datos sensibles en informes y evidencias. Riesgo de pérdida de datos, migraciones, cancelación o recursos requiere tratamiento explícito y proporcional. No prometas sandbox, aislamiento ni contención que el runtime no haya demostrado; si un límite requerido no puede verificarse, informa el bloqueo específico.
