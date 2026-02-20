
## Fix: Allow description to wrap to 2 lines while keeping portion always visible

### What's happening

The current implementation uses `truncate` on the description span, which is shorthand for `overflow-hidden whitespace-nowrap text-overflow-ellipsis`. This forces the description onto a single line always — that's why every item is being cut short regardless of whether the portion would fit on the same line.

### The correct fix

Replace `truncate` with a **wrapping** approach. The key insight: use `flex-wrap: wrap` on the container so the description and portion are flex items that can flow across 2 lines naturally. The description uses `min-w-0` but no explicit line clamp, so it wraps freely. The portion button has `shrink-0` and `basis-full` only kicks in when needed — actually, the simpler approach is:

- Description span: `min-w-0 break-words` (allows wrapping, no artificial 1-line limit)
- Portion button: `shrink-0 whitespace-nowrap` (stays on same line if there's room, otherwise wraps to next line)
- Container: `flex-wrap: wrap` so the portion can wrap to a new line when description fills the row

With `max-h-[3rem]` still on the outer container, the total height is still capped at ~2 lines. The combination means:

| Description | Portion | Result |
|---|---|---|
| Short ("Coffee") | "(1 portion)" | Both on 1 line |
| Medium ("Bacon egg & cheese pita") | "(0.5 sandwiches)" | Both on 1 line |
| Long ("GOLD STANDARD 100% WHEY...") | "(1 scoop)" | Description wraps, portion on line 2 |
| Very long, no portion | — | Description wraps to 2 lines as before |

This mirrors exactly what the user showed in the screenshot — descriptions wrap naturally and the portion appears on the second line when needed.

### Changes to `src/components/FoodItemsTable.tsx`

**Editable row container (~line 748-751):** Add `flex-wrap` to the container:
```tsx
"flex items-baseline gap-1 flex-wrap",  // add flex-wrap
```

**Editable row DescriptionCell (~line 760):** Replace `truncate flex-1 min-w-0` with `min-w-0`:
```tsx
className="min-w-0"
```
(Remove `truncate` and `flex-1` — we no longer want artificial truncation or stretching)

**Read-only row container (~line 792):** Add `flex-wrap`:
```tsx
className={cn("flex items-baseline gap-1 flex-wrap flex-1 min-w-0 pl-1 pr-0 py-1", compact && "text-sm")}
```

**Read-only row description span (~line 793-795):** Replace `truncate flex-1 min-w-0` with `min-w-0`:
```tsx
className="min-w-0"
```

**Group header rows (~lines 375-378 and ~555-558):** Same change — replace `truncate flex-1 min-w-0` with `min-w-0` on the DescriptionCell className. Add `flex-wrap` to the flex container wrapping the group name + portion button.

### Why this works without layout explosion

The outer `overflow-hidden max-h-[3rem]` container remains unchanged. It caps the total rendered height to ~2 lines (~3rem). With `flex-wrap`, the browser flows description text first, then the portion button on the next line only if the description fills the row. The hard height cap means if somehow both overflow (very long description + long portion), nothing bleeds out — it's just clipped gracefully.

### Files changed

| File | Change |
|---|---|
| `src/components/FoodItemsTable.tsx` | Replace `truncate flex-1 min-w-0` with `min-w-0` on description spans/DescriptionCell. Add `flex-wrap` to the flex containers in editable row, read-only row, and both group header rows. |
