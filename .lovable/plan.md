
## Fix: align delete icons vertically with a fixed-width value column

### The problem

The value span currently has `min-w-0 truncate max-w-[55%]` — it shrinks to the width of its text content. So:

- `"149.6 lbs"` → ~78px wide → trash icon at ~78px
- `"149 lbs"` → ~62px wide → trash icon at ~62px

The result is a jagged column of trash icons at different X positions, looking "bedraggled".

### The fix: fixed-width value column

Replace the `min-w-0 truncate max-w-[55%]` with a **fixed width** (`w-32`, 128px) plus `truncate`. Every row's value column is exactly the same width, so every delete icon starts at the same horizontal position:

```
[date: w-28]  [value: w-32 fixed]  [trash: always at same X]
```

128px comfortably fits:
- `"149.6 lbs"` (typical numeric with unit)
- `"120 / 80 mmHg"` (dual_numeric)
- `"text_numeric"` labels up to about 15 chars

For long text/text_multiline entries, the value truncates at 128px and the trash still lines up.

### Adding `tabular-nums` for numbers

For numeric types, `font-variant-numeric: tabular-nums` (Tailwind: `tabular-nums`) makes each digit the same width, so `149` and `149.6` align on the decimal point visually. This is a nice-to-have that pairs well with the fixed column.

Apply it on the value span unconditionally — it has no visible effect on non-numeric text.

### Exact change: one line in `src/components/CustomLogTypeView.tsx`

**Line 93** — value span:
```tsx
// Before
<span className="text-sm min-w-0 truncate max-w-[55%]">

// After
<span className="text-sm tabular-nums truncate w-32 shrink-0">
```

- `w-32` (128px) — fixed width, aligns all trash icons
- `shrink-0` — prevents flex from collapsing it below 128px
- `truncate` — handles overflow for long text values
- `tabular-nums` — digits align cleanly within the column

### Only file changed

`src/components/CustomLogTypeView.tsx` — one line, line 93.
