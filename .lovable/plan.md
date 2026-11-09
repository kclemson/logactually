# Calendar: let people choose what each day shows

## How it works today
Each day square has three lines: calories (top), the date (middle), and exercise/custom-log icons (bottom). The bottom line always saves space, so someone who only logs food sees an empty strip on every day.

## Recommendation

**Where to change it: on the calendar itself, saved to their account.**
- A small "Show" button next to the month name opens a short menu.
- People change this while looking at the calendar, so they see the result immediately. Burying it in Settings means they have to know it exists.
- The choice is saved like other preferences, so it follows them across devices. No separate entry in Settings is needed.

**What they can pick: two lines, one menu each.**
- Top line: Calories (default), Protein, Carbs, Net carbs, Fat, or Nothing.
- Bottom line: Activity icons (default), any of the same nutrition options, or Nothing.
- Example: the person who asked picks Calories on top and Protein on the bottom, and sees "1,850" above the date and "120g" below it.
- Two fixed lines are easier to understand than a checklist where several numbers get squeezed into a small square on a phone.

**Better default when exercise is turned off.** If someone has exercise tracking off in Settings and has never touched this menu, the bottom line starts as Protein instead of empty icons. Most people like this user would never need to open the menu.

## Smaller details
- Nutrition numbers use the same colors as elsewhere in the app (e.g. protein matches its color in the food log).
- The calorie target dot only shows next to calories, wherever calories appear.
- The day's background color, the tap-for-details popup, and the monthly totals don't change.
- Custom-log icons are part of "Activity icons." If someone picks a nutrition number for the bottom line, those icons go away (the popup still lists them).

## Technical notes
- New setting `calendarRows: { top, bottom }` stored with the other user settings; if it's missing, the defaults above apply, with exercise tracking off affecting the bottom default.
- The calendar's food query needs to load protein/carbs/fat/fiber totals as well as calories (same columns, one query). Net carbs = max(0, carbs − fiber).
- A small dropdown menu in the month header; the choice is saved when the user picks it.
- One rendering helper per line, covering both lines.
- Small test for the default rule (exercise off → protein on the bottom line).
