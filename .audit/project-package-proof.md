# Prueba de paquete compartido por proyecto

**Resultado: PASS.** Repetir con `node .audit/verify-project-package.mjs` desde cualquier directorio del repo.

`git archive` crea en una raíz temporal el candidato inmutable `1bf9ddcd762493a009f26bf58cf7a4b78a31cb99`; un manifiesto Pi temporal publica `.agents/skills`. Dos proyectos aislados declaran el mismo path absoluto del paquete en `.pi/settings.json`, sin copias. El RPC real de Pi 1.2.0 confirma en `get_commands` que `--approve` carga la skill y `--no-approve` la omite. No hay prompt ni llamada a modelo.

Desde ambos proyectos, `python -m isswf` importa mediante el `PYTHONPATH` exacto y persiste autorizaciones distintas en `--state` aislados. HOME y `PI_CODING_AGENT_DIR` son temporales. No se copian credenciales ni configuración real. `finally` limpia y cada proceso tiene timeout de 30 s.

Prueba activación por proyecto, no instalación oficial ni sandbox. La revisión Git está fijada; el directorio temporal extraído no está protegido contra escrituras. Tampoco prueba preservar `AGENTS.md` o settings existentes: los proyectos del fixture empiezan vacíos. No valida perfiles, roles ni fallback de runtime. La dirección elegida es paquete versionado compartido activado por proyecto, no vendor/copia. Fuentes: `docs/research/instalacion-pi.md` y documentación local Pi 1.2.0 de instalación, paquetes, CLI, settings, configuración, seguridad, RPC, SDK y referencias enlazadas.
