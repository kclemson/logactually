/**
 * Pure builders for the scrapbook ("memory" custom log) data export.
 *
 * The export bundles every scrapbook into a single zip containing:
 *  - `index.html`     — a self-contained, offline-renderable gallery
 *  - `metadata.json`  — a versioned, machine-readable manifest
 *  - `media/…`        — the actual photos/videos (+ video posters)
 *
 * Everything here is side-effect-free so it can be unit tested; the network
 * (signed-URL download) and zip assembly live in the export hook.
 */

export const SCRAPBOOK_EXPORT_SCHEMA = 'logactually.scrapbook.export';
export const SCRAPBOOK_EXPORT_VERSION = 1;
export const SCRAPBOOK_EXPORT_APP = 'Log Actually';

// ---------------------------------------------------------------------------
// Inputs (shaped by the export hook from DB rows)
// ---------------------------------------------------------------------------

export interface ExportMediaInput {
  id: string;
  entry_id: string;
  kind: 'image' | 'video';
  mime_type: string | null;
  width: number | null;
  height: number | null;
  duration_secs: number | null;
  sort_order: number;
  original_filename: string | null;
  /** Internal storage path (GUID-based) — used to fetch + derive an extension. */
  storage_path: string;
  poster_path: string | null;
}

export interface ExportEntryInput {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  created_at: string;
  category: string | null;
  note: string | null;
  media: ExportMediaInput[];
}

export interface ExportScrapbookInput {
  log_type_id: string;
  name: string;
  entries: ExportEntryInput[];
}

// ---------------------------------------------------------------------------
// Manifest (output)
// ---------------------------------------------------------------------------

export interface ManifestMedia {
  id: string;
  entry_id: string;
  kind: 'image' | 'video';
  mime_type: string | null;
  original_filename: string | null;
  /** Relative path of the media file within the zip. */
  file: string;
  /** Relative path of the video poster within the zip, or null. */
  poster: string | null;
  width: number | null;
  height: number | null;
  duration_secs: number | null;
  sort_order: number;
}

export interface ManifestEntry {
  id: string;
  date: string;
  created_at: string;
  category: string | null;
  note: string | null;
  media: ManifestMedia[];
}

export interface ManifestScrapbook {
  log_type_id: string;
  name: string;
  slug: string;
  entry_count: number;
  media_count: number;
  entries: ManifestEntry[];
}

export interface ScrapbookManifest {
  schema: string;
  version: number;
  app: string;
  exported_at: string;
  scrapbooks: ManifestScrapbook[];
}

/** A single file the hook must download from storage into the zip. */
export interface MediaFetchTask {
  storage_path: string;
  zip_path: string;
}

export interface BuiltExport {
  manifest: ScrapbookManifest;
  tasks: MediaFetchTask[];
}

// ---------------------------------------------------------------------------
// Filename helpers
// ---------------------------------------------------------------------------

/** URL/path-safe lowercase slug for a scrapbook name. */
export function slugify(name: string): string {
  const slug = (name ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'scrapbook';
}

/** Lowercase extension (without dot) from a path/filename, or '' if none. */
export function extensionOf(nameOrPath: string | null | undefined): string {
  if (!nameOrPath) return '';
  const m = /\.([a-z0-9]+)$/i.exec(nameOrPath.trim());
  return m ? m[1].toLowerCase() : '';
}

/**
 * Make an arbitrary user-supplied filename safe to write into a zip: strip any
 * directory components and control/illegal characters, collapse whitespace, and
 * cap length. Returns '' when nothing usable remains.
 */
export function sanitizeFilename(name: string | null | undefined): string {
  if (!name) return '';
  // Keep only the final path segment (defeat ../ and absolute paths).
  const base = name.replace(/\\/g, '/').split('/').pop() ?? '';
  const cleaned = base
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f<>:"/\\|?*]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[ .]+|[ .]+$/g, '')
    .trim();
  return cleaned.slice(0, 120);
}

/**
 * Choose the export filename for a media item: the original upload name when we
 * have one (sanitized, with a guaranteed extension), otherwise a friendly
 * generated name — never a raw GUID.
 */
export function resolveExportFilename(
  media: ExportMediaInput,
  ctx: { slug: string; date: string; index: number },
): string {
  const ext = extensionOf(media.original_filename) || extensionOf(media.storage_path) ||
    (media.kind === 'video' ? 'mp4' : 'jpg');

  const sanitized = sanitizeFilename(media.original_filename);
  if (sanitized) {
    return extensionOf(sanitized) ? sanitized : `${sanitized}.${ext}`;
  }

  const nn = String(ctx.index + 1).padStart(2, '0');
  return `${ctx.slug}-${ctx.date}-${nn}.${ext}`;
}

/** Split a filename into stem + dotted extension (e.g. "a.jpg" -> ["a", ".jpg"]). */
function splitName(name: string): [string, string] {
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return [name, ''];
  return [name.slice(0, dot), name.slice(dot)];
}

/** Return a name unique within `used` (case-insensitive), adding " (2)", " (3)"… */
function uniqueName(name: string, used: Set<string>): string {
  if (!used.has(name.toLowerCase())) {
    used.add(name.toLowerCase());
    return name;
  }
  const [stem, ext] = splitName(name);
  let i = 2;
  let candidate = `${stem} (${i})${ext}`;
  while (used.has(candidate.toLowerCase())) {
    i++;
    candidate = `${stem} (${i})${ext}`;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

// ---------------------------------------------------------------------------
// Manifest builder
// ---------------------------------------------------------------------------

/**
 * Build the export manifest and the list of media files to fetch. Filenames are
 * resolved and de-duplicated per (scrapbook, date) folder so the on-disk layout
 * is collision-free and human-readable.
 */
export function buildScrapbookExport(
  scrapbooks: ExportScrapbookInput[],
  exportedAt: Date = new Date(),
): BuiltExport {
  const tasks: MediaFetchTask[] = [];
  const usedSlugs = new Set<string>();

  const manifestScrapbooks: ManifestScrapbook[] = scrapbooks.map((sb) => {
    // Ensure scrapbook folder slugs are unique across the whole export.
    let slug = slugify(sb.name);
    if (usedSlugs.has(slug)) {
      let i = 2;
      while (usedSlugs.has(`${slug}-${i}`)) i++;
      slug = `${slug}-${i}`;
    }
    usedSlugs.add(slug);

    // Track used filenames per date folder (filenames + posters share the space).
    const usedByFolder = new Map<string, Set<string>>();
    const usedFor = (folder: string) => {
      let set = usedByFolder.get(folder);
      if (!set) {
        set = new Set<string>();
        usedByFolder.set(folder, set);
      }
      return set;
    };

    let mediaCount = 0;

    const entries: ManifestEntry[] = sb.entries.map((entry) => {
      const folder = `media/${slug}/${entry.date}`;
      const used = usedFor(folder);

      const media: ManifestMedia[] = entry.media.map((m, idx) => {
        const desired = resolveExportFilename(m, { slug, date: entry.date, index: idx });
        const fileName = uniqueName(desired, used);
        const zipFile = `${folder}/${fileName}`;
        tasks.push({ storage_path: m.storage_path, zip_path: zipFile });

        let posterRel: string | null = null;
        if (m.poster_path) {
          const [stem] = splitName(fileName);
          const posterName = uniqueName(`${stem}-poster.jpg`, used);
          posterRel = `${folder}/${posterName}`;
          tasks.push({ storage_path: m.poster_path, zip_path: posterRel });
        }

        mediaCount++;

        return {
          id: m.id,
          entry_id: m.entry_id,
          kind: m.kind,
          mime_type: m.mime_type,
          original_filename: m.original_filename,
          file: zipFile,
          poster: posterRel,
          width: m.width,
          height: m.height,
          duration_secs: m.duration_secs,
          sort_order: m.sort_order,
        };
      });

      return {
        id: entry.id,
        date: entry.date,
        created_at: entry.created_at,
        category: entry.category,
        note: entry.note,
        media,
      };
    });

    return {
      log_type_id: sb.log_type_id,
      name: sb.name,
      slug,
      entry_count: entries.length,
      media_count: mediaCount,
      entries,
    };
  });

  const manifest: ScrapbookManifest = {
    schema: SCRAPBOOK_EXPORT_SCHEMA,
    version: SCRAPBOOK_EXPORT_VERSION,
    app: SCRAPBOOK_EXPORT_APP,
    exported_at: exportedAt.toISOString(),
    scrapbooks: manifestScrapbooks,
  };

  return { manifest, tasks };
}

// ---------------------------------------------------------------------------
// HTML rendering
// ---------------------------------------------------------------------------

/** Escape text for safe interpolation into HTML element content/attributes. */
export function escapeHtml(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escape a string for safe embedding inside a <script> JSON/JSON-LD block. */
function escapeForScript(json: string): string {
  return json.replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function formatDateHeading(date: string): string {
  // Parse as a local date without timezone surprises (YYYY-MM-DD).
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return date;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTag(category: string | null): string {
  const t = (category ?? '').trim();
  if (!t) return '';
  return t.startsWith('#') ? t : `#${t}`;
}

function renderMedia(m: ManifestMedia): string {
  const file = escapeHtml(m.file);
  const dims = m.width && m.height ? ` width="${m.width}" height="${m.height}"` : '';
  if (m.kind === 'video') {
    const poster = m.poster ? ` poster="${escapeHtml(m.poster)}"` : '';
    return `<video class="media" controls playsinline preload="metadata"${poster} data-media-id="${escapeHtml(m.id)}"><source src="${file}"${m.mime_type ? ` type="${escapeHtml(m.mime_type)}"` : ''}></video>`;
  }
  return `<img class="media" loading="lazy" src="${file}" alt="${escapeHtml(m.original_filename ?? '')}"${dims} data-media-id="${escapeHtml(m.id)}">`;
}

function renderEntry(entry: ManifestEntry): string {
  const tag = formatTag(entry.category);
  const tagHtml = tag ? `<span class="tag">${escapeHtml(tag)}</span>` : '';
  const noteHtml = entry.note
    ? `<p class="note">${escapeHtml(entry.note).replace(/\n/g, '<br>')}</p>`
    : '';
  const mediaHtml = entry.media.length
    ? `<div class="media-grid">${entry.media.map(renderMedia).join('')}</div>`
    : '';
  return `<article class="entry" data-entry-id="${escapeHtml(entry.id)}">
  <header class="entry-head"><time datetime="${escapeHtml(entry.date)}">${escapeHtml(formatDateHeading(entry.date))}</time>${tagHtml}</header>
  ${mediaHtml}
  ${noteHtml}
</article>`;
}

function renderScrapbook(sb: ManifestScrapbook): string {
  const entries = sb.entries.map(renderEntry).join('\n');
  return `<section class="scrapbook" data-log-type-id="${escapeHtml(sb.log_type_id)}">
  <h2>${escapeHtml(sb.name)}</h2>
  <p class="counts">${sb.entry_count} ${sb.entry_count === 1 ? 'post' : 'posts'} · ${sb.media_count} ${sb.media_count === 1 ? 'file' : 'files'}</p>
  ${entries || '<p class="empty">No posts.</p>'}
</section>`;
}

function buildJsonLd(manifest: ScrapbookManifest): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Collection',
    name: 'Scrapbook export',
    dateCreated: manifest.exported_at,
    hasPart: manifest.scrapbooks.map((sb) => ({
      '@type': 'ImageGallery',
      name: sb.name,
      associatedMedia: sb.entries.flatMap((e) =>
        e.media.map((m) => ({
          '@type': m.kind === 'video' ? 'VideoObject' : 'ImageObject',
          contentUrl: m.file,
          ...(m.kind === 'video' && m.poster ? { thumbnailUrl: m.poster } : {}),
          ...(m.width ? { width: m.width } : {}),
          ...(m.height ? { height: m.height } : {}),
          uploadDate: e.created_at,
          ...(e.note ? { description: e.note } : {}),
        })),
      ),
    })),
  });
}

/** Render the self-contained, offline-viewable `index.html` for the manifest. */
export function renderScrapbookHtml(manifest: ScrapbookManifest): string {
  const sections = manifest.scrapbooks.map(renderScrapbook).join('\n');
  const dataJson = escapeForScript(JSON.stringify(manifest));
  const jsonLd = escapeForScript(buildJsonLd(manifest));
  const exportedHuman = new Date(manifest.exported_at).toLocaleString();

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Scrapbook export — ${escapeHtml(manifest.app)}</title>
<script type="application/ld+json">${jsonLd}</script>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; background: #0f1115; color: #e8e8ea; }
  .wrap { max-width: 920px; margin: 0 auto; padding: 24px 16px 64px; }
  .app-head h1 { margin: 0 0 4px; font-size: 1.6rem; }
  .app-head .meta { color: #9aa0a6; font-size: .85rem; margin: 0 0 24px; }
  .scrapbook { margin: 40px 0; }
  .scrapbook > h2 { font-size: 1.3rem; margin: 0 0 2px; }
  .counts { color: #9aa0a6; font-size: .8rem; margin: 0 0 16px; }
  .entry { background: #171a21; border: 1px solid #242833; border-radius: 14px; padding: 14px; margin: 0 0 16px; }
  .entry-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .entry-head time { font-weight: 600; font-size: .9rem; }
  .tag { background: rgba(20,184,166,.18); color: #2dd4bf; border-radius: 999px; padding: 2px 10px; font-size: .78rem; font-weight: 600; }
  .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
  .media { width: 100%; height: 100%; max-height: 520px; object-fit: cover; border-radius: 10px; background: #000; display: block; }
  video.media { object-fit: contain; }
  .note { margin: 12px 2px 2px; white-space: pre-wrap; }
  .empty { color: #9aa0a6; }
  a { color: #2dd4bf; }
</style>
</head>
<body>
<div class="wrap">
  <header class="app-head">
    <h1>Scrapbook export</h1>
    <p class="meta">Exported from ${escapeHtml(manifest.app)} on ${escapeHtml(exportedHuman)} · open <code>metadata.json</code> for the full machine-readable data</p>
  </header>
  ${sections}
</div>
<script type="application/json" id="scrapbook-data">${dataJson}</script>
</body>
</html>`;
}

/** Plain-text README explaining the archive layout and schema. */
export function buildReadme(manifest: ScrapbookManifest, skipped: number): string {
  const totalEntries = manifest.scrapbooks.reduce((n, s) => n + s.entry_count, 0);
  const totalMedia = manifest.scrapbooks.reduce((n, s) => n + s.media_count, 0);
  const lines: (string | null)[] = [
    `${manifest.app} — Scrapbook export`,
    `Exported: ${manifest.exported_at}`,
    `Schema: ${manifest.schema} (version ${manifest.version})`,
    '',
    `Scrapbooks: ${manifest.scrapbooks.length}`,
    `Posts: ${totalEntries}`,
    `Media files: ${totalMedia}`,
    skipped > 0 ? `Skipped (could not download): ${skipped}` : null,
    '',
    'Contents',
    '--------',
    'index.html     Open this in any browser to view the whole archive,',
    '               including photos and videos, fully offline.',
    'metadata.json  Machine-readable manifest. Every post references its media',
    '               by relative file path; each media object also carries its',
    '               entry_id, ids, dimensions, and original filename.',
    'media/         The actual photos and videos, organized as:',
    '                 media/<scrapbook>/<date>/<filename>',
    '               Original upload filenames are used where available;',
    '               older files use a friendly generated name.',
    '',
    'Note: images are stored at up to 1920px (as displayed in the app).',
  ];
  return lines.filter((l) => l !== '').join('\n') + '\n';
}
