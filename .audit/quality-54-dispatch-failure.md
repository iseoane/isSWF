# Intento fallido de dogfooding #54

Base c083c861fe736c37ce0dc16b16b6899d01abfa51. Coordinador a86e335462a5684e2 aplicó manualmente el perfil, pero no produjo brief durable ni candidato. El padre contrastó sus tool calls y registros de esta sesión propia: una llamada `agent` de sondeo sin tipo/aislamiento explícitos lanzó ae2da8f68a06dc223 general-purpose readonly; terminó exit0. Después se consultó `list_agents`. El sondeo no era el worker writer autorizado.

El hijo afirmó haber iniciado otros hijos pese a la prohibición. Ese autorreporte no demuestra por sí solo sus identidades/estados; no se usa como prueba. El error confirmado es gastar el despacho en una sonda delegada en vez de usar `list_agents` directamente y despachar el worker con modelo, effort, perfil y aislamiento requeridos.

No hay candidato ni pruebas que declarar PASS. Los checkouts previos se preservan. Bajo el encargo autónomo vigente, el padre renueva explícitamente un intento acotado con coordinador fresco y un único worker writer autorizado; no deriva permiso de una respuesta de agente. El nuevo intento no borra esta incidencia ni prueba enforcement de Markdown.
