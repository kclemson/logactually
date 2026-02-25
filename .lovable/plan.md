

# Analysis: Cardio calorie burn coverage gaps

## Current state

The distance-based duration estimator (`estimateCardioDurationFromDistance`) handles two of seven cardio types:

| Cardio type | Has distance fallback | Typical no-duration log |
|---|---|---|
| walk_run | Yes | "2 mile walk" |
| cycling | Yes | "10 mile bike ride" |
| rowing | **No** | "rowed 2000m" |
| swimming | **No** | "swam 1500m", "swam 30 laps" |
| elliptical | N/A | Usually logged with duration |
| stair_climber | N/A | Usually logged with duration |
| jump_rope | N/A | Usually logged with duration |

## Realistic gaps

**Rowing** and **swimming** are the two where a user might plausibly log distance without duration:
- Rowing: typical pace 2:00–2:30/500m → speed ~6–7.5 mph equivalent
- Swimming: typical pace 1:30–2:30/100m → speed ~1.5–2.5 mph equivalent

Elliptical, stair climber, and jump rope don't have a meaningful "distance" concept, so there's no reasonable fallback — but users almost always include a duration for these ("20 min jump rope"), so the gap is minimal.

## Recommendation

Add rowing and swimming to `estimateCardioDurationFromDistance`. No changes needed for elliptical, stair climber, or jump rope.

### Changes: `src/lib/calorie-burn.ts`

Add two branches to the speed lookup in `estimateCardioDurationFromDistance`:

```typescript
} else if (exerciseKey === 'rowing') {
  speedRange = [4.0, 7.5]; // ~2:30–1:20 per 500m
} else if (exerciseKey === 'swimming') {
  speedRange = [1.5, 2.5]; // ~2:30–1:30 per 100m
}
```

Also update `hasDistanceTracking` in `exercise-metadata.ts` to include rowing and swimming so the UI allows distance input for those exercises (currently only walk_run and cycling).

### Files

| File | Change |
|---|---|
| `src/lib/calorie-burn.ts` | Add rowing and swimming speed ranges to `estimateCardioDurationFromDistance` |
| `src/lib/exercise-metadata.ts` | Add `rowing` and `swimming` to `hasDistanceTracking` |

