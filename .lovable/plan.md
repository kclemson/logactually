

## Remove Stale "Waist" Placeholder from Custom Log Input

### Problem
The `LogEntryInput` component still shows `Label (e.g. Waist)` as placeholder text for `text_numeric` log types. This is a leftover from the old body measurement approach that used a single `text_numeric` type. Since body measurements have been refactored into individual numeric types, and `text_numeric` has been removed from the manual creation flow, this placeholder is outdated.

### Change

**`src/components/LogEntryInput.tsx`** (line 53)

Update the placeholder from `'Label (e.g. Waist)'` to a more generic label like `'Label'` since `text_numeric` types are now only for user-created custom configurations where "Waist" is no longer the canonical example.

### Other "Waist" occurrences (no changes needed)
- `src/lib/log-templates.ts` -- legitimate template name ("Waist Measurement") and display label
- `supabase/functions/populate-demo-data/index.ts` -- demo data seeding, uses "Waist" as actual data values
