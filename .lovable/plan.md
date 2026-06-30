# One-time bloodwork backfill (unit-aware) + regression guard

## What I found (the links)
Backfill must key the CBC differential by **unit**, not by the misleading label. Verified against your 385 rows; no new collisions introduced.

### Series that MERGE (multiple labels → one trend)
**Differential — percentages (unit %):**
- Basophils % ← `% Basophils`, `Basos`
- Eosinophils % ← `% Eosinophils`, `Eos`
- Lymphocytes % ← `% Lymphocytes`, `Lymphs`
- Monocytes % ← `% Monocytes`, `Monocytes %` *(the % rows)*
- Neutrophils % ← `% Neutrophils`, `Neutrophils %` *(the % rows)*

**Differential — absolute counts (unit 10*3/uL):**
- Basophils (Absolute) ← `Baso (Absolute)`, `Basophils %` *(10*3/uL)*
- Eosinophils (Absolute) ← `Eos (Absolute)`, `Absolute Eosinophil Count`
- Lymphocytes (Absolute) ← `Lymphs (Absolute)`, `Absolute Lymphocyte Count`
- Monocytes (Absolute) ← `Monocytes (Absolute)`, `Monocytes %` *(10*3/uL)*
- Neutrophils (Absolute) ← `Neutrophils (Absolute)`, `Neutrophils %` *(10*3/uL)*

**Non-differential merges:**
- Iron ← `Iron`, `Iron, SRM`
- Alkaline Phosphatase ← `Alkaline Phosphatase`, `Alkaline Phosphatase (Total)`
- ALT ← `ALT`, `ALT (Beckman)`
- AST ← `AST`, `AST (Beckman)`
- Bilirubin (Total) ← `Bilirubin (Total)`, `Total Bilirubin (Beckman)`
- Total Protein ← `Total Protein`, `Total Protein (Beckman)`
- eGFR ← `eGFR`, `eGFR by CKD-EPI 2021`
- RDW ← `RDW`, `RDW-CV`

### Single-label re-keys (cleaner identity; Option 3 keeps dried-blood separate)
- LDL Cholesterol ← `LDL Chol Calc (NIH)`
- Cholesterol/HDL Ratio ← `T. Chol/HDL Ratio`
- CO2 ← `Carbon Dioxide, Total`
- Folate ← `Folate, SRM`
- Bilirubin (Direct) ← `Direct Bilirubin (Beckman)`
- Total Cholesterol (Dried Blood) ← `Cholesterol, Total, Dried Bld`
- HDL Cholesterol (Dried Blood) ← `HDL Cholesterol, Dried Blood`
- LDL Cholesterol (Dried Blood) ← `LDL Chol Cal(NIH),DB`
- Triglycerides (Dried Blood) ← `Triglyceride, Dried Blood`
- Hemoglobin A1c (Dried Blood) ← `Hemoglobin A1c, Dried Blood`
- Est. Average Glucose (Dried Blood) ← `Est Avg Glu (eAG),DB`

### Notably FIXED by this pass
`Basophils %` (1 row), `Monocytes %` (2 rows), `Neutrophils %` (2 rows) at unit `10*3/uL` are currently mislabeled as percentages — they move to the correct `_abs` series, cleaning the percentage trends.

### Left untouched (out of dictionary scope)
`Immature Granulocytes` and `Nucleated RBC` (% vs absolute share one slug key today; all values ≈0, so trends are unaffected). Can be addressed separately if you want.

## Part 1 — Backfill existing rows (data update)
Run one unit-aware `UPDATE` on `bloodwork_results` via the data tool. Logic:
- Compute a unit class: `abs` when unit matches `uL | 10*3 | 10E3 | 10*9 | K/ | /L`, `pct` when unit is `%`.
- For any differential label (baso/eos/lymph/mono/neut), set `canonical_key` to the `_pct` or `_abs` sibling based on unit class, and `display_name` to that series' canonical name.
- For the non-differential old keys listed above, map via a fixed `old_key → new_key/display` table.
- All other rows untouched.

Re-run the collision and before/after distinct-series checks to confirm the result matches this plan.

## Part 2 — Stop future uploads from re-breaking it (code + tests)
Without this, the next Lab-A upload re-mislabels `Neutrophils %` (absolute) as a percentage.
- Make `canonicalize` unit-aware: add an optional `unit` argument. When a name resolves to a CBC differential percent/absolute pair, let the unit class pick the `_pct` vs `_abs` sibling (overriding the name when they disagree, e.g. `Neutrophils %` + `10*3/uL` → `neutrophils_abs`).
- Update the two callers to pass the parsed unit: `supabase/functions/parse-bloodwork/index.ts` and `src/hooks/useBloodworkPanels.ts` (keep the `_shared` and `src/lib` dictionary copies identical).
- Extend `bloodwork-canonical.test.ts` with unit-disambiguation cases (same label, both units → different keys) and add the leading-`%` synonyms so name-only resolution still works when no unit is present.

## Verification
- After the update: distinct `(display_name, canonical_key)` matches the link groups above; per-panel collision count unchanged (4 pre-existing, ≈0-value only).
- `bunx vitest run src/lib/bloodwork-canonical.test.ts` green.
- Spot-check a merged trend (e.g. Iron, Neutrophils %) in the analyte popover shows a single continuous series.
