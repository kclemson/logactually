import { describe, it, expect, beforeEach } from 'vitest';
import {
  hashSignature,
  hashExerciseKeys,
  isDismissed,
  dismissSuggestion,
  getDismissalCount,
  shouldShowOptOutLink,
  detectRepeatedFoodEntry,
  detectRepeatedWeightEntry,
  findMatchingSavedRoutine,
} from './repeated-entry-detection';
import type { FoodItem, FoodEntry } from '@/types/food';
import type { AnalyzedExercise, SavedRoutine } from '@/types/weight';

// ---------------------------------------------------------------------------
// Hashing
// ---------------------------------------------------------------------------

describe('hashSignature', () => {
  it('is deterministic', () => {
    expect(hashSignature('chicken breast')).toBe(hashSignature('chicken breast'));
  });

  it('produces different hashes for different inputs', () => {
    expect(hashSignature('chicken breast')).not.toBe(hashSignature('pasta sauce'));
  });
});

describe('hashExerciseKeys', () => {
  it('is deterministic', () => {
    const keys = new Set(['bench_press', 'lat_pulldown']);
    expect(hashExerciseKeys(keys)).toBe(hashExerciseKeys(keys));
  });

  it('is order-independent (sets are sorted)', () => {
    const a = new Set(['bench_press', 'lat_pulldown']);
    const b = new Set(['lat_pulldown', 'bench_press']);
    expect(hashExerciseKeys(a)).toBe(hashExerciseKeys(b));
  });

  it('produces different hashes for different key sets', () => {
    const a = new Set(['bench_press']);
    const b = new Set(['lat_pulldown']);
    expect(hashExerciseKeys(a)).not.toBe(hashExerciseKeys(b));
  });
});

// ---------------------------------------------------------------------------
// Dismissal tracking (localStorage)
// ---------------------------------------------------------------------------

describe('dismissal tracking', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('isDismissed returns false for unknown hash', () => {
    expect(isDismissed('xyz')).toBe(false);
  });

  it('dismissSuggestion marks hash as dismissed', () => {
    dismissSuggestion('abc');
    expect(isDismissed('abc')).toBe(true);
  });

  it('getDismissalCount starts at 0', () => {
    expect(getDismissalCount()).toBe(0);
  });

  it('getDismissalCount increments on dismiss', () => {
    dismissSuggestion('a');
    dismissSuggestion('b');
    expect(getDismissalCount()).toBe(2);
  });

  it('shouldShowOptOutLink returns false below threshold', () => {
    dismissSuggestion('a');
    dismissSuggestion('b');
    expect(shouldShowOptOutLink()).toBe(false);
  });

  it('shouldShowOptOutLink returns true at threshold (3)', () => {
    dismissSuggestion('a');
    dismissSuggestion('b');
    dismissSuggestion('c');
    expect(shouldShowOptOutLink()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Food detection
// ---------------------------------------------------------------------------

describe('detectRepeatedFoodEntry', () => {
  const makeItems = (desc: string, cal: number): FoodItem[] => [
    { description: desc, calories: cal, protein: 0, carbs: 0, fat: 0 } as FoodItem,
  ];

  const makeEntry = (desc: string, cal: number, opts?: Partial<FoodEntry>): FoodEntry => ({
    id: Math.random().toString(),
    user_id: 'u1',
    eaten_date: '2025-01-01',
    raw_input: desc,
    food_items: makeItems(desc, cal),
    total_calories: cal,
    total_protein: 0,
    total_carbs: 0,
    total_fat: 0,
    source_meal_id: null,
    group_name: null,
    group_portion_multiplier: null,
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
    ...opts,
  });

  it('returns null when no history', () => {
    expect(detectRepeatedFoodEntry(makeItems('chicken', 300), [])).toBeNull();
  });

  it('returns null when not enough matches', () => {
    const entries = [makeEntry('chicken breast', 300)];
    expect(detectRepeatedFoodEntry(makeItems('chicken breast', 300), entries)).toBeNull();
  });

  it('detects when 2+ similar entries exist', () => {
    const entries = [
      makeEntry('chicken breast grilled', 310),
      makeEntry('grilled chicken breast', 290),
    ];
    const result = detectRepeatedFoodEntry(makeItems('chicken breast grilled', 300), entries);
    expect(result).not.toBeNull();
    expect(result!.matchCount).toBe(3); // 2 matches + 1 new
  });

  it('ignores entries from saved meals', () => {
    const entries = [
      makeEntry('chicken breast', 300, { source_meal_id: 'meal1' }),
      makeEntry('chicken breast', 300, { source_meal_id: 'meal2' }),
    ];
    expect(detectRepeatedFoodEntry(makeItems('chicken breast', 300), entries)).toBeNull();
  });

  it('rejects when calories differ by more than 40%', () => {
    const entries = [
      makeEntry('chicken breast', 300),
      makeEntry('chicken breast', 300),
    ];
    // New item has 600 cal → 100% diff from 300
    expect(detectRepeatedFoodEntry(makeItems('chicken breast', 600), entries)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Weight detection
// ---------------------------------------------------------------------------

describe('detectRepeatedWeightEntry', () => {
  const makeExercises = (...keys: string[]): AnalyzedExercise[] =>
    keys.map(k => ({
      exercise_key: k,
      description: k,
      sets: 3,
      reps: 10,
      weight_lbs: 100,
    }));

  const makeWeightEntry = (keys: string[], routineId?: string) => ({
    entry_id: Math.random().toString(),
    logged_date: '2025-01-01',
    exercise_keys: new Set(keys),
    source_routine_id: routineId ?? null,
  });

  it('returns null when no history', () => {
    expect(detectRepeatedWeightEntry(makeExercises('bench_press'), [])).toBeNull();
  });

  it('detects when 2+ similar entries exist', () => {
    const entries = [
      makeWeightEntry(['bench_press', 'lat_pulldown']),
      makeWeightEntry(['bench_press', 'lat_pulldown']),
    ];
    const result = detectRepeatedWeightEntry(
      makeExercises('bench_press', 'lat_pulldown'),
      entries
    );
    expect(result).not.toBeNull();
    expect(result!.matchCount).toBe(3);
  });

  it('ignores entries from saved routines', () => {
    const entries = [
      makeWeightEntry(['bench_press'], 'routine1'),
      makeWeightEntry(['bench_press'], 'routine2'),
    ];
    expect(detectRepeatedWeightEntry(makeExercises('bench_press'), entries)).toBeNull();
  });

  it('requires >= 0.7 Jaccard similarity', () => {
    // New: [A, B, C], History: [A] → Jaccard = 1/3 = 0.33 < 0.7
    const entries = [
      makeWeightEntry(['bench_press']),
      makeWeightEntry(['bench_press']),
    ];
    expect(detectRepeatedWeightEntry(
      makeExercises('bench_press', 'lat_pulldown', 'squat'),
      entries
    )).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Find matching saved routine
// ---------------------------------------------------------------------------

describe('findMatchingSavedRoutine', () => {
  const makeRoutine = (keys: string[], name: string, lastUsed?: string): SavedRoutine => ({
    id: Math.random().toString(),
    user_id: 'u1',
    name,
    original_input: null,
    exercise_sets: keys.map(k => ({
      exercise_key: k,
      description: k,
      sets: 3,
      reps: 10,
      weight_lbs: 100,
    })),
    use_count: 1,
    last_used_at: lastUsed ?? null,
    is_auto_named: false,
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
  });

  const makeExercises = (...keys: string[]): AnalyzedExercise[] =>
    keys.map(k => ({
      exercise_key: k,
      description: k,
      sets: 3,
      reps: 10,
      weight_lbs: 100,
    }));

  it('returns null when no routines', () => {
    expect(findMatchingSavedRoutine(makeExercises('bench_press'), [])).toBeNull();
  });

  it('returns null when similarity < 0.7', () => {
    const routines = [makeRoutine(['bench_press', 'squat', 'deadlift'], 'Routine A')];
    // Only 1 of 3 keys match → 0.33
    expect(findMatchingSavedRoutine(makeExercises('bench_press'), routines)).toBeNull();
  });

  it('matches when Jaccard >= 0.7', () => {
    const routines = [makeRoutine(['bench_press', 'lat_pulldown'], 'Push Pull')];
    const result = findMatchingSavedRoutine(
      makeExercises('bench_press', 'lat_pulldown'),
      routines
    );
    expect(result).not.toBeNull();
    expect(result!.similarity).toBe(1.0);
    expect(result!.name).toBe('Push Pull');
  });

  it('computes diffs for changed values', () => {
    const routines = [makeRoutine(['bench_press'], 'Bench Day')];
    const newExercises: AnalyzedExercise[] = [{
      exercise_key: 'bench_press',
      description: 'bench_press',
      sets: 4, // was 3
      reps: 10,
      weight_lbs: 135, // was 100
    }];
    const result = findMatchingSavedRoutine(newExercises, routines);
    expect(result).not.toBeNull();
    expect(result!.diffs).toHaveLength(1);
    expect(result!.diffs[0].sets).toBe(1); // +1
    expect(result!.diffs[0].reps).toBeUndefined(); // unchanged
    expect(result!.diffs[0].weight_lbs).toBe(35); // +35
  });

  it('tie-breaks by most recently used', () => {
    const routines = [
      makeRoutine(['bench_press'], 'Old Routine', '2025-01-01'),
      makeRoutine(['bench_press'], 'New Routine', '2025-06-01'),
    ];
    const result = findMatchingSavedRoutine(makeExercises('bench_press'), routines);
    expect(result!.name).toBe('New Routine');
  });
});
