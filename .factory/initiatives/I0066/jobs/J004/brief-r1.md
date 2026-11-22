# I0066 J004 brief r1: Windows CI and verification timing

- Authorization: operator, 2026-11-22 ("añade lo de la medicion de windows a I0066").
- Objective and acceptance: [plan.md](../../plan.md) J004.

## Notes

- Observed 2026-11-22: windows-latest "Package and host discovery" 4m34s-5m42s versus 1m48s-2m6s on ubuntu-latest; the three CI jobs already run in parallel (no `needs:` in `.github/workflows/quality.yml`). Local `isswf-verify --tier initiative` on Windows took 384 s; `--tier job` 276-315 s.
- Out: dropping checks or platforms.

## Method

- `isswf-performance`: selected. Review: one reviewer.
