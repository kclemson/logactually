import { describe, it, expect } from 'vitest';
import {
  preprocessText,
  jaccardSimilarity,
  extractCandidateFoodWords,
  hybridSimilarityScore,
  createItemsSignature,
} from './text-similarity';

// ---------------------------------------------------------------------------
// preprocessText
// ---------------------------------------------------------------------------

describe('preprocessText', () => {
  it('lowercases input', () => {
    expect(preprocessText('CHICKEN BREAST')).toContain('breast');
    expect(preprocessText('CHICKEN BREAST')).toContain('chicken');
  });

  it('removes stop words', () => {
    const result = preprocessText('a cup of the rice');
    expect(result).not.toContain('a');
    expect(result).not.toContain('of');
    expect(result).not.toContain('the');
    expect(result).toContain('cup');
    expect(result).toContain('rice');
  });

  it('removes numbers', () => {
    expect(preprocessText('2 eggs and 3 slices of toast')).not.toMatch(/\d/);
  });

  it('sorts words alphabetically', () => {
    const result = preprocessText('chicken grilled breast');
    expect(result).toBe('breast chicken grilled');
  });

  it('expands single-word abbreviation "tbsp"', () => {
    const result = preprocessText('2 tbsp peanut butter');
    expect(result).toContain('tablespoon');
    expect(result).not.toContain('tbsp');
  });

  it('expands single-word abbreviation "pb"', () => {
    const result = preprocessText('pb sandwich');
    expect(result).toContain('butter');
    expect(result).toContain('peanut');
  });

  it('expands multi-word abbreviation "fl oz"', () => {
    const result = preprocessText('8 fl oz milk');
    expect(result).toContain('fluid');
    expect(result).toContain('ounce');
  });

  it('expands "fl. oz." with dots', () => {
    const result = preprocessText('8 fl. oz. milk');
    expect(result).toContain('fluid');
    expect(result).toContain('ounce');
  });

  it('expands food-specific abbreviations', () => {
    const result = preprocessText('choc chip cookies');
    expect(result).toContain('chocolate');
  });
});

// ---------------------------------------------------------------------------
// jaccardSimilarity
// ---------------------------------------------------------------------------

describe('jaccardSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(jaccardSimilarity('chicken breast', 'chicken breast')).toBe(1);
  });

  it('returns 0 for completely disjoint strings', () => {
    expect(jaccardSimilarity('chicken breast', 'pasta sauce')).toBe(0);
  });

  it('returns value between 0 and 1 for partial overlap', () => {
    const sim = jaccardSimilarity('chicken breast grilled', 'chicken breast fried');
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThan(1);
    // 2 shared out of 4 unique → 0.5
    expect(sim).toBeCloseTo(0.5, 1);
  });

  it('returns 1 for two empty strings', () => {
    expect(jaccardSimilarity('', '')).toBe(1);
  });

  it('returns 0 when one string is empty', () => {
    expect(jaccardSimilarity('chicken', '')).toBe(0);
    expect(jaccardSimilarity('', 'chicken')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// extractCandidateFoodWords
// ---------------------------------------------------------------------------

describe('extractCandidateFoodWords', () => {
  it('strips history reference words', () => {
    const result = extractCandidateFoodWords('another tilapia like from yesterday');
    expect(result).toContain('tilapia');
    expect(result).not.toContain('another');
    expect(result).not.toContain('yesterday');
    expect(result).not.toContain('like');
  });

  it('strips meal references', () => {
    const result = extractCandidateFoodWords('the pasta from lunch');
    expect(result).toContain('pasta');
    expect(result).not.toContain('lunch');
  });

  it('keeps food words', () => {
    const result = extractCandidateFoodWords('grilled chicken breast');
    expect(result).toContain('grilled');
    expect(result).toContain('chicken');
    expect(result).toContain('breast');
  });

  it('removes numbers', () => {
    const result = extractCandidateFoodWords('2 eggs from yesterday');
    expect(result).toContain('eggs');
    expect(result).not.toContain('2');
  });

  it('expands abbreviations before filtering', () => {
    const result = extractCandidateFoodWords('pb toast from earlier');
    expect(result).toContain('peanut');
    expect(result).toContain('butter');
    expect(result).toContain('toast');
    expect(result).not.toContain('earlier');
  });
});

// ---------------------------------------------------------------------------
// hybridSimilarityScore
// ---------------------------------------------------------------------------

describe('hybridSimilarityScore', () => {
  it('returns 0 for empty candidate words', () => {
    expect(hybridSimilarityScore([], 'chicken breast')).toBe(0);
  });

  it('returns high score when all candidate words match', () => {
    const score = hybridSimilarityScore(['chicken', 'breast'], 'Grilled chicken breast with rice');
    expect(score).toBeGreaterThan(0.5);
  });

  it('returns low score when no candidate words match', () => {
    const score = hybridSimilarityScore(['pizza', 'pepperoni'], 'Grilled chicken breast');
    expect(score).toBe(0);
  });

  it('fuzzy matches close spellings', () => {
    // "chiken" is 1 edit from "chicken"
    const score = hybridSimilarityScore(['chiken'], 'chicken breast');
    expect(score).toBeGreaterThan(0);
  });

  it('containment is weighted higher than Jaccard', () => {
    // 1 word matching 1 of 1 candidate → high containment
    const score = hybridSimilarityScore(['tilapia'], 'grilled tilapia with lemon');
    // containment = 1.0 (1/1), Jaccard lower
    expect(score).toBeGreaterThan(0.7 * 1.0); // at least the containment portion
  });
});

// ---------------------------------------------------------------------------
// createItemsSignature
// ---------------------------------------------------------------------------

describe('createItemsSignature', () => {
  it('creates signature from multiple food items', () => {
    const items = [
      { description: 'Grilled Chicken' },
      { description: 'Brown Rice' },
    ] as any[];
    const sig = createItemsSignature(items);
    expect(sig).toContain('chicken');
    expect(sig).toContain('rice');
    expect(sig).toContain('brown');
    expect(sig).toContain('grilled');
  });
});
