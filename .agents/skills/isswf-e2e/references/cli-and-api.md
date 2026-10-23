# CLI, terminal and API journeys

Read this reference when the public interface is an executable, interactive terminal or service. Reuse the language and harness already maintained by the target project; Node.js, Python, shell, expect and HTTP libraries are choices, not universal requirements.

## Command-line programs

Invoke the real built or installed executable with argument arrays where available. Use a disposable working directory, home/configuration and data store. Preserve the environment variables the runtime genuinely needs, while excluding unrelated credentials and user configuration. Include paths with spaces or Unicode when they are part of the supported contract.

Assert the appropriate combination of exit code, structured output, stderr, created files and unchanged/absent side effects. Expected values come from the specification or known fixtures, not from recomputing the executable's result. Exercise the installed artifact when installation or packaging is under test; importing a source helper does not prove the launcher works.

Use a PTY when prompts, raw input, terminal sizing or TTY detection are part of the interaction. Pipes alone do not prove interactive behavior. Drive observed prompts and transitions with bounded waits, and preserve a transcript that shows the action and outcome without credentials.

## Services and transitions

Start the actual service against isolated test data and wait for a usable public endpoint. Drive documented HTTP operations with known fixtures, and read back the expected state or verify a forbidden effect through the proper interface. An HTTP 200 response alone does not prove the requested operation happened.

For a journey spanning CLI, API and a UI, bind the same test identity, environment and data throughout. Avoid unrelated fixture instances that make individual assertions pass without verifying the transition. Separate optional external/provider checks from ordinary offline CI and state exactly which boundary each substitute leaves untested.

## Ownership and teardown

Give spawned processes bounded deadlines and capture bounded output. Record exact process handles and ownership before issuing teardown; killing every process with the same name is unsafe. Reconcile descendants, open ports and scratch files after failures as well as success. Preserve reports separately from scratch data.

Keep other projects, global host settings and user data unchanged unless their modification is explicitly the authorized journey. Restoring them after an unapproved change does not make that change authorized. Do not replay an uncertain external write or paid invocation just because a test timed out.
