[
  {
    "id": "explicit-unknown-role",
    "decision": "authorized by whole-route override; use blocked pending runtime evidence",
    "model": "openai-codex/gpt-6-luna",
    "effort": "high",
    "reason": "The explicit override supplies a complete route within the trusted grant, so the unknown role does not block route resolution. Fixture compatibility and availability values are not runtime evidence.",
    "inputConfigSHA": "ffb0b2aa26d57b2371b72808b02dcb2b0fde2af3"
  },
  {
    "id": "incompatible-alternate",
    "decision": "blocked at incompatible next tuple",
    "model": "openai-codex/gpt-6-luna",
    "effort": "medium",
    "reason": "Quota exhaustion permits advancing only to the next route tuple; the fixture marks that tuple incompatible. Do not skip ahead. The fixture does not establish actual runtime availability or compatibility.",
    "inputConfigSHA": "ffb0b2aa26d57b2371b72808b02dcb2b0fde2af3"
  },
  {
    "id": "pinned-old-attempt",
    "decision": "preserve and resume the pinned route; runtime evidence required before use",
    "model": "opencode-go/glm-5.3-flash",
    "effort": "high",
    "reason": "A001 records this selection and the old input SHA. Do not re-resolve the attempt against the newer configuration SHA; fixture state does not prove runtime availability.",
    "inputConfigSHA": "ffb0b2aa26d57b2371b72808b02dcb2b0fde2af3"
  }
]

Git commands used: `git -C /tmp/isswf-models60-njL7TK show 439357df3311723f63cbe3416002631357506727:cases.json`, `git -C /tmp/isswf-models60-njL7TK show 439357df3311723f63cbe3416002631357506727:.factory/models.json`, and `git -C /tmp/isswf-models60-njL7TK show 439357df3311723f63cbe3416002631357506727:A001.json`. No dispatch or fallback execution is claimed.
