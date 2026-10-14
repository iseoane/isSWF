# Arranque de isSWF por proyecto

Estado: propuesta de distribución y activación, no instalador implementado. U1 y U2 funcionan localmente; antes de U3 se comprobará cómo usarlas desde otro proyecto. Engram y Codegraph todavía no están integrados en el funcionamiento normal de isSWF. Este documento concreta el nuevo acuerdo de la [visión](vision.md), sin dar por resuelto el ejecutor de S02.

## Decisión propuesta

Instalar los recursos de la factory una vez por versión y activarlos explícitamente en cada proyecto. Compartir los archivos no significa cargar automáticamente sus instrucciones en todos los proyectos ni compartir sus datos.

| Alternativa | Ventaja | Coste o riesgo | Decisión |
| --- | --- | --- | --- |
| Paquete compartido con revisión fijada y activación de proyecto | Una fuente de skills y perfiles; cada proyecto elige versión. | Hay que probar resolución de recursos, trust, actualizaciones y convivencia de versiones. | Dirección acordada con el usuario. |
| Copias completas en cada proyecto | Checkout autocontenido. | Duplica metodología y runtime; propaga arreglos mediante copias y facilita divergencias. | No es el camino normal. |

La [investigación Pi](research/instalacion-pi.md) recomienda copias para su primer bootstrap. Conservamos sus hechos y prueba de descubrimiento, pero no esa recomendación: el usuario ya eligió evitar copiar la factory. Una instalación compartida puede usar el caché de paquetes de Pi y declaraciones de proyecto, sin cambiar el catálogo personal. No se necesita una extensión por skill.

## Qué se comparte y qué no

Propuesta de distribución, no árbol ya creado:

```text
factory/<revision-inmutable>/
  .agents/skills/                 procedimientos Markdown
  agents/                        perfiles Markdown futuros
  isswf/                         soporte Python pequeño
  docs/                          contratos y referencias de las skills
  examples/                      formatos ficticios citados por las skills
  package.json                   manifiesto Pi futuro

proyecto/
  AGENTS.md                      instrucciones existentes, intactas
  .pi/settings.json              activación explícita; preservar contenido previo
  isswf.config.json              identidad, versión y configuración local propuestas
  .agents/skills/                procedimientos propios del proyecto, si existen

estado-del-usuario/isswf/<project-id>/
  isswf.sqlite3                  estado operativo separado, no versionado
```

La versión de la factory y la del proyecto son distintas. No se apunta a un checkout de desarrollo mutable como instalación estable. Actualizar un proyecto no cambia la versión de otro ni las instrucciones de un worker ya activo. Un rollback selecciona una versión comprobada; no borra trabajos ni memorias.

Todos los worktrees de un mismo proyecto usan una identidad estable y el mismo dueño de estado operativo. El nombre del directorio o del worktree no identifica el proyecto. Proyectos diferentes tienen datos separados. Esta resolución automática de identidad/rutas aún no está implementada: el CLI actual recibe `--state` explícitamente.

Los agentes Markdown serán datos del runtime de isSWF. Pi 1.2.0 carga skills y contexto, pero no despacha perfiles Markdown ni asigna modelos por rol de forma nativa. Empaquetar esos perfiles no equivale a ejecutar workers.

## Configuración por proyecto

Se propone un único `isswf.config.json` versionado para:

- identidad estable del proyecto y revisión de factory;
- defaults y overrides por rol: modelo/esfuerzo inicial y cadena ordenada de fallbacks aprobados;
- integración de memoria y navegación, y límites operativos pertinentes.

El esquema concreto se probará antes de implementarlo. No contiene credenciales ni copia settings privados de Pi. La configuración de modelos por rol pertenece a isSWF, no a las skills ni al default de sesión de Pi. El runtime deberá comprobar combinaciones disponibles y conservar la configuración efectiva de cada intento. Actualmente no existe ese resolver ni fallback automático.

Las rutas de instalación personales se resuelven al activar el proyecto, no se convierten en una dependencia portátil ficticia. Cuando exista un origen de distribución autorizado se podrá declarar una ref Git inmutable o una versión exacta de paquete. Ahora sólo hay Git local; no se inventa un repositorio remoto ni se publica una release.

## Recorrido de activación

1. El operador elige una versión revisada de la factory y el proyecto objetivo.
2. Se comprueban dependencias y se presenta qué archivos o entradas se añadirán. Se preservan `AGENTS.md`, settings y skills existentes; no se sobrescriben ni se mezclan memorias por nombre parecido.
3. Se declara el paquete en el ámbito del proyecto. Pi exige trust para recursos de proyecto; esa decisión no es un sandbox ni autorización de ejecutar encargos.
4. Se fija identidad, configuración y ubicación del estado. Instalar o confiar instrucciones no autoriza una issue ni efectos GitHub.
5. Se comprueban catálogo de skills, CLI y panel desde el proyecto objetivo. Una prueba fallida deja la integración incompleta, no una factory lista por tener archivos copiados.

La implementación deberá hacer esta operación idempotente y reversible. No se propone un comando por agente, skill o proveedor. Los comandos actuales de intake siguen siendo operaciones del operador; no acreditan un arranque automático del coordinador.

## Engram

Engram es memoria externa para decisiones y aprendizajes. Su identidad de proyecto se fija explícitamente y se comparte entre worktrees; no se usan lecturas globales `--all` en el flujo normal. No guarda secretos, transcript completo ni una copia autoritativa del estado. Un recuerdo se contrasta con brief y código actuales.

La [investigación Engram](research/engram-arranque.md) distingue la sonda offline de `doctor`, que abre el store y puede crear archivos. La [prueba aislada](../.audit/engram-scope.json) verifica guardar y recuperar en procesos nuevos con dos proyectos ficticios, sin usar memorias reales. No acredita la integración en isSWF ni separación contra un proceso malicioso del mismo usuario.

La [sonda sobre el directorio real](../.audit/engram-compatibility.json) fue rechazada antes de operaciones de memoria. No prueba corrupción: el mismo mensaje se observó con sidecars en un store temporal, y `integrity_check` devolvió `ok` sobre una copia fiel con 28 tablas. La sonda rechaza cualquier directorio que contenga ficheros `-wal`, `-shm` o `-journal`, y una parada limpia de `engram serve` no los retira: se comprobó sobre el store real, que sigue rechazando la sonda con el servidor parado. Por eso **`compatibility` no puede ser la comprobación previa de este store** y no se usará como tal. La integración abrirá el store por su vía normal, con identidad explícita, y tratará la ausencia de Engram como degradación explícita. Nunca se borran sidecars, se migra ni se repara para conseguir un PASS. El [registro](../.audit/engram-checkpoint-verify.json) conserva la secuencia y su corrección.

## Codegraph

Codegraph aporta navegación para el grounding: símbolos, relaciones, consumidores y referencias precisas al código. No valida comportamiento ni sustituye al checkout y sus pruebas. La skill deberá usar los avisos de actualidad del índice y entregar un mapa de lectura vinculado al proyecto y revisión correctos.

La [comprobación real](research/codegraph-arranque.md) confirmó que isSWF no tiene índice. La indexación es decisión del usuario, mediante `codegraph init` en el proyecto. Hasta disponer de índice se declara esa limitación y se usa lectura/búsqueda local; no se presenta un mapa de Codegraph inventado. No se ha cerrado la prueba de grounding mediante esa herramienta.

## Pruebas realizadas y pendientes

La [prueba de paquete compartido](../.audit/project-package-proof.md), repetida por el padre, usa un `git archive` de U2 y un manifiesto temporal, no un paquete publicado. El [resultado](../.audit/project-package-proof.json) confirma mediante RPC real de Pi 1.2.0 que dos proyectos cargan la misma skill con `--approve` y la omiten con `--no-approve`. El CLI Python se importa desde esa copia fijada y conserva grants distintos en estados temporales separados. No hubo prompts a modelos ni configuración global modificada. Esto demuestra primitivas de activación, no el instalador ni los perfiles de ejecución.

Los ocho checks de [Engram aislado](../.audit/engram-scope.json) contrastan dos selectores de proyecto con memoria ficticia en procesos nuevos. No abren el store real ni integran MCP. La consulta Codegraph sigue bloqueada por ausencia de índice.

Para cerrar el arranque operativo falta:

- Distribución real fijada por revisión, convivencia de versiones y protección de la instalación estable. La prueba actual comparte una copia de un commit, no un directorio protegido contra escrituras.
- Trust persistido/interactivo y activación sobre settings existentes. El catálogo RPC con `--approve`/`--no-approve` ya se comprobó, no todos los modos de trust.
- Arranque cómodo del CLI sin un `PYTHONPATH` manual y conservación de instrucciones/settings preexistentes. El import desde otro checkout y estados separados ya se comprobaron; el fixture no tenía archivos previos.
- Engram con identidad de proyecto explícita y degradación sin cambiar estado operativo ni inventar memoria. Abrir por la vía normal ya no es un bloqueo abierto: el store se verificó sano sobre copia y la sonda se descartó como comprobación previa.
- Grounding Codegraph real tras indexación elegida por el usuario; checkout equivocado y mapa obsoleto no se usan como evidencia vigente.
- Actualización y rollback que respetan versiones de proyectos y ejecuciones activas. No se simulan workers inexistentes para acreditar este escenario.

La verificación documental de los 61 criterios originales comprueba enlaces y asignaciones, no estas nuevas pruebas de arranque. Se conservarán sus resultados por separado antes de declarar la instalación operativa o continuar con U3.
