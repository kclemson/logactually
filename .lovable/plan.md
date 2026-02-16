

# Equation Section Refinements

## Changes to `src/components/CalorieTargetDialog.tsx`

### 1. Match font styling to input labels
The input labels (Body weight, Height, Age, etc.) use `text-xs text-muted-foreground`. The equation section currently uses `text-[10px]` which is smaller. Change the equation block to use `text-xs text-muted-foreground` to match.

### 2. Remove indentation, left-align with labels
Remove the `bg-muted/50 rounded py-1.5 px-2` wrapper styling that creates a visually indented box. The equations should sit flush-left like the other label rows above them.

### 3. Drop the `f()` notation
Instead of `f(150 lbs, 5'1", 48 years, Female) = ~1,248`, just list the inputs naturally separated by commas and show the result:
```
150 lbs, 5'1", 48 years, Female = ~1,248
```

### 4. Remove leading `=` from equations
The second line of each equation currently starts with `= `. Remove that so it reads naturally:
```
1,248 x 1.375 - 0 deficit = 1,716 cal/day
```

### 5. Hide "Average" profile from equation
When `bodyComposition` is null (Average), omit it from the BMR equation entirely since it's the default and doesn't add information. Only show "Male" or "Female" when explicitly selected.

### 6. Fix unit reactivity bug
The `equationData` memo depends on `settings` but the weight display uses `settings.weightUnit` which is correct. However, the `BiometricsInputs` component has a local `bodyWeightUnit` state that can diverge from `settings.weightUnit`. The equation should read from `settings.weightUnit` directly (which it already does in the memo). The issue is that the BiometricsInputs unit toggle only updates local state, not `settings.weightUnit`. We need to update `BiometricsInputs` to also persist the weight unit change to settings via `updateSettings({ weightUnit: unit })` when toggled.

### File changes

**`src/components/CalorieTargetDialog.tsx`** (lines 247-268):
- Remove `bg-muted/50 rounded py-1.5 px-2` wrapper
- Change `text-[10px]` to `text-xs`
- Remove `f(` and `)` from BMR line
- Remove leading `= ` from equation lines
- Skip profile display when `bodyComposition` is null

**`src/components/BiometricsInputs.tsx`** (line 93):
- Add `updateSettings({ weightUnit: unit })` inside `handleBodyWeightUnitChange` so changing the weight unit toggle persists to settings and triggers the equation memo to recompute with the correct unit.

