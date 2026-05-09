## Problem

When a user manually edits a saved custom chart's title or note (via the inline-editable header/footer) and then re-opens the chart in the edit dialog, both fields revert to their auto-generated defaults. The values still exist in the DB (`saved_charts.chart_spec.title` / `saved_charts.chart_spec.aiNote`) — they just aren't threaded into the builder's preview.

## Root cause

`CustomChartDialog` opens with one of two builders:

- `SingleChartBuilder` (`src/components/SingleChartBuilder.tsx`)
- `CompareChartBuilder` (`src/components/CompareChartBuilder.tsx`)

Both receive `initialDsl` (and `initialDsl2`) so form fields restore correctly, but neither receives the saved `chartSpec.title` or `chartSpec.aiNote`. On mount, both run `handleGenerate()`, which builds a fresh `ChartSpec` via `executeDSL` — that produces an auto-built `title` from `buildQuestion()` / `humanizeMetric(metric)`, and no `aiNote` at all. The user's saved metadata is overwritten before the preview renders, and (worse) gets persisted as the auto-generated value if they hit Save without re-typing.

## Fix

Thread the saved `chartSpec.title` and `chartSpec.aiNote` into each builder and re-apply them after every preview generation. Local `customTitle` / `customNote` state lets subsequent inline edits in the dialog work as today.

### Change 1 — `src/components/SingleChartBuilder.tsx`

1. Add `initialTitle?: string` and `initialNote?: string` to `SingleChartBuilderProps`.
2. Add state:
   - `const [customTitle, setCustomTitle] = useState<string | undefined>(initialTitle);`
   - `const [customNote, setCustomNote] = useState<string | undefined>(initialNote);`
3. In `handleGenerate`, after building `spec`:
   - `if (customTitle) spec.title = customTitle;`
   - `if (customNote) spec.aiNote = customNote;`
4. Update the inline-edit handlers (lines 314–315) to also persist to the custom state:
   - `onTitleChange={(t) => { setCustomTitle(t); setPreview(prev => prev ? { ...prev, title: t } : null); }}`
   - `onAiNoteChange={(n) => { setCustomNote(n); setPreview(prev => prev ? { ...prev, aiNote: n } : null); }}`
5. In `handleSave`, defensively merge: `chartSpec: { ...preview, title: customTitle ?? preview.title, aiNote: customNote ?? preview.aiNote }`.

### Change 2 — `src/components/CompareChartBuilder.tsx`

Mirror the exact same pattern at the matching call sites (`mergeChartSpecs(...)` is where the `if (customTitle) merged.title = customTitle; if (customNote) merged.aiNote = customNote;` lines go).

### Change 3 — `src/components/CustomChartDialog.tsx`

At the existing builder render sites (around lines 309–310 and 330), pass:

- `initialTitle={initialChart?.chartSpec.title}`
- `initialNote={initialChart?.chartSpec.aiNote}`

## Why this approach

- Keeps the DSL as source-of-truth for *data* config, and `chart_spec.{title,aiNote}` as source-of-truth for *display* metadata — same separation already used at the Trends-page render layer.
- Re-generation triggered by config tweaks naturally preserves user metadata.
- No schema changes, no `executeDSL` changes.

## Out of scope

- The "ai" tab (v1 charts without DSL) — `initialChart.chartSpec` is already passed straight through there, so this bug is specific to the v2 builder paths.
- No backend, RLS, or DSL changes.