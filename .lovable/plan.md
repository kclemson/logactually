

## Surgical Extraction: `CompactChartTooltip`

### What

Extract the duplicated `CompactTooltip` component into a shared file named `CompactChartTooltip`, then write isolated unit tests.

### Steps

1. **Create `src/components/trends/CompactChartTooltip.tsx`**
   - Move the component from `FoodChart.tsx` (lines 80-139)
   - Rename to `CompactChartTooltip` (component and props interface)
   - Export both the component and `CompactChartTooltipProps`

2. **Update `src/components/trends/FoodChart.tsx`**
   - Remove the local `CompactTooltip` definition and its `CompactTooltipProps` interface (~60 lines)
   - Import `CompactChartTooltip` from the new file
   - Update all three usages (FoodChart, StackedMacroChart, VolumeChart) to reference the new name

3. **Update `src/pages/Trends.tsx`**
   - Remove the local `CompactTooltip` definition and its `CompactTooltipProps` interface (~60 lines)
   - Import `CompactChartTooltip` from the new file
   - Update usages in ExerciseChart and CustomLogTrendChart to reference the new name

4. **Create `src/components/trends/CompactChartTooltip.test.tsx`**
   - Renders nothing when `active` is false or `payload` is empty
   - Renders label and payload values when active
   - Applies `formatter` to displayed values
   - Shows total line when `totalKey` matches a key in payload data
   - Shows "Go to day" button only when `isTouchDevice` is true
   - Calls `onGoToDay` with correct date when button is clicked

5. **Run tests** to confirm nothing broke

### Net effect

- ~120 lines removed across two files (60 from each)
- One shared, tested component
- Zero behavioral changes

