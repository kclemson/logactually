import { supabase } from '@/integrations/supabase/client';

export const MEMORY_BUCKET = 'memory-media';

// Signed URLs are minted with a long TTL so nothing expires while the user is
// browsing a session. The in-memory cache treats an entry as valid for a bit
// less than the real TTL to leave a safety margin.
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 12; // 12h
const SIGNED_URL_CACHE_MARGIN_MS = 60 * 1000; // re-mint 1 min before real expiry

export type MediaKind = 'image' | 'video';

/** Map a MIME type to a supported media kind, or null if unsupported. */
export function mediaKindFromMime(mime: string | null | undefined): MediaKind | null {
  if (!mime) return null;
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  return null;
}

/** Lowercase file extension (without dot), falling back to a kind-based default. */
export function fileExtension(fileName: string, kind: MediaKind): string {
  const match = /\.([a-z0-9]+)$/i.exec(fileName);
  if (match) return match[1].toLowerCase();
  return kind === 'video' ? 'mp4' : 'jpg';
}

/** Storage folder for a single entry's media: `{userId}/{entryId}`. */
export function buildEntryFolder(userId: string, entryId: string): string {
  return `${userId}/${entryId}`;
}

/** Full storage path for a media file. */
export function buildMediaPath(
  userId: string,
  entryId: string,
  mediaId: string,
  ext: string,
): string {
  return `${buildEntryFolder(userId, entryId)}/${mediaId}.${ext}`;
}

/** Full storage path for a video's poster (first-frame) image. */
export function buildPosterPath(userId: string, entryId: string, mediaId: string): string {
  return `${buildEntryFolder(userId, entryId)}/${mediaId}-poster.jpg`;
}

// ---------------------------------------------------------------------------
// Signed URL cache (browser only — relies on Supabase storage)
// ---------------------------------------------------------------------------

interface CacheEntry {
  url: string;
  expiresAt: number;
}

const signedUrlCache = new Map<string, CacheEntry>();

/** Drop a cached signed URL so the next request re-mints it (e.g. after a load error). */
export function invalidateSignedUrl(path: string): void {
  signedUrlCache.delete(path);
}

/**
 * Return a signed URL for a private media path, cached with a long TTL so it
 * never ages out mid-session. Returns null if the path can't be signed.
 */
export async function getSignedMemoryUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const cached = signedUrlCache.get(path);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  const { data, error } = await supabase.storage
    .from(MEMORY_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) return null;

  signedUrlCache.set(path, {
    url: data.signedUrl,
    expiresAt: Date.now() + SIGNED_URL_TTL_SECONDS * 1000 - SIGNED_URL_CACHE_MARGIN_MS,
  });
  return data.signedUrl;
}

// ---------------------------------------------------------------------------
// Client-side media processing (browser only — relies on canvas/<video>)
// ---------------------------------------------------------------------------

export interface ProcessedImage {
  blob: Blob;
  width: number;
  height: number;
}

const MAX_IMAGE_DIMENSION = 1920; // big enough for full-bleed viewing

/**
 * Resize (if oversized) and re-encode an image to JPEG for compact, full-bleed
 * display. Returns the processed blob and its final dimensions.
 */
export function processImageFile(file: File): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not decode image'));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          const scale = MAX_IMAGE_DIMENSION / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas unavailable'));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Could not encode image'));
            resolve({ blob, width, height });
          },
          'image/jpeg',
          0.85,
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export interface VideoMeta {
  posterBlob: Blob | null;
  width: number;
  height: number;
  duration: number;
}

/**
 * Extract a poster frame (first frame), dimensions, and duration from a video
 * file. Poster generation is best-effort; posterBlob may be null on failure.
 */
export function extractVideoMeta(file: File): Promise<VideoMeta> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    let settled = false;

    const cleanup = () => URL.revokeObjectURL(url);
    const finish = (meta: VideoMeta) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(meta);
    };

    video.onloadeddata = () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      // Seek slightly past the start so the frame isn't black.
      const seekTo = Math.min(0.1, duration || 0);
      const grab = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return finish({ posterBlob: null, width, height, duration });
          ctx.drawImage(video, 0, 0, width, height);
          canvas.toBlob(
            (blob) => finish({ posterBlob: blob, width, height, duration }),
            'image/jpeg',
            0.8,
          );
        } catch {
          finish({ posterBlob: null, width, height, duration });
        }
      };
      video.onseeked = grab;
      try {
        video.currentTime = seekTo;
      } catch {
        grab();
      }
    };
    video.onerror = () => finish({ posterBlob: null, width: 0, height: 0, duration: 0 });
    video.src = url;
  });
}

/** Format a video duration (seconds) as M:SS. */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '';
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Display a category as a hashtag. Leaves an existing leading `#` untouched
 * (and tolerates surrounding whitespace) so users who type `#Foo` don't get
 * `##Foo`. The stored value is never modified — this is display-only.
 */
export function formatTag(category: string | null | undefined): string {
  const trimmed = (category ?? '').trim();
  if (!trimmed) return '';
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

