

## Reorganize Preferences Section Layout

### Overview
Reorder the preferences items and update the layout so each setting displays as a row with the label on the left and controls on the right.

---

### Changes

| Change | Description |
|--------|-------------|
| Reorder items | Move "Show Weights" above "Weight Units" |
| Update layout | Each preference becomes a flex row with `justify-between` |

---

### New Layout Structure

Each preference row will use:
```
flex items-center justify-between
```
- Label on left
- Controls on right

---

### Order After Change
1. Theme (with 3 buttons right-aligned)
2. Show Weights (toggle right-aligned)
3. Weight Units (conditionally shown when weights enabled, 2 buttons right-aligned)

---

### Implementation

**File:** `src/pages/Settings.tsx` (lines 223-283)

```tsx
{/* Preferences - theme and units */}
<CollapsibleSection title="Preferences" icon={Settings2} storageKey="settings-preferences">
  <div className="space-y-4">
    {/* Theme */}
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">Theme</p>
      <div className="flex gap-2">
        {themeOptions.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => handleThemeChange(value)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 transition-colors",
              mounted && theme === value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="text-sm">{label}</span>
          </button>
        ))}
      </div>
    </div>
    
    {/* Show Weights - MOVED UP, now before Weight Units */}
    {showWeightsFeature && (
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Show Weights</p>
        <button
          onClick={() => updateSettings({ showWeights: !settings.showWeights })}
          className={cn(
            "w-12 h-6 rounded-full transition-colors relative border",
            settings.showWeights ? "bg-primary border-primary" : "bg-muted border-border"
          )}
        >
          <span
            className={cn(
              "absolute left-0 top-0.5 w-5 h-5 rounded-full shadow transition-transform",
              settings.showWeights 
                ? "translate-x-6 bg-primary-foreground" 
                : "translate-x-0.5 bg-white"
            )}
          />
        </button>
      </div>
    )}
    
    {/* Weight Units - now after Show Weights */}
    {showWeights && (
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Weight Units</p>
        <div className="flex gap-2">
          {weightUnitOptions.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleWeightUnitChange(value)}
              className={cn(
                "flex items-center justify-center rounded-lg border px-3 py-2 transition-colors",
                settings.weightUnit === value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
              )}
            >
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
</CollapsibleSection>
```

---

### Key Layout Changes
- Each row: `flex items-center justify-between` — label left, controls right
- Removed `mb-2` from labels since they're now inline with controls
- Removed `max-w-xs` and `max-w-[160px]` constraints — buttons flow naturally on the right
- Removed `flex-1` from theme buttons so they don't stretch unnecessarily

