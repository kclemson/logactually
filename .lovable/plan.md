
## Root cause: `line-clamp-2` makes spans behave like blocks

`line-clamp-2` is CSS shorthand for:
```css
display: -webkit-box;
-webkit-line-clamp: 2;
overflow: hidden;
```

The `display: -webkit-box` turns the element into a block formatting context. That's why "Sausage Biscuit Mini" and "(2 sandwiches)" always end up on separate lines — the description span is technically a block, so the portion button wraps below no matter what.

Every approach so far has kept either `line-clamp` or a flex container fighting this — none of them can win.

## The correct approach: treat description + portion as inline text

The description and portion should flow as **inline text**, exactly like words in a sentence. CSS already knows how to do this perfectly:

```
Sausage Biscuit Mini (2 sandwiches)   ← short: all on one line
Bacon egg & cheese pita               ← medium: wraps naturally,
(0.5 sandwiches)                      ← portion stays inline after
Old-fashioned vanilla farmstyle       ← long: wraps to 2 lines,
greek yogurt (5.3 ONZ)                ← portion on same line as tail
```

The implementation: make the description a plain `inline` element and the portion button/span also `inline`. Wrap them in a `<div>` that is `block` (normal flow). The description text wraps naturally, and the portion sits right after the last character of the description.

No flex, no line-clamp, no height cap. Just inline text flow — the way browsers have handled this for 30 years.

For the "don't let it grow forever" concern: a food log description longer than ~3 lines would be genuinely unusual. The row can accommodate 2-3 lines naturally. If a hard cap is still wanted, `line-clamp-3` applied to the **outer** `<div>` (not the description span) would cap the entire block including the portion, which is acceptable.

## Changes to `src/components/FoodItemsTable.tsx`

### Read-only item row (lines 791–816)

**Before:**
```tsx
<div className={cn("flex gap-1 flex-wrap flex-1 min-w-0 pl-1 pr-0 py-1", compact && "text-sm")}>
  <span title={getItemTooltip(item)} className="line-clamp-2 min-w-0">
    {item.description}
  </span>
  {item.portion && (
    <span className="shrink-0 ml-1 text-xs text-muted-foreground whitespace-nowrap">({item.portion})</span>
  )}
</div>
```

**After:**
```tsx
<div className={cn("flex-1 min-w-0 pl-1 pr-0 py-1 leading-snug", compact && "text-sm")}>
  <span title={getItemTooltip(item)}>
    {item.description}
  </span>
  {item.portion && (
    <span className="ml-1 text-xs text-muted-foreground"> ({item.portion})</span>
  )}
  {hasAnyEditedFields(item) && (
    <span className="text-focus-ring font-bold" title={formatEditedFields(item) || 'Edited'}> *</span>
  )}
</div>
```

The description `<span>` and portion `<span>` are now just inline text that flows together. No flex, no clamp, no shrink.

### Editable item row (lines 748–776)

The `DescriptionCell` component uses `contentEditable` which is already inline-ish. Remove `line-clamp-2` from it, and move the portion button + edited indicator **outside** the `DescriptionCell` but inside the same `<div>`:

**Before:**
```tsx
<div className={cn(
  "flex-1 min-w-0 rounded pl-1 py-1",
  "flex items-baseline gap-1 flex-wrap",
  "focus-within:ring-2 ..."
)}>
  <DescriptionCell ... className="line-clamp-2">
    {item.portion && <button ...>({item.portion})</button>}
    {hasAnyEditedFields(item) && <span ...> *</span>}
  </DescriptionCell>
</div>
```

**After:**
```tsx
<div className={cn(
  "flex-1 min-w-0 rounded pl-1 py-1 leading-snug",
  "focus-within:ring-2 ..."
)}>
  <DescriptionCell ... className="">
    {item.portion && (
      <button ...>({item.portion})</button>
    )}
    {hasAnyEditedFields(item) && <span ...> *</span>}
  </DescriptionCell>
</div>
```

The portion button and edited indicator stay as children of `DescriptionCell` (rendered after the `contentEditable` span via the `children` prop slot), which already renders them inline. Just remove the flex + line-clamp from the container.

### Group header rows (lines 371 and ~551)

Same approach — remove `flex-wrap items-baseline gap-1` from the container `<div>`, and remove `line-clamp-2` from the `DescriptionCell` className. The group name and "(1 portion)" button flow inline naturally.

## Why this is the right long-term approach

| Approach | Problem |
|---|---|
| `truncate` on description | Forces 1 line, portion gets cut |
| `line-clamp-2` on description | `-webkit-box` makes it a block, portion always on new line |
| `max-h-[3rem]` on container | Clips portion when description wraps |
| **Inline text flow** | Description wraps naturally, portion follows inline — always visible |

## Files changed

| File | Change |
|---|---|
| `src/components/FoodItemsTable.tsx` | Remove `flex flex-wrap items-baseline gap-1` from description containers. Remove `line-clamp-2` from description spans/DescriptionCell. Let description + portion render as plain inline elements. |
