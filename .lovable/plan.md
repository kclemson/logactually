

## Add Secondary Muscles to Plank and Kettlebell Swing

### Overview

Incorporate the optional UX improvements from the external review to add secondary muscle groups for core stabilizer exercises.

---

### Changes Summary

| Exercise | Current | After |
|----------|---------|-------|
| plank | Abs (no secondary) | Abs, **Shoulders**, **Glutes** |
| kettlebell_swing | Glutes, Hamstrings, Abs | Glutes, Hamstrings, Abs, **Lower Back** |

---

### File Changes

#### 1. `src/lib/exercise-metadata.ts`

**Line ~78 (plank)**:
```typescript
// Before
plank: { primary: 'Abs' },

// After
plank: { primary: 'Abs', secondary: ['Shoulders', 'Glutes'] },
```

**Line ~57 (kettlebell_swing)**:
```typescript
// Before
kettlebell_swing: { primary: 'Glutes', secondary: ['Hamstrings', 'Abs'] },

// After
kettlebell_swing: { primary: 'Glutes', secondary: ['Hamstrings', 'Abs', 'Lower Back'] },
```

---

#### 2. `supabase/functions/_shared/exercises.ts`

**Line ~68 (plank)**:
```typescript
// Before
{ key: 'plank', name: 'Plank', aliases: ['planks', 'front plank'], primaryMuscle: 'Abs' },

// After
{ key: 'plank', name: 'Plank', aliases: ['planks', 'front plank'], primaryMuscle: 'Abs', secondaryMuscles: ['Shoulders', 'Glutes'] },
```

**Line ~61 (kettlebell_swing)**:
```typescript
// Before
{ key: 'kettlebell_swing', ..., primaryMuscle: 'Glutes', secondaryMuscles: ['Hamstrings', 'Abs'] },

// After
{ key: 'kettlebell_swing', ..., primaryMuscle: 'Glutes', secondaryMuscles: ['Hamstrings', 'Abs', 'Lower Back'] },
```

---

### UI Result Examples

| Exercise | Before | After |
|----------|--------|-------|
| Plank | Max: 60 lbs · Abs | Max: 60 lbs · Abs, Shoulders, Glutes |
| Kettlebell Swing | Max: 35 lbs · Glutes, Hamstrings, Abs | Max: 35 lbs · Glutes, Hamstrings, Abs, Lower Back |

