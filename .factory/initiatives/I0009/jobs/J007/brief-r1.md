# J007: Ground the remaining native Windows execution boundary

## Objective and current authorization

The operator's final objective is an operational factory on Linux and Windows, not just a distributable package. Current explicit additional execution permission covers isolated compiler/host dependency preparation and no-model verification. Safe local source investigation proceeds; do not infer permission for paid providers, global host changes, enabling OS features, another dispatcher, publication or a security downgrade. Define the bounded native execution implementation before making changes. This record is pending investigation, not an executable dispatch grant.

## Current evidence and reading map

Exact examined source: 23ab7c8d8f766cacda61986699006b8a677c1080.

- tools/pi-worker-task.mjs:140-142 builds the worker's Linux Bubblewrap namespace/mount invocation. Read the surrounding generated runtime and boundary-controls code before selecting a replacement seam.
- tools/native-recovery.mjs:8-14,40,62,143-157 obtains Linux /proc process/namespace identity, pins /usr/bin/bwrap, spawns the recorder and validates cessation/runtime identity. Do not turn missing evidence into stopped/success.
- tools/worker-lifecycle.mjs:51-85,217,296-306 uses /proc boot/start/executable identity and child cessation. Existing platform-runtime.mjs contains Windows process identity for initialization only; it does not establish worker namespace or descendant control.
- docs/local-worker-lifecycle.md and docs/model-routing.md remain canonical for grants, pinned job inputs, activation, actors and supported routes. Read both fully before any dispatch or replacement.
- J006 proves native compiled Windows package and actual Pi/Claude resource installation/discovery; it does not prove an executable worker isolation boundary or complete setup.

## Investigation and acceptance boundary

Identify native Windows options and their real constraints using authoritative platform documentation and reversible synthetic probes. Cover filesystem read/write scope, inherited credentials/environment, network restrictions, pinned SDK/runtime read-only access, exclusive workspace, descendant process containment, timeout/termination, process-reuse/reboot identity and uncertain recovery. A process job object alone is not proof of filesystem/network isolation. Do not present WSL as native Windows support or substitute host-controlled delegation for the selected factory executor.

Preserve Linux execution and exact runtime/methodology integrity. Select a functional implementation unit with positive and negative controls only after grounding. Keep full setup blocked until capability evidence exists; no live model calls under this unit's current investigation boundary. If an operator-only product decision is genuinely needed, present the observed options and exact affected step; do not ask the operator to resolve investigable technical uncertainty.
