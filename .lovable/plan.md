

## Simple Fix: Remove Auto-Enable and Clear Data on Toggle-Off

### What changes

Two small edits:

1. **Settings page**: Remove the line that auto-enables calorie burn when clicking "Set up" -- the dialog's own toggle handles that.

2. **CalorieBurnDialog**: When the user toggles the feature OFF inside the dialog, clear all biometric data so it resets to a fresh "never configured" state.

### Technical details

**File: `src/pages/Settings.tsx` (lines 257-259)**

Remove the auto-enable logic so clicking "Set up" just opens the dialog:

```ts
// Before
onClick={() => {
  if (!settings.calorieBurnEnabled) {
    updateSettings({ calorieBurnEnabled: true });
  }
  setCalorieBurnDialogOpen(true);
}}

// After
onClick={() => setCalorieBurnDialogOpen(true)}
```

**File: `src/components/CalorieBurnDialog.tsx` (handleToggle, ~line 140)**

Update to clear all biometric fields when toggling off:

```ts
// Before
const handleToggle = () => {
  updateSettings({ calorieBurnEnabled: !settings.calorieBurnEnabled });
};

// After
const handleToggle = () => {
  if (settings.calorieBurnEnabled) {
    updateSettings({
      calorieBurnEnabled: false,
      bodyWeightLbs: null,
      heightInches: null,
      age: null,
      bodyComposition: null,
      defaultIntensity: null,
    });
    setHeightDisplay('');
  } else {
    updateSettings({ calorieBurnEnabled: true });
  }
};
```

Two files, minimal changes. The `heightUnit` preference (ft/cm) is preserved since it's a display preference, not personal data.

