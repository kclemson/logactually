import { describe, it, expect } from 'vitest';
import { generateRoutineName } from './routine-naming';
import type { SavedExerciseSet } from '@/types/weight';

const baseExercise: SavedExerciseSet = {
  exercise_key: 'lat_pulldown',
  description: 'Lat Pulldown',
  sets: 3,
  reps: 10,
  weight_lbs: 65,
};

describe('generateRoutineName', () => {
  it('formats strength exercise', () => {
    expect(generateRoutineName(baseExercise)).toBe('Lat Pulldown (3x10 @ 65 lbs)');
  });

  it('formats cardio with duration only', () => {
    const exercise: SavedExerciseSet = {
      ...baseExercise,
      description: 'Rowing Machine',
      weight_lbs: 0,
      sets: 0,
      reps: 0,
      duration_minutes: 15.5,
    };
    expect(generateRoutineName(exercise)).toBe('Rowing Machine (15:30)');
  });

  it('formats cardio with distance only', () => {
    const exercise: SavedExerciseSet = {
      ...baseExercise,
      description: 'Running',
      weight_lbs: 0,
      sets: 0,
      reps: 0,
      duration_minutes: 0,
      distance_miles: 2.5,
    };
    expect(generateRoutineName(exercise)).toBe('Running (2.5 mi)');
  });

  it('formats cardio with both duration and distance', () => {
    const exercise: SavedExerciseSet = {
      ...baseExercise,
      description: 'Running',
      weight_lbs: 0,
      sets: 0,
      reps: 0,
      duration_minutes: 15.5,
      distance_miles: 2.5,
    };
    expect(generateRoutineName(exercise)).toBe('Running (15:30, 2.5 mi)');
  });

  it('treats non-zero weight as strength even with duration', () => {
    const exercise: SavedExerciseSet = {
      ...baseExercise,
      duration_minutes: 10,
    };
    // weight_lbs is 65 (non-zero), so it's strength format
    expect(generateRoutineName(exercise)).toBe('Lat Pulldown (3x10 @ 65 lbs)');
  });
});
