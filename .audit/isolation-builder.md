Created `/tmp/isswf-isolation-spike.v3JOF0/isolation.py`. No repo changes or subagents.

Checkpoint passed with exit 0.
- Syntax compilation.
- Baseline positive controls.
- Worker and reviewer permissions.
- Reviewer scratch build and behavior, with original hashes and modes unchanged.

Logs are `/tmp/isswf-isolation-spike.v3JOF0/baseline.log` and `/tmp/isswf-isolation-spike.v3JOF0/permissions.log`.

Parent can run `python /tmp/isswf-isolation-spike.v3JOF0/isolation.py pi`, then `lifecycle`. Neither was run here. Lifecycle uses plain Python writers and targets observed namespace PID1, separately from cleanup.

Model the Domain shaped the operation table. Prove It Works shaped the positive-control checkpoint.

Limits remain explicit. LLM network/auth, prompt skills, and arbitrary mount-source safety are unproven. No production-security or startup/reboot claim. The script exceeds the approximate 400-line target.
