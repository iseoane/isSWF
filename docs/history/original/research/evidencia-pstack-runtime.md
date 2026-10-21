# Evidencia del runtime Pstack para Pi

## Qué se comprobó

Se ejecutaron cinco archivos de tests del port en commit `990cd7b02ac6f3e8f825716f7c72e2f06d8f4a92`. El código de la extensión es real; el proceso hijo Pi y la API del padre son los dobles del repositorio. No se usó un modelo para generar código ni se ejecutaron tests live de la CLI Pi.

Se verificaron estos mecanismos:

- El cuerpo del agente llega como system prompt añadido y su catálogo de skills como argumento de lanzamiento.
- El prompt recibido por el hijo es el encargo explícito. La llamada no envía la conversación del padre.
- Modelo y esfuerzo se resuelven e inyectan en el hijo.
- Background devuelve identificador y la terminación notifica al padre.
- La hoja de modelos llega al hijo, pero el mandato de poteto-mode solo al padre.
- Las coincidencias de rutas añaden un recordatorio de lectura de skill.
- Los mensajes a agentes activos y terminados siguen su ciclo correspondiente.

## Comando y resultado

```bash
bun test tests/pi/agents-launch.test.mjs \
  tests/pi/agents-run.test.mjs \
  tests/pi/agents-messages.test.mjs \
  tests/pi/prompt.test.mjs \
  tests/pi/path-skills.test.mjs
```

Resultado exacto del resumen:

```text
75 pass
0 fail
224 expect() calls
Ran 75 tests across 5 files.
```

El entorno usó Bun `1.4.2`. Se enlazó temporalmente el directorio de dependencias del Pi instalado en esta máquina al snapshot. No se instalaron paquetes ni se modificó el entorno del usuario. El log completo se conserva en [pstack-runtime-tests.log](pstack-runtime-tests.log).

Para reproducir, obtener ese commit del port, proporcionar su dependencia `typebox` y ejecutar el comando anterior. El snapshot utilizado está en `/tmp/isswf-pstack-research.C7F6kB/port`. El symlink temporal se elimina después de la prueba; no forma parte de isSWF.

## Qué no se demuestra

Los tests no prueban que un modelo lea las skills anunciadas, cumpla cada paso, produzca una slice funcional o gestione correctamente el producto. Tampoco prueban aislamiento frente a escrituras mediante `bash`. No se presenta una medición de rendimiento ni una comparación entre modelos.

El estado `completed` del proceso no equivale a cumplimiento de criterios de aceptación. Ese límite se ve en el código `outcomeOf` y se distingue expresamente en [el análisis de agentes](pstack-agentes.md).
