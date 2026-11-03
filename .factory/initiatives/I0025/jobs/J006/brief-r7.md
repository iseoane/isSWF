# J006 / r7 — Post-start export verification replaces the pre-start policy gate

## Authority

On 2026-11-03, after A006 returned the r5 §5 blocker, the operator selected option 2: replace the pre-start managed-policy gate with bounded post-start verification. Budget is the unspent r6 allowance only: the same worker context for the remainder of its ≤40 min, then one bound review ≤15 min; conditional 15+15 min correction/review unchanged. All r6 exclusions remain.

## Design change to r5 §5 (everything else in r5 stays canonical)

- Instrumentation may be enabled after explicit project opt-in **without** claiming pre-start policy compatibility. The pre-start warning must say compatibility is unknown until exports are observed.
- Readiness is determined **after the run** from what the loopback receiver actually accepted: `export-observed` (at least one valid authenticated metrics export with the expected native provenance) or `no-export-observed` (none; possible managed/server-managed endpoint override, missing final flush or other cause — stated as unknown, never as zero usage). Replace the hardcoded `managed-policy-not-inspected` receipt value with this observed status.
- Observed export proves local delivery for that run only; it is not a policy-compliance certification and does not prove no other destination received telemetry.
- Prefer received-export evidence. Do **not** add a logs exporter or `managed_settings_resolved` parser in this unit unless indispensable; if added, it must be bounded, metrics-scope-free of raw payloads and documented as optional evidence.
- No reading secrets, changing/bypassing managed policy or global configuration.

## Stop conditions

r5 stop conditions apply, except that inability to inspect policy before start no longer stops the unit. Stop if post-start observation cannot distinguish received exports deterministically or the native entry cannot be exercised.
