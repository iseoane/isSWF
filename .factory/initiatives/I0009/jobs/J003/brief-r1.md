# J003: Stable Windows/Linux checkout bytes (#84)

## Objective and authority

Repair #84 under the same current operator request and local boundaries as J002. Preserve exact executable/runtime and release integrity. Do not change global Git configuration, silently rewrite operator files, disable digest checks, launch alternate workers, or implement independent findings. Source commits and remote code publication are not selected by this bounded bug-repair request.

## Grounding and decision

Examined base: 809e3b1f05c0acfb9eb2e23bb8fac5c0e7086f3b. Before changes, native Windows core.autocrlf=true converts checkout text to CRLF, making runtime raw hashes differ from pinned blobs and LF-only host resource checks fail. The repository had no .gitattributes. Select '* text=auto eol=lf' in the repository so detected text remains LF on all hosts and binary files remain unchanged. No runtime comparison is normalized or weakened. Existing working copies are not automatically rewritten; bilingual development guidance recommends preserving local work and using a fresh policy-containing clone.

One functional unit includes .gitattributes, a true/false-autocrlf text/binary clone regression, worker-route fixture materialization under the repository policy, native CI and portable check wiring, and bilingual development guidance. The disposable worker-route fixture copies .gitattributes, commits its runtime, then removes/recreates only fixture runtime files through checkout-index so actual raw bytes reflect the policy; production runtime checks remain unchanged.

## Acceptance and checks

- Native Windows red observed before policy: runtime.mjs gained CR bytes under autocrlf=true.
- Native Windows and Linux/WSL checkout regression PASS for executable/Markdown/JSON/YAML and binary preservation under autocrlf true/false, including clean status and exact Git blob comparison.
- Public worker-route admission PASS natively on Windows and Linux in the clean combined candidate: canonical route reaches invalid SDK-path guard; malformed routes fail without runs-store creation.
- Host-portability static checks PASS on native Windows and Linux in that candidate; no live host/model behavior inferred.
- Linux release-package regression PASS, including packed receipts, init, guarded migration/rollback/recovery and legacy state preservation.
- Syntax, bilingual structure/links/examples and diff whitespace checks PASS. ESLint/Knip dependencies are absent; no installation performed.

## Evidence identity and limitations

Combined candidate is test-fixture commit feeb89af1a22df9ec711dd5e0c05451dd6a549a0, retained under the private temporary isswf-83-84-candidate-20261026 directory. It is not a source-repository commit or published release. The full portable suite under WSL on the Windows filesystem failed via 60-second reviewer-task subprocess timeout; no full-suite PASS, cause attribution, native Windows Bun, live worker, independent review or CI is claimed. Verification mode is combined: exact checkout-byte/binary checks plus pending independent semantic assessment of the policy and integrity boundaries.

Independent first-plan directory-fsync failure is https://github.com/iseoane/isSWF/issues/85, created with needs-triage and bug after duplicate search; it is not fixed by this unit. Review exact retained source before later commit/publication; technical closure and operator acceptance remain separate.
