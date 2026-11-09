# Find past foods by the words you typed, not just the AI's names

## What the suggestions search today (Food tab)
The suggestion list under the text box is built from your last 90 days of food logs plus your saved meals. Each past food is searchable by:
- the AI's name for it (e.g. "Mozzarella String Cheese"), and
- what you typed, **but only sometimes.**

Three gaps explain "I know I logged this but it won't show up":

1. **Only one version of your wording is kept.** If you've logged the same food 10 times, the suggestion keeps just the most recent typing. Example: you typed "cheese stick" last week and "string cheese" today. Typing "cheese stick" can fail, because only "string cheese" was kept.
2. **The name of a grouped meal isn't searchable.** When several foods are logged together, the suggestion shows the group's short name (e.g. "Afternoon snack"), but typing that name doesn't find it. Only your original text and the food names are checked.
3. **Anything older than 90 days isn't included.** A food you logged in the spring won't come up at all.

The Exercise tab is a separate story. Its suggestions intentionally cover only saved routines, so this change doesn't touch it.

## Fix
- **Remember every way you've described a food.** Each suggestion becomes searchable by all the text you've typed for it over time, plus the AI's name. This directly fixes the user's report: whatever you called it, it can be found.
- **Make the group name searchable** for grouped meals.
- **Look back 6 months instead of 90 days.** Ranking already favors recent and frequent foods, so older items only show up when they're the best match and won't crowd out what you eat now.

Not changed: every word you type still has to match something. That strictness keeps random suggestions out of the list.

## Technical notes
- `FoodLog.tsx` typeahead build: when an item/group key repeats, append that entry's `raw_input` (for single-item entries) to the existing `searchText` (deduped words). Today the first occurrence wins.
- Group candidates: prepend `entry.group_name` to `searchText`.
- `useRecentFoodEntries(90)` → `useRecentFoodEntries(180)` for the typeahead only. Check where else the 90-day result is used, so other features keep their window. The query only loads a few columns.
- Add a small test for the candidate builder (extract it into `src/lib/food-typeahead.ts`): two entries of the same food with different typed text are both searchable, and the group name is searchable.
