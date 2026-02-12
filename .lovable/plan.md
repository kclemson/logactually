

## Reduce Side Padding on the Trends Page Only

Rather than making the PCF charts compact (which would misalign them with other charts), we reduce the effective side padding for the entire Trends page. This keeps all charts aligned while giving more horizontal room for subtitles.

### Approach

Add a small negative horizontal margin to the Trends page root container. The Layout provides `px-3` (12px) globally. We add `-mx-1` (-4px) on the Trends page, bringing the effective padding down to 8px per side -- recovering 8px total width without touching other pages.

### Change

**File: `src/pages/Trends.tsx`** (line 693)

```
- <div className="space-y-6">
+ <div className="space-y-6 -mx-1">
```

This uniformly reduces padding for all Trends content (period buttons, Food Trends, Exercise Trends), keeping everything aligned. Combined with the existing `gap-1` on the PCF row, the subtitles should comfortably fit on one line.

