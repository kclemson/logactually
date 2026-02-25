

# Rename W → E and SW → SE in admin user table

Rename two column headers to reflect "Exercise" instead of the legacy "Weights" label. Combined with the tooltip task from the previous plan.

## Changes

| File | Change |
|---|---|
| `src/pages/Admin.tsx` | Line 310: `W2d` → `E2d` |
| `src/pages/Admin.tsx` | Line 313: `W` → `E` |
| `src/pages/Admin.tsx` | Line 314: `SW` → `SE` |

Plus wrap all 13 column headers in `Tooltip` components (from the already-approved plan), using these labels:

| Header | Tooltip |
|--------|---------|
| User | User number |
| Last | Last active date |
| F2d | Food entries today |
| E2d | Exercise entries today |
| F | Total food entries |
| SF | Saved meals |
| E | Total exercise entries |
| SE | Saved routines |
| SC | Saved charts |
| C | Custom logs enabled |
| Lt | Custom log types |
| Cs | Custom log entries |
| B | Beta user |

Single file change, no database or dependency changes.

