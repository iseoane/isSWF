# Pi and Claude Code portability candidate

## What changed and why

A local opt-in Claude Code plugin delegates through thin wrappers that read the existing shared factory profiles. A host guide distinguishes Claude-native delegation from the existing Pi SDK path. Pi remains the default supported execution host; its package manifest and native worker/job runtime are unchanged.

## Visual summary

```text
Pi entry -> existing shared coordinator -> existing Pi SDK path
Claude local plugin -> shared coordinator + Claude host guide -> native Claude roles
shared profiles -> one methodology source
Claude authenticated model/delegation check -> pending J002
```

## Scope

Static Claude integration only. No global plugin install, login, Claude model prompt, new provider, OpenCode support or Pi-equivalent sandbox/recovery claim. The plugin is loaded explicitly from a trusted checkout with --plugin-dir. Machine-local Pi activation settings are excluded from the final published diff.

## Checks and results

At source checkpoint `4770e4c`, the coordinator ran the aggregate portable checks, ESLint over active source/tests and Knip successfully in a clean standalone clone. The portable entry now includes the new host test. Its earlier linked-worktree failure is retained in A001 and explained by the existing .git-directory fixture requirement, not relabeled as success.

The installed Claude Code 2.1.299 binary accepted the plugin manifest with an optional author warning and marketplace-install advice. This is actual local schema validation, not proof of authenticated model behavior. The wrapper that invokes global mise setup was not used for this check.

Mutation controls reproduced V001's test gap before correction: changing either Pi runtime file still passed. After SHA-256 pins were added, each mutation failed while the unchanged candidate passed. These checks were performed by the coordinator, who is a coauthor of that correction. A deliberate future Pi runtime update must reconcile these pins rather than silently weakening them.

## Independent review

V001 records a genuine native one-attempt review of `2ce728c1bbc45a2dd4f11e6dd790aef9e1218587`. Standards PASS, Spec FAIL, medium integration risk. The original report is retained verbatim. The test-coverage finding has been corrected, but its affected independent review is pending against the new candidate. No new reviewer call is inferred from the consumed grant. CI is a separate publication check, not independent review.

## Integration risk and recovery

The plugin is opt-in and leaves root package.json and the Pi job/task runtime unchanged. Host capability claims, model selection and permissions remain relevant integration risks. No merge is permitted under the operator's low-risk-only authority while the medium-risk review and affected recheck remain unresolved.

The native worker's original run remains terminal failure/partial because newly created parent directories exceed its exact-file mutable-entry contract. The coordinator inspected and preserved its output, verified recorded process cessation, and selected only the ten permitted regular files for source review. No worker replacement or automatic retry was launched. This draft does not claim a successful native delivery or fix that separate runtime limitation.

## Closure and acceptance

Not technically closed or product accepted. Draft PR publication is authorized; merge is not performed. Runtime success, independent approval of the corrected candidate, authenticated Claude validation and product acceptance remain distinct.

## Blockers and next action

Obtain a scoped follow-up independent review for the corrected candidate. J002 then validates real Claude skill discovery, implementation and independent review in an authorized authenticated environment. Retain the runner new-directory limitation as a separate recorded finding; do not change original attempt records or replay consumed calls.
