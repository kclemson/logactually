

## Move Calorie Burn Display: Into Total Row and Expanded Section

### What changes

1. **Total row gets calorie estimate inline** -- Instead of a separate line below the table saying "Est. burn: ~81-157 cal", the Total row will read: `Total` followed by `(~81-157 cal)` in smaller, italic, muted text.

2. **Per-exercise calorie estimates move into expanded section** -- The calorie sub-row currently shown under every exercise row will be removed. Instead, per-exercise estimates will appear inside the expanded content (the `>` section), alongside cardio metadata and "Logged as" text.

### Technical Details

**`src/pages/WeightLog.tsx`** (lines 678-698):
- Compute the total calorie burn result and format it as a short string (e.g., `"(~81-157 cal)"`).
- Pass it as a new prop `totalCalorieBurnDisplay` to `WeightItemsTable`.
- Remove the standalone `<p>` block that currently renders the calorie summary below the table.

**`src/components/WeightItemsTable.tsx`**:

- **Add prop** `totalCalorieBurnDisplay?: string` to the component interface.
- **TotalsRow** (line 300): After the "Total" text, append: `{totalCalorieBurnDisplay && <span className="text-[11px] font-normal italic text-muted-foreground ml-1">{totalCalorieBurnDisplay}</span>}`
- **Remove per-exercise calorie block** (lines 708-731): Delete the calorie burn estimate that renders below each exercise row.
- **Add per-exercise estimates to expanded section** (after line 807, inside the expanded content): For each exercise in the entry, compute and display the calorie estimate in the same `text-sm text-muted-foreground` style used by other expanded content.

### Files Changed
- `src/components/WeightItemsTable.tsx`
- `src/pages/WeightLog.tsx`

