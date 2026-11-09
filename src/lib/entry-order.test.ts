import { describe, it, expect, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
import { moveEntryId, sortByEntryOrder } from './entry-order';

describe('moveEntryId', () => {
  it('moving the 3rd entry up swaps it with the 2nd and keeps the rest', () => {
    expect(moveEntryId(['a', 'b', 'c', 'd'], 'c', -1)).toEqual(['a', 'c', 'b', 'd']);
  });
  it('cannot move the top entry up or the bottom entry down', () => {
    expect(moveEntryId(['a', 'b'], 'a', -1)).toBeNull();
    expect(moveEntryId(['a', 'b'], 'b', 1)).toBeNull();
  });
});

describe('sortByEntryOrder', () => {
  it('keeps rows of the same entry together and in their original order', () => {
    const rows = [{ e: 'x', n: 1 }, { e: 'x', n: 2 }, { e: 'y', n: 3 }];
    expect(sortByEntryOrder(rows, (r) => r.e, ['y', 'x']).map((r) => r.n)).toEqual([3, 1, 2]);
  });
});
