## Resultado

No reproduje una apertura del store real de Engram, una llamada a modelo ni cambios en los archivos revisados. No usé red ni subagentes.

- **Paquete compartido y activación por proyecto:** `node .audit/verify-project-package.mjs` pasó. Dos proyectos temporales resolvieron la misma skill desde una ruta compartida; `--approve` la cargó y `--no-approve` la omitió. El RPC pidió solo `get_commands`, en modo offline y sin sesión. El CLI Python escribió estados separados.
- **Límite de esa prueba:** usa un archivo de un commit fijado, extraído a un directorio temporal. Prueba ruta compartida y activación, **no** la inmutabilidad frente a escrituras, una distribución publicada ni un instalador de producción.
- **Preservación de `AGENTS.md` y settings:** está documentada como requisito, pero no quedó verificada: los proyectos del fixture empiezan vacíos y no hay instalador que probar.
- **Perfiles Markdown y Pi:** la investigación distingue perfiles de skills; la prueba confirma el catálogo de skills, no despacho de perfiles ni selección de modelos por rol. No encontré evidencia en este alcance de que Pi los ejecute nativamente.
- **Engram:** repetí el verificador copiándolo con su carpeta `.audit` a un directorio temporal. Pasaron los ocho checks con dos proyectos ficticios. El script usa un `HOME` y un store temporales; su salida se escribió allí y se borró al terminar. La sonda de compatibilidad sobre ese fixture abierto rechazó el estado con sidecars, sin demostrar corrupción. El artefacto de compatibilidad del store real solo registra un rechazo de preflight; no acredita apertura ni permite concluir corrupción.
- **Alcance de Engram:** los marcadores prueban filtrado por selector en el CLI observado, no aislamiento contra un proceso del mismo usuario que pueda escoger otro proyecto.
- **Codegraph:** `.codegraph` no existe en el checkout. Eso concuerda con el documento, pero no repetí la consulta al servidor; no afirmo haber verificado su respuesta.
- **Factory sin vendor/autoload global:** el fixture confirma que ambos proyectos apuntan a una ruta común y que `--no-approve` omite el recurso. No es una prueba de un instalador real ni de todas las fuentes de carga global posibles.

**Conclusión:** no encontré un fallo reproducible en los verificadores dentro de estos límites. La principal cautela es no presentar como comprobadas la preservación de archivos existentes, la inmutabilidad de producción ni la respuesta actual de Codegraph. El estado de trabajo previo se conservó; no hay cambios en los archivos objetivo.
