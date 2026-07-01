# Branch Registry — chipper-ui

Flow branches use a compressed namespace to avoid polluting the top level.

## Format

```
flow/<topic>/<description>
```

## Topic Codes

| Code | Expansion | Context |
|------|-----------|---------|
| `vid` | Vegas Interior Detailers | Chipper-UI site design/UX work (2026-06-29 →) |

## Examples

```
flow/vid/fix-landing-layout
flow/vid/add-footer
flow/vid/dark-mode-toggle
```

## Rules

- Every Flow branch lives under `flow/<topic>/`.
- New topic codes get added to this table before the first branch is pushed.
- Branches merge via PR to `main`. No direct main commits.
