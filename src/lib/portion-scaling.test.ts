import { describe, it, expect } from 'vitest';
import {
  MULTIPLIER_STEPS,
  stepMultiplier,
  scalePortion,
  scaleItemByMultiplier,
} from './portion-scaling';
import type { FoodItem } from '@/types/food';

// ---------------------------------------------------------------------------
// stepMultiplier
// ---------------------------------------------------------------------------

describe('stepMultiplier', () => {
  it('steps up through the sequence', () => {
    expect(stepMultiplier(1.0, 'up')).toBe(1.25);
    expect(stepMultiplier(2.0, 'up')).toBe(2.5);
  });

  it('steps down through the sequence', () => {
    expect(stepMultiplier(1.0, 'down')).toBe(0.75);
    expect(stepMultiplier(2.5, 'down')).toBe(2.0);
  });

  it('clamps at minimum (0.25)', () => {
    expect(stepMultiplier(0.25, 'down')).toBe(0.25);
  });

  it('clamps at maximum (5.0)', () => {
    expect(stepMultiplier(5.0, 'up')).toBe(5.0);
  });

  it('snaps up from non-standard value', () => {
    expect(stepMultiplier(1.1, 'up')).toBe(1.25);
  });

  it('snaps down from non-standard value', () => {
    expect(stepMultiplier(1.1, 'down')).toBe(1.0);
  });

  it('snaps up from value above max', () => {
    expect(stepMultiplier(6.0, 'up')).toBe(5.0);
  });

  it('snaps down from value below min', () => {
    expect(stepMultiplier(0.1, 'down')).toBe(0.25);
  });
});

// ---------------------------------------------------------------------------
// scalePortion
// ---------------------------------------------------------------------------

describe('scalePortion', () => {
  it('returns unchanged when multiplier is 1', () => {
    expect(scalePortion('1 cup', 1)).toBe('1 cup');
  });

  it('scales integer portion and pluralizes', () => {
    expect(scalePortion('1 cup', 2)).toBe('2 cups');
  });

  it('scales decimal portion', () => {
    expect(scalePortion('0.5 cups', 2)).toBe('1 cup');
  });

  it('scales fraction portion', () => {
    expect(scalePortion('1/2 cup', 2)).toBe('1 cup');
  });

  it('handles pluralization for "ch" ending', () => {
    // "sandwich" ends in "ch" → adds "es"
    expect(scalePortion('1 sandwich', 2)).toBe('2 sandwiches');
    expect(scalePortion('1 peach', 2)).toBe('2 peaches');
  });

  it('handles pluralization for "sh" ending', () => {
    expect(scalePortion('1 dish', 2)).toBe('2 dishes');
  });

  it('handles pluralization for "ss" ending', () => {
    expect(scalePortion('1 glass', 2)).toBe('2 glasses');
  });

  it('handles pluralization for "x" ending', () => {
    expect(scalePortion('1 box', 2)).toBe('2 boxes');
  });

  it('de-pluralizes when scaling down to 1', () => {
    expect(scalePortion('2 cups', 0.5)).toBe('1 cup');
  });

  it('de-pluralizes "es" endings', () => {
    expect(scalePortion('2 peaches', 0.5)).toBe('1 peach');
  });

  it('does not de-pluralize words ending in "ss"', () => {
    // "2 glasses" at 0.5 → "1 glass" (removes "es")
    expect(scalePortion('2 glasses', 0.5)).toBe('1 glass');
  });

  it('appends multiplier tag for unparseable text', () => {
    expect(scalePortion('a handful', 2)).toBe('a handful (x2)');
  });

  it('returns empty string for empty portion', () => {
    expect(scalePortion('', 2)).toBe('');
  });

  it('handles portion with no unit', () => {
    expect(scalePortion('3', 2)).toBe('6');
  });

  it('formats decimal result to one decimal place', () => {
    expect(scalePortion('1 cup', 1.5)).toBe('1.5 cups');
  });
});

// ---------------------------------------------------------------------------
// scaleItemByMultiplier
// ---------------------------------------------------------------------------

describe('scaleItemByMultiplier', () => {
  const baseItem: FoodItem = {
    uid: 'test-uid',
    description: 'Chicken breast',
    calories: 200,
    protein: 30,
    carbs: 0,
    fat: 5,
    portion: '1 piece',
    fiber: 0,
    sugar: 0,
    saturated_fat: 1,
    sodium: 50,
    cholesterol: 80,
  };

  it('scales all numeric nutritional fields', () => {
    const updates = scaleItemByMultiplier(baseItem, 2);
    expect(updates.calories).toBe(400);
    expect(updates.protein).toBe(60);
    expect(updates.carbs).toBe(0);
    expect(updates.fat).toBe(10);
    expect(updates.fiber).toBe(0);
    expect(updates.sugar).toBe(0);
    expect(updates.saturated_fat).toBe(2);
    expect(updates.sodium).toBe(100);
    expect(updates.cholesterol).toBe(160);
  });

  it('rounds scaled values', () => {
    const updates = scaleItemByMultiplier(baseItem, 0.75);
    expect(updates.calories).toBe(150);
    expect(updates.protein).toBe(23); // 30 * 0.75 = 22.5 → 23
  });

  it('scales portion text', () => {
    const updates = scaleItemByMultiplier(baseItem, 2);
    expect(updates.portion).toBe('2 pieces');
  });

  it('skips portion when not present', () => {
    const itemNoPortion: FoodItem = { ...baseItem, portion: undefined as any };
    const updates = scaleItemByMultiplier(itemNoPortion, 2);
    expect(updates.portion).toBeUndefined();
  });
});
