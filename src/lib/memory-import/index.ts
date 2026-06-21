import { extractHashtags, isHashtagOnlyLine } from './hashtags';
import type { ParsedImage, ParsedPost } from './types';

export type { ParsedImage, ParsedPost } from './types';
export { extractHashtags } from './hashtags';

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

/**
 * Best-effort parse of a human date string into YYYY-MM-DD. Handles the
 * common "Month D, YYYY" form without relying on the host locale/timezone.
 * Returns null when nothing date-like is found.
 */
export function parseDateString(input: string): string | null {
  const text = input.trim();
  // "February 1, 2023" / "Feb 1 2023"
  const m = text.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/i,
  );
  if (m) {
    const month = MONTHS[m[1].toLowerCase()];
    const day = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    if (month && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  // ISO-ish "2023-02-01"
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return null;
}

const PREFERRED_MAX_WIDTH = 1456;

/**
 * Pick the best download URL for an image element: from its `srcset`, the
 * largest variant not exceeding a sensible web width; otherwise its `src`.
 */
function pickImageUrl(img: HTMLImageElement): string | null {
  const srcset = img.getAttribute('srcset');
  if (srcset) {
    // Candidates are separated by a comma followed by whitespace. We can't split
    // on bare commas because image URLs themselves may contain commas.
    const candidates = srcset
      .split(/,\s+/)
      .map((part) => part.trim())
      .map((part) => {
        const [url, descriptor] = part.split(/\s+/);
        const width = descriptor && descriptor.endsWith('w')
          ? parseInt(descriptor.slice(0, -1), 10)
          : NaN;
        return { url, width };
      })
      .filter((c) => c.url);
    if (candidates.length > 0) {
      const sized = candidates.filter((c) => Number.isFinite(c.width));
      if (sized.length > 0) {
        const within = sized.filter((c) => c.width <= PREFERRED_MAX_WIDTH);
        const pool = within.length > 0 ? within : sized;
        // largest of the eligible pool
        pool.sort((a, b) => b.width - a.width);
        return pool[0].url;
      }
      return candidates[0].url;
    }
  }
  return img.getAttribute('src');
}

/** Read intrinsic dimensions from width/height attrs or a JSON `data-attrs`. */
function readDimensions(img: HTMLImageElement): { width?: number; height?: number } {
  const wAttr = parseInt(img.getAttribute('width') ?? '', 10);
  const hAttr = parseInt(img.getAttribute('height') ?? '', 10);
  if (Number.isFinite(wAttr) && Number.isFinite(hAttr)) {
    return { width: wAttr, height: hAttr };
  }
  const dataAttrs = img.getAttribute('data-attrs');
  if (dataAttrs) {
    try {
      const parsed = JSON.parse(dataAttrs);
      const w = Number(parsed.width);
      const h = Number(parsed.height);
      if (Number.isFinite(w) && Number.isFinite(h)) return { width: w, height: h };
    } catch {
      /* ignore malformed data-attrs */
    }
  }
  return {};
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Parse a single exported HTML file into a normalized {@link ParsedPost}.
 *
 * This is the only place that understands file structure. It is intentionally
 * forgiving so additional formats map cleanly onto the same output without the
 * UI or import pipeline changing. Today it handles a paragraph-based export:
 * a leading header line, a date line, body paragraphs, a trailing
 * hashtag-only line, and inline images.
 */
export function parseMemoryFile(html: string, fileName: string): ParsedPost {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const paragraphs = Array.from(doc.querySelectorAll('p'))
    .map((p) => (p.textContent ?? '').trim());

  // Detect the date line (first paragraph that looks like a date).
  let date: string | null = null;
  let dateIdx = -1;
  for (let i = 0; i < paragraphs.length; i++) {
    const parsed = parseDateString(paragraphs[i]);
    // Only treat short, date-dominant lines as the date (avoid matching a date
    // mentioned inside a long sentence).
    if (parsed && paragraphs[i].length <= 32) {
      date = parsed;
      dateIdx = i;
      break;
    }
  }

  // Build the note body: drop the date line, a leading header line (ends with
  // ":" and sits before the body), and any hashtag-only lines.
  const bodyLines: string[] = [];
  for (let i = 0; i < paragraphs.length; i++) {
    const line = paragraphs[i];
    if (!line) continue;
    if (i === dateIdx) continue;
    if (isHashtagOnlyLine(line)) continue;
    // Leading header line like "Best Things Today:" appearing at the very top.
    const isLeading = i <= Math.max(dateIdx, 0);
    if (isLeading && line.endsWith(':') && countWords(line) <= 6) continue;
    bodyLines.push(line);
  }
  const note = bodyLines.join('\n\n').trim();

  // Category = first hashtag found in the content. Extract per paragraph so
  // adjacent block text isn't concatenated onto the tag (e.g. "#Tag" + "Thanks").
  const hashtags = paragraphs.flatMap((line) => extractHashtags(line));
  const category = hashtags.length > 0 ? hashtags[0] : null;

  // Images in document order, de-duplicated by URL.
  const images: ParsedImage[] = [];
  const seen = new Set<string>();
  for (const img of Array.from(doc.querySelectorAll('img'))) {
    const url = pickImageUrl(img as HTMLImageElement);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    images.push({ url, ...readDimensions(img as HTMLImageElement) });
  }

  return {
    sourceName: fileName,
    date,
    note,
    wordCount: countWords(note),
    category,
    images,
  };
}
