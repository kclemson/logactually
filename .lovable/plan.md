

## Update Demo Data Generation for Calorie Target Distribution

### Goal
With the demo account's daily calorie target set to 2000, adjust food generation so that daily totals follow this distribution:
- 75% of days: green (at or below 2050 cal -- within 2.5% over target)
- 15% of days: amber (2050-2200 cal -- 2.5% to 10% over)
- 10% of days: red (above 2200 cal -- more than 10% over)

### How It Works Today
Each day gets 3-4 random meals picked from the pre-parsed AI cache. The daily total is whatever those meals happen to add up to -- completely uncontrolled, often landing well under 2000 (as seen in the screenshot with many days at 800-1500 cal).

### Approach
Instead of picking meals blindly, we assign each day a calorie budget based on the target distribution, then select meals that approximately fit that budget.

**Changes to `supabase/functions/populate-demo-data/index.ts`:**

1. **Add a `DAILY_CALORIE_TARGET` constant** (2000) and the distribution thresholds.

2. **Add a `assignDailyCalorieBudget` function** that, given the day's index and total days, determines which tier (green/amber/red) the day falls into using the 75/15/10 distribution, then returns a target calorie range:
   - Green days: 1700-2050 cal (most land near/under target)
   - Amber days: 2050-2200 cal
   - Red days: 2200-2600 cal

3. **Modify the per-day food generation loop** (around line 722) to:
   - Compute that day's calorie budget
   - Build the day's meals by selecting from the parsed cache, tracking running calorie total
   - Pick meals that keep the total within the target range
   - If needed, skip snacks or add extra snacks to nudge the total into range

4. **Pre-compute calorie totals per cached input** so we can do budget-aware selection without re-parsing.

### Technical Detail

```text
Day assignment logic:
- Shuffle all day indices
- First 75% get "green" tier
- Next 15% get "amber" tier  
- Last 10% get "red" tier

Per-day meal selection:
- Start with breakfast (random pick)
- Add lunch (random pick)
- Add dinner -- pick one whose calories bring total closest to budget
- Optionally add/skip snack to fine-tune total
```

This keeps the AI parsing unchanged (same bulk parse of all inputs) and only changes the selection logic when assembling each day's entries.

### Files Changed
- `supabase/functions/populate-demo-data/index.ts` -- modify food generation loop and add budget assignment helpers

