# I0009: Windows factory compatibility

This branch carries only the approved methodology-first transition, not the paused native executor expansion. The original J001–J007 plan and evidence remain at their original Git paths in checkpoint `1c7e898ca1eb4e8e35c455aeadbb1f39832caed7` and draft PR #87. Resolve those pinned records there; they are not recreated, migrated, completed or relabelled by this branch.

## Current scope decision

The operator approves shared methodology with thin host integrations for native Windows/Linux and Pi/Claude Code equally. Hosts own execution, permissions and isolation. New ordinary tasks need no factory executor pin or capacity store. Existing legacy assignments retain their original contracts and records. Real model calls remain paused.

## J008

- Status: in-progress
- Objective: Connect shared roles/configuration to Pi subagents and Claude native delegation, without a new execution framework
- Depends on: None
- Brief: [brief-r1.md](jobs/J008/brief-r1.md)
- Blocker: Affected exact-candidate checks and independent semantic acceptance pending
- Next step: Port only this functional unit to actual remote main, diagnose failing checks and publish a standalone PR under the operator-approved size exception; keep PR #87 paused
