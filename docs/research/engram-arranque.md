# Engram para isSWF

## Recomendación

Usar Engram como memoria local, opcional y no autoritativa, con un identificador de proyecto explícito y estable, por ejemplo `isswf`. No usar el nombre base del worktree como identificador. El binario mantiene una base SQLite local común por defecto y separa la memoria por proyecto; `ENGRAM_DATA_DIR` elige otra base, no una partición de proyecto.

Para una futura integración MCP, fijar el proyecto en el proceso de isSWF, por ejemplo `engram mcp --tools=agent --project isswf`. No ejecutar todavía `setup`, `init` ni comandos de memoria contra el store real. `--project` tiene precedencia sobre `ENGRAM_PROJECT`, que a su vez precede a la detección por directorio actual. Las lecturas sin selector resuelven el proyecto actual; `--all` es la opción explícita para lecturas globales. La prueba aislada confirmó que `save`, `search` y `context` aceptan el mismo proyecto explícito.

Mantener la sincronización desactivada por defecto. Activarla solo tras aprobar qué datos salen del equipo y por qué canal. No conectar Engram a escrituras críticas de SQLite: si recuperar contexto falla, continuar sin contexto; si guardar una memoria falla, no revertir ni impedir una transacción de isSWF que ya tuvo éxito. Esta última garantía es una recomendación de integración, no algo probado en isSWF.

## Versión y fuentes

El binario local `/home/linuxbrew/.linuxbrew/bin/engram` responde `engram 3.4.0`. El tag oficial `v3.4.0` de `Gentleman-Programming/engram` apunta al commit `5c4171845958f046968c14d7d57a325eb4a83b7e`, fechado 2026-10-11. El release identifica además los commits `2eb9f51` para la sonda de compatibilidad y `5c41718` para aceptar cabeceras SQLite en modo WAL.

La coincidencia de versión y tag no prueba que el binario instalado se haya compilado de ese código. No se comparó hash del binario con un artefacto oficial. Las observaciones de CLI que siguen son del binario local; las explicaciones de implementación están atribuidas al tag fuente.

Fuentes oficiales consultadas:

- [Release v3.4.0](https://github.com/Gentleman-Programming/engram/releases/tag/v3.4.0)
- [Código del tag v3.4.0](https://github.com/Gentleman-Programming/engram/tree/v3.4.0)
- [CLI y configuración](https://github.com/Gentleman-Programming/engram/blob/v3.4.0/cmd/engram/main.go)
- [Despacho de compatibility y código de salida](https://github.com/Gentleman-Programming/engram/blob/v3.4.0/cmd/engram/compatibility.go)
- [Sonda de compatibilidad](https://github.com/Gentleman-Programming/engram/blob/v3.4.0/internal/store/compatibility.go)
- [Instalación y directorio de datos](https://github.com/Gentleman-Programming/engram/blob/v3.4.0/docs/INSTALLATION.md)
- [Diagnósticos de doctor](https://github.com/Gentleman-Programming/engram/blob/v3.4.0/docs/DOCTOR.md)
- [Implementación de doctor](https://github.com/Gentleman-Programming/engram/blob/v3.4.0/cmd/engram/doctor.go)
- [README y resolución de proyecto](https://github.com/Gentleman-Programming/engram/blob/v3.4.0/README.md)
- [Referencia de Engram](https://github.com/Gentleman-Programming/engram/blob/v3.4.0/DOCS.md)

## Store, compatibilidad y doctor

`ENGRAM_DATA_DIR` selecciona el directorio local del store. Si falta o contiene solo espacios, Engram usa `~/.engram`. El valor configurado no identifica por sí mismo el proyecto. La selección del proyecto y la ubicación de la base son controles distintos.

`engram compatibility --data-dir <ruta-absoluta> --json` es la comprobación offline que se debe ejecutar antes de considerar abrir un store existente. El código del tag la despacha antes de resolver la configuración normal, migrar bases huérfanas o crear un `Store`. Lee los nombres y metadatos de los ficheros del directorio, hasta 100 bytes de la cabecera SQLite y `.instance-id`; no consulta tablas ni memorias, usa SQLite, migra ni repara. Su salida nunca autoriza automáticamente a abrir la base. `status: fresh` describe un directorio vacío. En una base existente, una cabecera válida solo permite clasificarla como `unknown_shape`, `legacy_schema` o `future_schema`; no demuestra la forma ni la integridad del esquema.

### Cómo interpretar el error de preflight

El resultado estructurado que conserva el padre para `~/.engram` fue código 2, stdout vacío y stderr `compatibility: unsafe or invalid fixture metadata`. No se volvió a ejecutar ese comando ni se inspeccionó el directorio real.

En el tag `v3.4.0`, `cmd/engram/compatibility.go` requiere exactamente `--data-dir <ruta>` y `--json`; no usa `ENGRAM_DATA_DIR` ni el directorio predeterminado. Devuelve código 2 con el texto reportado cuando `store.ProbeCompatibility` devuelve cualquier error. La función `fail` de `internal/store/compatibility.go` usa el mismo error genérico para múltiples condiciones. Entre ellas están una ruta no absoluta o no canónica, un directorio ilegible, sidecars `-wal`, `-shm` o `-journal`, otro fichero `.db`, una base ausente en un directorio no vacío, `engram.db` o `.instance-id` no regulares o inválidos, una cabecera SQLite inválida, tamaño de página inesperado y cambios de metadatos durante la observación. La función no informa cuál condición falló.

El nombre "fixture metadata" forma parte de ese error genérico. No significa por sí solo que la base real sea incompatible o esté corrupta. El README del mismo tag presenta el comando como observación de stores existentes, aunque la implementación rechaza varios estados del directorio. Por tanto, el resultado actual solo establece que la sonda no pudo producir evidencia. No permite concluir que el store sea incompatible, corrupto ni seguro para abrir. Los estados `legacy_schema`, `future_schema` y `unknown_shape` son observaciones JSON exitosas, no la causa del código 2.

La sonda rechaza expresamente los sidecars WAL, SHM y journal. El test local previo confirmó el mismo error después de que `doctor` creara sidecars en un store temporal. No se sabe si los sidecars u otra condición causaron el resultado de `~/.engram`, porque el directorio real no se examinó. No borrar, mover ni renombrar ficheros para conseguir que la sonda pase.

`engram doctor --json --project <id>` es de solo diagnóstico respecto a filas, migraciones y cursores de sincronización, según [la documentación oficial de doctor](https://github.com/Gentleman-Programming/engram/blob/v3.4.0/docs/DOCTOR.md). Sin embargo, doctor abre el store mediante `Store.New`; no es una prueba previa a la apertura. En la prueba aislada con un directorio vacío creó `engram.db`, sidecars WAL, `.instance-id` y ficheros de lock. El README también advierte que el arranque normal del store ejecuta DDL y reparaciones. No ejecutar doctor real en esta investigación.

No ejecutar doctor contra `~/.engram` como siguiente paso. Aunque los diagnósticos base se describen como de solo lectura, `cmd/engram/doctor.go` llama a `Store.New`, y el comentario de `ProbeCompatibility` advierte que el arranque normal puede ejecutar DDL y reparaciones. Para investigar con menos riesgo, detener todos los procesos Engram y copiar el directorio completo a una ubicación privada, incluidos `engram.db`, `engram.db-wal`, `engram.db-shm`, `.instance-id` y los demás archivos. Verificar la copia y ejecutar `engram doctor --json --project isswf` solo contra esa copia. No ejecutar `doctor repair`, `--apply` ni comandos de escritura. Una prueba exitosa sobre la copia no autoriza abrir el original. Cualquier ejecución sobre el original queda pendiente de aprobación explícita y un plan de respaldo y restauración.

## Proyecto, alcance y sincronización

- La resolución documentada es proyecto explícito, luego `ENGRAM_PROJECT`, luego detección desde el directorio actual.
- El binario ofrece `--project` en `save`, `search` y `context`; el test aislado confirmó que el `project` y `scope` explícitos aparecen en el resultado guardado y recuperado.
- Usar un identificador canónico compartido entre worktrees de isSWF. El nombre de un worktree suele cambiar al renombrarlo o crear otro checkout y no es una identidad de proyecto estable.
- No usar `--all` en la integración normal. La documentación reserva esa opción para lecturas globales intencionales.
- Engram es local por defecto. `ENGRAM_CLOUD_AUTOSYNC` no está activo salvo que se configure como `1`; el código también requiere token y servidor. No se consultó ni modificó configuración de nube, tokens, servicios o autenticación.
- La sincronización local mediante Git y la nube son canales distintos. Revisar los datos y el destino antes de habilitar cualquiera. Esta investigación no ejecutó `sync`, exportación ni tráfico de red desde Engram.

## Comprobaciones ejecutadas

Las pruebas usaron solo `/tmp/engram-isswf-check.i4FcPi`, `HOME` temporal, un proyecto ficticio `isswf-fixture` y `env -i`. Se dejó `ENGRAM_CLOUD_AUTOSYNC=0` y `ENGRAM_NO_UPDATE_CHECK=1`, sin heredar tokens ni otras variables del usuario. No se ejecutaron comandos contra el store real ni se listaron proyectos.

Versión y ayuda local:

```sh
/home/linuxbrew/.linuxbrew/bin/engram --version
/home/linuxbrew/.linuxbrew/bin/engram --help
/home/linuxbrew/.linuxbrew/bin/engram compatibility --help
/home/linuxbrew/.linuxbrew/bin/engram doctor --help
/home/linuxbrew/.linuxbrew/bin/engram init --help
```

La versión fue `3.4.0`. La ayuda mostró `ENGRAM_DATA_DIR`, la precedencia de proyecto, el estado opt-in de autosync y el comando de compatibilidad. La ayuda de `doctor` marcó las comprobaciones de reparación por separado. `save --help` falló con `unknown save flag`; `search --help` se trató como una búsqueda y devolvió `No memories found`. No repetir esas formas contra un store real.

Comprobación aislada reproducible de un directorio vacío:

```sh
BIN=/home/linuxbrew/.linuxbrew/bin/engram
TMP=$(mktemp -d /tmp/engram-isswf-check.XXXXXX)
mkdir -p "$TMP/home" "$TMP/data"
env -i PATH=/home/linuxbrew/.linuxbrew/bin:/usr/bin:/bin HOME="$TMP/home" \
  ENGRAM_DATA_DIR="$TMP/data" ENGRAM_CLOUD_AUTOSYNC=0 ENGRAM_NO_UPDATE_CHECK=1 \
  "$BIN" compatibility --data-dir "$TMP/data" --json
env -i PATH=/home/linuxbrew/.linuxbrew/bin:/usr/bin:/bin HOME="$TMP/home" \
  ENGRAM_DATA_DIR="$TMP/data" ENGRAM_CLOUD_AUTOSYNC=0 ENGRAM_NO_UPDATE_CHECK=1 \
  "$BIN" doctor --json --project isswf-fixture
```

La sonda devolvió `source: offline`, `status: fresh` y `offline_automatic_opening_authorized: false`. Doctor devolvió `status: ok`, proyecto `isswf-fixture`, y 10 comprobaciones sin advertencias, bloqueos ni errores. Doctor creó el store SQLite temporal y sus ficheros WAL, de identidad y lock. Después, la sonda sobre ese store devolvió código 2 con `unsafe or invalid fixture metadata`, como se explicó arriba.

Prueba aislada de guardar y recuperar bajo el mismo proyecto:

```sh
env -i PATH=/home/linuxbrew/.linuxbrew/bin:/usr/bin:/bin HOME="$TMP/home" \
  ENGRAM_DATA_DIR="$TMP/data" ENGRAM_CLOUD_AUTOSYNC=0 ENGRAM_NO_UPDATE_CHECK=1 \
  "$BIN" save "scope smoke test" "fixture-only memory for scoped retrieval" \
  --project isswf-fixture --scope project
env -i PATH=/home/linuxbrew/.linuxbrew/bin:/usr/bin:/bin HOME="$TMP/home" \
  ENGRAM_DATA_DIR="$TMP/data" ENGRAM_CLOUD_AUTOSYNC=0 ENGRAM_NO_UPDATE_CHECK=1 \
  "$BIN" search "fixture-only memory" --project isswf-fixture
env -i PATH=/home/linuxbrew/.linuxbrew/bin:/usr/bin:/bin HOME="$TMP/home" \
  ENGRAM_DATA_DIR="$TMP/data" ENGRAM_CLOUD_AUTOSYNC=0 ENGRAM_NO_UPDATE_CHECK=1 \
  "$BIN" context --project isswf-fixture --scope project
```

`save` creó la observación `#1`; tanto `search` como `context` la devolvieron con proyecto `isswf-fixture` y alcance `project`. Esto prueba la selección explícita en el binario local, no aislamiento entre proyectos mediante un test de datos cruzados.

## Verificación independiente posterior

El padre ejecutó [verify-engram-scope.py](../../.audit/verify-engram-scope.py) con una base temporal, dos proyectos ficticios y marcadores de una sola palabra. La [salida conservada](../../.audit/engram-scope.json) registra ocho comprobaciones: directorio fresco sin autorización automática de apertura, apertura deliberada del fixture, recuperación en procesos nuevos, rechazo de memoria del otro proyecto y contexto acotado. No se usó `--all` ni se abrió el store real. Esto amplía la prueba de selectores, no certifica aislamiento frente a un caller que pueda elegir cualquier proyecto.

La [sonda del padre sobre el directorio real](../../.audit/engram-compatibility.json) devolvió exit2 y `unsafe or invalid fixture metadata`; no se continuó con operaciones de memoria. No se ha determinado la causa concreta en el store real ni se interpreta como corrupción. La integración normal sigue apagada.

## Límites

No se abrió, leyó ni enumeró el store real. Por eso no se ha confirmado su compatibilidad, su integridad, sus proyectos existentes ni si tiene sidecars que hagan fallar la sonda. Tampoco se instaló MCP, se escribió configuración, se contactó una nube ni se probó el comportamiento de isSWF ante fallos de Engram.

Antes de integrar, hace falta un diseño de fallo cerrado alrededor de una única identidad estable de proyecto y pruebas con una base temporal de isSWF: fallos de disponibilidad de Engram no deben abortar ni deshacer operaciones de SQLite; una recuperación vacía o fallida debe dejar la funcionalidad existente intacta. Mantener la integración apagada hasta que esos tests pasen.
