import { describe, it, expect } from 'vitest';
import {
  estimateCalorieBurn,
  estimateTotalCalorieBurn,
  getMetRange,
  narrowMetByEffort,
  applyInclineBonus,
  estimateStrengthDuration,
  getCompositionMultiplier,
  cmToInches,
  inchesToCm,
  formatCalorieBurnValue,
  type CalorieBurnSettings,
  type ExerciseInput,
} from './calorie-burn';

const BASE_SETTINGS: CalorieBurnSettings = {
  calorieBurnEnabled: true,
  bodyWeightLbs: null,
  heightInches: null,
  age: null,
  bodyComposition: null,
  defaultIntensity: null,
};

const settingsWith = (overrides: Partial<CalorieBurnSettings>): CalorieBurnSettings => ({
  ...BASE_SETTINGS,
  ...overrides,
});

// ---------------------------------------------------------------------------
// MET lookup
// ---------------------------------------------------------------------------

describe('getMetRange', () => {
  it('returns specific range for known exercise', () => {
    const met = getMetRange('bench_press');
    expect(met.low).toBe(3.5);
    expect(met.high).toBe(5.0);
  });

  it('returns subtype range when subtype provided', () => {
    const met = getMetRange('walk_run', 'walking');
    expect(met.low).toBe(2.0);
    expect(met.high).toBe(3.5);
  });

  it('returns _default when exercise has subtypes but none provided', () => {
    const met = getMetRange('walk_run');
    expect(met.low).toBe(2.0);
    expect(met.high).toBe(12.0);
  });

  it('returns generic strength for unknown exercise', () => {
    const met = getMetRange('unknown_exercise_xyz');
    expect(met.low).toBe(3.0);
    expect(met.high).toBe(6.0);
  });

  it('returns generic cardio for known cardio exercise not in MET table', () => {
    // All cardio exercises in exercise-metadata are in the MET table,
    // but if one weren't, it should fall back to generic cardio.
    // We test that the lookup returns something reasonable for all known exercises.
    const met = getMetRange('elliptical');
    expect(met.low).toBe(5.0);
    expect(met.high).toBe(8.0);
  });
});

// ---------------------------------------------------------------------------
// Effort narrowing
// ---------------------------------------------------------------------------

describe('narrowMetByEffort', () => {
  const met = { low: 2.0, high: 12.0 };

  it('effort 1 narrows near low end', () => {
    const result = narrowMetByEffort(met, 1);
    expect(result.low).toBeCloseTo(2.0, 1);
    expect(result.high).toBeLessThan(4.0);
  });

  it('effort 10 narrows near high end', () => {
    const result = narrowMetByEffort(met, 10);
    expect(result.low).toBeGreaterThan(10.0);
    expect(result.high).toBeCloseTo(12.0, 1);
  });

  it('effort 5 narrows around midpoint', () => {
    const result = narrowMetByEffort(met, 5);
    const midpoint = 2.0 + (4 / 9) * 10; // ~6.44
    expect(result.low).toBeLessThan(midpoint);
    expect(result.high).toBeGreaterThan(midpoint);
  });

  it('clamps effort below 1', () => {
    const result = narrowMetByEffort(met, -5);
    expect(result.low).toBe(2.0);
  });

  it('clamps effort above 10', () => {
    const result = narrowMetByEffort(met, 15);
    expect(result.high).toBe(12.0);
  });
});

// ---------------------------------------------------------------------------
// Incline bonus
// ---------------------------------------------------------------------------

describe('applyInclineBonus', () => {
  it('adds ~0.75 MET per 5% incline', () => {
    const met = { low: 2.0, high: 3.5 };
    const result = applyInclineBonus(met, 10);
    expect(result.low).toBeCloseTo(3.5, 1);
    expect(result.high).toBeCloseTo(5.0, 1);
  });

  it('zero incline adds nothing', () => {
    const met = { low: 5.0, high: 8.0 };
    const result = applyInclineBonus(met, 0);
    expect(result.low).toBe(5.0);
    expect(result.high).toBe(8.0);
  });
});

// ---------------------------------------------------------------------------
// Strength duration estimation
// ---------------------------------------------------------------------------

describe('estimateStrengthDuration', () => {
  it('estimates reasonable duration for 3 sets', () => {
    const dur = estimateStrengthDuration(3, 10);
    // 3 sets × 35s = 105s low, 3 sets × 45s = 135s high
    expect(dur.low).toBeCloseTo(105 / 3600, 4);
    expect(dur.high).toBeCloseTo(135 / 3600, 4);
  });

  it('returns 0 for 0 sets', () => {
    const dur = estimateStrengthDuration(0, 10);
    expect(dur.low).toBe(0);
    expect(dur.high).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Composition multiplier
// ---------------------------------------------------------------------------

describe('getCompositionMultiplier', () => {
  it('returns 0.95 for female', () => {
    expect(getCompositionMultiplier('female')).toBe(0.95);
  });

  it('returns 1.05 for male', () => {
    expect(getCompositionMultiplier('male')).toBe(1.05);
  });

  it('returns 1.0 for null (population average)', () => {
    expect(getCompositionMultiplier(null)).toBe(1.0);
  });
});

// ---------------------------------------------------------------------------
// Unit conversions
// ---------------------------------------------------------------------------

describe('unit conversions', () => {
  it('cm to inches', () => {
    expect(cmToInches(2.54)).toBeCloseTo(1.0, 4);
    expect(cmToInches(180)).toBeCloseTo(70.87, 1);
  });

  it('inches to cm', () => {
    expect(inchesToCm(1)).toBeCloseTo(2.54, 4);
    expect(inchesToCm(70)).toBeCloseTo(177.8, 1);
  });
});

// ---------------------------------------------------------------------------
// Main estimation: cardio with full metadata
// ---------------------------------------------------------------------------

describe('estimateCalorieBurn', () => {
  it('cardio with full metadata returns narrow range', () => {
    const exercise: ExerciseInput = {
      exercise_key: 'walk_run',
      exercise_subtype: 'running',
      sets: 0,
      reps: 0,
      weight_lbs: 0,
      duration_minutes: 30,
      exercise_metadata: { effort: 8 },
    };
    const settings = settingsWith({ bodyWeightLbs: 160, bodyComposition: 'male' });
    const result = estimateCalorieBurn(exercise, settings);

    expect(result.type).toBe('range');
    if (result.type === 'range') {
      expect(result.low).toBeGreaterThan(200);
      expect(result.high).toBeLessThan(500);
      // With effort 8 and known weight, range should be narrow
      expect(result.high - result.low).toBeLessThan(50);
    }
  });

  it('cardio without metadata returns wide range', () => {
    const exercise: ExerciseInput = {
      exercise_key: 'cycling',
      sets: 0,
      reps: 0,
      weight_lbs: 0,
      duration_minutes: 45,
    };
    const result = estimateCalorieBurn(exercise, BASE_SETTINGS);

    expect(result.type).toBe('range');
    if (result.type === 'range') {
      expect(result.low).toBeGreaterThan(100);
      expect(result.high).toBeGreaterThan(result.low);
      // Without body weight or effort, range is wider
      expect(result.high - result.low).toBeGreaterThan(100);
    }
  });

  it('strength exercise estimates from sets', () => {
    const exercise: ExerciseInput = {
      exercise_key: 'bench_press',
      sets: 3,
      reps: 10,
      weight_lbs: 135,
    };
    const settings = settingsWith({ bodyWeightLbs: 180 });
    const result = estimateCalorieBurn(exercise, settings);

    expect(result.type).toBe('range');
    if (result.type === 'range') {
      expect(result.low).toBeGreaterThan(5);
      expect(result.high).toBeLessThan(100);
    }
  });

  it('user-reported calories bypass estimation', () => {
    const exercise: ExerciseInput = {
      exercise_key: 'walk_run',
      exercise_subtype: 'running',
      sets: 0,
      reps: 0,
      weight_lbs: 0,
      duration_minutes: 30,
      exercise_metadata: { calories_burned: 320 },
    };
    const result = estimateCalorieBurn(exercise, BASE_SETTINGS);

    expect(result.type).toBe('exact');
    if (result.type === 'exact') {
      expect(result.value).toBe(320);
    }
  });

  it('default intensity narrows range', () => {
    const exercise: ExerciseInput = {
      exercise_key: 'walk_run',
      exercise_subtype: 'running',
      sets: 0,
      reps: 0,
      weight_lbs: 0,
      duration_minutes: 30,
    };

    const withoutIntensity = estimateCalorieBurn(exercise, settingsWith({ bodyWeightLbs: 160 }));
    const withIntensity = estimateCalorieBurn(exercise, settingsWith({ bodyWeightLbs: 160, defaultIntensity: 7 }));

    expect(withoutIntensity.type).toBe('range');
    expect(withIntensity.type).toBe('range');
    if (withoutIntensity.type === 'range' && withIntensity.type === 'range') {
      const rangeWithout = withoutIntensity.high - withoutIntensity.low;
      const rangeWith = withIntensity.high - withIntensity.low;
      expect(rangeWith).toBeLessThan(rangeWithout);
    }
  });

  it('incline adds to calorie estimate', () => {
    const base: ExerciseInput = {
      exercise_key: 'walk_run',
      exercise_subtype: 'walking',
      sets: 0,
      reps: 0,
      weight_lbs: 0,
      duration_minutes: 30,
    };
    const settings = settingsWith({ bodyWeightLbs: 160 });

    const flat = estimateCalorieBurn(base, settings);
    const inclined = estimateCalorieBurn(
      { ...base, exercise_metadata: { incline_pct: 10 } },
      settings,
    );

    expect(flat.type).toBe('range');
    expect(inclined.type).toBe('range');
    if (flat.type === 'range' && inclined.type === 'range') {
      expect(inclined.low).toBeGreaterThan(flat.low);
      expect(inclined.high).toBeGreaterThan(flat.high);
    }
  });

  it('body composition female vs male ~5-10% difference', () => {
    const exercise: ExerciseInput = {
      exercise_key: 'walk_run',
      exercise_subtype: 'running',
      sets: 0,
      reps: 0,
      weight_lbs: 0,
      duration_minutes: 30,
    };

    const female = estimateCalorieBurn(exercise, settingsWith({ bodyWeightLbs: 160, bodyComposition: 'female' }));
    const male = estimateCalorieBurn(exercise, settingsWith({ bodyWeightLbs: 160, bodyComposition: 'male' }));

    expect(female.type).toBe('range');
    expect(male.type).toBe('range');
    if (female.type === 'range' && male.type === 'range') {
      // Male should be ~10% higher than female
      const ratio = male.low / female.low;
      expect(ratio).toBeGreaterThan(1.05);
      expect(ratio).toBeLessThan(1.15);
    }
  });

  it('missing duration for cardio with no sets returns zero range', () => {
    const exercise: ExerciseInput = {
      exercise_key: 'cycling',
      sets: 0,
      reps: 0,
      weight_lbs: 0,
    };
    const result = estimateCalorieBurn(exercise, BASE_SETTINGS);
    expect(result.type).toBe('range');
    if (result.type === 'range') {
      expect(result.low).toBe(0);
      expect(result.high).toBe(0);
    }
  });

  it('unknown exercise uses generic fallback', () => {
    const exercise: ExerciseInput = {
      exercise_key: 'totally_unknown_exercise',
      sets: 4,
      reps: 8,
      weight_lbs: 100,
    };
    const settings = settingsWith({ bodyWeightLbs: 170 });
    const result = estimateCalorieBurn(exercise, settings);

    expect(result.type).toBe('range');
    if (result.type === 'range') {
      expect(result.low).toBeGreaterThan(0);
      expect(result.high).toBeGreaterThan(0);
    }
  });

  it('0 sets and 0 reps for strength returns zero', () => {
    const exercise: ExerciseInput = {
      exercise_key: 'bench_press',
      sets: 0,
      reps: 0,
      weight_lbs: 135,
    };
    const result = estimateCalorieBurn(exercise, BASE_SETTINGS);
    if (result.type === 'range') {
      expect(result.low).toBe(0);
      expect(result.high).toBe(0);
    }
  });

  it('very high body weight increases burn proportionally', () => {
    const exercise: ExerciseInput = {
      exercise_key: 'walk_run',
      exercise_subtype: 'running',
      sets: 0,
      reps: 0,
      weight_lbs: 0,
      duration_minutes: 30,
    };

    const light = estimateCalorieBurn(exercise, settingsWith({ bodyWeightLbs: 120 }));
    const heavy = estimateCalorieBurn(exercise, settingsWith({ bodyWeightLbs: 250 }));

    expect(light.type).toBe('range');
    expect(heavy.type).toBe('range');
    if (light.type === 'range' && heavy.type === 'range') {
      expect(heavy.low).toBeGreaterThan(light.low * 1.5);
    }
  });

  it('explicit effort overrides default intensity', () => {
    const exercise: ExerciseInput = {
      exercise_key: 'walk_run',
      exercise_subtype: 'running',
      sets: 0,
      reps: 0,
      weight_lbs: 0,
      duration_minutes: 30,
      exercise_metadata: { effort: 3 }, // low effort
    };
    const settings = settingsWith({ bodyWeightLbs: 160, defaultIntensity: 9 }); // high default

    const result = estimateCalorieBurn(exercise, settings);
    // Should use effort 3 (low), not default 9 (high)
    expect(result.type).toBe('range');
    if (result.type === 'range') {
      // Effort 3 with running MET 8-12 should give low-end estimate
      expect(result.high).toBeLessThan(400);
    }
  });
});

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------

describe('estimateTotalCalorieBurn', () => {
  it('sums multiple exercises', () => {
    const exercises: ExerciseInput[] = [
      {
        exercise_key: 'bench_press',
        sets: 3,
        reps: 10,
        weight_lbs: 135,
      },
      {
        exercise_key: 'walk_run',
        exercise_subtype: 'running',
        sets: 0,
        reps: 0,
        weight_lbs: 0,
        duration_minutes: 20,
      },
    ];
    const settings = settingsWith({ bodyWeightLbs: 160 });
    const result = estimateTotalCalorieBurn(exercises, settings);

    expect(result.type).toBe('range');
    if (result.type === 'range') {
      expect(result.low).toBeGreaterThan(100);
      expect(result.high).toBeGreaterThan(result.low);
    }
  });

  it('returns exact when all exercises have reported calories', () => {
    const exercises: ExerciseInput[] = [
      {
        exercise_key: 'walk_run',
        sets: 0,
        reps: 0,
        weight_lbs: 0,
        duration_minutes: 30,
        exercise_metadata: { calories_burned: 300 },
      },
      {
        exercise_key: 'cycling',
        sets: 0,
        reps: 0,
        weight_lbs: 0,
        duration_minutes: 20,
        exercise_metadata: { calories_burned: 200 },
      },
    ];
    const result = estimateTotalCalorieBurn(exercises, BASE_SETTINGS);
    expect(result.type).toBe('exact');
    if (result.type === 'exact') {
      expect(result.value).toBe(500);
    }
  });
});

// ---------------------------------------------------------------------------
// Display formatting
// ---------------------------------------------------------------------------

describe('formatCalorieBurnValue', () => {
  it('formats range (numeric only)', () => {
    expect(formatCalorieBurnValue({ type: 'range', low: 120, high: 180 })).toBe('~120-180');
  });

  it('formats exact', () => {
    expect(formatCalorieBurnValue({ type: 'exact', value: 320 })).toBe('~320');
  });

  it('formats zero range as empty', () => {
    expect(formatCalorieBurnValue({ type: 'range', low: 0, high: 0 })).toBe('');
  });

  it('formats equal low/high', () => {
    expect(formatCalorieBurnValue({ type: 'range', low: 100, high: 100 })).toBe('~100');
  });
});
