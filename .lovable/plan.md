# Analyte popover: full names + inline pin & Google-lookup actions

## Your question, answered
The expanded names for these acronyms are a **fixed, well-known standard** — they don't differ between labs (MCV always = Mean Corpuscular Volume, etc.). So we add them as a static `fullName` on the canonical analyte registry, alongside the existing keys/synonyms.

## Part 1 — Full-name mapping
- Add an optional `fullName?: string` field to `CanonicalAnalyte` in **both** dictionary copies (`src/lib/bloodwork-canonical.ts` and `supabase/functions/_shared/bloodwork-canonical.ts`), kept byte-identical.
- Populate it only for abbreviation-style analytes where it adds information. Examples:
  - WBC → White Blood Cell Count, RBC → Red Blood Cell Count
  - MCV → Mean Corpuscular Volume, MCH → Mean Corpuscular Hemoglobin, MCHC → Mean Corpuscular Hemoglobin Concentration
  - RDW → Red Cell Distribution Width, MPV → Mean Platelet Volume
  - HDL/LDL/VLDL → High/Low/Very-Low-Density Lipoprotein Cholesterol
  - BUN → Blood Urea Nitrogen, eGFR → Estimated Glomerular Filtration Rate
  - ALT → Alanine Aminotransferase, AST → Aspartate Aminotransferase, GGT → Gamma-Glutamyl Transferase
  - TIBC → Total Iron-Binding Capacity, UIBC → Unsaturated Iron-Binding Capacity
  - TSH → Thyroid-Stimulating Hormone, CRP → C-Reactive Protein, hs-CRP → High-Sensitivity C-Reactive Protein, ESR → Erythrocyte Sedimentation Rate
  - SHBG → Sex Hormone-Binding Globulin, DHEA-S → Dehydroepiandrosterone Sulfate, HOMA-IR → Homeostatic Model Assessment of Insulin Resistance
  - CO2 → Carbon Dioxide (Bicarbonate), A/G Ratio → Albumin/Globulin Ratio, HbA1c → Hemoglobin A1c (Glycated)
  - Free/Total T4 → Thyroxine, Free/Total T3 → Triiodothyronine
- Analytes whose display name is already descriptive (Iron, Ferritin, Glucose, Sodium…) get no `fullName`.
- Export a small lookup so the popover can resolve a `fullName` from a `canonicalKey` (reuse the existing key index).

## Part 2 — Pin + Google lookup in the popover header
Goal: the trend popover header shows, left-to-right, the **pin icon**, the **analyte name + full name**, and the **question-mark Google link** — the same key actions available in the list row.

- **Extract shared action components** from `BloodworkPanelGroup.tsx` into a small module (e.g. `src/components/bloodwork/AnalyteActions.tsx`): `AnalytePinButton` ({ canonicalKey, displayName, isReadOnly }) and `AnalyteLookupLink` ({ displayName }). Reuse them in both the list rows and the popover header so the pin/lookup behavior stays in one place. Support a slightly larger tap-target size variant for the popover header.
- **`AnalyteTrendPopover`** gains an `isReadOnly` prop (passed down from `BloodworkPanelGroup`) so the header pin respects read-only mode, and looks up `fullName` from the registry by `canonicalKey`.
- Render a compact header at the top of `PopoverContent`, always visible (loading, empty, and loaded states): `[pin]  Name / full-name  ………  [?]`. The acronym is bold; the full name sits beneath it as muted small text, shown only when present and different from the display name.
- Add an optional `hideHeader` prop to `ChartCard` and pass it through `DynamicChart`. The popover renders the chart with `hideHeader` so the chart's own title isn't duplicated under our new header.

## Out of scope
No changes to pinning logic, the Google query format, chart data fetching, or backend.

## Technical notes
- `AnalytePinButton` uses the existing `usePinnedBloodworkCharts` hook; `AnalyteLookupLink` keeps the current `https://www.google.com/search?q=<name> blood test` URL and `stopPropagation` behavior.
- Header buttons call `stopPropagation` so taps don't close the popover or toggle the row.
- `hideHeader` defaults to `false`, leaving every other ChartCard usage unchanged.

## Verification
- `tsgo` typecheck clean; `bunx vitest run src/lib/bloodwork-canonical.test.ts` green.
- Playwright screenshot of an opened popover for an acronym analyte (e.g. MCV) confirming: pin (left), name + full name, and the ? link (right), plus the trend chart with no duplicated title.
