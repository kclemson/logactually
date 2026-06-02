import { describe, it, expect } from 'vitest';
import {
  CHART_IDS,
  foodMacroChartId,
  exerciseChartId,
  customLogChartId,
  bloodworkChartId,
  isChartHidden,
  toggleChartId,
} from './chart-visibility';

describe('chart-visibility ID builders', () => {
  it('builds stable fixed IDs', () => {
    expect(CHART_IDS.foodCalories).toBe('food:calories');
    expect(CHART_IDS.foodMacroSplit).toBe('food:macroSplit');
    expect(CHART_IDS.foodCombined).toBe('food:combined');
    expect(CHART_IDS.exerciseCalorieBurn).toBe('exercise:calorieBurn');
  });

  it('builds macro chart IDs', () => {
    expect(foodMacroChartId('protein')).toBe('food:macro:protein');
  });

  it('builds exercise chart IDs with and without subtype', () => {
    expect(exerciseChartId('bench_press', 'flat')).toBe('exercise:bench_press:flat');
    expect(exerciseChartId('running')).toBe('exercise:running:');
    expect(exerciseChartId('running', null)).toBe('exercise:running:');
  });

  it('builds custom-log and bloodwork IDs', () => {
    expect(customLogChartId('abc')).toBe('customlog:abc');
    expect(bloodworkChartId('xyz')).toBe('bloodwork:xyz');
  });
});

describe('isChartHidden', () => {
  it('detects hidden vs visible', () => {
    expect(isChartHidden('food:calories', ['food:calories'])).toBe(true);
    expect(isChartHidden('food:calories', [])).toBe(false);
    expect(isChartHidden('food:calories', ['food:combined'])).toBe(false);
  });
});

describe('toggleChartId', () => {
  it('adds when visible', () => {
    expect(toggleChartId('food:calories', [])).toEqual(['food:calories']);
  });

  it('removes when hidden', () => {
    expect(toggleChartId('food:calories', ['food:calories', 'x'])).toEqual(['x']);
  });

  it('does not mutate the input array', () => {
    const input = ['x'];
    toggleChartId('food:calories', input);
    expect(input).toEqual(['x']);
  });
});
