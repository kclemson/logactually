

## Change debug JSON from `pre` to resizable `textarea`

**File**: `src/components/CreateChartDialog.tsx`

Replace the `<pre>` block (lines 212-216) with a `<Textarea>` (already imported) that is `readOnly`, uses the same small font styling, and has `resize` enabled so you can drag it to fit a screenshot.

### Technical details

- Swap `<pre>` for `<Textarea readOnly>` with `value={JSON.stringify(currentSpec, null, 2)}`
- Classes: `text-[10px] font-mono bg-muted/50 rounded p-2 min-h-[100px] resize-y`
- Remove `max-h` constraint so you can resize freely
- No new imports needed (`Textarea` is already imported)

Single-line change in one file.

