# Make demo data trigger Quick Add

Quick Add is empty in the demo account because generated logs are never attributed to saved items:

- Saved meals are created *after* the daily food loop, so every demo food entry has no `source_meal_id` — food usage is always zero.
- Saved routines are created up front, but only ~30% of workout days reference one, spread randomly across all strength routines (cardio routines are never referenced at all). No single routine clears the habit threshold.

Quick Add requires, within the trailing 30 days: at least 5 active days, and an item used on at least 3 days AND at least 30% of active days, with its last use within 10 days.

## What changes

1. **Create saved meals before the daily loop** (same as routines today) and keep an in-memory pool of `{id, name, original_input, food_items}`.
2. **Designate "habit" items.** Pick 2 saved meals and 2 saved routines (one strength, one cardio) as the demo user's habits.
3. **Log habits densely in the recent window.** On days inside the last 30 days, each habit meal is logged with high probability (~55–65%) and each habit routine on its exercise days, so both comfortably clear the 30% ratio and the 10-day recency guard. Older days keep the current mixed/random behaviour so history still looks varied.
4. **Attribute the rows.** Food entries created from a saved meal carry `source_meal_id` and copy that meal's parsed `food_items`/`raw_input`; cardio days can now also reference a cardio saved routine via `source_routine_id`.
5. **Roll usage counts up.** Extend the existing routine `use_count`/`last_used_at` bump to saved meals too, so counts match the generated history instead of the current random seed values.

## Technical notes

- File: `supabase/functions/populate-demo-data/index.ts` only. No schema or client changes.
- Move the saved-meal insert block (currently after the day loop) above it; the AI parse of `SAVED_MEAL_TEMPLATES` already runs earlier, so cached items are available.
- Habit-day probability is computed against days within `today - 30`, independent of the dialog's chosen range, so Quick Add works even when the range starts 90 days back.
- Saved-meal food entries reuse the meal's cached items so daily macro totals stay consistent with the calorie-tier budget logic (a habit meal counts toward `runningCalories` like any other pick).
- Summary output gains no new fields; existing counts still apply.
