

## Move "Log..." dropdown and "Add Tracking Type" to the top of the Custom page

Currently the Custom page has: date picker → entries → input form → dropdown/add button (at bottom). Food and Exercise pages have: textarea + buttons → date picker → entries. The date picker ends up at a different vertical position.

### Change

In `src/pages/OtherLog.tsx`, move the bottom controls section (the "Log..." `Select` dropdown + "+ Add Tracking Type" button) from below the entries list to above the date navigation. This puts them in the same vertical position as the textarea/buttons on Food and Exercise, so the date picker aligns consistently across all tabs.

Additionally, when a log type is selected from the dropdown and the `LogEntryInput` form appears, it should render inline right below the dropdown row (still above the date nav), mirroring how Food/Exercise show their input area above the date picker.

Remove the `pt-4 border-t` styling since these controls will no longer be a footer -- they'll be the top-level input area.

### File changed: 1

| File | Change |
|------|--------|
| `src/pages/OtherLog.tsx` | Reorder JSX: move the dropdown + add button block and the `LogEntryInput` block to render before the date navigation section. Remove bottom-border styling. |

