# Review guidance evaluation

## Method and identity

The source checkout remains based on `099079ed4cbb2f87ae0b7f89c4409ca577443274`, with no source commit or publication for this change.

A disposable source fixture pinned the updated review profile, skill and reference at `cae6c8e6eb31a8a29dcf29363fc0768d9e83bd69`. Its unpublished Node package supplied the new methodology through the existing native reviewer caller. The baseline caller read the original methodology at `099079ed4cbb2f87ae0b7f89c4409ca577443274`. Both reviewed the same synthetic base `b113532b8ab2156e835f02a912622e7cb993fc53` and candidate `8aa97eb42e523b267a9aee4601b5a40b4d85c6be`.

The two calls used `openai-codex/gpt-6-luna` at `high`, with SDK-confirmed OAuth subscription coverage, one attempt and one fetch each, HTTP 200, and no retry or fallback. Model and effort were verified by the caller but omitted from the shared human-readable brief; the baseline report notes that omission. This limitation is retained without another invocation.

The reviewer received contracts, full source/diff and the existing checks, which pass on both versions. The held-out probes and expected findings were excluded. The parent inspected both reports against the executable contracts and oracle; this classification is not an independent review of the new methodology.

## Results

| Case | Executed ground truth | Original methodology | Updated methodology |
| --- | --- | --- | --- |
| Authorization condition | Non-owner write is incorrectly allowed; public checks miss it | Blocking finding | Blocking finding |
| Tenant cache identity | Same key across tenants leaks the first cached value; public checks miss it | Blocking finding | Blocking finding |
| Budget bounds | Reordering preserves safe-integer and inclusive-bound behavior | No blocking finding | No blocking finding |
| Boolean guard | Equivalent rewrite under the stated input domain | No blocking finding | No blocking finding |

Each methodology detected both seeded defects, missed neither, and produced no blocking false alarms on the two valid paths. Both correctly returned Standards fail and Spec fail for the deliberately defective candidate. These are expected fixture verdicts, not failed checks of this implementation.

This is one trial per methodology, one model, fixed order and four small cases. No comparative improvement is demonstrated. It does not measure complex architecture judgment, dependency review completeness, other models, general recall or instruction reliability.

## Reproduction and evidence

- Run `node tests/review-guidance.mjs .` for executable fixture controls without provider calls.
- An absent absolute output directory as the second argument retains base/candidate files, checks, held-out probes and `oracle.json` for a new authorized evaluation. Exclude the probes and oracle from the reviewer bundle.
- Local raw records are under ignored `tooling/.local/review-guidance-eval/`: `setup.json`, `requests.json`, `baseline-result.json`, `updated-result.json`, `summary.json` and `quality.log`. They retain exact pins, bundle hashes, caller results and reports.
- Baseline bundle SHA-256: `ae701b1897c84f64fd24b56d246b9188e7a919b222f93b4f08ea3508b35db923`.
- Updated bundle SHA-256: `45fbbb4e2049ff86f56e489adde60467f694c74cffc96a5dcde770f46dd4fabd`.

## Static branch walkthrough

- Ordinary code change: criteria and relevant tests precede implementation; inspect affected consumers and report concrete gaps.
- Documentation or deterministic transformation: use contract/preservation evidence, without forcing unit tests or mutation.
- Uncertain detection gap: a cheap experiment needs an authorized disposable copy; preserve the reviewed candidate and distinguish an equivalent mutation from a defect.
- Text-only caller or read-only probe: assess supplied observations or request a bounded missing check; neither gains mutation capability.
- Changed dependencies: inspect the actual installation boundary and relevant changes; unavailable optional network information alone is not an automatic blocker.
- Missing evidence essential to a required criterion: the affected axis remains inconclusive. Optional experiments, stylistic preferences and fixed line counts do not create blockers.

These walkthroughs check instruction structure, not observed model adherence for every branch. No independent review of this methodology, remote CI, commit, push or release is claimed for the pending change.

## Design source

The selected ideas were compared with [Addy Osmani's code-review-and-quality skill](https://github.com/addyosmani/agent-skills/blob/aeac41d4d005999432bb7312f7ff06383a91d59d/skills/code-review-and-quality/SKILL.md). isSWF retains its own Standards/Spec contract, proportionate verification, exact candidate identity, permissions and native caller boundaries rather than adopting the upstream workflow wholesale.
