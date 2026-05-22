## Goal
After a bloodwork file is parsed, show the user a richer success state inside the upload slot — including the date AND the list of panel categories that were extracted (e.g. "CBC With Differential/Platelet · Lipid Panel · Iron and TIBC"), so they can see at a glance what landed.

## Changes

### 1. `supabase/functions/parse-bloodwork/index.ts`
Include section titles in the success response. After we build `rows`, also build a deduplicated, in-order list of section titles that actually produced ≥1 result, and return it:

```ts
return new Response(JSON.stringify({
  ok: true,
  result_count: rows.length,
  collected_date: collectedDate,
  sections: <ordered unique non-null section_titles with at least one result>,
}), ...);
```

Only the success branch needs this. The `duplicate_pending` branch already returns early and doesn't apply.

### 2. `src/hooks/useBloodworkPanels.ts`
Extend the `uploadAndParse` return shape to surface the new field:

```ts
return {
  panel,
  extractedDate: fnData?.collected_date ?? null,
  sections: (fnData?.sections as string[] | undefined) ?? [],
};
```

### 3. `src/components/BloodworkUploadInput.tsx`
- Replace the single `savedTo` string with a small `saved` state object: `{ date: string | null; sections: string[] } | null` (still using `'__no_date__'` semantics by allowing `date: null`).
- In `runUpload`, on success capture both `extractedDate` and `sections`.
- Replace the current dashed upload button with a prominent success card when `saved` is set (matching the previously approved direction):
  - Left column: green check icon + `Saved to {Mon D, YYYY}` (or "Saved — no date found" fallback) in normal foreground text.
  - Below that, in muted-foreground text-xs, the section names joined by ` · ` (e.g. `CBC With Differential/Platelet · Lipid Panel · Iron and TIBC`). If `sections` is empty, omit this line.
  - Right side: a real `View →` button (default variant) that navigates to the extracted date. Hidden if no date.
  - The cancel `X` continues to dismiss without navigating.
- The upload button is only rendered while `saved` is null.

No backfill of existing panels is needed — this only affects the post-upload toast state, not stored data.

## Out of scope
- Showing per-section result counts (e.g. "Lipid Panel (6)") — keep it to category names only for now.
- Restyling the in-progress / error / duplicate states.
- Changing how categories render in `BloodworkPanelGroup` itself.