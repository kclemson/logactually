import { supabase } from '@/integrations/supabase/client';

/** Return a new order with `id` swapped one step up (-1) or down (+1); null if it can't move. */
export function moveEntryId(ids: string[], id: string, dir: -1 | 1): string[] | null {
  const i = ids.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return null;
  const next = [...ids];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/** Unique entry ids in first-seen order. */
export function uniqueInOrder(ids: string[]): string[] {
  return [...new Set(ids)];
}

/** Stable sort of rows by the position of their entry id in `order`. */
export function sortByEntryOrder<T>(rows: T[], getId: (r: T) => string, order: string[]): T[] {
  const pos = new Map(order.map((id, i) => [id, i]));
  return rows
    .map((r, i) => ({ r, i }))
    .sort((a, b) => (pos.get(getId(a.r)) ?? 1e9) - (pos.get(getId(b.r)) ?? 1e9) || a.i - b.i)
    .map((x) => x.r);
}

/** Persist a day's entry order: sort_order = index. Exercise rows share their entry's value. */
export async function persistEntryOrder(kind: 'food' | 'weights', orderedIds: string[]) {
  const results = await Promise.all(
    orderedIds.map((id, i) =>
      kind === 'food'
        ? supabase.from('food_entries').update({ sort_order: i }).eq('id', id)
        : supabase.from('weight_sets').update({ sort_order: i }).eq('entry_id', id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}
