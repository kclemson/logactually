import { describe, it, expect } from 'vitest';
import { formatRoutineSubtitle } from './routine-subtitle';
import type { SavedRoutine, SavedExerciseSet } from '@/types/weight';

const baseRoutine = (sets: SavedExerciseSet[]): SavedRoutine => ({
  id: 'r1',
  user_id: 'u1',
  name: 'test',
  original_input: null,
  exercise_sets: sets,
  use_count: 0,
  last_used_at: null,
  is_auto_named: false,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
});

const lift = (overrides: Partial<SavedExerciseSet> = {}): SavedExerciseSet => ({
  exercise_key: 'bench_press',
  description: 'Bench Press',
  sets: 3,
  reps: 8,
  weight_lbs: 135,
  ...overrides,
});

const cardio = (overrides: Partial<SavedExerciseSet> = {}): SavedExerciseSet => ({
  exercise_key: 'walk_run',
  description: 'Run',
  sets: 0,
  reps: 0,
  weight_lbs: 0,
  duration_minutes: 30,
  distance_miles: 3,
  ...overrides,
});

const lbs = { weightUnit: 'lbs' as const, distanceUnit: 'mi' as const };
const kg = { weightUnit: 'kg' as const, distanceUnit: 'km' as const };

describe('formatRoutineSubtitle', () => {
  it('lifting single in lb', () => {
    expect(formatRoutineSubtitle(baseRoutine([lift()]), lbs)).toBe('3×8 · 135 lbs');
  });

  it('lifting single in kg', () => {
    expect(formatRoutineSubtitle(baseRoutine([lift()]), kg)).toBe('3×8 · 61 kg');
  });

  it('lifting single, no weight', () => {
    expect(formatRoutineSubtitle(baseRoutine([lift({ weight_lbs: 0 })]), lbs)).toBe('3×8');
  });

  it('lifting multi', () => {
    expect(
      formatRoutineSubtitle(
        baseRoutine([lift(), lift({ exercise_key: 'squat', sets: 4 }), lift({ exercise_key: 'row', sets: 5 })]),
        lbs,
      ),
    ).toBe('3 lifts · 12 sets');
  });

  it('cardio single mi', () => {
    expect(formatRoutineSubtitle(baseRoutine([cardio()]), lbs)).toBe('30 min · 3.0 mi');
  });

  it('cardio single km', () => {
    expect(formatRoutineSubtitle(baseRoutine([cardio()]), kg)).toBe('30 min · 4.8 km');
  });

  it('cardio single, no distance', () => {
    expect(formatRoutineSubtitle(baseRoutine([cardio({ distance_miles: 0 })]), lbs)).toBe('30 min');
  });

  it('cardio multi sums duration', () => {
    expect(
      formatRoutineSubtitle(
        baseRoutine([cardio({ duration_minutes: 20 }), cardio({ duration_minutes: 25 })]),
        lbs,
      ),
    ).toBe('2 cardio · 45 min');
  });

  it('mixed routine treated as lifting', () => {
    expect(
      formatRoutineSubtitle(baseRoutine([lift(), cardio()]), lbs),
    ).toBe('2 lifts · 3 sets');
  });
});
