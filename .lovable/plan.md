
## Fix: Portion button clipped on mobile — trim description to make room

### User preference
Keep the layout exactly as-is (inline portion button on the same line as the description). Just ensure the description truncates sooner when a portion is present, so the portion button is never clipped off.

### Root cause
The container is `overflow-hidden max-h-[3rem]`, which is roughly 2 lines tall. `DescriptionCell` renders a `<span>` with the description text inline, followed by the portion button as a sibling. When the description wraps to 2 lines on mobile, the portion button becomes a third line and is silently clipped by `overflow-hidden`.

### The fix: `line-clamp-1` on the description when a portion is present

Currently the editable `DescriptionCell` span has no explicit `line-clamp`. When a `portion` exists, add `line-clamp-1` via a `className` prop so the description truncates to one line with an ellipsis — keeping the portion button always visible on the same second "line" of the container.

There are two places to fix:

**1. Editable mode** (~line 751): Pass `className="line-clamp-1"` to `DescriptionCell` when `item.portion` is truthy. When there's no portion, leave it unclamped (current behaviour — description can wrap to 2 lines).

**2. Read-only mode** (~line 790): The `<span>` already has `line-clamp-2`. When `item.portion` is truthy, switch it to `line-clamp-1` so the portion fits inline.

Both group header rows (~line 371 and ~line 550) use a group portion — same fix applies: clamp the group name to 1 line when a cumulative portion multiplier is displayed.

### Technical details

`DescriptionCell` already accepts a `className` prop that it passes to its inner `<span>`:

```tsx
// DescriptionCell.tsx — the span already forwards className
<span
  className={cn(
    "border-0 bg-transparent focus:outline-none cursor-text hover:bg-muted/50",
    className  // ← this is where we inject line-clamp-1
  )}
  ...
/>
```

So the change is purely at the call-site in `FoodItemsTable.tsx` — no changes to `DescriptionCell` itself.

### Change at individual item editable row (~line 751)

```tsx
// Before
<DescriptionCell
  value={item.description}
  onSave={...}
  title={...}
>

// After
<DescriptionCell
  value={item.description}
  onSave={...}
  title={...}
  className={item.portion ? "line-clamp-1" : undefined}
>
```

### Change at individual item read-only row (~line 790)

```tsx
// Before
<span className={cn("pl-1 pr-0 py-1 line-clamp-2 shrink min-w-0", compact && "text-sm")}>

// After
<span className={cn("pl-1 pr-0 py-1 shrink min-w-0", item.portion ? "line-clamp-1" : "line-clamp-2", compact && "text-sm")}>
```

### Change at group header rows (~lines 372 and 552)

Same pattern — both use a `DescriptionCell` for the group name. When a cumulative multiplier is displayed (i.e. when the portion button renders), add `className="line-clamp-1"`:

```tsx
<DescriptionCell
  value={groupName}
  ...
  className={hasPortionButton ? "line-clamp-1" : undefined}
>
```

### Files changed

| File | Change |
|---|---|
| `src/components/FoodItemsTable.tsx` | In editable item row: add `className={item.portion ? "line-clamp-1" : undefined}` to `DescriptionCell`. In read-only item row: conditionally switch `line-clamp-2` to `line-clamp-1` when `item.portion` is truthy. In both group header rows: same pattern on the `DescriptionCell` when a portion multiplier button is shown. |

### Result

- Short descriptions with a portion: description fits on one line + portion visible beside it ✓
- Long descriptions with a portion: description truncates with `…` on one line + portion visible beside it ✓  
- Long descriptions without a portion: still wraps to 2 lines as today ✓
- No layout restructuring, no extra vertical space ✓
