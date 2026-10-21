# I0003 / J001 — audit archive maintenance

Operator request: “Haz lo que recomiendas de audit para ordenarlo todo y dejarlo limpio”. Archive development material, not the factory runtime. Do not reopen accepted v1 jobs.

## One functional unit

Provide one development-only archival command and portable fixture tests, apply it to this repository, and publish the resulting archive pointers and a small receipt. Intermediate commits are recovery checkpoints, not separate deliveries.

Source base: `1ad7fc32c38386b537678a4657aba9feaacd1756`. Normal runtime, active tests/CI and agent instructions have no direct `.audit` dependency. The installer explicitly selects six planning/status/panel modules and excludes development archives. Historical manual guides and job reports still reference audit paths.

## Acceptance and safety

- Preserve every file's bytes/type/mode, including local-only data, by a same-filesystem directory rename and before/after manifest verification. Do not extract opaque backups or publish their contents/names.
- Preserve tracked artifacts in Git history. Keep only a README and archive descriptor in the active `.audit`; put the full private archive under ignored `tooling/.local/audit-archive/`.
- Require the exact committed source checkpoint and a clean tracked tree before applying. No overwrite, automatic deletion, history rewrite or replay of historical model/worker/grant operations. An incomplete archive remains preserved for inspection.
- Retain historical lookup via the recorded Git checkpoint. Update the active retention/reproduction guidance; original review conclusions are not rewritten.
- Run fixture preservation/refusal/tamper controls, existing public quality, lint/dead-code checks and a focused independent review of the procedure. Check the actual generated removal/pointer delta against the reviewed procedure and preservation receipt before publication; require exact PR/main CI.

The archive is development history, not installed product data. This changes organization, not total retained disk usage. No client, provider, worker, reboot, installation or global configuration operation is authorized.
