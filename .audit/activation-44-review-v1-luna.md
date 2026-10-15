## Standards
No material blocker found in the guide’s distinction between the resource package and a Git checkpoint, or in the exact two-skill payload boundary. The setup instructions point to included resources; they do not require the old Python CLI or the 97-file link closure.

**Evidence limitation:** `.audit/verify-activation-44.mjs` builds its synthetic commit from the export allowlist, then runs the installer from the producer checkout. Its SHA identifies those synthetic resource blobs—not the complete seven-file implementation candidate.

## Spec
**Blocker — activation allows a second package version.** The independent fixture records successful activation of a second SHA, exit 0, and both versions in `packages`, contrary to the decision’s no-upgrade/no-multiple-versions contract. The installer checks only whether the *same path* is already present; it does not refuse another version of this package. The verifier’s single-version repeat test misses this case. Evidence: `.audit/activation-44-independent-v1.json`; `tools/factory-package.mjs` package append logic.

The fixture’s preservation and same-version repeat checks passed; they do not offset this failure. No candidate changes made. **Fix should be handled by a fresh writer after both reviews are final.**
