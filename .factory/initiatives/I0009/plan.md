# I0009: Windows factory compatibility

Type: bug

This coordinator-owned plan records local progress, not execution permission or process liveness.

The operator's current final objective is factory operation on both Linux and Windows. Initialization, packaging and host discovery are intermediate acceptance milestones, not a reduction of that objective. Existing Linux portable and isolated synthetic execution evidence does not prove all real-provider behavior. Windows native isolated execution and lifecycle/read-only recovery now have mechanical verification below; complete setup, the public provider journey and final acceptance remain explicit pending boundaries.

## J001

- Status: in-review
- Objective: Repair Windows init EPERM without regressing Linux initialization or weakening file-sync failures and process-identity recovery guards
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: Compiled Bun Windows/Linux artifact validation and independent assessment remain pending; native Windows worker lifecycle/isolation is not implemented by this unit.
- Next step: Review the retained local candidate, run the native compiled-artifact matrix, and separately scope Windows worker execution support.

### Acceptance

- Native Windows and Linux initialize and repeat initialization without changing pins or models
- Live, malformed and inaccessible process identity cannot authorize recovery
- File sync failures remain fatal; Linux directory fsync and legacy identity remain intact
- CI includes native Node initialization and compiled-package init coverage on both systems
- Documentation distinguishes initialization from full worker and migration/recovery support

### Evidence

- jobs/J001/brief-r1.md
- tests/init-platform.mjs
- tests/platform-package.mjs
- Native Windows Node initialization regression: PASS
- Linux/WSL Node initialization regression: PASS
- Linux/WSL tests/release-package.mjs: PASS
- Documentation structure and bilingual links: PASS
- Windows regression additionally covers PID reuse and CIM failure blocking; Linux covers directory-sync failure propagation
- Normalized standalone Linux full-suite attempt: FAIL in tests/reviewer-task.mjs:265, expected response-complete but observed blocked; cause not established
- Whole-checkout portable suite on the Windows-mounted tree: FAIL at existing CRLF-sensitive skill-frontmatter assertion; not a passing suite

## J002

- Status: in-review
- Objective: Repair issue #83 by accepting canonical external plan grants on native Windows without weakening internal-path rejection on Linux
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: Independent semantic assessment and exact-head CI pending; correction retained in source commit 8ea8d2adc978aace0a17fc517b79d04a94ed2440
- Next step: Review the committed boundary correction; #85's subsequently authorized local repair is tracked in J004, not a complete Windows agent-execution claim

### Acceptance

- External siblings pass authority validation on Windows and Linux
- Internal/root grants and aliases resolving inside the project remain rejected
- Exercise the pinned-launcher journey and retain any subsequent independent failure

### Evidence

- https://github.com/iseoane/isSWF/issues/83
- jobs/J002/brief-r1.md
- tests/plan-grant-boundary.mjs: Windows RED before fix, Windows/Linux PASS afterward
- Linux tests/initiative-plan.mjs: PASS
- https://github.com/iseoane/isSWF/issues/85

## J003

- Status: in-review
- Objective: Repair issue #84 with a repository-owned LF checkout policy preserving exact runtime integrity on Windows and Linux
- Depends on: None
- Brief: [brief-r1.md](jobs/J003/brief-r1.md)
- Blocker: Independent assessment and exact-head CI pending; no native Windows Bun artifact or live-agent validation
- Next step: Review the retained checkout policy and candidate evidence; preserve existing user working copies and raw executable digest checks

### Acceptance

- Clean Windows and Linux text checkouts remain byte-identical to Git with autocrlf true or false
- Binary bytes remain unchanged
- Native public worker-route admission reaches its intended no-SDK guard while invalid routes refuse without claims
- Host static checks pass on a fresh candidate and migration guidance preserves user work

### Evidence

- https://github.com/iseoane/isSWF/issues/84
- jobs/J003/brief-r1.md
- tests/checkout-line-endings.mjs: Windows RED before policy, Windows/Linux PASS afterward
- Clean candidate native Windows/Linux host-portability and worker-route-admission: PASS
- Linux release-package regression: PASS
- Full-suite WSL run on retained candidate: FAIL with 60-second reviewer-task subprocess timeout; not a green suite
- Later full Linux regression on native Linux filesystem: PASS on candidate 30e303fd928d639074d2505785f7d31052982ea9 containing J004; previous failure retained, no cause attribution

## J004

- Status: in-review
- Objective: Repair issue #85 first-plan Windows publication using platform directory-sync policy and truthful interrupted-claim handling, then run regression
- Depends on: J002
- Brief: [brief-r1.md](jobs/J004/brief-r1.md)
- Blocker: Independent assessment/CI and Windows Bun validation pending; subsequent #86 repair and Bubblewrap verification are tracked in J005
- Next step: Review #85 source commit 5a59fff5e09225851f9a88eba2823775ba5160dc; retain distinctions between Linux isolation, native Windows focal checks and complete agent readiness

### Acceptance

- Native Windows and Linux publish/repeat the first plan through the pinned launcher
- Regular-file sync errors remain fatal and Linux directory flush remains mandatory
- Pre/post-publication failures preserve claims and available bytes, report publication stage and block automatic retry/no-op success
- Installed tools retain a complete import closure and native job pins include the new transitive platform primitive
- Run regression after focal checks and report independent deficiencies without automatically correcting them

### Evidence

- https://github.com/iseoane/isSWF/issues/85
- jobs/J004/brief-r1.md
- tests/plan-publication.mjs: Windows RED before repair; Windows/Linux PASS afterward
- Native Windows Node pinned init/first-plan/repeat, boundaries, checkout, host-static and worker-route checks: PASS
- Full Linux node tools/check-quality.mjs: PASS on retained candidate 30e303fd928d639074d2505785f7d31052982ea9
- Linux Bun packed executable regression: PASS; isolated synthetic worker SKIP because Bubblewrap unavailable
- Native Windows factory-tools-install and initiative-plan: FAIL at unchanged directory-symlink fixture creation with EPERM; not application unsafe-path acceptance
- https://github.com/iseoane/isSWF/issues/86
- Source commit 8ea8d2adc978aace0a17fc517b79d04a94ed2440 preserves #83/#84; #85 was subsequently committed as 5a59fff5e09225851f9a88eba2823775ba5160dc under explicit operator authorization, without push

## J005

- Status: in-review
- Objective: Correct #86's Windows directory-alias fixtures and resolve the missing Linux Bubblewrap verification prerequisite
- Depends on: J004
- Brief: [brief-r1.md](jobs/J005/brief-r1.md)
- Blocker: Independent review and exact-head remote CI pending; native Windows Bun and complete worker isolation remain outside verified results
- Next step: Review the local fixture correction; preserve Linux sandbox PASS and native Windows targeted PASS as distinct evidence; no issue closure or push selected

### Acceptance

- Use Windows junction fixtures without elevation, while retaining actual Linux directory-symlink coverage
- Assert directory aliases exist, application refusal occurs, and aliased target data is unchanged
- Include both suites in the existing native Linux/Windows CI matrix
- Verify canonical /usr/bin/bwrap and run actual previously skipped Linux sandbox checks without changing the runtime's executable identity controls

### Evidence

- https://github.com/iseoane/isSWF/issues/86
- Native Windows pre-repair EPERM fixture failures retained with J004
- Clean runtime/test candidate 4e8e88b03349fecbde345c96936edfead802a576: native Windows factory-tools-install and initiative-plan PASS
- Same candidate on native Linux filesystem: full portable quality PASS with ISSWF_TEST_BUN_WORKER=1; Bun compiled synthetic isolated task PASS
- Explicit node tests/diagnostic-probes.mjs . --sandbox: PASS including host positive control and actual namespace/network/read-only boundaries
- Operator installed Debian Bubblewrap 0.12.0-1~deb13u1 interactively; /usr/bin/bwrap and namespace smoke verified; no runtime pin bypass or privilege escalation by the assistant
- Direct factory-tools-install run from the older unnormalized working checkout fails exact LF/CRLF byte comparison before the alias check; preserved as checkout limitation, not represented as green
- Local CI matrix wiring added after the retained runtime/test candidate; remote CI not run
- Subsequently retained in source commit 23ab7c8d8f766cacda61986699006b8a677c1080 under explicit operator commit authorization; no push

## J006

- Status: in-review
- Objective: Verify the native Windows compiled distribution and actual Pi/Claude installation/discovery with isolated dependencies and profiles
- Depends on: J005
- Brief: [brief-r1.md](jobs/J006/brief-r1.md)
- Blocker: This milestone passes its mechanical checks; final factory acceptance still requires J007, complete setup and separately authorized real-provider verification
- Next step: Consume the retained native Windows reports and investigate native worker/runtime support without treating skill discovery as execution

### Acceptance

- Prepare CI-pinned native Bun and locked host dependencies externally without modifying personal host registrations
- Build and install the exact committed Windows artifact, retain exact receipt and test init/first-plan idempotence
- Exercise real Pi package installation and Claude plugin inventory from isolated profiles
- Verify source/installed resource separation and preserve earlier incomplete observations

### Evidence

- Exact source 23ab7c8d8f766cacda61986699006b8a677c1080; Bun 1.4.3; Pi 1.4.0; Claude 2.1.299
- Native Windows platform-package: PASS; artifactId 6d276448edf6907584a4425302b6a5ff5cc4bee9214c1d97609d5577701ab3e3
- Native Windows host-discovery: PASS; all 14 packaged skills in Pi user/project scopes and Claude plugin inventory
- Native Windows source-host-isolation: PASS on separate invocation after original outer 300-second harness interruption; no remaining relevant processes before retry
- Original interruption preserved, not a product-failure attribution; separate source-isolation result includes user settings and unrelated-resource preservation
- Ignored driver tooling/.local/windows-install/native-host.mjs and retained external reports described in J006 brief; no model prompts or provider credentials

## J007

- Status: awaiting-human
- Objective: Implement the native Windows bounded-tool isolation backend, then verify lifecycle/recovery and the remaining cross-platform readiness units in sequence
- Depends on: J006
- Brief: [brief-r2.md](jobs/J007/brief-r2.md)
- Blocker: Points1/2 have mechanical native isolation/lifecycle evidence; minimal setup is narrowly configured in dfc0024. The explicitly approved second isolated trial on corrected7225 runtime succeeds technically: only result.txt changes, protected check exit0, bound root/13tool cessation and automatic capacity release. The sole independent reviewer reports Standards pass but Spec inconclusive: model-origin exact node check.mjs invocation cannot be established from retained operation/exit receipts without command arguments. Response completion is not acceptance. Original failed worker and retained reservation remain unchanged; causal relation to the inline-eval repair remains unproven. Cumulative worker2/2 and reviewer1/1 authority is exhausted. General client-use, installation maintenance, broader independent review and exact-head remote CI remain pending; abrupt profile/ACL cleanup and hard disk quota remain limitations.
- Next step: Preserve both trials and the independent inconclusive verdict. Locally repair privacy-safe, candidate-linked command evidence and regression coverage before proposing any further finite live validation; do not fabricate missing command text, weaken the unchanged brief or replay either actor. See J007/brief-r2.md for exact trial/candidate/report identifiers. No auth-path request, global host change, cleanup, new model call or publication authority is inferred. Native Windows read-only diagnostic workspace probes remain unsupported.

### Acceptance

- Preserve existing Linux implementation and regression coverage
- Identify and test native Windows filesystem, credential/environment, network and descendant-process boundaries with positive and negative synthetic controls
- Preserve immutable runtime/methodology pins, exclusive claims, process identity, uncertain-state refusal and recovery semantics
- Keep setup partial until actual platform capability evidence exists; no model calls or host-global changes selected by the current test-dependency grant

### Evidence

- tools/pi-worker-task.mjs:140-142 generates Bubblewrap/Linux namespace arguments and Linux filesystem mounts
- tools/native-recovery.mjs:8-14,40,62,143-157 pins /usr/bin/bwrap, /proc process/namespace identity and Linux recorder behavior
- tools/worker-lifecycle.mjs:51-85,217,296-306 uses Linux-only /proc identity and cessation inspection
- No native worker dispatched, substitute dispatcher selected or isolation equivalence inferred from successful Windows package tests
- Operator subsequently authorizes sequential local implementation, verification and one commit per solved readiness point; live providers/global changes/publication remain separate
- Native LPAC prototype: selected workspace write allowed; private outside file, AAP-only canary and runtime write refused; inherited synthetic secret absent; host TCP positive and LPAC network EACCES
- Job Object assigned before suspended child resume; explicit job termination and zero-active-process polling precede profile cleanup
- File-based Node subprocess succeeds, piped Node subprocess hangs; same piped probe succeeds with Bun 1.4.3, including denial of synthetic host registry canary
- Compiled original binary fails restricted ancestor lstat; local Windows native-canonicalization correction in tools/bun-release.mjs verified with rebuilt actual compiled candidate ecac49edd8855cf15ef407ab6c075e4630030f8e under LPAC
- Same candidate native Windows platform-package PASS; Linux whole quality invocation FAIL at its 60-second Bun subprocess budget, followed by explicit mandatory-isolation bun-release PASS; no full-current-suite green claim
- Historical prototype/bootstrap observations alone did not establish integrated worker readiness, complete credential isolation, parent-death controls or independent security review
- Point 1 retained implementation candidate 8c39e97155fe499d6aed96bee2b47ac5bc0d0893: actual native Windows Bun package/npm installation PASS, artifactId 4b9f8fa3b395a3c8544c3abfeaf240aea14512622d0e7a4cc75e23baf1d54839; private fixture isswf-windows-integrated-wpmyij
- Same candidate compiled self-contained task PASS with pinned brief/methodology, synthetic SDK/session, real LPAC boundary check, only authorized file mutation and protected check; Node preparation and implicit engine substitution refused before publication. No provider prompt or normal lifecycle launch
- Same candidate native command controls PASS: allowed work/readonly read; denied outside, runtime/factory writes, inherited secret, private registry canary and network; host/public-registry positive controls; real piped subprocess, timeout, malformed UTF-8 byte bounds, detached descendants, normal Job cessation/profile cleanup
- Same candidate native lifetime controls PASS: junction/hardlink refusal before startup, blocked retry, startup publication conflict without execution/overwrite, and active tool exit after SDK owner death confirmed using a pre-opened native process handle. Abrupt loss retains missing cleanup/completion as unknown, not success
- Linux full portable quality with mandatory Bun/Bubblewrap synthetic task PASS at /tmp/isswf-windows-tools-8c39-quality-r2.log. First invocation timed out at outer 60-second release-package budget; original log retained. After process reconciliation, explicit release-package PASS in 34.456s and bun-release PASS in 39.263s preceded full PASS; timeout cause is not asserted
- Native Windows clean methodology and route admission PASS; initial worker-capacity-api FAIL at capacity-scope-must-be-separate exposed point 2 native separator handling. ESLint/Knip and independent security review are not claimed by portable PASS; CI is configured, not remotely executed
- Point 2 working changes: native capacity separators, shared platform directory-sync policy and captured/pinned platform helper dependency; native Windows portable capacity API PASS. Private Linux candidate c37ae3e1c7dec1cf5f529e040d962e1b19308255 passes normal worker capacity refusal, actual sandbox completion API and public route admission
- Optional Linux capacity sandbox fixture initially failed its live-task premise: corrected /lib64 mapping to usr/lib64 and required actual command marker, not only namespace publication; failures now retain fixture evidence. Initial failure preserved in candidate a684954506545ec2e93a630b438f3786ae3e7054. These earlier checks alone are not native Windows lifecycle/recovery completion
- Point2 retained candidate fada5864386d8e955371e383645b7c7e49de50e7, fixture isswf-windows-integrated-3Xqfhg, artifactId bce4a7c8defbd7a51c9b307504d3a5943e93b1b14512e875b89182007242becf: native package/install and all seven Windows suites PASS. Actual compiled lifecycle with synthetic SDK/LPAC task proves successful capacity archival, exact owner-loss root Job cessation, read-only stopped-review-required for authorized partial bytes, interrupted capacity retention and rejection of corrupt root/partial-startup evidence or excess mutation scope. Profiles/ACL cleanup is not fabricated or performed by recovery
- Same candidate full Linux portable quality with mandatory ISSWF_TEST_BUN_WORKER=1 PASS; logs /tmp/isswf-windows-lifecycle-fada-quality-r2.log and -bun-explicit.log. Initial -quality.log outer60-second bun-release timeout retained separately; no cause asserted. Locked ESLint/Knip and bilingual docs PASS; CI remains configured, not remotely executed. No real provider, public coordinator journey or independent review claim
- Point3 candidate3ae7710607cab775aff7bb8b94bdb64772c12ca8: native text-role injected suites and installed compiled reviewer transport/readback/replay PASS; artifactId84f02cab8faa8bec0d40bcf471ff87b8889a8c6a99a3d856e541827725117902, fixture isswf-windows-integrated-iANbgX. Full Linux quality with mandatory Bun/Bubblewrap PASS at /tmp/isswf-windows-setup-3ae-quality.log. Current locked ESLint/Knip, docs and diff checks PASS. Caller native root/separator/directory corrections preserve fatal regular-file sync, retained claims and no replay. Original Git-root/fsync failures and wrapper timeouts remain historical evidence
- Initial Pi1.4 SDK metadata: configured tuples/efforts recognized, Typebox works, no session and0fetches; Codex/Go auth=false. Later safe profile metadata confirms authenticated/subscription OpenAI OAuth and actual offline SDK session/tool integration (not live provider access). Setup reconciliation/proposed minimal composition is in .factory/project-setup.md, not an execution grant
- Provider compatibility candidate8bda5bdfa1c5502a9dfb6b2c10e2e540a4ce616e, artifact63f947ca0e43ce2d69036cf920270b97c10a36cc99a6f9c1b1105e99b715e258, fixture isswf-windows-integrated-kN1Alu: explicit legacy/new worker+reviewer compiled controls PASS; nonsubscription before session and mismatched reviewer provider before fetch refused. Full Linux mandatory-isolation rerun, ESLint/Knip/docs PASS; first outer60s Bun timeout retained. Actual SDK offline fixtures levraS (instrumented0fetches) and jGcpIp (unmodified generated task) PASS with observed cessation, no prompt, only sandbox_shell and actual LPAC/file/network controls. Private wrapper identity and shebang mistakes retained separately, not product defects. Source defaults remain unchanged; no live model actor authorized
- Final candidate6ffab1244079a47bca9a5549647c36472dccee09 additionally rejects explicit null route (red/green public CLI regression). Artifact2c8e00a5883221ddb04a07217784ea5fa76e27865971552b97c7feeb9a7e099e, native compiled controls and actual SDK offline lkW7LN/wvkUWP PASS; first instrumented0fetches, second genuine unmodified task. Full Linux mandatory Bun/Bubblewrap quality and locked static/docs checks PASS. Evidence at /tmp/isswf-luna-provider-6ff-{bun-explicit,quality}.log; no live/provider or independent product verdict
