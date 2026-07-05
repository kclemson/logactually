# Add Demo Bloodwork Generation

Add the ability to seed the demo account with realistic bloodwork, modeling **iron-deficiency anemia** (and elevated cholesterol) that **improves over three lab draws** — as if the demo user was diagnosed and successfully treated.

Note: cholesterol is a *lipid panel* value, not part of a CBC. So each lab draw will contain three sections — **CBC**, **Iron Panel**, and **Lipid Panel** — which mirrors how a single blood draw is reported.

## What the user will see

A new **Bloodwork** checkbox in the "Populate Demo Data" dialog (on by default). When run, the demo account gets a "Bloodwork" log type on the Custom page with 3 dated panels. Trends/analyte charts will show hemoglobin, ferritin, iron, MCV, LDL, etc. moving from clearly abnormal toward normal.

## The three lab draws (improving over the date range)

Placed at roughly 85, 45, and 7 days before "today" (clamped inside the selected range). Each includes flags (Low/High) computed against reference ranges.

```text
                     Draw 1 (worst)   Draw 2 (better)   Draw 3 (near normal)   Ref range
CBC
  Hemoglobin            10.2 L           11.8 L            14.1                 13.5–17.5 g/dL
  Hematocrit            32 L             37 L              43                   41–53 %
  RBC                   4.1 L            4.4 L             4.9                  4.5–5.9 M/uL
  MCV                   74 L             79 L              86                   80–100 fL
  MCH                   23 L             25.5 L            29                   27–33 pg
  MCHC                  31 L             32.5             33.5                  32–36 g/dL
  RDW                   17.5 H           15.5 H            13.8                 11.5–14.5 %
  Platelets            420 H            360               300                   150–400 K/uL
  WBC                   6.2              6.0               5.8                  4.0–11.0 K/uL
Iron Panel
  Iron                  28 L             52 L              95                   65–175 ug/dL
  TIBC                 450 H            410 H             360                   250–400 ug/dL
  Iron Saturation       6 L             13 L              26                   20–50 %
  Ferritin              8 L             22 L              65                   30–400 ng/mL
  Transferrin          380 H            340              300                   200–360 mg/dL
Lipid Panel
  Total Cholesterol    245 H            218 H            185                   <200 mg/dL
  LDL Cholesterol      172 H            138 H            105 H                 <100 mg/dL
  HDL Cholesterol       38 L             44               52                   >40 mg/dL
  Triglycerides        210 H            165 H            120                   <150 mg/dL
```

## Technical implementation

All changes are in the demo populator; no schema changes.

**1. `supabase/functions/populate-demo-data/index.ts`**
- Import `canonicalize` from `../_shared/bloodwork-canonical.ts` to derive `canonical_key` / `display_name` per analyte (same path the real parser uses, so trends line up).
- Define the three draws as data (analyte name, value, unit, ref low/high, section). A small helper computes the `flag` ("Low"/"High"/null) from value vs. reference range.
- Add `generateBloodwork` to `PopulationParams`, `RequestParams`, the defaults block (`?? false` server-side, dialog sends `true`), and the logging.
- New `generateBloodworkData(demoUserId, serviceClient, startDate, endDate)` function that:
  - Clears the demo user's existing `bloodwork_results`, then `bloodwork_panels`, then any prior `Bloodwork` `custom_log_types` row.
  - Creates the `Bloodwork` log type: `{ name: 'Bloodwork', value_type: 'panel', sort_order: <next> }`.
  - For each draw: inserts a `bloodwork_panels` row with `parse_status: 'success'`, `collected_date`, `panel_title` (e.g. "Complete Blood Count + Iron + Lipid Panel"), and a placeholder `storage_path` (column is NOT NULL) like `demo/bloodwork-<date>.pdf`. No file is uploaded — the "view original" link simply no-ops via the existing `getSignedUrl` null path.
  - Inserts `bloodwork_results` rows for that panel with `section_order`/`result_order`, `panel_section` ("CBC" / "Iron Panel" / "Lipid Panel"), `numeric_value`, `unit`, `reference_low/high`, a `reference_raw` string, and `flag`.
- Call `generateBloodworkData(...)` from `doPopulationWork` when `generateBloodwork` is set, and include a `bloodworkPanels` count in the summary.

**2. `src/hooks/usePopulateDemoData.ts`**
- Add `generateBloodwork?: boolean` to `PopulateDemoDataParams` and pass it through; add `bloodworkPanels?: number` to `PopulateSummary`.

**3. `src/components/PopulateDemoDataDialog.tsx`**
- Add `generateBloodwork` state (default `true`) and a "Bloodwork" checkbox next to the others.
- Include it in `nothingSelected`, the submit `params`, and the result summary list ("Created N bloodwork panels").

## Notes / trade-offs
- Placeholder `storage_path` means the "view original document" icon does nothing for demo panels (already handled gracefully — no error). If you'd prefer, I can additionally generate and upload a simple text/PDF report so that link works; left out to keep scope tight.
- Reference ranges use standard adult-male values to match the demo profile's weight range.
