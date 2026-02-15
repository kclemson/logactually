

# Fix Label Color Consistency in Calorie Burn Dialog

## Problem

The Calorie Burn dialog uses white (`text-sm`) labels for "Body weight", "Height", "Age", "Metabolic profile", and "Default intensity", while the Calorie Target dialog and Settings page use gray (`text-muted-foreground`) labels. The interactable controls (inputs, dropdowns, toggles) should be the white/prominent elements, not the labels.

## Changes

### `src/components/BiometricsInputs.tsx`

Change label styling on all four rows from `text-sm` to `text-xs text-muted-foreground`:

- Line 151: `"Body weight"` -- change `text-sm` to `text-xs text-muted-foreground`
- Line 186: `"Height"` -- change `text-sm` to `text-xs text-muted-foreground`
- Line 220: `"Age"` -- change `text-sm` to `text-xs text-muted-foreground`
- Line 240: `"Metabolic profile"` -- change `text-sm` to `text-xs text-muted-foreground`

### `src/components/CalorieBurnDialog.tsx`

- Line 228: `"Default intensity"` -- change `text-sm` to `text-xs text-muted-foreground`

This makes both dialogs consistent with the gray-label pattern used across Settings and the Calorie Target dialog.
