[
  {
    "id": "healthy-primary",
    "decision": "select",
    "model": "opencode-go/glm-5.3-flash",
    "effort": "high",
    "reason": "The granted primary tuple is compatible and available. No need to preflight or select the alternate.",
    "inputConfigSHA": "ceec0094cd0742542f6ad78bc81cb518984af373"
  },
  {
    "id": "quota-advance",
    "decision": "hold",
    "model": "openai-codex/gpt-6-luna",
    "effort": "medium",
    "reason": "Quota exhaustion permits considering the next tuple, but stopped status alone does not reconcile identity, task, ownership, partial work, and total actor grant. The route grant does not authorize another actor.",
    "inputConfigSHA": "ceec0094cd0742542f6ad78bc81cb518984af373"
  },
  {
    "id": "test-failure",
    "decision": "hold",
    "model": "opencode-go/glm-5.3-flash",
    "effort": "high",
    "reason": "A test failure is not a routing failure: do not advance to the alternate based on it.",
    "inputConfigSHA": "ceec0094cd0742542f6ad78bc81cb518984af373"
  },
  {
    "id": "unknown-writer",
    "decision": "block",
    "model": "openai-codex/gpt-6-luna",
    "effort": "medium",
    "reason": "Quota exhaustion permits considering the next tuple, but the prior writer's unknown state prevents advancing.",
    "inputConfigSHA": "ceec0094cd0742542f6ad78bc81cb518984af373"
  }
]

Git commands used in the fixture repository:
- `git show 439357df3311723f63cbe3416002631357506727:cases.json`
- `git show ffb0b2aa26d57b2371b72808b02dcb2b0fde2af3:.factory/models.json`
- `git rev-parse ffb0b2aa26d57b2371b72808b02dcb2b0fde2af3:.factory/models.json`
