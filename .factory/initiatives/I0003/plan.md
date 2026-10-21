# I0003: Audit archive maintenance

Type: maintenance

This coordinator-owned plan records reported progress, not execution permission or process liveness.

## J001

- Status: in-review
- Objective: Archive development audit artifacts without losing evidence or changing factory runtime
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md) (pending until prepared)
- Blocker: Final independent verification and exact PR/main CI remain publication gates.
- Next step: Review the full procedure with actual preservation evidence, then publish after exact CI gates.

### Acceptance

- Preserve all audit bytes, file types and modes in a verified private archive and preserve tracked Git history.
- Leave only archive metadata in .audit; private payloads must be ignored and excluded from installed packages.
- Preserve historical lookup/reproduction paths and normal runtime/quality behavior.
- Publish only a small receipt, not raw private payloads or a filename census.
- Verify the archiver and resulting operation; exact PR/main CI gate publication.

### Evidence

- Operator conversation: Haz lo que recomiendas de audit para ordenarlo todo y dejarlo limpio
- Source checkpoint: 1ad7fc32c38386b537678a4657aba9feaacd1756
- Applied procedure checkpoint: 7678f6476501c410245d0056a1e1c5e262ff8c21
- Preserved audit Git tree: f77aee1d95716e4e14ebf5ec1949882fff64f943
- Actual preservation receipt: .factory/initiatives/I0003/jobs/J001/A001.md
- Lookup metadata: .audit/archive.json
