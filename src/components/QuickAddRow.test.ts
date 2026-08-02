import { describe, it, expect } from 'vitest';
import { shortenChipName } from './QuickAddRow';

describe('shortenChipName', () => {
  it('leaves short names untouched', () => {
    expect(shortenChipName('Coffee')).toBe('Coffee');
  });

  it('breaks at a word boundary', () => {
    expect(shortenChipName('Strawberries and Chobani yogurt')).toBe('Strawberries and…');
  });

  it('hard-cuts a single very long word', () => {
    expect(shortenChipName('Supercalifragilisticexpialidocious')).toBe('Supercalifragilist…');
  });

  it('drops trailing punctuation before the ellipsis', () => {
    expect(shortenChipName('Barebell bar - Cookies & cream')).toBe('Barebell bar…');
  });
});
