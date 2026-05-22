Fix bloodwork result row alignment so all numeric values share the same left edge in their own column. No units shown.

Row layout (3 columns):
```text
test name | value [flag] | reference range
```

Changes in `src/components/BloodworkPanelGroup.tsx` (around lines 165–179):
1. Keep grid as 3 columns but make the value column left-aligned with a fixed width: `grid-cols-[1fr_3.5rem_auto]`.
2. Value cell: render `valueStr` left-aligned with `tabular-nums text-left`, with the H/L flag inline to its right (small, colored). Flag only appears when abnormal, so it sits to the right of the number without disturbing the shared left edge of values across all rows.
3. Reference range cell unchanged (muted).