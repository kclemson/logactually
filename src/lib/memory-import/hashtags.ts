/**
 * Extract hashtags from arbitrary text, preserving the exact tag text
 * (including the leading `#`). Generic by design — there is no per-tag or
 * per-source handling anywhere in the importer.
 */
export function extractHashtags(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/#[\p{L}\p{N}_]+/gu);
  return matches ? Array.from(matches) : [];
}

/** Return true if a line, once trimmed, consists solely of hashtags. */
export function isHashtagOnlyLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return /^(#[\p{L}\p{N}_]+\s*)+$/u.test(trimmed);
}
