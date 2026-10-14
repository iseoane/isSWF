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

La evidencia posterior y la condición concreta están en la sección «Diagnóstico de la sonda sobre el store real». El análisis de candidatos que sigue se conserva como registro del razonamiento previo.

No ejecutar doctor contra `~/.engram` como siguiente paso. Aunque los diagnósticos base se describen como de solo lectura, `cmd/engram/doctor.go` llama a `Store.New`, y el comentario de `ProbeCompatibility` advierte que el arranque normal puede ejecutar DDL y reparaciones. Para investigar con menos riesgo, detener todos los procesos Engram y copiar el directorio completo a una ubicación privada, incluidos `engram.db`, `engram.db-wal`, `engram.db-shm`, `.instance-id` y los demás archivos. Verificar la copia y ejecutar `engram doctor --json --project isswf` solo contra esa copia. No ejecutar `doctor repair`, `--apply` ni comandos de escritura. Una prueba exitosa sobre la copia no autoriza abrir el original. Cualquier ejecución sobre el original queda pendiente de aprobación explícita y un plan de respaldo y restauración.

## Diagnóstico de la sonda sobre el store real

Esta sección resuelve la causa del código 2 reportada arriba. Se trabajó con el código del tag `v3.4.0` (commit `5c4171845958f046968c14d7d57a325eb4a83b7e`, que incluye `2eb9f51` y `5c41718`) y con copias privadas del store. No se escribió, borró ni renombró nada en `~/.engram`.

### Condiciones que producen el error, según el código

`cmd/engram/compatibility.go` L32-35 exige exactamente un `--data-dir <ruta>` y un `--json`; cualquier otro argumento imprime la línea de uso y devuelve 2. L36-39 llama a `store.ProbeCompatibility` y, ante cualquier error, imprime el error en stderr y devuelve 2. Por eso el texto reportado es el mensaje genérico de `internal/store/compatibility.go` L33: no identifica qué comprobación falló.

Todas las condiciones que llaman a `fail()` en `internal/store/compatibility.go` son:

| # | Línea | Condición |
|---|---|---|
| 1 | L35 | la ruta no es absoluta, o `filepath.Clean(dir) != dir` (barra final, `.` o `..`) |
| 2 | L38-41 | `filepath.EvalSymlinks` falla |
| 3 | L45-48 | `Lstat` falla o no es un directorio |
| 4 | L49-52 | falla la primera instantánea de metadatos del directorio |
| 5 | L53-56 | falla `os.ReadDir` |
| 6 | L60 | cualquier entrada cuyo nombre termine en `-wal`, `-shm` o `-journal`, o cualquier `*.db` distinto de `engram.db` |
| 7 | L67-71 | no hay `engram.db` y el directorio no está vacío |
| 8 | L73-76 | `engram.db` no es un fichero regular |
| 9 | L77-80 | `.instance-id` ausente, no regular, o mayor de 128 bytes |
| 10 | L81-84 | `.instance-id` ilegible o no son 32 hex minúsculas (`internal/store/instance.go` L81-91) |
| 11 | L86-96 | error al abrir `engram.db`, lectura corta de 100 bytes, error de `Stat`, `!os.SameFile`, o cabecera distinta de `SQLite format 3\x00` |
| 12 | L99-105 | tamaño de página fuera de `[512, 65536]`, no potencia de dos, tamaño de fichero no múltiplo del tamaño de página, o bytes 18/19 (versiones de formato) fuera de `{1,2}` |
| 13 | L115-118 | la instantánea de metadatos cambió durante la observación: nombre, `SameFile`, modo, tamaño o mtime de cualquier entrada |

La clasificación de esquema (L106-113; `schemaVersion = 1` en `internal/store/store.go` L1181) produce `unknown_shape`, `legacy_schema` o `future_schema` con salida 0: son éxitos, no causas del código 2. El [README del tag](https://github.com/Gentleman-Programming/engram/blob/v3.4.0/README.md) L224-249 enumera el rechazo de «WAL/SHM/journal sidecars and observed metadata changes». El test `internal/store/compatibility_test.go` usa fixtures `wal`, `shm` y `journal` (L42, L76-81), y `TestCompatibilityProbeAcceptsRealWALStore` (L153-183) sólo acepta una base en modo WAL **quiescente**, es decir sin sidecars.

### Qué condición se cumple en `~/.engram`

Confirmado: la condición 6, sobre `engram.db-wal` (27 896 552 B) y `engram.db-shm` (32 768 B).

Evidencia diferencial en copias privadas (`cp -a`, `HOME` temporal, `env -i`, `ENGRAM_CLOUD_AUTOSYNC=0`, `ENGRAM_NO_UPDATE_CHECK=1`):

| Variante (copia) | Sonda |
|---|---|
| Copia literal, con sidecars | exit 2, mismo stderr |
| La misma copia sólo con `engram.db-wal` y `engram.db-shm` retirados de la copia | exit 0, `status: unknown_shape`, `instance_id` idéntico al del store real |
| Copia sin sidecars más un fichero vacío ajeno llamado `decoy-wal` | exit 2 |

La copia literal reproduce el fallo; retirar únicamente los dos sidecars lo convierte en éxito; un nombre ajeno terminado en `-wal` vuelve a fallar. Eso aísla la línea L60 como la condición que dispara el rechazo y descarta las demás para este contenido: la cabecera es válida (página 4096, versiones de escritura/lectura 2/2, esquema 1, 43 085 824 B divisible por 4096) y `.instance-id` son 32 hex válidos. El binario acepta por tanto una base en modo WAL con cabecera 2: incluye el arreglo de `5c41718`.

Probable, no observable en esta ejecución porque la condición 6 falla antes: la condición 13, cambios de metadatos durante la observación, con `engram serve` vivo escribiendo `sync.log` (mtime 08:38:04; entradas «Push OK» e «Import/Pull OK» en el log). Comprobado aparte, en una copia sin sidecars: con un escritor que sólo añade a `sync.log`, 50 de 50 sondas devolvieron exit 2 con el mismo error; en reposo, exit 0. La sonda es una carrera contra cualquier escritor del directorio, no sólo contra los sidecars.

No hay evidencia de ninguna otra condición: ninguna otra falla sobre esta copia. No se marca corrupción.

### Resultado en la copia y legibilidad del store

Sólo lectura acotada, contra la copia literal, sin volcar contenidos:

- `projects list` → exit 0; 44 proyectos.
- `stats --all` → exit 0; 3614 sesiones, 2797 observaciones, 4015 prompts.
- `context --project omarchy --scope project` → exit 1, `engram: unknown project: omarchy`.

El store abre y se lee, con su WAL, en un proceso Engram normal que apunta a la copia. El rechazo de `compatibility` no es un hallazgo de incompatibilidad ni de integridad. Nota: `omarchy` aparece en `sync.log` pero no existe como proyecto almacenado.

Límite: la copia se tomó con el store abierto, sin instantánea atómica. El éxito de lectura indica que SQLite pudo leer el conjunto copiado; no certifica la integridad del original. El propio README (L246-249) recuerda que un éxito offline nunca autoriza a abrir un store existente.

### Implicaciones para la preflight automática

- `compatibility` **no sirve como preflight del store vivo**: mientras `engram serve` mantiene el WAL, la condición 6 garantiza exit 2 con independencia del estado real del store. Tampoco sirve como detector de corrupción.
- Sirve sólo como observación offline de un directorio quiescente: copia sin sidecars y sin escritores concurrentes. Su valor es clasificar cabecera e identidad, nunca autorizar la apertura.

### Parada real de `engram serve` (14 de octubre)

El usuario propuso parar y rearrancar el servidor. Se envió `SIGTERM` al proceso, esperó su salida y se observó el directorio real: el proceso terminó pronto, pero `engram.db-wal` (27 896 552 B, mtime sin cambios) y `engram.db-shm` siguieron presentes, y la sonda volvió a devolver exit 2 con el mismo mensaje. Es decir, **la predicción basada en la copia no se cumplió**: retirar los sidecars en una copia hacía pasar la sonda, pero la parada de Engram no los retira.

Consecuencia práctica: la condición 6 depende de que existan esos ficheros, no de que el store esté abierto en ese momento. Un store que Engram haya abierto en modo WAL y dejado con sidecars seguirá rechazando la sonda de forma estable. `compatibility` no puede ser la comprobación previa de este store. El [registro](../../.audit/engram-checkpoint-verify.json) conserva la secuencia completa, incluida la corrección.

El servidor se relanzó desde `~/Work/agent-depot` con `ENGRAM_CLOUD_AUTOSYNC=1` y volvió a escuchar en `127.0.0.1:7437`. Su propio log informó `[autosync] ERROR: cloud token is not configured ... autosync disabled`, y `GET /sync/status` respondió `enabled=false` con `reason_code: blocked_unenrolled`. El cloud no está configurado; las líneas de `sync.log` corresponden a los hooks de exportación/importación de chunks en Git, no a tráfico de nube. El prefijo de cada línea es el **nombre de la máquina** (`sync.sh` registra `[$(hostname -s)]`), no un proyecto: `[omarchy] Push OK` significa que este equipo empujó su copia de chunks. Una lectura anterior de este informe lo interpretó como otro proyecto y era incorrecta. Los hooks que invocan `sync.sh` son la extensión de Pi y los hooks de Codex y Claude del usuario; su aviso `binario engram no encontrado en el PATH del hook` se analizó por separado.
- Para el camino vivo, el canal autoritativo es el propio store en marcha: `GET /compatibility` del servidor devuelve `source: active`, `status: ready` y `capability: startup-verified-store-v1` (README L250-258).
- Alternativa sin sonda: abrir con el camino normal y tratar los errores de esquema en el llamante, con fallo cerrado (continuar sin contexto). `Store.New` ejecuta DDL y reparaciones.
- No borrar ni renombrar sidecars para que la sonda pase: los sidecars están rechazados a propósito y aquí el WAL contiene 27,9 MB de transacciones confirmadas que un checkpoint no ha trasladado al fichero principal. Suprimirlo es pérdida silenciosa de datos.

### Huella

Nada se escribió en `~/.engram`; sólo lecturas (`cp -a`) y ejecuciones de la sonda y de lecturas acotadas en copias bajo `/var/tmp`, borradas al terminar. El directorio real conserva tamaños y mtimes anteriores (engram.db 43 085 824 B, `-wal` 27 896 552 B, `-shm` 32 768 B). El resumen estructurado está en [`.audit/engram-probe-copy.json`](../../.audit/engram-probe-copy.json).

## Proyecto, alcance y sincronización

- La resolución documentada es proyecto explícito, luego `ENGRAM_PROJECT`, luego detección desde el directorio actual. Con un directorio que contiene varios repositorios git, la detección no elige: el binario local responde `ambiguous project: multiple git repos found in cwd` y sale con código 1. Falla en cerrado, pero refuerza que la identidad debe pasarse explícita.
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

Actualización posterior: la sección «Diagnóstico de la sonda sobre el store real» sí examinó copias privadas del store. La causa del código 2 quedó identificada (sidecars `-wal`/`-shm`), el store abrió y se leyó en la copia con 44 proyectos y 2797 observaciones, y no se modificó nada en `~/.engram`. Las afirmaciones de este apartado sobre lo no examinado quedan superadas por esa sección.

Antes de integrar, hace falta un diseño de fallo cerrado alrededor de una única identidad estable de proyecto y pruebas con una base temporal de isSWF: fallos de disponibilidad de Engram no deben abortar ni deshacer operaciones de SQLite; una recuperación vacía o fallida debe dejar la funcionalidad existente intacta. Mantener la integración apagada hasta que esos tests pasen.
