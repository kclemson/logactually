

## Rename "Weights" to "Exercise" + Merge Import/Export Sections

### 1. Rename user-facing "Weights" labels to "Exercise"

All user-visible occurrences of "Weights" or "Weight" (where it refers to the exercise feature, not the weight-unit setting) get renamed:

| File | Current | New |
|---|---|---|
| `src/components/BottomNav.tsx` | `label: 'Weights'` | `label: 'Exercise'` |
| `src/pages/Settings.tsx` | `"Show Weights"` | `"Show Exercise"` |
| `src/pages/Settings.tsx` | `"Weights"` (export row label) | `"Exercise"` |
| `src/pages/Settings.tsx` | Comment `"weight tracking"` references | Updated comments |
| `src/pages/Help.tsx` | `"show weight in Kgs"` | `"show exercise weight in Kgs"` |
| `src/pages/Help.tsx` | `"weight lifting routine"` | `"exercise routine"` |
| `src/components/DevToolsPanel.tsx` | `<SelectItem value="weights">Weights</SelectItem>` | `...Exercise...` |

Internal variable names (`showWeights`, `weightSets`, etc.) and the URL route `/weights` stay unchanged -- this is a label-only change.

### 2. Merge "Import from Apple Health" into "Export to CSV" as a combined "Import and Export" section

**Section title**: "Export to CSV" becomes **"Import and Export"**

**Icon**: Keep `Download` (or switch to `ArrowUpDown` / `ArrowDownUp` for a combined metaphor -- `ArrowDownUp` from lucide works well).

**Layout inside the section**:

```
Import
  Apple Health     [instructions + file picker inline, gated by showExercise + !isReadOnly]

Export
  Food             [Daily Totals]  [Detailed Log]
  Exercise         [Detailed Log]   (gated by showExercise)
  (read-only msg if applicable)
```

The Apple Health import content moves from its own `CollapsibleSection` into a sub-area at the top of this combined section, separated from the export rows by a subtle border or heading.

### Files Changed

1. **`src/components/BottomNav.tsx`** -- Change nav label from `'Weights'` to `'Exercise'`
2. **`src/pages/Settings.tsx`** -- Rename labels, remove the standalone Apple Health collapsible, merge its content into the export section (now "Import and Export"), rename "Weights" export label to "Exercise"
3. **`src/pages/Help.tsx`** -- Update two help text strings
4. **`src/components/DevToolsPanel.tsx`** -- Update select item label

