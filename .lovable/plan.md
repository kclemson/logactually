# Calendar: choose which icons appear on the bottom line

## My take on your idea
Checkboxes are the right idea. I'd make two changes:

- **No "All" option and no "up to 3" limit.** There are only five icon types (Lifting, Run/walk, Cycling, Other cardio, Custom logs). A plain checklist with everything checked already means "all", so a separate "All" option would be a second way to say the same thing. A limit isn't needed either: a phone cell fits 3 icons and a desktop cell fits 4. Most days have only 1–2 types, and on busier days the existing trimming applies.
- **Call the option "Icons" instead of "Activity icons".** You're right that custom logs aren't activities. Renaming it lets custom logs stay in the same list without the label being wrong.

## How it works
- The bottom-line dropdown becomes: Icons, Calories, Protein, Carbs, Net carbs, Fat, Nothing.
- When "Icons" is picked, a short checklist appears under it in the same menu:
  - [x] Lifting
  - [x] Run / walk
  - [x] Cycling
  - [x] Other cardio
  - [x] Custom logs (listed only if custom logs are turned on in Settings)
- Example: someone who only cares about running unchecks everything except Run / walk. Only days with a run or walk show the icon, and every other day's bottom line stays empty.
- **Defaults:** everything is checked, so the calendar looks exactly like it does today until someone changes it. If every box gets unchecked, the bottom line is simply empty.
- If exercise tracking is off, the four exercise boxes are hidden (as today, their icons never show).
- Choices are saved to the account, the same way the line choices already are.
- **When icons get trimmed:** if a day has more checked types than fit, exercise icons come first and the custom-log icon gets the last slot, as it does now.

## Technical notes
- Rename the bottom option value `activity` to `icons`. Treat a saved `activity` value as `icons` so nobody's choice gets reset.
- New setting `calendarIcons: string[] | null` (null = all). Values: `lifting`, `runwalk`, `cycling`, `othercardio`, `custom`.
- In `History.tsx`, filter the icons in the cell by this list before trimming them.
- Add checkboxes to the popover (native `<input type="checkbox">`), shown only when the bottom line is "Icons". Each change saves straight away.
- Add tests in `calendar-rows.test.ts`: null means every icon is shown; an empty list shows none; a saved `activity` value is read as `icons`.
