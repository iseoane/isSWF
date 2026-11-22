# Documentación

[isSWF](../../README.es.md) · [English](../en/index.md)

Empieza por las guías vigentes de esta página. La implementación y sus pruebas determinan el comportamiento actual; los planes y las demostraciones históricas no lo sustituyen. Los objetivos aceptados siguen definiendo qué debe conseguir un cambio solicitado.

## Utilizar isSWF

- [Instalación y actualizaciones](installation.md): preparar un paquete local, elegir un entorno e inicializar un repositorio.
- [Primeros pasos](getting-started.md): plantear una petición acotada al coordinador.
- [Cómo funciona la factoría](reference.md): roles, registros, versiones y límites.
- [Consultar el trabajo](operations.md): consultar una iniciativa y usar el panel local sin iniciar agentes.

## Desarrollar isSWF

- [Dónde está cada cosa](architecture.md): carpetas, responsabilidades de las herramientas y límites del estado.
- [Desarrollo](development.md): preparar el paquete, probar, pasar el lint y encontrar código sin utilizar.
- [Glosario](../../GLOSSARY.es.md): vocabulario compartido del producto.
- [Posibles acciones futuras](future-actions.md): propuestas separadas del comportamiento implementado.

## Sitio publicado

El diagrama interactivo del flujo está publicado en [https://iseoane.github.io/isSWF/](https://iseoane.github.io/isSWF/). Las actualizaciones son manuales: abre **Actions → Publish workflow diagrams → Run workflow**, selecciona `main` y ejecútalo cuando la publicación esté autorizada. No hay despliegue automático al hacer push. La fase de preparación solo incluye la página de inicio bilingüe y los dos diagramas interactivos, nunca las imágenes de resumen.

## Recursos detallados e historial

Los recursos técnicos del coordinador siguen en inglés y en sus rutas estables porque hay instrucciones y paquetes actuales que los referencian. Se enumeran en [consulta del trabajo](operations.md). No constituyen un flujo obligatorio para el usuario.

La instalación de la release compilada es una vía heredada independiente, no un requisito para el trabajo con hosts nativos: consulta [actualizar la ruta heredada y después migrar un proyecto](installation.md#actualizar-la-ruta-heredada-y-después-migrar-un-proyecto) y la [compatibilidad de los hosts](../host-portability.md).

La documentación retirada está disponible en el historial de Git.
