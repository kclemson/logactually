

## Tighten Calorie Burn Dialog Spacing and Restyle Preview

### 1. Reduce outer padding (dialog to viewport edge)
Currently the dialog uses `left-4 right-4` (16px each side) giving 32px total margin. Change to `left-2 right-2` and update `max-w-[calc(100vw-32px)]` to `max-w-[calc(100vw-16px)]` for tighter mobile fit.

### 2. Reduce inner content padding
The `DialogContent` base class applies `p-6` (24px). Override to `p-4` (16px) on this dialog instance to tighten the content inside.

### 3. Replace preview box with section header
Remove the `rounded-lg border border-border bg-muted/30 p-3` container around the preview exercises. Instead, add an uppercase section header matching the existing style (like "YOUR INFO" and "WORKOUT DEFAULTS"). The header will read **"PREVIEW"** -- or if you prefer a wordsmith alternative, consider "SAMPLE ESTIMATES" (for fallback) / "YOUR ESTIMATES" (for real data). I'd suggest just "PREVIEW" for simplicity since it's clear in context.

The "Example exercises" label for sample data moves into the header as a parenthetical: "PREVIEW (EXAMPLES)".

### Technical Details

**File: `src/components/CalorieBurnDialog.tsx`**

Line 217 -- Update `DialogContent` className:
- Change `left-4 right-4` to `left-2 right-2`
- Change `max-w-[calc(100vw-32px)]` to `max-w-[calc(100vw-16px)]`
- Add `p-4` to override the base `p-6`

Lines 243-253 -- Replace the preview container:
- Remove the `div` with `rounded-lg border border-border bg-muted/30 p-3`
- Replace with a `div className="space-y-1.5"` containing:
  - An uppercase section header: `<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">` with text "Preview" (or "Preview (examples)" when using samples)
  - The exercise rows directly beneath, no box/border
