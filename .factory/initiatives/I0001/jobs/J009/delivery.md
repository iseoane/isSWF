# Delivery summary

## Work and candidate

J009, brief-r3.md. Extends project navigation integrated in PR39/40. Exact source/review identity is retained in the job's attempt/review records, not inferred from HEAD here.

## What changed and why

Las fichas permiten registrar una nota local para el coordinador. Se conserva junto al job con los hashes del plan, brief y entrega que se mostraron. Registrar no aplica una decisión ni cambia el estado del trabajo.

## Visual summary

Abrir node tools/isswf-panel.mjs --project /absolute/project, elegir iniciativa y ficha, escribir una nota apta para mostrar y pulsar Registrar nota para el coordinador. La confirmación dice Nota registrada, no aplicada. Volver a la ficha muestra el texto registrado. El coordinador debe consultarlo; no recibe un despertar automático.

## Scope

Notas locales limitadas, con autor no autenticado y archivos por ID exclusivos. No aceptación automática, cambios de plan, grants, dispatch, modelos, merge, servicios globales ni GitHub. No prueba de actividad viva ni uso efectivo de referencias. Los cuatro jobs aceptados no se reabren.

## Checks and results

Pruebas HTTP cubren token/Origin/Host, evidencia obsoleta, cuerpo y nota limitados, stores inseguros, replay y concurrencia sin sobrescribir; el plan permanece intacto. Chromium real envió una nota en un proyecto sintético, observó la confirmación y la leyó en la ficha sin alterar el plan. No es una aceptación real. Los resultados finales de calidad/revisión/CI se registran por separado en A/V.

## Independent review

V001/V002 retienen las revisiones de los cortes previos. Las notas requieren una revisión independiente del candidato exacto antes de integrar.

## Closure and acceptance

J009 sigue en curso. Se registran entradas para el coordinador, no decisiones aplicadas. Falta reconciliación segura de decisiones y los criterios runtime; no pedir aceptación del panel completo.

## Integration risk and recovery

Loopback y token de sesión no prueban identidad del operador ni aíslan procesos locales hostiles. CSP permite formularios same-origin; las notas no son secretos ni se sanitizan universalmente. No publicar el servidor. Un fallo parcial debe inspeccionarse, nunca reintentarse automáticamente. El lector acotado muestra unknown ante corrupción/overflow y no repara archivos. Los hashes son observaciones separadas, no una transacción contra escritores externos.

## Blockers and next action

Completar revisión/CI del corte de notas. El coordinador verifica los pins de cada nota y registra por separado decisiones auténticas; no confundir el texto recibido con autorización de ejecución. Abordar después criterios runtime del panel.
