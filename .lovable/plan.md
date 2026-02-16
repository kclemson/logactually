
# Make Non-Interactive Unit Labels Gray (No Background Fill)

## Problem
Non-interactive unit labels ("years", "cal/day") currently use `bg-primary/10 text-foreground` which gives them a filled background and white/black text -- making them look like interactive elements (identical to the active state of lbs/kg and ft/cm toggles). They should instead be plain muted text with no background.

## Updated Rule
- **Interactive units** (lbs/kg, ft/cm): Keep current styling -- active state gets `bg-primary/10 text-foreground font-medium`, inactive gets `text-muted-foreground`
- **Non-interactive units** (years, cal/day): Use `text-muted-foreground` only -- no background fill, no bold, gray color

## Changes

### 1. `src/components/BiometricsInputs.tsx` (line 234)
"years" label for Age input:
- From: `text-xs px-1.5 py-0.5 rounded bg-primary/10 text-foreground`
- To: `text-xs text-muted-foreground`

### 2. `src/components/CalorieTargetDialog.tsx` (line 247)
"cal/day" label for Target deficit:
- From: `text-xs px-1.5 py-0.5 rounded bg-primary/10 text-foreground whitespace-nowrap`
- To: `text-xs text-muted-foreground whitespace-nowrap`

### 3. `src/components/CalorieTargetDialog.tsx` (line 303)
"cal/day" label for Exercise-adjusted target:
- From: `text-xs px-1.5 py-0.5 rounded bg-primary/10 text-foreground whitespace-nowrap`
- To: `text-xs text-muted-foreground whitespace-nowrap`

This matches the existing pattern used by "/10" in the Calorie Burn dialog, which already uses `text-xs text-muted-foreground` for a non-interactive unit.
