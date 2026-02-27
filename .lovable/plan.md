

## Plan: Reusable typeahead suggestions for LogInput

Build the typeahead as a generic, mode-agnostic system that plugs into `LogInput` — the shared input component already used by both FoodLog and WeightLog.

### Architecture

```text
LogInput (shared)
  ├── Textarea
  ├── TypeaheadSuggestions (new, generic)  ← renders dropdown
  └── Button row

useTypeaheadSuggestions (new, generic)
  ├── accepts: text, candidates[], getText(candidate), getKey(candidate)
  └── returns: ranked matches[]
```

The hook and component know nothing about food or exercise — they operate on a generic `TypeaheadCandidate` interface. Each page (FoodLog, WeightLog) maps its domain data into this generic shape.

### Generic interface

```typescript
interface TypeaheadCandidate {
  id: string;              // unique key for dedup
  label: string;           // display text (e.g. "Egg McMuffin" or "Bench Press 4x8")
  searchText: string;      // text to match against (raw_input + item descriptions)
  subtitle?: string;       // secondary info (e.g. "320 cal" or "3 sets")
  timestamp: string;       // ISO date for recency ranking
  frequency?: number;      // pre-computed by caller if desired
  payload: unknown;        // opaque data passed back on selection
}
```

### New files

1. **`src/hooks/useTypeaheadSuggestions.ts`** — generic hook
   - Accepts `text: string` and `candidates: TypeaheadCandidate[]`
   - Debounces text (300ms) internally via a ref + setTimeout pattern
   - Filters at ≥ 3 chars using `extractCandidateFoodWords` generalized to just word extraction + `hybridSimilarityScore`
   - Deduplicates by `id`, ranks by `similarity × recency × frequency`
   - Returns top 5 matches

2. **`src/components/TypeaheadSuggestions.tsx`** — generic dropdown component
   - Receives `matches: TypeaheadCandidate[]` and `onSelect(candidate)`
   - Renders below textarea: muted background, small text, each row shows `label`, `subtitle`, relative time
   - Dismisses on Escape, blur, or empty matches
   - Keyboard nav (arrow keys + Enter) for desktop

### Modified files

3. **`src/components/LogInput.tsx`**
   - Add optional props: `typeaheadCandidates?: TypeaheadCandidate[]`, `onSelectTypeahead?: (candidate: TypeaheadCandidate) => void`
   - Wire `useTypeaheadSuggestions(text, typeaheadCandidates)` internally
   - Render `TypeaheadSuggestions` between textarea and button row
   - Hide when `isBusy`

4. **`src/pages/FoodLog.tsx`** (first consumer)
   - Map `recentEntries` → `TypeaheadCandidate[]` using a `useMemo`
   - Deduplicate by `createItemsSignature` — group identical meals, track frequency + most recent date
   - Label = first item description (or group name), subtitle = total calories
   - `onSelectTypeahead` → call `createEntryFromItems` with the payload's food items (bypasses AI)

### Future: WeightLog integration (not in this PR)

WeightLog will follow the same pattern:
- Map `recentWeightEntries` → `TypeaheadCandidate[]` keyed by exercise signature
- Label = exercise description, subtitle = sets/reps summary
- `onSelectTypeahead` → create weight entry directly

### UX details

- Dropdown appears inline below textarea, above the button row
- Muted styling: `bg-muted/50 border rounded-md shadow-sm`, small text
- Each row: label (truncated), subtitle (muted), relative time ("2d ago")
- No dropdown when loading/analyzing or text < 3 chars
- Tap/Enter selects, Escape dismisses

