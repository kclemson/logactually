

# Add small buffer to rollup green threshold

Single constant change in `src/lib/calorie-target.ts`:

```
ROLLUP_GREEN_MAX = 0  →  ROLLUP_GREEN_MAX = 0.05
```

This gives a 0.05% buffer so that rounding artifacts (where the displayed average matches the target but the unrounded value is fractionally over) still show a green dot. The legend will automatically update since it reads from the constant — it will show "≤0.05%" instead of "under".

### Files

| File | Change |
|---|---|
| `src/lib/calorie-target.ts` | Change `ROLLUP_GREEN_MAX` from `0` to `0.05` |

