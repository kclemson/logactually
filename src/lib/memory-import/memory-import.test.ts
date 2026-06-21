import { describe, it, expect } from 'vitest';
import { parseMemoryFile, parseDateString } from './index';
import { extractHashtags, isHashtagOnlyLine } from './hashtags';

const SAMPLE = `
<p>Best Things Today:</p>
<p>February 1, 2023</p>
<p>1. The first good thing happened today and it was lovely.</p>
<p>2. The second good thing also happened.</p>
<figure>
  <img src="https://cdn.example.com/full/photo-a.jpg" width="1456" height="1941"
    srcset="https://cdn.example.com/w424/photo-a.jpg 424w, https://cdn.example.com/w1456/photo-a.jpg 1456w, https://cdn.example.com/w2912/photo-a.jpg 2912w" />
</figure>
<p>#BestThingsToday</p>
`;

describe('parseDateString', () => {
  it('parses "Month D, YYYY"', () => {
    expect(parseDateString('February 1, 2023')).toBe('2023-02-01');
    expect(parseDateString('December 25, 1999')).toBe('1999-12-25');
  });
  it('parses ISO dates', () => {
    expect(parseDateString('2023-02-01')).toBe('2023-02-01');
  });
  it('returns null when no date', () => {
    expect(parseDateString('just some words')).toBeNull();
  });
});

describe('hashtags', () => {
  it('extracts hashtags verbatim', () => {
    expect(extractHashtags('hello #World and #foo_bar')).toEqual(['#World', '#foo_bar']);
  });
  it('detects hashtag-only lines', () => {
    expect(isHashtagOnlyLine('#a #b')).toBe(true);
    expect(isHashtagOnlyLine('text #a')).toBe(false);
  });
});

describe('parseMemoryFile', () => {
  const post = parseMemoryFile(SAMPLE, 'sample.html');

  it('extracts the date', () => {
    expect(post.date).toBe('2023-02-01');
  });
  it('strips header, date and hashtag lines from the note', () => {
    expect(post.note).not.toContain('Best Things Today');
    expect(post.note).not.toContain('February 1, 2023');
    expect(post.note).not.toContain('#BestThingsToday');
    expect(post.note).toContain('The first good thing');
    expect(post.note).toContain('The second good thing');
  });
  it('uses the first hashtag as category', () => {
    expect(post.category).toBe('#BestThingsToday');
  });
  it('prefers a web-sized srcset variant within bounds', () => {
    expect(post.images).toHaveLength(1);
    expect(post.images[0].url).toBe('https://cdn.example.com/w1456/photo-a.jpg');
    expect(post.images[0].width).toBe(1456);
  });
  it('counts words in the note', () => {
    expect(post.wordCount).toBeGreaterThan(0);
  });
});
