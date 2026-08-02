# Fix: Quick Add never appears in the demo account

## What's actually wrong
Quick Add requires an item to be logged on at least 30% of the user's "active days" in the trailing 30 days. That active-day count currently includes **future-dated entries**, and the demo account is populated 30 days into the future.

Measured on the live demo account today:

```text
Food     active days counted: 61   (only 31 are in the past)
         threshold = 0.3 x 61 = 19 days
         Pizza Night     17 days -> fails
         Protein Snack   16 days -> fails

Exercise active days counted: 48   (only 22 are in the past)
         Leg Extension   14 days -> fails
         Running          7 days -> fails
```

So the demo data is fine — the denominator is wrong. With future days excluded, thresholds become 9.3 (food) and 6.6 (exercise) and all four habits qualify.

## The fix
Clamp both Quick Add usage queries to the window `[today - 30, today]` instead of `>= today - 30`. Future-dated entries (which any user can create by logging ahead) will no longer dilute the habit ratio, and won't count as usage days either.

This is a one-line-per-hook change, correct for real users as well as the demo account, and needs no data regeneration.

## Technical notes
- `src/hooks/useQuickAddFood.ts`: add `.lte('eaten_date', today)` alongside the existing `gte` cutoff.
- `src/hooks/useQuickAddRoutines.ts`: same for `logged_date`.
- `src/lib/quick-add.ts` needs no change; its recency guard already uses today.
- Add a case to `src/lib/quick-add.test.ts` asserting that future-dated rows do not inflate `activeDays` (via `buildQuickAddUsage`) — guards the regression at the library level too, in case a caller forgets the clamp.
