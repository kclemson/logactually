## Goal

Let the user upload a bloodwork document (PDF or image, any visual layout), parse it into a dated panel with grouped analyte/value/unit rows, persist the original file, and chart per-analyte trends through the existing custom-log infrastructure.

## Custom log type model

Add a new `value_type = 'panel'` to `custom_log_types`. Surface it in the existing dropdown in `CreateLogTypeDialog` as **"Document upload"** — same entrypoint as any other custom log, no special UI path. The user can name it whatever they want ("Bloodwork", "Lab Results"); the type just declares "entries are uploaded documents that get parsed into named numeric values".

## Schema

**`bloodwork_panels`** (one row per uploaded document):
- `id`, `user_id`, `log_type_id`
- `collected_date` (the date the labs were drawn — drives all trends)
- `panel_title` (full document title for display, e.g. "CBC With Differential/Platelet; Iron and TIBC; Ferritin")
- `storage_path`, `source_mime_type`, `source_filename`
- `raw_extraction` jsonb (full unmodified AI output, kept for debugging + future verify UI)
- `parse_status` text ('pending' | 'success' | 'failed'), `parse_error` text nullable
- `created_at`, `updated_at`

**`bloodwork_results`** (one row per analyte value):
- `id`, `user_id`, `panel_id` (cascade delete with panel), `collected_date` (denormalized for fast trend queries)
- `panel_section` text — the heading the value appeared under in the document ("Lipid Panel", "Iron and TIBC", "CBC With Differential/Platelet"). Drives UI grouping.
- `section_order` int, `result_order` int — preserve printed order within section
- `analyte_name` text (raw, as printed: "Iron Bind.Cap.(TIBC)")
- `canonical_key` text (`tibc`, `ldl_cholesterol`, `ferritin`) — the trend identity
- `display_name` text ("TIBC", "LDL Cholesterol", "Ferritin")
- `numeric_value` numeric, `unit` text
- `reference_low` numeric, `reference_high` numeric, `reference_raw` text (for non-numeric refs like "Not Estab.")
- `flag` text nullable (H/L/Abnormal if the lab marked it)

Index: `bloodwork_results(user_id, canonical_key, collected_date)` — primary trend query path.

RLS on both tables: `auth.uid() = user_id` for SELECT; INSERT/UPDATE/DELETE additionally `NOT is_read_only_user(auth.uid())`, matching existing custom-log tables.

## File storage

New private bucket `bloodwork-files`. Storage RLS: read/write only inside `${auth.uid()}/`. Client uploads directly; DB stores `storage_path`. View opens a signed URL in a new tab.

## Parsing pipeline

New edge function `parse-bloodwork`:

1. Client uploads file to bucket → gets `storage_path`.
2. Client inserts a `bloodwork_panels` row with `parse_status='pending'` and the storage path, then calls the function with the panel id.
3. Function downloads the file with the service role, base64-encodes, sends to `google/gemini-2.5-pro` via the AI gateway with a structured **tool call** (not "return JSON"). Tool name `extract_bloodwork`, parameters:
   ```
   { collected_date: string (YYYY-MM-DD),
     panel_title: string,
     sections: [{
       section_title: string,
       results: [{ analyte_name, numeric_value, unit,
                   reference_low?, reference_high?, reference_raw?, flag? }]
     }] }
   ```
   System prompt stays general (per project's semantic-prompting rule): extract every visible result, preserve units and section headings as printed, leave fields blank rather than guess. No enumerated analyte list, no per-lab heuristics.
4. **Canonicalization pass** in the same function: a small lookup table in `supabase/functions/_shared/bloodwork-canonical.ts` mapping synonyms to a canonical key + display name (~80 common analytes — LDL/HDL/total cholesterol/triglycerides, ferritin/iron/TIBC/UIBC/iron saturation, full CBC, A1C, TSH/free T4/free T3, AST/ALT, glucose, etc.). Unknown analytes get a slug of the raw name (`iron_bind_cap_tibc`) plus the raw display — they still chart immediately, just won't merge with other labs' wording until a synonym is added.
5. Bulk-insert `bloodwork_results`, flip the panel to `parse_status='success'` with `raw_extraction` saved. On failure: retry once with `openai/gpt-5` (matches existing AI fallback pattern), and if that also fails, set `parse_status='failed'` with the error message so the user sees it in the UI.
6. Standard 402/429 surfacing to client.

## UI

- **Per-type input row**: when `value_type === 'panel'`, the input renders a file picker (accept `.pdf,image/*`) + spinner state ("Reading your labs…"). Same row layout as numeric/medication rows.
- **Per-day log row** (collapsed): `[date] · {type name} · N results · 📎 view`. Trash icon for delete (cascades to results + storage object).
- **Per-day log row** (expanded): results listed grouped by `panel_section` in printed order, each row showing `display_name · value unit · ref range · flag`. Section headings act as visual dividers.
- **View original**: "view" link opens a fresh signed URL in a new tab.
- **Failed parse state**: collapsed row shows "⚠ Couldn't parse — tap to retry"; tapping re-invokes the function against the same `storage_path`.
- **Trends**: a thin adapter exposes each `canonical_key` in `bloodwork_results` as a chartable series for the existing custom-log trend builder. "Ferritin over time" works out of the box once two panels exist.

## Out of scope for step 1
- Inline verify-against-original UI (data captured in `raw_extraction` so we can build it later without re-parsing).
- AI-driven canonicalization (lookup map only).
- Out-of-range alerting beyond storing `flag`.
- Demo data for the new type.

## Technical notes
- New edge function: `supabase/functions/parse-bloodwork/index.ts` + shared canonical map in `supabase/functions/_shared/bloodwork-canonical.ts`.
- New hooks: `useBloodworkPanels` (per-day + per-type, optimistic delete mirroring `useCustomLogEntriesForType`).
- New components: `BloodworkUploadRow`, `BloodworkPanelEntry` (the per-day expanded grouped view).
- `CreateLogTypeDialog`: add a third radio option "Document upload" → `value_type='panel'`.
- Number coercion (`Number(v)`) on every numeric field at ingest.
- Memory entry after build: `mem://features/bloodwork-panel-system` documenting the panel/results split, section grouping, canonical-key trend strategy, and the synonym-map vs exercise-catalog distinction.
