## Goal
Make the bloodwork upload dialog feel less cramped and show meaningful summary info in the success state.

## Changes

### 1. `supabase/functions/parse-bloodwork/index.ts`
Change the `sections` field returned on success from `string[]` to `Array<{ title: string; count: number }>`. While building rows, track per-section counts in a `Map<string, number>` keyed by trimmed section title; when a section produces ≥1 row and we haven't seen the title before, push `{ title, count }` into the ordered list. After the loop, fill in the final counts from the map. Continue to return `result_count` and `collected_date`.

### 2. `src/hooks/useBloodworkPanels.ts`
Update `uploadAndParse` return shape:
```ts
return {
  panel,
  extractedDate: fnData?.collected_date ?? null,
  sections: (fnData?.sections as Array<{ title: string; count: number }> | undefined) ?? [],
  resultCount: (fnData?.result_count as number | undefined) ?? 0,
  filename: file.name,
};
```

### 3. `src/pages/OtherLog.tsx`
Bump the `panel` branch wrapper from `p-3` to `p-5` so the dialog donates more vertical space.

### 4. `src/components/BloodworkUploadInput.tsx`
Restructure to a vertical layout:

**Header row** (always visible): small "Bloodwork" label on the left, X dismiss on the right.

**State A — Upload (when `!saved`)**: full-width dashed dropzone, `py-8` tall, centered upload icon stacked above "Choose a PDF or image" and a muted helper line "PDF or image, up to 20MB". Busy state uses same shape with spinner + "Reading your document…".

**State B — Success (when `saved`)**: card with `p-4`:
- Primary line: green check + date (e.g. `Mar 29, 2026`) in foreground text-sm font-medium. No "Saved to" prefix. Fallback when no date: "No collection date found in document".
- Below: filename, muted-foreground text-xs, truncated with `title` attr.
- Summary line: `{resultCount} results across {sections.length} panel{s}` in muted-foreground text-xs.
- Vertical list of sections, each on its own line with a subtle bullet/dash prefix: `· CBC With Differential/Platelet (20)`. Title in foreground/80, count in muted-foreground.
- Right-aligned `View →` primary button (h-9). Hidden when no date.

State change persists `saved` as `{ date, sections, resultCount, filename } | null`. Error text gets a little top margin.

### Out of scope
- File size, page count, lab brand detection
- Clickable section titles
- Restyling duplicate-blocked dialog
- Backfilling old panels with section counts (only affects post-upload toast, not stored data)