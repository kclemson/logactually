import { describe, it, expect } from 'vitest';
import {
  EntryBoundary,
  isFirstInBoundary,
  isLastInBoundary,
  isEntryNew,
  getEntryHighlightClasses,
  hasAnyEditedFields,
  formatEditedFields,
} from './entry-boundaries';

const boundaries: EntryBoundary[] = [
  { entryId: 'a', startIndex: 0, endIndex: 2 },
  { entryId: 'b', startIndex: 3, endIndex: 5 },
  { entryId: 'c', startIndex: 6, endIndex: 6 }, // single-item entry
];

describe('isFirstInBoundary', () => {
  it('returns boundary for first item in each group', () => {
    expect(isFirstInBoundary(0, boundaries)?.entryId).toBe('a');
    expect(isFirstInBoundary(3, boundaries)?.entryId).toBe('b');
    expect(isFirstInBoundary(6, boundaries)?.entryId).toBe('c');
  });

  it('returns null for non-first items', () => {
    expect(isFirstInBoundary(1, boundaries)).toBeNull();
    expect(isFirstInBoundary(2, boundaries)).toBeNull();
    expect(isFirstInBoundary(4, boundaries)).toBeNull();
    expect(isFirstInBoundary(99, boundaries)).toBeNull();
  });

  it('handles empty boundaries', () => {
    expect(isFirstInBoundary(0, [])).toBeNull();
  });
});

describe('isLastInBoundary', () => {
  it('returns boundary for last item in each group', () => {
    expect(isLastInBoundary(2, boundaries)?.entryId).toBe('a');
    expect(isLastInBoundary(5, boundaries)?.entryId).toBe('b');
    expect(isLastInBoundary(6, boundaries)?.entryId).toBe('c');
  });

  it('returns null for non-last items', () => {
    expect(isLastInBoundary(0, boundaries)).toBeNull();
    expect(isLastInBoundary(1, boundaries)).toBeNull();
    expect(isLastInBoundary(3, boundaries)).toBeNull();
    expect(isLastInBoundary(99, boundaries)).toBeNull();
  });
});

describe('isEntryNew', () => {
  const newIds = new Set(['x', 'y']);

  it('returns true for IDs in the set', () => {
    expect(isEntryNew('x', newIds)).toBe(true);
    expect(isEntryNew('y', newIds)).toBe(true);
  });

  it('returns false for IDs not in the set', () => {
    expect(isEntryNew('z', newIds)).toBe(false);
  });

  it('returns false for null/undefined entryId', () => {
    expect(isEntryNew(null, newIds)).toBe(false);
    expect(isEntryNew(undefined, newIds)).toBe(false);
  });

  it('returns false when newEntryIds is undefined', () => {
    expect(isEntryNew('x', undefined)).toBe(false);
  });
});

describe('getEntryHighlightClasses', () => {
  it('returns empty string when not new', () => {
    expect(getEntryHighlightClasses(false, true, true)).toBe('');
    expect(getEntryHighlightClasses(false, false, false)).toBe('');
  });

  it('returns full rounded outline for single-item entry', () => {
    const classes = getEntryHighlightClasses(true, true, true);
    expect(classes).toContain('rounded-md');
    expect(classes).toContain('animate-outline-fade');
    expect(classes).not.toContain('animate-outline-fade-top');
    expect(classes).not.toContain('animate-outline-fade-bottom');
  });

  it('returns top-only rounding for first of many', () => {
    const classes = getEntryHighlightClasses(true, true, false);
    expect(classes).toContain('rounded-t-md');
    expect(classes).toContain('animate-outline-fade-top');
    expect(classes).not.toContain('pb-0.5');
  });

  it('returns bottom-only rounding for last of many', () => {
    const classes = getEntryHighlightClasses(true, false, true);
    expect(classes).toContain('rounded-b-md');
    expect(classes).toContain('animate-outline-fade-bottom');
    expect(classes).toContain('pb-0.5');
  });

  it('returns middle classes for middle items', () => {
    const classes = getEntryHighlightClasses(true, false, false);
    expect(classes).toContain('animate-outline-fade-middle');
    expect(classes).not.toContain('rounded');
  });

  it('always includes left padding when new', () => {
    expect(getEntryHighlightClasses(true, true, true)).toContain('pl-0.5');
    expect(getEntryHighlightClasses(true, false, false)).toContain('pl-0.5');
  });
});

describe('hasAnyEditedFields', () => {
  it('returns true when editedFields has entries', () => {
    expect(hasAnyEditedFields({ editedFields: ['calories'] })).toBe(true);
    expect(hasAnyEditedFields({ editedFields: ['calories', 'protein'] })).toBe(true);
  });

  it('returns false when editedFields is empty', () => {
    expect(hasAnyEditedFields({ editedFields: [] })).toBe(false);
  });

  it('returns false when editedFields is undefined', () => {
    expect(hasAnyEditedFields({})).toBe(false);
  });
});

describe('formatEditedFields', () => {
  it('formats single field', () => {
    expect(formatEditedFields({ editedFields: ['calories'] })).toBe('Edited: Calories');
  });

  it('formats multiple fields with commas', () => {
    expect(formatEditedFields({ editedFields: ['calories', 'protein'] })).toBe('Edited: Calories, Protein');
  });

  it('capitalizes field names', () => {
    expect(formatEditedFields({ editedFields: ['description'] })).toBe('Edited: Description');
    expect(formatEditedFields({ editedFields: ['weight_lbs'] })).toBe('Edited: Weight_lbs');
  });

  it('returns null for empty editedFields', () => {
    expect(formatEditedFields({ editedFields: [] })).toBeNull();
  });

  it('returns null for undefined editedFields', () => {
    expect(formatEditedFields({})).toBeNull();
  });
});
