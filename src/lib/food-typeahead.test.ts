import { describe, it, expect } from 'vitest';
import { buildFoodTypeaheadCandidates } from './food-typeahead';
import { extractCandidateFoodWords, hybridSimilarityScore } from './text-similarity';
import type { FoodItem } from '@/types/food';

const item = (description: string, calories = 80) => ({ description, calories } as FoodItem);
const matches = (query: string, searchText: string) =>
  hybridSimilarityScore(extractCandidateFoodWords(query), searchText) >= 0.25;

describe('buildFoodTypeaheadCandidates', () => {
  it('keeps every way the user described the same food', () => {
    const [c] = buildFoodTypeaheadCandidates([
      { eaten_date: '2026-11-09', raw_input: 'string cheese', food_items: [item('Mozzarella Snack Stick')], total_calories: 80 },
      { eaten_date: '2026-11-01', raw_input: 'cheese stick', food_items: [item('Mozzarella Snack Stick')], total_calories: 80 },
    ]);
    expect(matches('cheese stick', c.searchText)).toBe(true);
    expect(matches('string cheese', c.searchText)).toBe(true);
    expect(c.frequency).toBe(2);
  });

  it('group name is searchable', () => {
    const [c] = buildFoodTypeaheadCandidates([
      { eaten_date: '2026-11-09', raw_input: 'apple and peanut butter', group_name: 'Afternoon snack',
        food_items: [item('Apple'), item('Peanut Butter')], total_calories: 280 },
    ]);
    expect(matches('afternoon snack', c.searchText)).toBe(true);
  });
});
