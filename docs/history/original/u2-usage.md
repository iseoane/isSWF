# U2. Registrar una decisión y reconciliar una issue

U2 conserva las decisiones humanas en el mismo snapshot SQLite que la propuesta. `prepare` propone y reconcilia. Solo el operador usa `decide` para registrar una respuesta. Ninguno de los dos comandos inicia ejecución.

## Preparar una ficha pendiente

Copia `examples/u2/ambiguous-proposal.json`, sustituye la referencia de autorización y prepara la ficha:

```sh
python -m isswf --state /ruta/privada prepare /ruta/ambiguous-proposal.json
```

Una pregunta contiene `id`, `kind`, `question`, `owner` y `exit_condition`. Usa `kind: product` para una decisión de producto y `kind: missing-information` para información que solo conoce el operador. El dueño debe ser `operator`. Una duda técnica que se puede investigar pertenece al grounding, no a la lista de preguntas.

`questions` contiene solo preguntas sin respuesta. Una pregunta con respuesta registrada no puede volver a la lista, aunque conserve el mismo texto e ID. Para preguntar algo nuevo después, usa un ID nuevo y una pregunta concreta. `needs-info` y `ready-for-human` requieren al menos una pregunta pendiente. Si quedan varias, responder una conserva el estado de espera correspondiente y las demás preguntas. `decide` deja `needs-triage` solo cuando ya no quedan preguntas.

La aceptación puede estar vacía mientras el operador aún debe fijar el criterio. `ready-for-agent` requiere aceptación no vacía, ninguna pregunta pendiente y `resolution: null`. Significa que el siguiente paso acotado está listo para realizarse, por ejemplo grounding técnico, no que ese grounding ya se completó, que se autorizó ejecutar cambios o que haya entrega o integración. Si el criterio ya está definido, un hecho técnico investigable no exige una espera humana perpetua. `next_step` propone el paso dentro del grant; no concede permisos ni promete ejecución, integración o entrega.

## Registrar la respuesta del operador

Copia `examples/u2/decision.json` y sustituye el identificador devuelto por `prepare`, la revisión actual y la respuesta:

```sh
python -m isswf --state /ruta/privada decide /ruta/decision.json
```

El documento acepta solo `work_id`, `expected_revision`, `question_id`, `answer` y `actor`. El comando comprueba la revisión, el trabajo, la autorización y la pregunta pendiente. `actor` registra atribución; no autentica al usuario. El comando publica una revisión del mismo trabajo, conserva la pregunta original en `answers`, elimina esa pregunta de la lista pendiente y fija `preparation` en `needs-triage`. No cambia el resultado a `ready-for-agent`.

No repitas `decide` para la misma pregunta. Una respuesta a un trabajo, pregunta o revisión distintos se rechaza sin cambiar la ficha ni la historia. El texto de una respuesta no concede permisos. La skill contrasta semánticamente que la respuesta se mantenga dentro del objetivo y alcance del grant.

## Reconciliar el brief

Después de `decide`, la skill lee la respuesta del snapshot y produce una propuesta nueva. Usa `decision_refs` con el identificador de respuesta devuelto por `decide`, conserva el mismo trabajo y autorización y aumenta `expected_revision` a la revisión actual. El nuevo brief debe respetar exactamente el objetivo y alcance autorizados.

Usa `examples/u2/reconciled-proposal.json` como formato. Para pasar a `ready-for-agent`, define aceptación observable, deja `questions` vacío y conserva `resolution: null`. Mantén en `decision_refs` todas las respuestas registradas para el trabajo, la autorización y la fuente actuales. El comando de preparación comprueba que cada pregunta anterior que desaparece tenga una respuesta registrada para la misma pregunta y fuente. También rechaza volver a incluir una pregunta respondida. No cambies el texto de una pregunta bajo el mismo ID ni retires una pregunta pendiente, incluso para usar `needs-triage`.

U2 bloquea el uso de respuestas si cambia el fingerprint de la fuente. Requiere reconciliación fuera de esta unidad. No borres preguntas pendientes ni añadas nuevas y cambies de revisión para saltarte una decisión.

## Registrar una disposición no accionable

Usa `preparation: needs-triage` y una `resolution` de tipo `duplicate` o `already-present` solo con destino, referencias de evidencia que incluyan observación y explicación. Una resolución concluyente no puede coexistir con preguntas pendientes. Responde todas las preguntas primero; `decide` conserva `needs-info` o `ready-for-human` mientras quede alguna. `examples/u2/already-present-proposal.json` muestra la forma. Sin evidencia, el parser rechaza la disposición: no inventes referencias ni una resolución concluyente. Para una sospecha técnica sin evidencia, conserva `resolution: null` y prepara grounding con un criterio observable de investigación, como en `examples/u2/grounding-proposal.json`. El ejemplo se puede comprobar con el CLI:

```sh
python -m isswf --state /ruta/privada authorize examples/u1/authorization.json
# Sustituye authorization_id en una copia de grounding-proposal.json con el id devuelto.
python -m isswf --state /ruta/privada prepare /ruta/grounding-proposal.json
```

La evidencia de una resolución se conserva en la misma ficha y el panel la muestra. El parser comprueba su forma, no su veracidad. Una disposición no acredita una entrega integrada.

## Snapshots y límites

`questions`, `decision_refs`, `answers` y `resolution` forman un solo contrato. Una propuesta no puede escribir `answers`; solo `decide` puede añadir una respuesta confiable. `show` y el panel leen el snapshot SQLite. El publicador actualiza la ficha y su historia en una transacción. Una falla de escritura conserva la revisión anterior.

Las fichas U1 antiguas siguen disponibles en lectura. La lectura añade valores vacíos solo en memoria, sin reescribir el snapshot ni la historia. El panel sigue siendo de solo lectura. En S01, U2 no implementa workers, ejecución, consulta real a GitHub ni publicación remota.
