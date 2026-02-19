
## Fix: CustomLogTypeView row layout — tighten date/value/delete spacing

### The problem

The current layout uses three elements in a `justify-between` flex row:

```
[date: w-28 fixed]    [value: flex-1 grows to fill ALL remaining space]    [trash: far right]
```

The `flex-1` on the value span causes it to stretch across the full remaining width. The value text itself left-algins within that stretch, so visually:

- The gap between date text and value text = (112px date column) + (however much of the flex-1 the text doesn't fill) — which on a 600px wide container leaves ~350px of dead space between the columns
- The delete button is at the far right edge, visually disconnected from its row

### The fix: drop `flex-1`, let value size to content, put trash right after it

Change the row from `justify-between` to a simple left-aligned flex row, with the value span sized to its content and the delete button immediately to its right:

```jsx
<div className="flex items-center gap-3 py-2 border-b ...">
  <span className="text-xs text-muted-foreground shrink-0 w-24">
    {formatEntryDate(...)}
  </span>
  <span className="text-sm shrink-0">
    {formatEntryValue(...)}
  </span>
  {!isReadOnly && (
    <Button className="shrink-0 ...">
      <Trash2 />
    </Button>
  )}
</div>
```

Key changes:
- Remove `justify-between` from the row div — the row is now left-to-right flow
- Change value span from `flex-1 min-w-0 truncate` to `shrink-0` — it sizes to content, no growth
- Delete button sits immediately after the value with the same `gap-3` spacing — visually grouped
- Date column: `w-28` → `w-24` (96px) — still fits "Yesterday, 2:14 PM" at `text-xs` but slightly tighter. Actually keep `w-28` since "Yesterday, 2:14 PM" is the longest possible string and needs the room.

### Handling long text values

For `text` and `text_multiline` value types the value could be a long string. With `shrink-0` it would overflow. Add `max-w-[60%]` + `truncate` on the value span so long text entries get truncated after 60% of row width, keeping the delete button visible:

```jsx
<span className="text-sm shrink min-w-0 truncate max-w-[60%]">
```

Using `shrink` (not `shrink-0` or `flex-1`):
- Content that fits: span collapses to content width, delete button follows immediately
- Content that overflows: span shrinks to available space with truncation

Actually the cleanest approach: use `min-w-0` + `shrink` on the value span. This lets it be as wide as its content up to the available space, then truncate. The delete button sits right after whatever width the value occupies.

### Exact changes to `src/components/CustomLogTypeView.tsx`

**Line 88** — row container: remove `justify-between`
```jsx
// Before
className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0 group"
// After
className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0 group"
```

**Line 93** — value span: remove `flex-1`, keep `min-w-0 truncate`, add explicit max-width
```jsx
// Before
className="text-sm flex-1 min-w-0 truncate"
// After
className="text-sm min-w-0 truncate max-w-[55%]"
```

**Line 97-106** — delete button: remove `shrink-0` (no longer needed since it's not competing with flex-1), keep everything else. The `md:opacity-0 md:group-hover:opacity-100` hover behavior stays.

### Only file changed

`src/components/CustomLogTypeView.tsx` — 3 line changes, no new files.
