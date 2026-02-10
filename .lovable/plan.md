

## Walking Chart Tweaks: Remove mph Mode + Simplify Duration Labels

### Changes

**1. Remove "mph" from Walking's chart mode cycle**

Currently, clicking the Walking chart header cycles through: time -> mph -> distance. For `exercise_subtype === 'walking'`, this will change to: time -> distance (skipping mph).

**2. Simplify duration labels for Walking**

Walking durations don't need seconds precision. The bar labels above columns will show whole-minute or h:mm format instead of decimal minutes:
- Under 60 min: `47` (just the number, since the subtitle says "time")
- 60+ min: `1:05`

This only affects the bar labels on top of columns, not the tooltip (which will continue showing full detail).

### Technical Details (single file: `src/pages/Trends.tsx`)

**A. Pass `exercise_subtype` into mode cycle logic (~line 275-283)**

The `handleHeaderClick` mode cycle will skip 'mph' when `exercise.exercise_subtype === 'walking'`:

```typescript
const isWalking = exercise.exercise_subtype === 'walking';

const handleHeaderClick = supportsSpeedToggle 
  ? () => {
      const nextMode: CardioViewMode = 
        isWalking
          ? (cardioMode === 'time' ? 'distance' : 'time')      // skip mph
          : (cardioMode === 'time' ? 'mph' : cardioMode === 'mph' ? 'distance' : 'time');
      localStorage.setItem(`trends-cardio-mode-${exercise.exercise_key}`, nextMode);
      setCardioMode(nextMode);
    }
  : undefined;
```

Also guard the initial state: if a walking chart has 'mph' saved in localStorage, fall back to 'time'.

**B. Simplify walking duration bar labels (~line 185-189)**

For walking exercises in "time" mode, format the label as whole minutes or h:mm instead of decimal:

```typescript
const cardioLabel = cardioMode === 'mph' 
  ? `${mph}` 
  : cardioMode === 'distance'
    ? `${Number(d.distance_miles || 0).toFixed(2)}`
    : isWalking
      ? formatWalkingDuration(Number(d.duration_minutes || 0))  // "47" or "1:05"
      : `${Number(d.duration_minutes || 0).toFixed(1)}`;
```

Where `formatWalkingDuration` is a small inline helper:

```typescript
function formatWalkingDuration(minutes: number): string {
  const rounded = Math.round(minutes);
  if (rounded >= 60) {
    const h = Math.floor(rounded / 60);
    const m = rounded % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
  }
  return `${rounded}`;
}
```

