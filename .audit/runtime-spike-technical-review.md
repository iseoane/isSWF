**Reviewer: OpenAI GPT‑6.1 (`gpt-6.1-sol`).** SHA‑256 matches the requested source. No subagents, network calls, source edits or user-configuration changes.

**Verdict: no blocker to the five bounded experimental observations.** I reran `python docs/research/probes/pi-lifecycle.py all`; exit status was 0. Results agree with the preserved log.

### Verified evidence

Pointers below use `docs/research/probes/`.

- **Disposable client exit:** `pi-lifecycle.log:2–3` records unchanged Pi/writer identities, both physically live, with writer heartbeats **2→9**. The clients are separate OS processes collected after exit—not merely disconnected logical sessions. Source: `pi-lifecycle.py:346–377`.
- **Normal stop:** log `:4–6` shows shell absent and writer zombie after abort, Pi absent after EOF with return code 0, and heartbeat fixed at 9. Stop margin **26.055 seconds**, exceeding the required five seconds.
- **Active crash:** log `:9–10` and `:23–24` show live known jobs immediately before owner SIGKILL, then exited Pi/ordinary writers. In escape-crash, the same escaped identity remains live and heartbeat grows **15→19**.
- **Escaped child survives abort and pipe closure:** log `:15–16` shows escaped heartbeat **9→14→19**, while Pi exits and ordinary writer becomes zombie.
- **Recovery without respawn:** log `:17` and `:25` records identity-checked SIGTERM of the escaped child, followed by zombie/nonwriting state and retained identities. Recovery code calls only `reconcile`, not `RPC` or writer launch (`pi-lifecycle.py:223–226`). No subsequent writer admission is exercised.
- **Intentional starttime mismatch:** log `:32–35` shows `signal:null`, `uncertain`, reservation retained, and sacrificial heartbeat **12→20**. Explicit corrected-identity cleanup follows.
- **Actual cleanup:** all five cleanup records (`:6,12,19,27,37`) report `/proc` absence, not merely cancellation ACKs or zombies.

### Safety and interpretation

**Pidfd handling is appropriate for these trials** (`pi-lifecycle.py:60–82`): open first, inspect boot/PID/starttime, signal only matched live identities, close the descriptor. Subsequent PID reuse cannot redirect the already-open pidfd. Nonces are recorded but are not authenticated process identities.

**Lifecycle accounting is sound on the observed paths:** direct children are collected; the runner becomes a subreaper; adopted zombies are reaped before the final absence assertion (`:428–451,454–469`). Zombies legitimately establish “cannot write,” while cleanup separately establishes absence.

**Two qualifications—not blockers to these observations:**

1. Owner SIGKILL closes **both** stdin and stdout pipes. Therefore “Pi exits after owner/pipe loss” is demonstrated; **EOF as the isolated causal mechanism** is not (`:397–408`). Avoid stronger causal wording.
2. The probe is not comprehensive failure-path proof. Socket existence is weaker than an explicit readiness handshake; identity-file existence assumes cooperative, complete metadata. RPC construction can fail after spawn, and malformed stdout marks `eof` even without physical EOF (`:167–193`). Outer cleanup provides additional protection, but arbitrary startup/crash windows are not tested.

`.audit/runtime-spike-brief.md` fits this research scope provided “retomar la conversación” means consulting the existing owner—not actual TUI/full-chat restoration. `docs/arquitectura-candidata.md` remains context only. These results establish neither arbitrary subprocess containment nor factory v1 OPS acceptance, reboot durability, live Pi reattachment or a security sandbox.
