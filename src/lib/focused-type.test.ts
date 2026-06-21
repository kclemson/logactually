import { describe, it, expect } from 'vitest';
import { resolveFocusedTypeId, FOCUSED_NONE } from './focused-type';

const types = [
  { id: 'a', created_at: '2024-01-01T00:00:00Z' },
  { id: 'b', created_at: '2024-03-01T00:00:00Z' },
  { id: 'c', created_at: '2024-02-01T00:00:00Z' },
];

describe('resolveFocusedTypeId', () => {
  it('derives the most-recently-created type when unset', () => {
    expect(resolveFocusedTypeId(null, types)).toBe('b');
    expect(resolveFocusedTypeId(undefined, types)).toBe('b');
  });

  it('returns null when the user opted out', () => {
    expect(resolveFocusedTypeId(FOCUSED_NONE, types)).toBeNull();
  });

  it('returns a valid stored id', () => {
    expect(resolveFocusedTypeId('a', types)).toBe('a');
  });

  it('falls back to newest for a stale/deleted id', () => {
    expect(resolveFocusedTypeId('zzz', types)).toBe('b');
  });

  it('returns null when there are no types', () => {
    expect(resolveFocusedTypeId(null, [])).toBeNull();
    expect(resolveFocusedTypeId('a', [])).toBeNull();
  });
});
