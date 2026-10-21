# I0003: Audit archive maintenance

Type: maintenance

This coordinator-owned plan records reported progress, not execution permission or process liveness.

## J001

- Status: in-progress
- Objective: Archive development audit artifacts without losing evidence or changing factory runtime
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md) (pending until prepared)
- Blocker: Archival procedure and preservation checks are being prepared; no artifact has moved yet.
- Next step: Test the bounded archival operation, apply it under the recorded operator scope, verify preservation and publish the maintenance delta.

### Acceptance

- Preserve all audit bytes, file types and modes in a verified private archive and preserve tracked Git history.
- Leave only archive metadata in .audit; private payloads must be ignored and excluded from installed packages.
- Preserve historical lookup/reproduction paths and normal runtime/quality behavior.
- Publish only a small receipt, not raw private payloads or a filename census.
- Verify the archiver and resulting operation; exact PR/main CI gate publication.

### Evidence

- Operator conversation: Haz lo que recomiendas de audit para ordenarlo todo y dejarlo limpio
- Source checkpoint: 1ad7fc32c38386b537678a4657aba9feaacd1756
