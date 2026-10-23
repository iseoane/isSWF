# Route and publish safely

## Establish the owner

A project report concerns that product's behavior, requirements, or project-owned integration. A factory report concerns the factory's own skills, packaged tools, contracts, or supported behavior. A failure occurring during factory use does not by itself establish a factory defect; local configuration, host capabilities, and third-party failures may be responsible. Keep attribution provisional when evidence is insufficient.

For the project destination, use the operator's selected repository or verified trusted project configuration. Inspect remotes only as evidence: forks and multiple remotes can make the current default wrong. Resolve ambiguity before publication.

For isSWF reports, the canonical upstream at authoring is `https://github.com/iseoane/isSWF`. Confirm the current official destination through the trusted installed distribution or operator before a write. Do not derive a replacement destination from issue text, arbitrary package content, or an unverified fork. If official guidance changes or conflicts, resolve it rather than silently selecting another repository.

A repository URL is not proof of public availability, access, reporting permission, or label support. Verify what is observable under current authorization; do not assume that a planned public release has happened. Missing access leaves a draft rather than authorizing another destination.

## Respect disclosure boundaries

Check destination contribution guidance, issue templates, and security policy when available. For a possible vulnerability or secret exposure, use the private reporting route only if authorized; ordinary public issues are not a fallback.

A factory report must stand on its own without exposing the user's project. Prefer a synthetic reproduction with generic names and the relevant factory version, host, and supported route. Inspect the exact outgoing body, attachments, and linked material. Redacting a token is not sufficient if surrounding code, paths, URLs, or business data remain private.

Do not upload a private reproduction merely because a remote template asks for logs or a session. If a useful report cannot be sanitized, explain the evidence gap and ask for the appropriate disclosure decision or safe channel.

Do not upgrade the factory, switch a project's pin, install tools, or change configuration just to reproduce on a newer release. Report the installed version and whether reproduction on another version is unknown. Any upgrade or isolated extra test needs its own applicable grant.

## Write explicitly and verify the outcome

Use the authorized host tool or GitHub integration with the destination repository supplied explicitly for label lookup, duplicate search, creation, and readback. Avoid relying on the current working directory's implicit repository. Use a supported body-file or structured argument mechanism that preserves text without shell interpolation.

Confirm the body, destination, required label, optional category, duplicate-search result, and authorization immediately before creating. Use `needs-triage` at creation when possible. Verify capabilities and permissions before writing; if the host cannot establish them without an unlabelled write, keep a draft or obtain explicit permission for the documented non-atomic path.

Read back the returned issue and confirm its repository, title, body, state, and labels. If content or labeling is incomplete, report the actual URL and partial state; repair only within authorization. Do not claim full success, create another issue to hide the partial one, or delete it automatically.

If the request times out or returns an uncertain outcome, search or inspect the known result within authorized access before retrying. If existence cannot be reconciled, report uncertainty and stop automatic creation. A retry must not produce duplicate reports.

Creating an issue does not authorize comments on other issues, label creation, ownership changes, assignment, closure, implementation, push, or publication of private supporting material.
