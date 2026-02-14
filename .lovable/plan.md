

## Fix Missing "Enable Exercise Logging" Toggle

The exercise toggle in Settings (lines 243-245) currently renders just `...` instead of the actual toggle UI. The content was accidentally lost during a prior edit.

### Technical Details

Replace the empty `...` div at lines 243-245 in `src/pages/Settings.tsx` with the proper toggle, mirroring the "Enable Custom logging" toggle pattern above it:

```tsx
{/* Show Exercise toggle */}
<div className="flex items-center justify-between">
  <div>
    <p className="text-xs text-muted-foreground">Enable Exercise logging</p>
    <p className="text-[10px] text-muted-foreground/70">Track exercises with sets, reps, and weight</p>
  </div>
  <button
    onClick={() => updateSettings({ showWeights: !settings.showWeights })}
    className={cn(
      "w-12 h-6 rounded-full transition-colors relative border flex-shrink-0",
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
```

One file changed: `src/pages/Settings.tsx` (lines 243-245).

