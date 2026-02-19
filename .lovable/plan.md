
## Fix dual_numeric row layout to match numeric style

### The problem

The current `dual_numeric` grid is `grid-cols-[60px_auto_60px_50px_24px]` — this stretches the two input fields and the `/` separator across the entire row width, so `130` sits at the far left, `/` floates in the middle, and `85` sits in the center-right. The result is the wide, hard-to-read layout shown in the screenshot.

The `numeric` layout (e.g. Weight) uses `grid-cols-[1fr_auto_60px_50px_24px]`, where the value sits in a fixed-width column near the right, followed by a narrow unit column. Everything is pushed right by the `1fr` spacer in col 1.

### The fix

Replace the `dual_numeric` grid template to match the `numeric` pattern: push the combined value group to the right, keep the unit and delete in their usual columns.

Instead of three separate grid columns for `[value1] [/] [value2]`, collapse them into a single inline flex group that sits in the same column position as a single numeric value. That group contains:

```
[input 130] [/ span] [input 85]
```

all tightly packed with `gap-x-0.5` or `gap-x-1`, with no outer spacing between them.

New grid template: `grid-cols-[1fr_auto_50px_24px]`

- **Col 1** (`1fr`): empty spacer (pushes everything right, same as numeric rows)
- **Col 2** (`auto`): inline flex group containing `[input1] / [input2]` tight together
- **Col 3** (`50px`): unit label (mmHg)
- **Col 4** (`24px`): delete button

The two inputs inside the flex group use `w-14` (56px) each, which fits 3-digit BP values comfortably. The `/` separator is an inline `text-sm text-muted-foreground mx-0.5`.

### Result

The entry will read: `130/85  mmHg  [trash]` — all pushed to the right, matching how `170.4  lbs` looks for Weight. Editing either number focuses just that input; the other stays stable.

### File changed

Only `src/components/CustomLogEntryRow.tsx` — specifically the `if (isDualNumeric)` branch (lines 78–120). No other files touched.
