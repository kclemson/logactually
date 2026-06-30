# Fix the empty "Iron, SRM" pinned chart

## Root cause
The one-time canonicalization backfill re-keyed `bloodwork_results` rows (e.g. `iron_srm` → `iron_serum`) but did **not** update the saved pinned charts in `saved_charts`, whose `chart_dsl.filter.canonicalKey` still points at the old key. The pin titled "Iron, SRM" filters on `iron_srm`, which no longer has any rows — hence the empty chart.

Confirmed in the database: exactly one orphaned bloodwork pin exists.
- `Iron, SRM` → `iron_srm` → 0 rows (empty)
- `Iron` → `iron_serum` → 10 rows (already working)

All other bloodwork pins (Ferritin, Total Cholesterol, TIBC, Iron Saturation) resolve correctly.

## Fix
Because a correct `iron_serum` "Iron" pin already exists, remapping the stale pin would just create a duplicate. So the fix is a one-time data correction:

- Delete the orphaned pinned chart (`saved_charts` row `56bcee34-9740-4c01-becf-3495a9f462ea`, key `iron_srm`).

After this, the empty chart disappears and the working "Iron" pin remains.

## Why no general migration is needed
A scan of every `source: "bloodwork"` pin shows this is the only one referencing a now-dead key, so a broad remap script isn't warranted. If more orphaned pins surface later, the same approach applies: remap the pin's `canonicalKey` to the new key, or delete it when a pin for the new key already exists.

## Verification
- Re-query `saved_charts` bloodwork pins joined against `bloodwork_results` row counts to confirm no pin resolves to 0 rows.
