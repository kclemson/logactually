

## Update "Your Info" Labels for Consistency

### Text changes in `src/components/CalorieBurnDialog.tsx`

**Section header:**
- Replace `Your info (narrows the range)` with just `YOUR INFO` as the uppercase header
- Add a new descriptive line below: *"These details help narrow the estimated calorie burn range."*

**Subtitles -- consistent "X effect" pattern with parenthetical scale:**

| Field | Current | New |
|-------|---------|-----|
| Body weight | `Biggest factor (~2-3x impact)` | `Largest effect (~30-50%)` |
| Height | `Used for metabolic rate` | `Moderate effect (~10-15%)` |
| Age | `~5% per decade` | `Small effect (~5% per decade)` |
| Body composition | `~5-10% difference` | `Moderate effect (~5-10%)` |

The ~30-50% for body weight comes from the actual formula: calories scale linearly with weight, and across a typical population range (130-200 lbs), that's roughly a 30-50% spread.

**Field label rename:**
- `Body composition` becomes `Metabolic profile`

### Technical details

All changes are text-only edits in `src/components/CalorieBurnDialog.tsx`:

1. Update the section header and add a descriptive sub-line
2. Update four subtitle strings in the gray text elements
3. Rename "Body composition" label to "Metabolic profile"

### Files changed
- `src/components/CalorieBurnDialog.tsx` -- text-only label updates

