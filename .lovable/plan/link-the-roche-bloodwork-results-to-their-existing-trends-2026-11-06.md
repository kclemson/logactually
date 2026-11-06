# Link the "(Roche)" bloodwork results to their existing trends

## What happened

Your November 2 report prints "(Roche)" after each test name. The dictionary didn't recognize those names, so 9 results started new trends instead of joining the existing ones.

## The fix (surgical)

1. **Add the "(Roche)" names to the dictionary,** the same way the "(Beckman)" names were added before. Matching logic doesn't change.

| Printed on report | Joins |
|---|---|
| Ferritin (Roche) | Ferritin |
| Transferrin Saturation (Roche) | Iron Saturation |
| Total Iron Binding Capacity (Roche) | TIBC |
| Transferrin (Roche) | Transferrin |
| Thyroid Stimulating Hormone (Roche) | TSH |
| ALT (Roche), AST (Roche) | ALT, AST |
| Total Bilirubin (Roche), Direct Bilirubin (Roche) | Bilirubin (Total), Bilirubin (Direct) |
| Total Protein (Roche) | Total Protein |

2. **Repair your existing 9 results** so they show up on the standard trends. Move any pin on a "(Roche)" chart to the matching standard chart.

## Technical details

- Add `'<name> roche'` synonyms to those 9 entries in `src/lib/bloodwork-canonical.ts` and its copy in `supabase/functions/_shared/bloodwork-canonical.ts`. Redeploy `parse-bloodwork`.
- One data update on `bloodwork_results` for your account only: re-key the 9 `*_roche` rows and set the canonical display names. Re-key any matching pinned-analyte entries in your settings.
