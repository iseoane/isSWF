# Pi and Claude Code portability delivery

## What changed and why

An opt-in local Claude Code plugin delegates through thin wrappers that read shared factory profiles. A host guide separates Claude-native delegation from the existing Pi SDK path. Root package.json and the Pi job/task runtime have no net change against the PR base.

## Visual summary

```text
Pi entry -> shared coordinator -> existing Pi SDK path
Claude local plugin -> shared coordinator + host guide -> native Claude roles
A003 fixture -> worker fail/fix/pass -> distinct read-only reviewer PASS/PASS
```

## Scope

The source adds local plugin integration and documentation. J002 validates one actual synthetic implementation/review chain on Claude Code 2.1.299. No global plugin install, OpenCode integration, client-use approval or Pi-equivalent sandbox/recovery claim. The plugin remains opt-in with --plugin-dir. Pi activation settings have no net change in the published PR.

## Checks and results

Existing portable checks, ESLint and Knip passed in a clean standalone clone and PR CI at 167a24d. Updated source and final-head publication gates require their own checks. The host test is registered in the portable quality entry and verifies the two unchanged runtime hashes. Mutation controls demonstrated its original coverage gap and subsequent detection of both runtime changes.

The installed Claude binary's plugin validator passed with optional attribution/marketplace advice. More importantly, [J002/A003](../J002/A003.md) records actual authenticated coordinator discovery, one native worker changing only the allowed file and passing its Node test, followed by a distinct read-only reviewer with Standards PASS and Spec PASS. Parent checks confirm the resulting bytes and protected test preservation.

A001/A002 remain unsuccessful permission-harness trials. A003 has no permission denials. Individual agent model/effort and handoff limitations are disclosed; neither a CLI exit code nor a model self-report proves a universal capability.

## Independent review

V001's original Standards PASS/Spec FAIL is preserved; its test-coverage finding is corrected. V002 independently confirms that correction with actual read-only mutation probes. Its additional settings-deletion finding is dismissed with exact PR-base evidence: both original base fed46e4 and tested head167a24d lack .pi/settings.json and their path diff is empty. The temporary file existed only at intermediate setup commits. V002 remains verbatim FAIL, not relabeled PASS.

The final closure review is recorded separately as V003 when available. It must assess the corrected source, actual PR-base scope, validation evidence and remaining limitations. CI is not that independent verdict. The A003 reviewer judges the synthetic fixture, not PR81's source.

## Integration risk and recovery

The plugin is explicit opt-in. Native Pi runtime, routes, package allowlist and job/task source remain unchanged. Claude tool declarations do not enforce Pi-equivalent sandboxing or recovery; permission policy and assignment must match actual commands.

The original native implementation worker remains failure/partial because new parent directories exceeded its exact-file mutable-entry contract. Its retained candidate was inspected, stopped process identities checked and admitted regular files reviewed. No worker replacement or native-success claim follows from this source delivery. That runner limitation is not fixed here.

## Closure and acceptance

The operator accepted the disclosed bounded Claude result and explicitly authorized publication and merge: "Pues adelante con la pr y hazla merge". This supersedes the earlier low-risk-only merge authorization, but does not waive demonstrated defects, required source review or exact-head CI. No product acceptance, merge or main-CI outcome is inferred before it actually occurs.

## Blockers and next action

Finish the bounded final source review, publish the curated records, require CI on the exact PR head and merge with a server-enforced head match. Confirm the resulting main commit and its CI. Preserve all historical report limits and unsuccessful attempts; no automatic extra actors, retry, global config or deployment is authorized.
