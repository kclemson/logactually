# Quick Add chips: quieter styling and placement

Scope for this pass: visual weight and position only. Labeling/truncation stays exactly as it is today and gets its own pass afterwards.

## 1. Make the chips recede

Today the chips are accent-colored, full-size buttons — they read as active content competing with the day's list. Change the resting state to "suggestion, not yet added":

- Muted treatment by default: `border-border`, `text-muted-foreground`, no fill.
- Accent color (blue food / purple exercise) only on hover, press, and pinned chips. Pinned still stands out; the rest recede.
- Smaller footprint: `text-[11px]`, `h-6`, tighter horizontal padding, `gap-1` between chips.
- The `…` overflow menu shrinks to a narrow chevron-free `⋯` at the same reduced height, so the chip's total width drops noticeably.

Net effect on the screenshots: the exercise row goes from two wrapped rows of chunky purple pills to one line of small gray pills.

## 2. Placement

Keep the row directly under the date navigation. Moving it to the middle or bottom of the page makes it unfindable once a day has entries, and its whole value is "add before/while I'm logging." The de-emphasis in step 1 is what removes the visual shouting — position isn't the problem.

Two placement refinements:

- Reduce the gap above it (`mt-3` → `mt-2`) and add a small bottom margin so it visually attaches to the date row as a sub-line rather than floating as its own block.
- It already stays visible after entries exist; keep that, since it now costs one short line.

## 3. Divider affordance

Add a faint hairline between the chip row and the day's entry list so the strip reads as a separate "not logged yet" zone. Nothing else changes structurally.

## Technical notes

- All changes are in `src/components/QuickAddRow.tsx` (`ACCENT` / `ACCENT_PINNED` maps, chip sizing classes) plus the two wrapper `div`s in `src/pages/FoodLog.tsx` and `src/pages/WeightLog.tsx`.
- Colors come from existing semantic tokens (`border-border`, `text-muted-foreground`) plus the established blue/purple accents already in the file.
- No hook, data, or label logic touched; `shortenChipName` and its tests are unchanged.

## Next pass (not in this change)

Label length and how to differentiate similar names — revisited after seeing the restyled row in place.
