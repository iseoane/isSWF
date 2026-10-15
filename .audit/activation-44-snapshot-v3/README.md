# Snapshot convention

The manifest binds the tracked binary patch plus all seven exact regular-file payloads, including untracked additions. Reconstruct by applying the tracked patch to the base then overlaying every listed payload. The tracked patch is not a full diff of untracked files. It may remain identical while untracked payload hashes change. The full overlay/digest is the candidate, not candidate.diff alone. This README explains the established convention and is not part of the candidate payload.
