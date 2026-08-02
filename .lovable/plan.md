# Quick Add as ghost rows

Replace the chip row with "ghost" rows that mirror exactly how a logged entry looks — same grid, same columns, same alignment — but rendered as clearly tentative: faint text, no fill, a dashed hairline instead of a solid one. Tapping a ghost row logs it and it becomes a real row in place.

## Why this works better than chips

- Names get the full row width, so "Dog walk (30m)" or a long meal name reads in full — no truncation, no repeated-prefix weirdness.
- Vertical rows cost less horizontal space than wrapped chips and stay usable once the day already has entries.
- The visual language already teaches the user what a logged row looks like, so a faded version of it reads instantly as "not logged yet."

## Behavior

- Ghost rows sit at the **bottom of the day's list**, below existing entries, separated by a dashed divider with a tiny "Quick add" label.
- Each row shows: name on the left, the item's typical numbers on the right in the same columns as real rows (calories for food; sets/reps/weight or duration for exercise), but dimmed.
- Tap anywhere on the row to log it. While saving, the row shows a spinner and fades toward full opacity; on success it disappears and the real entry appears in the list.
- A small `…` affordance at the right of each row keeps the existing menu: Always show / Hide this / Turn off Quick Add.
- Pinned items keep a filled pin icon before the name, in the domain accent color.
- Row count and selection logic are unchanged (existing `selectQuickAddIds`).

## Reuse and architecture (unchanged goals)

The original architecture holds: selection logic stays domain-agnostic, the UI stays presentational, and each domain only supplies data.

- `src/lib/quick-add.ts` (thresholds, `selectQuickAddIds`, `buildQuickAddUsage`) is untouched — still the single shared brain for food, exercise, and any future custom-log domain.
- `useQuickAddFood` / `useQuickAddRoutines` keep their current shape; a future `useQuickAddCustomLog` plugs in the same way.
- The new component holds no domain logic, no queries, no settings access — it renders items and calls back, exactly like `QuickAddRow` did. Everything domain-specific (grid template, accent, right-hand metric cells) arrives as props.
- Settings keys (`quickAddEnabled`, `quickAddPinned`, `quickAddHidden`) stay shared and global across domains.

## Technical notes

- New `src/components/QuickAddGhostRows.tsx` replacing `QuickAddRow.tsx`'s usage. Props mirror the current ones (`items`, `accent`, `pinnedIds`, `pendingId`, `onAdd`, `onTogglePin`, `onHide`, `onDisable`) plus `gridCols` and an optional per-item `cells: ReactNode[]` so each domain supplies its own right-hand columns without the component knowing what they mean.
- To stay aligned with real rows, `FoodLog.tsx` and `WeightLog.tsx` pass the same grid template used by `FoodItemsTable` / `WeightItemsTable` (`grid-cols-[1fr_50px_90px_24px]` and `grid-cols-[1fr_45px_45px_60px_24px]` respectively, matching whatever delete/select columns are active).
- Ghost styling: `text-muted-foreground/70`, `border-dashed`, hover raises to full foreground plus a faint accent tint (blue for food, purple for exercise), reusing the existing accent maps.
- Move the render site in both pages from above the entry list to just after it; keep `settings.quickAddEnabled` gating and all existing handlers.
- `shortenChipName` and `QuickAddRow.test.ts` are no longer needed for the row layout — the shortening helper is deleted along with `QuickAddRow.tsx`, and its test file is removed. `src/lib/quick-add.test.ts` stays and keeps covering the shared selection logic.

