# Keep typed text when switching days

## What's going on
The cause is related to the rotation bug but not the same. The Food and Exercise pages deliberately start fresh whenever the day changes. That's useful, because it closes open edits, menus and selections from the previous day. The text box gets wiped along with everything else, so anything typed but not yet submitted is lost.

## Fix
Keep the fresh start, but have the text box remember what's typed in it:
- What you've typed in the Food box (and separately in the Exercise box) carries over when you change days with the arrows or the calendar.
- Example: you type "2 eggs and toast", notice you're on Sunday, tap back to Saturday, and the text is still there, ready to submit for Saturday.
- The draft is cleared when you submit it or clear the box, same as now.
- It isn't kept through a full page reload, which matches how the app behaves today.
- The text box in the "Create saved meal / routine" dialog isn't affected; it still starts empty every time.

## Not included
Custom logs use a different form (number fields and so on), not this text box. They aren't covered by this change. Say if you want them too.

## Technical notes
- Add an optional `draftKey` prop to `LogInput`, passed only from `FoodLog` ("food") and `WeightLog` ("weights").
- Keep drafts in a small in-memory store (`src/lib/log-drafts.ts`) that lives outside the per-day page. `LogInput` uses the stored draft as its starting text and updates the store whenever the text changes, including when it's cleared. The page can keep resetting on day change while the draft survives.
- Add a tiny unit test for the draft store, checking that a draft is kept between reads and that clearing removes it.
