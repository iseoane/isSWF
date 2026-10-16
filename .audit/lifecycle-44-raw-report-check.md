# Verbatim report whitespace

The audit-wide whitespace check reports six Markdown hard line breaks in two retained raw reports. Five section-heading lines in `lifecycle-44-grounding.md` and the first verdict line in `lifecycle-44-review-v1-luna.md` end with exactly two spaces. These are intentional Markdown hard breaks from the actors' returned text, not production-code whitespace defects.

Preserve the raw reports unchanged. Check every other staged path with `git diff --cached --check`, excluding only those two explicit report paths. This is a local audit-artifact exception, not a global Git setting, a hook bypass or a changed source-review verdict. Production source and frozen payloads remain byte-identical.
