**Outcome: blocked.** The authorized `J999` brief is missing at the pinned checkpoint. No latest brief was substituted.

**Observed:** Ran `git -C /tmp/isswf-profiles57-WRTbOy show 6cfbb7c100ff05b425ffa9792fe56ea4c53ebcdb:.factory/jobs/J999/brief-r1.md` twice, treating the SHA once as the document-input checkpoint and once as the target base. Both returned exit 128: `path '.factory/jobs/J999/brief-r1.md' does not exist`. This is the required-path failure, not a missing-object error.

The authorized follow-up report tests a different, 39-character SHA. Its `bad object` result does **not** prove the requested J999-path probe; it cannot establish the required job is available or unavailable at the specified full SHA.

Read only the frozen researcher profile/reference and authorized report, then ran those Git probes in the authorized fixture. No writes, agents, network, Python, or commits. Retry evidence does not count as route success and does not erase the earlier scope violation described in the report. Model is declared as LunaHigh for this verification; actual runtime model was not independently observed. GLM route remains unconfigured.

**Next:** coordinator must provide a valid, authorized J999 brief at a pinned checkpoint before research can proceed.
