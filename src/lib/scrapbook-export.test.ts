import { describe, it, expect } from 'vitest';
import {
  slugify,
  extensionOf,
  sanitizeFilename,
  resolveExportFilename,
  buildScrapbookExport,
  renderScrapbookHtml,
  escapeHtml,
  type ExportScrapbookInput,
  type ExportMediaInput,
} from './scrapbook-export';

function media(over: Partial<ExportMediaInput> = {}): ExportMediaInput {
  return {
    id: 'm1',
    entry_id: 'e1',
    kind: 'image',
    mime_type: 'image/jpeg',
    width: 1920,
    height: 1080,
    duration_secs: null,
    sort_order: 0,
    original_filename: null,
    storage_path: 'u/e1/abc-guid.jpg',
    poster_path: null,
    ...over,
  };
}

describe('slugify', () => {
  it('makes a url-safe lowercase slug', () => {
    expect(slugify('My Travel Diary!')).toBe('my-travel-diary');
  });
  it('strips accents', () => {
    expect(slugify('Café Trip')).toBe('cafe-trip');
  });
  it('falls back when empty', () => {
    expect(slugify('   ')).toBe('scrapbook');
    expect(slugify('')).toBe('scrapbook');
  });
});

describe('extensionOf', () => {
  it('extracts the lowercase extension', () => {
    expect(extensionOf('photo.JPG')).toBe('jpg');
    expect(extensionOf('u/e1/x.mp4')).toBe('mp4');
  });
  it('returns empty when none', () => {
    expect(extensionOf('noext')).toBe('');
    expect(extensionOf(null)).toBe('');
  });
});

describe('sanitizeFilename', () => {
  it('keeps a clean name', () => {
    expect(sanitizeFilename('rome-sunset.jpg')).toBe('rome-sunset.jpg');
  });
  it('strips directory traversal and separators', () => {
    expect(sanitizeFilename('../../etc/passwd')).toBe('passwd');
    expect(sanitizeFilename('a/b/c.png')).toBe('c.png');
  });
  it('removes illegal characters', () => {
    expect(sanitizeFilename('a:b*c?.jpg')).toBe('a b c .jpg'.replace(/\s+/g, ' '));
  });
  it('returns empty for nothing usable', () => {
    expect(sanitizeFilename(null)).toBe('');
    expect(sanitizeFilename('   ')).toBe('');
  });
});

describe('resolveExportFilename', () => {
  const ctx = { slug: 'travel', date: '2026-06-01', index: 0 };
  it('uses the original filename when present', () => {
    expect(resolveExportFilename(media({ original_filename: 'rome-sunset.jpg' }), ctx)).toBe('rome-sunset.jpg');
  });
  it('adds an extension if the original lacks one', () => {
    expect(resolveExportFilename(media({ original_filename: 'rome', storage_path: 'u/e/x.png' }), ctx)).toBe('rome.png');
  });
  it('falls back to a friendly name (never a guid)', () => {
    const name = resolveExportFilename(media({ original_filename: null }), ctx);
    expect(name).toBe('travel-2026-06-01-01.jpg');
  });
  it('falls back with the index in the name', () => {
    const name = resolveExportFilename(media({ original_filename: null }), { ...ctx, index: 4 });
    expect(name).toBe('travel-2026-06-01-05.jpg');
  });
  it('derives video extension from storage path', () => {
    const name = resolveExportFilename(
      media({ kind: 'video', original_filename: null, storage_path: 'u/e/x.mov' }),
      ctx,
    );
    expect(name).toBe('travel-2026-06-01-01.mov');
  });
});

describe('buildScrapbookExport', () => {
  const exportedAt = new Date('2026-06-22T12:00:00.000Z');

  function sb(over: Partial<ExportScrapbookInput> = {}): ExportScrapbookInput {
    return {
      log_type_id: 'lt1',
      name: 'Travel',
      entries: [
        {
          id: 'e1',
          date: '2026-06-01',
          created_at: '2026-06-01T10:00:00.000Z',
          category: 'italy',
          note: 'Hello',
          media: [media({ id: 'm1', original_filename: 'rome.jpg' })],
        },
      ],
      ...over,
    };
  }

  it('produces a versioned manifest and fetch tasks', () => {
    const { manifest, tasks } = buildScrapbookExport([sb()], exportedAt);
    expect(manifest.schema).toBe('logactually.scrapbook.export');
    expect(manifest.version).toBe(1);
    expect(manifest.exported_at).toBe('2026-06-22T12:00:00.000Z');
    expect(manifest.scrapbooks).toHaveLength(1);
    const book = manifest.scrapbooks[0];
    expect(book.slug).toBe('travel');
    expect(book.entry_count).toBe(1);
    expect(book.media_count).toBe(1);
    expect(book.entries[0].media[0].file).toBe('media/travel/2026-06-01/rome.jpg');
    expect(tasks).toEqual([{ storage_path: 'u/e1/abc-guid.jpg', zip_path: 'media/travel/2026-06-01/rome.jpg' }]);
  });

  it('preserves the entry<->media reference (entry_id on each media)', () => {
    const { manifest } = buildScrapbookExport([sb()], exportedAt);
    const m = manifest.scrapbooks[0].entries[0].media[0];
    expect(m.entry_id).toBe('e1');
  });

  it('de-duplicates colliding filenames within a date folder', () => {
    const input = sb({
      entries: [
        {
          id: 'e1',
          date: '2026-06-01',
          created_at: '2026-06-01T10:00:00.000Z',
          category: null,
          note: null,
          media: [
            media({ id: 'm1', original_filename: 'pic.jpg', storage_path: 'u/e1/a.jpg' }),
            media({ id: 'm2', original_filename: 'pic.jpg', storage_path: 'u/e1/b.jpg' }),
          ],
        },
      ],
    });
    const { manifest, tasks } = buildScrapbookExport([input], exportedAt);
    const files = manifest.scrapbooks[0].entries[0].media.map((m) => m.file);
    expect(files).toEqual([
      'media/travel/2026-06-01/pic.jpg',
      'media/travel/2026-06-01/pic (2).jpg',
    ]);
    expect(tasks).toHaveLength(2);
  });

  it('includes posters as separate fetch tasks for videos', () => {
    const input = sb({
      entries: [
        {
          id: 'e1',
          date: '2026-06-01',
          created_at: '2026-06-01T10:00:00.000Z',
          category: null,
          note: null,
          media: [
            media({
              id: 'm1',
              kind: 'video',
              original_filename: 'clip.mp4',
              storage_path: 'u/e1/v.mp4',
              poster_path: 'u/e1/v-poster.jpg',
            }),
          ],
        },
      ],
    });
    const { manifest, tasks } = buildScrapbookExport([input], exportedAt);
    const m = manifest.scrapbooks[0].entries[0].media[0];
    expect(m.file).toBe('media/travel/2026-06-01/clip.mp4');
    expect(m.poster).toBe('media/travel/2026-06-01/clip-poster.jpg');
    expect(tasks).toContainEqual({ storage_path: 'u/e1/v-poster.jpg', zip_path: 'media/travel/2026-06-01/clip-poster.jpg' });
  });

  it('gives unique folder slugs to same-named scrapbooks', () => {
    const { manifest } = buildScrapbookExport([sb({ log_type_id: 'a' }), sb({ log_type_id: 'b' })], exportedAt);
    expect(manifest.scrapbooks[0].slug).toBe('travel');
    expect(manifest.scrapbooks[1].slug).toBe('travel-2');
  });

  it('handles text-only entries with no media', () => {
    const input = sb({
      entries: [
        {
          id: 'e1',
          date: '2026-06-01',
          created_at: '2026-06-01T10:00:00.000Z',
          category: null,
          note: 'just text',
          media: [],
        },
      ],
    });
    const { manifest, tasks } = buildScrapbookExport([input], exportedAt);
    expect(manifest.scrapbooks[0].entries[0].media).toEqual([]);
    expect(tasks).toHaveLength(0);
  });
});

describe('escapeHtml', () => {
  it('escapes html-significant characters', () => {
    expect(escapeHtml('<b>&"\'')).toBe('&lt;b&gt;&amp;&quot;&#39;');
  });
});

describe('renderScrapbookHtml', () => {
  const exportedAt = new Date('2026-06-22T12:00:00.000Z');
  const input: ExportScrapbookInput = {
    log_type_id: 'lt1',
    name: 'Travel',
    entries: [
      {
        id: 'e1',
        date: '2026-06-01',
        created_at: '2026-06-01T10:00:00.000Z',
        category: 'italy',
        note: '<script>alert(1)</script>',
        media: [media({ id: 'm1', original_filename: 'rome.jpg' })],
      },
    ],
  };

  it('escapes user note text (no raw script tag)', () => {
    const { manifest } = buildScrapbookExport([input], exportedAt);
    const html = renderScrapbookHtml(manifest);
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('embeds the manifest data and references media by relative path', () => {
    const { manifest } = buildScrapbookExport([input], exportedAt);
    const html = renderScrapbookHtml(manifest);
    expect(html).toContain('id="scrapbook-data"');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('media/travel/2026-06-01/rome.jpg');
    expect(html).toContain('data-entry-id="e1"');
  });
});
