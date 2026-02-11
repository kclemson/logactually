

## Add lbs/kg Unit Toggle to Body Weight Row

### What changes

Replace the static weight unit label (`lbs` or `kg`) next to the body weight input with an interactive toggle (matching the height row's `ft`/`cm` toggle). The default selection comes from the user's app-wide `weightUnit` setting, but they can switch locally within the dialog. The stored value remains `bodyWeightLbs` (in lbs) -- only the display/input conversion changes.

### Technical details

**`src/components/CalorieBurnDialog.tsx`**:

1. Add a local state `bodyWeightUnit` initialized from `settings.weightUnit` (either `'lbs'` or `'kg'`).

2. Replace `displayWeight()` and `handleWeightChange` to use `bodyWeightUnit` instead of `settings.weightUnit`:
   - Display: convert stored `bodyWeightLbs` to the local unit for display
   - Input: convert user entry back to lbs for storage

3. Add `handleBodyWeightUnitChange(unit)` that:
   - Converts the current displayed value from old unit to new unit (using the display value, same pattern as height)
   - Updates `bodyWeightUnit` state

4. Replace the static `<span>{settings.weightUnit}</span>` with the same toggle button pattern used for height:
   ```tsx
   <div className="flex gap-0.5">
     {(['lbs', 'kg'] as const).map((unit) => (
       <button
         key={unit}
         onClick={() => handleBodyWeightUnitChange(unit)}
         className={cn(
           "text-xs px-1.5 py-0.5 rounded transition-colors",
           bodyWeightUnit === unit
             ? "bg-primary/10 text-foreground font-medium"
             : "text-muted-foreground hover:text-foreground"
         )}
       >
         {unit}
       </button>
     ))}
   </div>
   ```

No changes to `useUserSettings.ts` or the database -- this is purely a local display concern within the dialog. The app-wide `weightUnit` setting remains unchanged.

### Files changed
- `src/components/CalorieBurnDialog.tsx` -- add local `bodyWeightUnit` state, unit toggle buttons, and conversion logic
