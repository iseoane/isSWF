# J002 delivery

- Source candidate: `aeba2fc2f758b89d73a3cf4f621ee73eeb86deb4` on `fix/265-durable-predispatch` (base `6ef5a9deb1d8baf25cdecb2877943307be19eadd`, inputs `435446bc83447365e3b348f1439b36770d30cab6`).
- Checks (coordinator, Linux): host-portability, factory-tools-install, check-docs PASS; `git diff --check` clean. Worker additionally reported eslint, knip and seven related tests clean, plus negative controls for six assertions (A001).
- Review: V001 PASS (Standards, Spec, aggregate).
- Risk: MEDIUM. Instruction change read by every coordinator on Pi and Claude: an over-broad refusal could block valid dispatches; an under-specified one could still let unpinned inputs through. Mitigated by concrete checkable conditions, independent review and static assertions; not mechanically enforced, live adherence unverified, Windows via CI only. Revert restores prior instructions; no data or state migration.
- Integration: human decision (MEDIUM; outside LOW standing permission).
