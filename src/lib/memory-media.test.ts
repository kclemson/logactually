import { describe, it, expect } from 'vitest';
import {
  mediaKindFromMime,
  fileExtension,
  buildEntryFolder,
  buildMediaPath,
  buildPosterPath,
  formatDuration,
} from './memory-media';

describe('mediaKindFromMime', () => {
  it('detects images', () => {
    expect(mediaKindFromMime('image/jpeg')).toBe('image');
    expect(mediaKindFromMime('image/png')).toBe('image');
    expect(mediaKindFromMime('image/heic')).toBe('image');
  });
  it('detects videos', () => {
    expect(mediaKindFromMime('video/mp4')).toBe('video');
    expect(mediaKindFromMime('video/quicktime')).toBe('video');
  });
  it('returns null for unsupported / empty', () => {
    expect(mediaKindFromMime('application/pdf')).toBeNull();
    expect(mediaKindFromMime('')).toBeNull();
    expect(mediaKindFromMime(null)).toBeNull();
    expect(mediaKindFromMime(undefined)).toBeNull();
  });
});

describe('fileExtension', () => {
  it('extracts lowercased extension', () => {
    expect(fileExtension('PHOTO.JPG', 'image')).toBe('jpg');
    expect(fileExtension('clip.MOV', 'video')).toBe('mov');
    expect(fileExtension('a.b.c.png', 'image')).toBe('png');
  });
  it('falls back by kind when missing', () => {
    expect(fileExtension('noext', 'image')).toBe('jpg');
    expect(fileExtension('noext', 'video')).toBe('mp4');
  });
});

describe('path builders', () => {
  const userId = 'user-1';
  const entryId = 'entry-1';
  const mediaId = 'media-1';

  it('builds owner-prefixed entry folder', () => {
    expect(buildEntryFolder(userId, entryId)).toBe('user-1/entry-1');
  });
  it('builds media path with extension', () => {
    expect(buildMediaPath(userId, entryId, mediaId, 'jpg')).toBe('user-1/entry-1/media-1.jpg');
  });
  it('builds poster path', () => {
    expect(buildPosterPath(userId, entryId, mediaId)).toBe('user-1/entry-1/media-1-poster.jpg');
  });
  it('always nests under the owner id (RLS prefix)', () => {
    expect(buildMediaPath(userId, entryId, mediaId, 'mp4').startsWith(`${userId}/`)).toBe(true);
  });
});

describe('formatDuration', () => {
  it('formats seconds as M:SS', () => {
    expect(formatDuration(5)).toBe('0:05');
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(600)).toBe('10:00');
  });
  it('returns empty for missing / zero', () => {
    expect(formatDuration(0)).toBe('');
    expect(formatDuration(null)).toBe('');
    expect(formatDuration(undefined)).toBe('');
  });
});
