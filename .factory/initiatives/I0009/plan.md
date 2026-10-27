# I0009: Windows factory compatibility

This branch carries only the approved methodology-first transition, not the paused native executor expansion. The original J001–J007 plan and evidence remain at their original Git paths in checkpoint `1c7e898ca1eb4e8e35c455aeadbb1f39832caed7` and draft PR #87. Resolve those pinned records there; they are not recreated, migrated, completed or relabelled by this branch.

## Current scope decision

The operator approves shared methodology with thin host integrations for native Windows/Linux and Pi/Claude Code equally. Hosts own execution, permissions and isolation. New ordinary tasks need no factory executor pin or capacity store. Existing legacy assignments retain their original contracts and records. Real model calls remain paused.

## J008

- Status: in-review
- Objective: Connect shared roles/configuration to Pi subagents and Claude native delegation, without a new execution framework
- Depends on: None
- Brief: [brief-r1.md](jobs/J008/brief-r1.md)
- Blocker: Independent semantic review pending; no new real-model call or merge is authorized
- Next step: Review draft PR #88 independently against its exact candidate; technical CI is green at 63ccd188a678cf9645dcea0d7e8802ca53d09e28 and the record-only successor must pass its own CI. Keep PR #87 paused
