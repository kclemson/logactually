

# Calorie target tooltip improvements — COMPLETED

All items implemented:
1. ✅ Threshold constants extracted (`DAILY_GREEN_MAX`, `DAILY_AMBER_MAX`, `ROLLUP_GREEN_MAX`, `ROLLUP_AMBER_MAX`)
2. ✅ Daily/weekly legends interleaved in calendar tooltip (`CalorieTargetTooltipContent.tsx`)
3. ✅ Dot opacity fixed in tooltip header lines
4. ✅ Rollup tooltip refactored: "rolling:" replaced with interleaved "weekly:" / "30-day:" legends with intake headers and status dots

### Files changed

| File | Changes |
|------|---------|
| `src/components/CalorieTargetRollup.tsx` | Remove `RollupLegend`, interleave "weekly:" and "30-day:" legends with their respective math blocks, add intake header lines with status dots |

