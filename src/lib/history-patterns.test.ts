import { describe, it, expect } from 'vitest';
import { detectHistoryReference, MIN_SIMILARITY_REQUIRED } from './history-patterns';

// ---------------------------------------------------------------------------
// High confidence patterns
// ---------------------------------------------------------------------------

describe('detectHistoryReference – high confidence', () => {
  it.each([
    ['yesterday', 'the pizza from yesterday'],
    ['dayOfWeek', 'chicken from Monday'],
    ['dayOfWeek', 'on Tuesday'],
    ['dayOfWeek', 'last Friday'],
    ['monthDay', 'Feb 1'],
    ['monthDay', 'January 15th'],
    ['monthDay', 'Dec 25'],
    ['numericDate', 'from 2/1'],
    ['numericDate', 'on 1/15'],
    ['dayBefore', 'day before yesterday'],
    ['leftover', 'leftover pasta'],
    ['leftover', 'the leftovers'],
    ['otherHalf', 'other half of the pizza'],
    ['restOf', 'rest of the sandwich'],
    ['remaining', 'remaining pizza'],
    ['finished', 'finished the pasta'],
  ])('detects "%s" pattern in "%s"', (_pattern, input) => {
    const result = detectHistoryReference(input);
    expect(result.hasReference).toBe(true);
    expect(result.confidence).toBe('high');
  });
});

// ---------------------------------------------------------------------------
// Medium confidence patterns
// ---------------------------------------------------------------------------

describe('detectHistoryReference – medium confidence', () => {
  it.each([
    ['another', 'another tilapia'],
    ['sameThing', 'same thing'],
    ['sameThing', 'same as last time'],
    ['again', 'that again'],
    ['repeat', 'repeat'],
    ['earlier', 'what I had earlier'],
    ['recently', 'recently'],
    ['lastTime', 'last time I had'],
    ['lastWeek', 'last week'],
    ['fewDaysAgo', 'a few days ago'],
    ['fewDaysAgo', 'couple days ago'],
    ['aWhileAgo', 'a while ago'],
    ['hadBefore', 'had before'],
    ['otherDay', 'the other day'],
    ['moreOf', 'more of the pasta'],
    ['inMonth', 'in January'],
    ['inMonth', 'back in December'],
  ])('detects "%s" pattern in "%s"', (_pattern, input) => {
    const result = detectHistoryReference(input);
    expect(result.hasReference).toBe(true);
    expect(result.confidence).toBe('medium');
  });
});

// ---------------------------------------------------------------------------
// Low confidence patterns
// ---------------------------------------------------------------------------

describe('detectHistoryReference – low confidence', () => {
  it.each([
    ['fromMeal', 'from breakfast'],
    ['fromMeal', 'from lunch'],
    ['fromMeal', 'from dinner'],
    ['thisMorning', 'this morning'],
    ['lastNight', 'last night'],
  ])('detects "%s" pattern in "%s"', (_pattern, input) => {
    const result = detectHistoryReference(input);
    expect(result.hasReference).toBe(true);
    expect(result.confidence).toBe('low');
  });

  // "earlier today" matches medium "earlier" before low "earlierToday"
  it('earlier today resolves to medium (earlier pattern matches first)', () => {
    const result = detectHistoryReference('eggs earlier today');
    expect(result.hasReference).toBe(true);
    expect(result.confidence).toBe('medium');
  });
});

// ---------------------------------------------------------------------------
// No match
// ---------------------------------------------------------------------------

describe('detectHistoryReference – no match', () => {
  it.each([
    '2 eggs and toast',
    'grilled chicken breast',
    'large pepperoni pizza',
    '8oz salmon fillet',
    'bowl of cereal with milk',
  ])('returns no reference for plain food input: "%s"', (input) => {
    const result = detectHistoryReference(input);
    expect(result.hasReference).toBe(false);
    expect(result.matchedPatterns).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// MIN_SIMILARITY_REQUIRED thresholds
// ---------------------------------------------------------------------------

describe('MIN_SIMILARITY_REQUIRED', () => {
  it('high is most lenient', () => {
    expect(MIN_SIMILARITY_REQUIRED.high).toBeLessThan(MIN_SIMILARITY_REQUIRED.medium);
  });

  it('medium is between high and low', () => {
    expect(MIN_SIMILARITY_REQUIRED.medium).toBeLessThan(MIN_SIMILARITY_REQUIRED.low);
  });
});
