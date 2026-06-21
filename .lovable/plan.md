# Move "View Scrapbook" into the card header

The large full-width teal **View Scrapbook** button currently sits above the entry list in the Scrapbook/memory card body. It feels heavy and out of place. We'll move it up into the card header, sitting next to the **+ Log** button, as a compact action.

## Changes (`src/components/CustomLogByTypeView.tsx`)

1. **Header (`TypeCard`)**: For memory log types only (`logType.value_type === 'memory'`), render a small **View Scrapbook** button just before the existing **+ Log** button in the header row. It uses the `Images` icon and a compact ghost/text style matching the existing "+ Log" button (`h-7 px-2 text-xs`), so the two actions read as a tidy pair. On click it navigates to `/custom/memories?type=<id>` (same destination as today), with `e.stopPropagation()` so it doesn't toggle the card's expand/collapse.
   - To keep label noise low in the narrow mobile header, it can show just the icon (with an `aria-label`) or "Scrapbook" text — defaulting to icon + short "Scrapbook" label.
   - Add a `useNavigate` call in `TypeCard` (hook already imported in the file).

2. **Body (`MemoryTypeBody`)**: Remove the full-width `View Scrapbook` `Button` block (lines ~472–479) so the entry list starts directly under the header. The `openViewer()` per-date navigation on individual rows stays unchanged.

## Notes / out of scope
- Purely a UI relocation; no data, navigation target, or behavior change beyond moving the button.
- Only affects `value_type === 'memory'` cards; all other custom log types keep their identical header (just "+ Log").
- The button stays hidden for read-only users only if we choose — but since it's a read action (just viewing), it should remain visible even in read-only mode (unlike "+ Log").
