

# CSV export with both unit conversions + edit-mode disclaimer

## 1. Exercise CSV: add Speed (km/h) column

The exercise CSV already includes both `Weight (lbs)` and `Weight (kg)`. We just need to add a `Speed (km/h)` column alongside the existing `Speed (mph)`.

### `src/lib/csv-export.ts`
- Add `Speed (km/h)` column after `Speed (mph)` in the headers array
- Compute the km/h value from `speed_mph` using the `MI_TO_KM` constant (already defined in the file as `LBS_TO_KG`; we add `MI_TO_KM = 1.60934`)
- Each row gets the extra converted speed value

No changes needed to `useExportData`, `ImportExportSection`, or `Settings.tsx` since we're just always including both columns (no user preference threading required).

## 2. Edit-mode disclaimer in DetailDialog

### `src/components/DetailDialog.tsx` (around line 612)
- Add a subtle italic note above the Cancel/Save buttons when in edit mode:
  ```
  <p className="text-[10px] italic text-muted-foreground/70 text-center w-full">
    Values aren't validated — please double-check your edits.
  </p>
  ```

## Files changed

| File | What |
|------|------|
| `src/lib/csv-export.ts` | Add `Speed (km/h)` header and converted value column |
| `src/components/DetailDialog.tsx` | Add subtle disclaimer text in edit-mode footer |

