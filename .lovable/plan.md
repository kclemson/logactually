In `src/components/BloodworkPanelGroup.tsx` (line 158-160), drop the unit suffix from the displayed value so each result shows just the number, with the reference range alongside for context.

Change:
```
`${r.numeric_value}${r.unit ? ` ${r.unit}` : ''}`
```
to:
```
`${r.numeric_value}`
```

Non-numeric fallbacks (`reference_raw`, `—`) and the H/L flag remain unchanged. Units are still preserved in the database and detail views — only hidden in this summary list.