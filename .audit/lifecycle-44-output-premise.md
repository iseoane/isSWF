# Output-publication premise

The failed premise is that capping captured raw bytes also bounds decoded-text publication work and the byte size of its JSON string fields.

V1 capped raw tails then decoded them, allowing replacement characters to expand past the accepted encoded-byte limit. V2 corrected small UTF-8 tails but repeatedly reconstructs the whole decoded string while trimming one code point. The exact-helper control on supported 64 KiB binary output exceeded its 2500 ms safety bound. The task timer has already been cleared before this publication step. Both versions and actual failure records are retained.

The producer task owns raw output. The execution host alone owns capture and terminal rendering. This is a representation problem at that boundary, not an imbalance among concurrent actors. `verify-lifecycle-44-output.mjs` is the rerunnable counterexample to the premise.

The next correction should make conversion and byte-safe clipping linear in the bounded input, preserve the public text fields and omission markers, and avoid a new formatter framework or larger timeouts. If rendering omits content after UTF-8 replacement expansion, record that omission honestly even when capture itself did not overflow. Independent review and the ordinary process controls remain required.
