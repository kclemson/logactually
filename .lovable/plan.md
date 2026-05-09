Collapse all chart builder save button labels to plain "Save":

- **`src/components/SingleChartBuilder.tsx`** (line 334): `Save to Trends` → `Save`
- **`src/components/CompareChartBuilder.tsx`** (line 340): `Save to Trends` → `Save`
- **`src/components/CustomChartDialog.tsx`** (line 536): replace conditional `editingIdRef.current ? "Save Changes" : "Save to Trends"` with just `"Save"`

No logic changes, label only.