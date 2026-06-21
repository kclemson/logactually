/**
 * Resolves the effective "featured" custom log type for the view toggle.
 *
 * Semantics of the stored `defaultFocusedTypeId` setting:
 * - `null` / unset      -> derive: the most-recently-created custom log type.
 * - `'none'` sentinel   -> the user explicitly opted out; no featured segment.
 * - a valid type id     -> that type (if it still exists).
 * - a stale/deleted id  -> falls back to derive (most-recently-created).
 *
 * This keeps the default generic: a freshly created type (including a Photo
 * Scrapbook) automatically becomes featured without any type-specific branch.
 */

export const FOCUSED_NONE = 'none';

interface CreatedAtLike {
  id: string;
  created_at: string;
}

/** Returns the type ids sorted newest-created first. */
function newestFirst<T extends CreatedAtLike>(types: T[]): T[] {
  return [...types].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function resolveFocusedTypeId<T extends CreatedAtLike>(
  stored: string | null | undefined,
  types: T[],
): string | null {
  if (stored === FOCUSED_NONE) return null;
  if (stored && types.some((t) => t.id === stored)) return stored;
  return newestFirst(types)[0]?.id ?? null;
}
