

## Click-to-edit saved charts, edit mode for deletes, and rename dialog

### Summary

Three changes bundled together:

1. **Rename `CreateChartDialog` to `CustomChartDialog`** -- reflects that it now handles both creation and editing
2. **Click a saved chart to open the refinement dialog** -- pre-populated with the original prompt, chart, and AI note
3. **Edit mode toggle for delete icons** -- a single pencil icon in the "My Charts" header toggles delete icon visibility on each chart

---

### Changes by file

**1. Rename: `src/components/CreateChartDialog.tsx` -> `src/components/CustomChartDialog.tsx`**

- Rename the file
- Rename the exported components: `CreateChartDialog` -> `CustomChartDialog`, `CreateChartDialogInner` -> `CustomChartDialogInner`
- Add optional `initialChart` prop: `{ id: string; question: string; chartSpec: ChartSpec }`
- When `initialChart` is provided:
  - Initialize `currentSpec`, `lastQuestion`, and `messages` from the saved chart
  - Dialog title shows "Edit Chart" instead of "Create Chart"
  - "Save to Trends" button calls `updateMutation` (overwrite existing) instead of `saveMutation`
- "Start over" clears all state; subsequent save creates a new chart via `saveMutation`
- Interface becomes:
  ```typescript
  interface CustomChartDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    period: number;
    initialChart?: { id: string; question: string; chartSpec: ChartSpec };
  }
  ```

**2. `src/hooks/useSavedCharts.ts`** -- Add `updateMutation`

```typescript
const updateMutation = useMutation({
  mutationFn: async ({ id, question, chartSpec }) => {
    const { error } = await supabase
      .from("saved_charts")
      .update({ question, chart_spec: chartSpec })
      .eq("id", id);
    if (error) throw error;
  },
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-charts"] }),
});
```

Return `updateMutation` alongside the existing exports.

**3. Database migration** -- Add UPDATE RLS policy

```sql
CREATE POLICY "Users can update own saved charts"
ON public.saved_charts FOR UPDATE
USING (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));
```

**4. `src/pages/Trends.tsx`** -- Wire up editing and edit mode

- Update import: `CreateChartDialog` -> `CustomChartDialog`
- Add state:
  - `editingChart: { id: string; question: string; chartSpec: ChartSpec } | null`
  - `isEditMode: boolean` (default false)
- "My Charts" section header gets a pencil icon button that toggles `isEditMode`
- Each saved chart becomes clickable (opens `CustomChartDialog` with `initialChart` set)
- `DeleteConfirmPopover` only renders when `isEditMode` is true
- Remove direct `onNavigate` from saved charts (navigation happens via the chart inside the dialog instead)
- Render `CustomChartDialog` with `initialChart` when `editingChart` is set; on close, clear `editingChart`

---

### UX flow

1. **Default view**: Saved charts render cleanly, no delete icons visible
2. **Tap pencil icon** in "My Charts" header: Delete icons appear on each chart
3. **Tap a chart**: Opens the dialog showing the original prompt, rendered chart, AI note, and a refine input
4. **Refine**: Type a follow-up (e.g. "make it a line chart"), hit Refine -- generates updated chart
5. **Save**: Overwrites the existing saved chart
6. **Start over**: Clears state; saving after this creates a new chart
7. **Close dialog**: Discards unsaved changes

### What stays the same

- Built-in charts are untouched
- The `DynamicChart` component and `useChartInteraction` hook are unchanged
- Existing saved charts without `dataSource`/`rawDate` still render (just without click-to-navigate inside the dialog)

