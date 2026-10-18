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

Pruebas HTTP cubren token/Origin/Host, evidencia obsoleta, cuerpo y nota limitados, stores inseguros, replay y concurrencia sin sobrescribir; el plan permanece intacto. Chromium real envió una nota en un proyecto sintético, observó la confirmación y la leyó en la ficha sin alterar el plan. No es una aceptación real. PR41 está integrada en main eae28aa170c6c6a9c17ce13bdfb0fe2f9498249a, que contiene el source checkpoint 72a55b5 de A003/V003. CI 39132510085 pasó sobre el head exacto 0c62b1953eb34f3d4ce0e2eb27694fa55c39e329; calidad, ESLint y Knip postmerge pasaron. No se atribuyen al revisor las comprobaciones de CI hechas por el coordinador.

## Independent review

V001/V002 retienen las revisiones de los cortes previos. V003 retiene PASS sobre el candidato exacto y la reproducción independiente del formulario nativo en Chromium. La entrega técnica está integrada; esto no es aceptación del operador.

## Closure and acceptance

Corte técnico entregado, pendiente de aceptación del operador. Hay un servidor loopback por proyecto, Kanban/fichas y notas registradas, no decisiones aplicadas. El operador cuestionó tener que arrancar el servidor manualmente; esa objeción de experiencia sigue abierta. No se ha implementado HTML estático ni arranque gestionado. No se presupone conformidad ni se acepta la v1 completa. Capacidad/slots corresponden a J005; continuidad/reinicio a J006, seguridad de clientes a J007 y reconciliación global a J008.

## Integration risk and recovery

Loopback y token de sesión no prueban identidad del operador ni aíslan procesos locales hostiles. CSP permite formularios same-origin; las notas no son secretos ni se sanitizan universalmente. No publicar el servidor. Un fallo parcial debe inspeccionarse, nunca reintentarse automáticamente. El lector acotado muestra unknown ante corrupción/overflow y no repara archivos. Los hashes son observaciones separadas, no una transacción contra escritores externos.

## Blockers and next action

Mostrar lo entregado y resolver con el operador la fricción del arranque manual antes de registrar aceptación. Un HTML estático sería una foto con fecha; datos actuales y respuestas requieren acceso local mediante servidor o permisos explícitos del navegador. No añadir ambos mecanismos por inercia. El coordinador verifica los pins de las notas y registra decisiones auténticas por separado; el texto recibido nunca es un grant.
