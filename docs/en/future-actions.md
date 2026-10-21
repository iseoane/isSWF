# Possible future actions

[Home](../../README.md) · [Documentation](index.md) · [Español de España](../es/future-actions.md)

These are proposals, not implemented features, a delivery schedule, or permission to run jobs. Check the current code and agree scope before taking one on. Existing plans are records of decisions, not proof that every planned capability exists.

## Distribution

After the current local work is checked and accepted, agree how to publish the first release and replace local-folder installation examples with its real source. Keep the Pi package, core, and Claude plugin on the same version. Publication and new live Claude checks remain separate decisions.

## Updates and recovery

Add explicit, deterministic project-data migrations when a real schema change requires them. Today, the installation update changes the runtime pin; it does not invent conversions for unknown schemas.

Broader recovery across reboot, arbitrary surviving processes, and lost external responses needs its own design and evidence. Do not describe the current bounded recovery as universal automatic resumption.

## Execution and visibility

Consider whether shared capacity should cover more execution paths. Existing capacity reservations are cooperative and grant-bound, not a machine-wide scheduler.

Consider fresh process and remote-state visibility if users need it. The current panel reads project records; live telemetry and automatic dispatch are different features.

## Maintenance

Keep bilingual guides, examples, and checks aligned with the code. Reassess historical documents only when their evidence or inputs are needed; do not turn old demonstrations into the current product manual.

Decide a retention and cleanup workflow before deleting old runtimes, claims, or evidence. Uninstallation does not currently perform automatic garbage collection.
