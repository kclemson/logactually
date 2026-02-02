

## Demo Mode Preview - COMPLETED

Demo users can now see what would be logged for all input types (text analysis, barcode scan, saved meals/routines) before being prompted to create an account.

### Implementation Summary

| File | Change |
|------|--------|
| `src/components/DemoPreviewDialog.tsx` | **New** - Wrapper dialog reusing existing tables |
| `src/pages/FoodLog.tsx` | Added demo preview for text, barcode, saved meals |
| `src/pages/WeightLog.tsx` | Added demo preview for text, saved routines |
| `src/components/LogInput.tsx` | Removed early isReadOnly block |

### How it Works

1. Demo users (read-only) can submit text, scan barcodes, or select saved items
2. The AI analysis runs normally, returning parsed items
3. Instead of saving to database, items are shown in `DemoPreviewDialog`
4. Dialog uses the same `FoodItemsTable`/`WeightItemsTable` with `editable={false}`
5. Users can expand entries to see original raw input (same UX as main log)
6. "Create Free Account" signs out and redirects to /auth
