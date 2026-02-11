

## Three Small Tweaks to Calorie Burn Settings

### 1. Remove the Flame icon from the Settings row
The Flame icon before "Calorie Burn Estimates" in Settings doesn't match the other items at that level (Theme, Daily Calorie Target, Show Exercise, Weight Units -- none have icons). Remove the icon and the wrapping `flex items-center gap-2` div so the label matches the siblings.

**File:** `src/pages/Settings.tsx` (lines 255-257)
- Remove the `Flame` icon import (line 2)
- Change the label wrapper from `<div className="flex items-center gap-2"><Flame .../><p ...>` to just `<p className="text-xs text-muted-foreground">`

### 2. Rename toggle text to "Show estimated calorie burn"
Update the toggle label string in `CalorieBurnDialog` from "Show calorie burn estimates" to "Show estimated calorie burn".

**File:** `src/components/CalorieBurnDialog.tsx` (line 113)
- Change the `<p>` text from "Show calorie burn estimates" to "Show estimated calorie burn"

### 3. Default the toggle to enabled when dialog opens
When the user clicks the Settings entry point to open the dialog for the first time (feature not yet enabled), automatically enable `calorieBurnEnabled` so the dialog shows all the configuration fields immediately. This only fires when the dialog opens while the feature is currently off.

**File:** `src/components/CalorieBurnDialog.tsx`
- In the dialog's `onOpenChange` handler (or a wrapper around the open action in Settings), call `updateSettings({ calorieBurnEnabled: true })` when the dialog is being opened and `calorieBurnEnabled` is currently `false`.

### Technical Details

**Settings.tsx changes:**
- Remove `Flame` from the lucide-react import
- Simplify the label markup at lines 254-258 to just `<p className="text-xs text-muted-foreground">Calorie Burn Estimates</p>`

**CalorieBurnDialog.tsx changes:**
- Line 113: `"Show calorie burn estimates"` becomes `"Show estimated calorie burn"`
- Add logic so that when `open` transitions to `true` while `settings.calorieBurnEnabled` is `false`, it calls `updateSettings({ calorieBurnEnabled: true })`. This can be done by wrapping the `onOpenChange` in Settings.tsx: when opening, also enable the setting. This avoids adding an effect inside the dialog.

