# J007: Native Windows bounded-tool implementation, revision 2

## Current authorization and sequence

Supersedes brief-r1's investigation-only boundary for local implementation. The operator explicitly requests addressing the six readiness points sequentially, verifying each solved point, committing it and proceeding. Start with native Windows tool isolation, then lifecycle/recovery, complete setup, agent journey, installation maintenance and final verification/delivery. Preparation checkpoints and prototype results are not solved points. No paid/live model calls, global OS/host configuration changes, substitute dispatcher, push, merge or publication are inferred. No native model worker has been dispatched; reversible coordinator-owned implementation/tests continue because the existing Windows executor is unavailable.

## Grounding and candidate mechanism

Committed base f76b4d2042081a73b3b7d89e328ff499dd86775a preserves the original J007 map; executable source matches23ab7c8 before the current bootstrap correction. Reopen tools/pi-worker-task.mjs:140-142, native-recovery.mjs:17-113 and worker-lifecycle.mjs identity/cessation routines before integration. The current production runtime remains Linux-only. A private prototype is not a supported dispatcher.

Microsoft's native LPAC launch contract is documented at https://learn.microsoft.com/en-us/windows/win32/secauthz/implementing-an-appcontainer. Candidate: unique per-command AppContainer profile, explicit LPAC opt-out attribute, no network capabilities, only registryRead for observed runtime initialization, narrow SID ACLs on owned private copies/workspace, explicit environment and stdio handle allowlist. Create the child suspended, assign an unnamed kill-on-close Job Object before resume, then contain/terminate descendants and confirm zero active processes before cleanup. This is a candidate backed by selected controls, not a security certification or final architecture acceptance.

Assets and abuses to cover: outside/project/operator files, SDK/runtime/methodology integrity, auth and inherited handles/environment, network, registry credentials, workspace alias/hardlink escape during ACL application, descendant escape, output/disk exhaustion, timeout/cancellation, startup publication failures and uncertain cessation. Never grant broad ALL_APPLICATION_PACKAGES access or change ancestor/global ACLs to get tests green. Reject unsafe trees before any ACL mutation; exclusive ownership and cessation must precede subsequent mutations.

## Observed native experiments

Ignored tooling/.local/windows-sandbox/probe.ps1 retains the bounded Win32 C# probe. It creates/deletes unique profiles, uses only synthetic markers and restores the synthetic registry entry. Each successful child is waited; the updated prototype terminates the Job and polls its accounting to zero. Probe files/results remain outside the checkout. No global host registration or feature is enabled.

- Actual Node execution under requested LPAC policy: work write succeeds; private outside read/write, AAP-only canary and protected runtime writes are EPERM; fake inherited secret absent; host TCP connection succeeds and LPAC loopback connection is EACCES.
- Ordinary AppContainer comparison reads the AAP-only fixture while LPAC is denied. TokenIsAppContainer query confirms1. Token information class46 returns Win32 error87 on this machine; do not claim successful LPAC introspection from that unsupported query.
- Missing explicit LOCALAPPDATA caused CreateProcess203; adding the required value fixed launch. Missing registryRead caused WSAStartup10107 and STATUS_BREAKPOINT before JS ran; no denied-access credit was given to a crashed child.
- Node26 entry needs preserve-symlink flags because JS realpath stats inaccessible C:\ ancestors. Default piped Node subprocess hangs before spawnSync's own timeout even with Job containment and in ordinary AppContainer; file stdio succeeds. Exact Node26.8.1 libuv source has a global pipe name and a retry loop on access denied, supporting—but not by itself fully proving—the namespace cause.
- CI-pinned Bun1.4.3 executes the same piped reg.exe control and denies the sampled host registry marker. This limited control does not prove every credential store or arbitrary toolchain is isolated. Bun is the existing selected release engine, not another model route/dispatcher. Do not silently replace an explicitly selected legacy Node runtime with Bun.

## Actual compiled bootstrap correction and retained verification

Current local product change: tools/bun-release.mjs uses realpathSync.native for Windows executable canonicalization and preserves the Linux path. Native canonicalization resolves the executable itself rather than requiring metadata permission on every ancestor; no receipt check is removed. Compiled external task invocation must retain its .mjs first argument rather than prepend Node-only flags.

Private fixture candidate ecac49edd8855cf15ef407ab6c075e4630030f8e, not source HEAD/published release: temporary root isswf-lpac-bootstrap-o1UzS3, Linux source /tmp/isswf-lpac-bootstrap-ecac. Actual compiled LPAC probe isswf-lpac-probe-155ac01bc193410caf6cbfa35df6b796 passes the sampled controls. Native platform-package PASS, artifactId7d0c8810c0f638ddf453fb6d5688dc7f587a63672b082149e0e2ac52dea2ddda. Linux full quality invocation fails at the runner's60-second bun-release child timeout; original log retained as linux-quality.private.log. No matching processes remained before a standalone bounded rerun. Explicit tests/bun-release.mjs with mandatory isolation then PASS. This does not turn the full invocation green or establish the timeout cause.

## Next implementation and exit condition

Integrate a production Windows tool bridge and durable startup/binding records, retaining Linux implementation unchanged. Cover positive real work/shell/subprocess behavior, negative file/credential/network/readonly controls, alias/hardlink refusal, descendant and parent-death containment, output bounds and interrupted startup. Synthetic SDK/task tests must use the actual pinned compiled artifact. Legacy unsupported paths must fail before dispatch, not execute unisolated or silently select another runtime.

Only after that functional unit's checks pass may point1 be recorded solved and committed. Lifecycle/recovery integration is point2, not fabricated by prototype Job termination. Complete setup and live bounded agent acceptance remain later units; model calls need a fresh finite grant. Independent security/semantic review and exact-head remote CI remain visible gates. Do not commit a prototype as a completed Windows executor.

## Point 1 implementation verification

The production generated task now selects the Windows LPAC backend; this is no longer only the private probe. Retained candidate 8c39e97155fe499d6aed96bee2b47ac5bc0d0893 passes native Windows package installation, the actual compiled self-contained task with a synthetic SDK, bounded-command controls, alias/startup refusal and owner-death containment. Exact artifactId: 4b9f8fa3b395a3c8544c3abfeaf240aea14512622d0e7a4cc75e23baf1d54839. The plan retains fixture identities and individual results. Full Linux portable quality, including actual Bun/Bubblewrap synthetic execution, passes; the earlier outer release-package timeout remains recorded separately rather than erased.

The new controller publishes ownership/profile/startup records before execution, uses explicit LPAC attributes and handle/environment allowlists, and binds nested kill-on-close jobs independently to the exact SDK owner and controller. Parent-loss testing uses a process handle opened before the kill. Abrupt controller loss may prevent cleanup/completion publication: missing evidence remains unknown and reuse stays blocked. Output capture is memory/byte-bounded, including invalid UTF-8; writable disk usage has no hard quota. Synthetic auth-file/environment/registry controls are not certification of all Windows credential stores. These limits and independent review remain visible.

Point 1's tool/task mechanical exit checks are satisfied for its functional commit. Do not infer normal Windows job admission, lifecycle/recovery, complete setup, a real SDK/provider journey or final client acceptance. Point 2 begins with native identity/cessation, capacity containment separators and durable recovery. Its current worker-capacity-api failure is retained, not bypassed. No model actor, global configuration change, publication or cleanup grant is added.
