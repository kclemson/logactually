
## Fix: Remove `max-h-[3rem]` cap, use `line-clamp-2` on description only

### Why everything so far has failed

All previous attempts kept `max-h-[3rem]` as the safety net. But `max-h-[3rem]` is roughly 48px — exactly 2 lines at the default line-height. The moment a description wraps to 2 lines AND a portion is present, the portion becomes line 3 and gets clipped. No amount of `flex-wrap`, `truncate`, or `line-clamp-1` can fix this while the outer container is still height-capped to 2 lines.

The two goals — "cap description to 2 lines" and "always show portion" — are fundamentally in conflict when using a single height cap on the whole container.

### The real fix: separate the two concerns

Remove `max-h-[3rem]` from the container. Instead, apply `line-clamp-2` directly to the description text element. This way:

- **Description** is capped to 2 lines via `line-clamp-2` — same visual behaviour as before
- **Portion** sits below as a flex-wrap sibling, always visible, no height cap fighting it
- **Total row height** = at most 2 lines of description + 1 line of portion — perfectly acceptable

### Changes to `src/components/FoodItemsTable.tsx`

**Read-only item row (around line 792-817):**

The outer `<div>` drops `max-h-[3rem]` and `overflow-hidden`. The description `<span>` gains `line-clamp-2`. The portion/edited indicator remain `shrink-0 whitespace-nowrap`.

```tsx
// Before
<div className={cn("flex items-baseline gap-1 flex-wrap flex-1 min-w-0 pl-1 pr-0 py-1", compact && "text-sm")}>
  <span title={...} className="min-w-0">

// After
<div className={cn("flex gap-1 flex-wrap flex-1 min-w-0 pl-1 pr-0 py-1", compact && "text-sm")}>
  <span title={...} className="line-clamp-2 w-full min-w-0">
```

Note `w-full` on the description span — this forces it to always occupy the full row width, so the portion naturally starts on its own line below. Without `w-full`, short descriptions sit inline with the portion (one line, fine), and long descriptions wrap to 2 lines then portion flows below (also fine).

Actually — for the flex-wrap approach, `w-full` is not always wanted (it would force portion to a new line even for "Coffee (1 portion)"). The better approach: keep `flex-wrap` on the container, let the description span grow naturally with `line-clamp-2`, and the portion wraps to a new line only when needed.

**Editable item row (around line 748-776):**

The container div drops `max-h-[3rem]` and `overflow-hidden`. The `DescriptionCell` gets `className="line-clamp-2"`.

```tsx
// Before (container)
"flex-1 min-w-0 rounded pl-1 py-1",
"overflow-hidden max-h-[3rem]",
"flex items-baseline gap-1 flex-wrap",

// After (container)
"flex-1 min-w-0 rounded pl-1 py-1",
"flex items-baseline gap-1 flex-wrap",
```

```tsx
// DescriptionCell
className="line-clamp-2"   // replaces "min-w-0"
```

**Group header rows (~lines 371 and 551):**

Same change — remove `max-h-[3rem]` from the container class, add `line-clamp-2` to the `DescriptionCell` className.

```tsx
// Before
<div className={cn("flex-1 min-w-0 overflow-hidden max-h-[3rem] rounded pl-1 py-1 flex items-baseline gap-1 flex-wrap ...", ...)}>
  <DescriptionCell ... className="min-w-0">

// After
<div className={cn("flex-1 min-w-0 rounded pl-1 py-1 flex items-baseline gap-1 flex-wrap ...", ...)}>
  <DescriptionCell ... className="line-clamp-2">
```

### Why this works for all cases

| Description | With portion? | Result |
|---|---|---|
| Short ("Coffee") | Yes ("1 portion") | Both on 1 line — portion fits inline |
| Medium ("Bacon egg & cheese pita") | Yes ("0.5 sandwiches") | Both on 1 line — enough space |
| Long ("Old-fashioned vanilla farmstyle greek") | Yes ("6 oz") | Description uses up to 2 lines via `line-clamp-2`, portion wraps to line 3 — **always visible** |
| Very long, no portion | No | Description wraps to 2 lines, no portion, same as before |
| Extremely long | Yes | Description clamps at 2 lines with `…`, portion is line 3 — always visible |

### Files changed

| File | Change |
|---|---|
| `src/components/FoodItemsTable.tsx` | Remove `overflow-hidden max-h-[3rem]` from the description container in: editable item row, read-only item row, and both group header rows. Add `line-clamp-2` to description elements (DescriptionCell className and read-only span className). |
