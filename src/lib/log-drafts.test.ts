import { describe, it, expect } from 'vitest';
import { getDraft, setDraft } from './log-drafts';

describe('log drafts', () => {
  it('keeps a draft between reads', () => {
    setDraft('food', '2 eggs and toast');
    expect(getDraft('food')).toBe('2 eggs and toast');
  });
  it('clearing removes the draft', () => {
    setDraft('food', 'x');
    setDraft('food', '');
    expect(getDraft('food')).toBe('');
  });
  it('drafts are separate per box', () => {
    setDraft('weights', 'squats');
    expect(getDraft('food')).toBe('');
  });
});
