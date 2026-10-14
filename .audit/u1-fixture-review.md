# Corrección del fixture del verificador documental

Invocación independiente `a5ac3eafcc83038cf`, GPT6 Luna high. Sin bloqueantes en sustituir la lista manual de carpetas por copia del árbol del proyecto excluyendo Git y caches. El revisor ejecutó el verificador: baseline/restauración pasan y los cinco errores esperados se rechazan. No se desactiva la validación de enlaces.

La omisión nueva era `.agents`, como antes había ocurrido con destinos de `.audit`. Es un defecto del fixture, no de los enlaces reales ni de U1. La corrección elimina la selección manual que exigía repetir el parche por destino.

El revisor señaló que TemporaryDirectory no garantiza por sí mismo quedar fuera del proyecto si cambia TMPDIR. El padre añadió una aserción antes de copytree. Con TMPDIR deliberadamente apuntando al proyecto, la ejecución falla con `Temporary fixture must be outside project` antes de copiar y limpia su temporal. Evidencia `.audit/u1-definition-temp-guard.log`. El caso normal y las cinco mutaciones vuelven a pasar. La adición de esa aserción fue verificada por el padre después del dictamen.
