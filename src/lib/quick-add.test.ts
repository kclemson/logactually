import { describe, it, expect } from 'vitest';
import { selectQuickAddIds, buildQuickAddUsage, QuickAddUsage } from './quick-add';

const usageOf = (entries: Record<string, number>): Map<string, QuickAddUsage> =>
  new Map(Object.entries(entries).map(([id, usedDays]) => [id, { usedDays, lastUsedAt: '2026-08-01' }]));

describe('selectQuickAddIds', () => {
  it('shows nothing below the active-day floor', () => {
    expect(
      selectQuickAddIds({ availableIds: ['a'], usage: usageOf({ a: 4 }), activeDays: 4 })
    ).toEqual([]);
  });

  it('requires at least 3 used days even when the ratio passes', () => {
    // 2 of 6 active days = 33% but below the 3-day floor
    expect(
      selectQuickAddIds({ availableIds: ['a'], usage: usageOf({ a: 2 }), activeDays: 6 })
    ).toEqual([]);
  });

  it('includes an item exactly at the 30% ratio', () => {
    // 6 of 20 active days = exactly 30%
    expect(
      selectQuickAddIds({ availableIds: ['a'], usage: usageOf({ a: 6 }), activeDays: 20 })
    ).toEqual(['a']);
    expect(
      selectQuickAddIds({ availableIds: ['a'], usage: usageOf({ a: 5 }), activeDays: 20 })
    ).toEqual([]);
  });

  it('ranks by used days and caps at 4', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    const usage = usageOf({ a: 5, b: 9, c: 7, d: 6, e: 8 });
    expect(selectQuickAddIds({ availableIds: ids, usage, activeDays: 10 })).toEqual(['b', 'e', 'c', 'd']);
  });

  it('always shows pinned items first, even when unqualified', () => {
    const result = selectQuickAddIds({
      availableIds: ['rare', 'common'],
      usage: usageOf({ rare: 1, common: 9 }),
      activeDays: 10,
      pinned: ['rare'],
    });
    expect(result).toEqual(['rare', 'common']);
  });

  it('shows pinned items even before the active-day floor is met', () => {
    expect(
      selectQuickAddIds({
        availableIds: ['a'],
        usage: usageOf({ a: 1 }),
        activeDays: 1,
        pinned: ['a'],
      })
    ).toEqual(['a']);
  });

  it('never exceeds 6 chips including pins', () => {
    const ids = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'x'];
    const usage = usageOf(Object.fromEntries(ids.map((id) => [id, 9])));
    const result = selectQuickAddIds({
      availableIds: ids,
      usage,
      activeDays: 10,
      pinned: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'],
    });
    expect(result).toHaveLength(6);
  });

  it('excludes hidden and already-logged items', () => {
    const result = selectQuickAddIds({
      availableIds: ['a', 'b', 'c'],
      usage: usageOf({ a: 9, b: 9, c: 9 }),
      activeDays: 10,
      hidden: ['a'],
      alreadyLoggedIds: ['b'],
    });
    expect(result).toEqual(['c']);
  });

  it('hidden wins over pinned', () => {
    expect(
      selectQuickAddIds({
        availableIds: ['a'],
        usage: usageOf({ a: 9 }),
        activeDays: 10,
        pinned: ['a'],
        hidden: ['a'],
      })
    ).toEqual([]);
  });

  it('drops frequent items that have gone quiet', () => {
    const usage = new Map([['a', { usedDays: 9, lastUsedAt: '2026-07-01' }]]);
    expect(
      selectQuickAddIds({ availableIds: ['a'], usage, activeDays: 10, today: '2026-08-02' })
    ).toEqual([]);
  });

  it('keeps items used within the recency window', () => {
    const usage = new Map([['a', { usedDays: 9, lastUsedAt: '2026-07-26' }]]);
    expect(
      selectQuickAddIds({ availableIds: ['a'], usage, activeDays: 10, today: '2026-08-02' })
    ).toEqual(['a']);
  });

  it('pinned items ignore the recency window', () => {
    const usage = new Map([['a', { usedDays: 9, lastUsedAt: '2026-05-01' }]]);
    expect(
      selectQuickAddIds({
        availableIds: ['a'],
        usage,
        activeDays: 10,
        pinned: ['a'],
        today: '2026-08-02',
      })
    ).toEqual(['a']);
  });
});

describe('buildQuickAddUsage', () => {
  it('counts distinct days per item and overall active days', () => {
    const { usage, activeDays } = buildQuickAddUsage([
      { date: '2026-08-01', itemId: 'a' },
      { date: '2026-08-01', itemId: 'a' },
      { date: '2026-08-02', itemId: 'a' },
      { date: '2026-08-02', itemId: null },
      { date: '2026-08-03', itemId: 'b' },
    ]);
    expect(activeDays).toBe(3);
    expect(usage.get('a')).toEqual({ usedDays: 2, lastUsedAt: '2026-08-02' });
    expect(usage.get('b')).toEqual({ usedDays: 1, lastUsedAt: '2026-08-03' });
  });
});
