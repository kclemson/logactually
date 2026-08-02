# Quick Add chips: quieter, smarter labels

The real problem isn't the layout — it's that every chip has to re-state the same words. Three "Dog walk" chips that only differ by duration waste the whole label budget on the part that's identical. Fix the label first, then dial down the visual weight.

## 1. Shared-prefix labeling

When two or more chips in the row start with the same words, show the common stem once and let each chip carry only what makes it different.

```text
before:  [+ Dog walk (25m…]  [+ Dog walk (30m…]  [+ Dog walk (20m…]
after:   Dog walk  [+ 25m]  [+ 30m]  [+ 20m]
```

- The stem is computed per-row from the chip names actually being shown (word-level common prefix, at least one full word).
- Chips that don't share the stem keep their own full label and sit after the grouped set.
- Only group when 2+ chips share a stem; a lone item just shows its name.
- The remainder gets punctuation stripped, so `Dog walk (25m)` yields `25m`, not `(25m)`.
- Full original name still lives on the native `title` tooltip and `aria-label`, so nothing is lost for screen readers or hover.

Because the shared words disappear, the per-chip character budget goes much further — chips get shorter *and* more informative at the same time. For non-grouped chips the budget rises from 18 to ~22 characters since we're no longer paying for repeated words.

## 2. Quieter, "not yet logged" styling

Chips currently use full accent color, which reads as active state. Switch the default to a muted treatment:

- Neutral/muted border and `text-muted-foreground` label, with a small `+` in the same muted tone.
- Accent color (blue for food, purple for exercise) appears only on hover/active and on pinned chips — so pinned still stands out, and the un-pinned row recedes.
- Slightly smaller: `text-[11px]`, tighter padding, `h-6` chips.

The row reads as a suggestion strip rather than as content.

## 3. Placement

Keep the row where it is (directly under the date navigation) — moving it to the middle or bottom of the page breaks the "add to today" adjacency and would make it hard to find once the day's list gets long. The reduced size and muted color do the de-emphasis work instead.

One change: the row currently only renders when the list is non-empty in a `mt-3` block. It stays visible after entries exist (already the case) — with the smaller footprint it costs one short line rather than two wrapped rows.

## Technical notes

- New pure helper `buildChipLabels(names: string[])` in `src/lib/quick-add.ts`, returning `{ stem, labels }`. Unit tests in `src/lib/quick-add.test.ts` covering: no shared stem, partial group, three-way group, stem that is the whole name, and punctuation trimming.
- `src/components/QuickAddRow.tsx` renders an optional stem label before the grouped chips and uses the derived per-chip label; existing `shortenChipName` stays as the fallback for ungrouped names (budget bumped to 22).
- Restyle is confined to the `ACCENT` / `ACCENT_PINNED` maps and chip sizing classes; colors use existing semantic tokens plus the established blue/purple accents.
- `FoodLog.tsx` / `WeightLog.tsx` need no logic changes — they already pass raw names.
