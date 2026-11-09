import { describe, it, expect } from 'vitest';
import { resolveCalendarRows, formatDayMetric } from './calendar-rows';

describe('resolveCalendarRows', () => {
  it('defaults bottom row to protein when exercise tracking is off', () => {
    expect(resolveCalendarRows(undefined, false)).toEqual({ top: 'calories', bottom: 'protein' });
  });
  it('defaults bottom row to activity icons when exercise tracking is on', () => {
    expect(resolveCalendarRows(undefined, true).bottom).toBe('activity');
  });
  it('saved choice overrides the default', () => {
    expect(resolveCalendarRows({ bottom: 'none' }, false).bottom).toBe('none');
  });
});

describe('formatDayMetric', () => {
  it('net carbs never goes below zero', () => {
    expect(formatDayMetric('net_carbs', { calories: 0, protein: 0, carbs: 5, fiber: 9, fat: 0 })).toBe('0g');
  });
});
