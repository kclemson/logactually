import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { MemoryMedia } from './useMemoryMedia';

/**
 * Fetches the first N media items (ordered by sort_order) for each of the given
 * memory entry ids, so list rows can show a leading thumbnail strip. Returns a
 * map of entryId -> media[]. Entries with no media (text-only) are absent.
 */
export function useMemoryCovers(entryIds: string[], limit = 4) {
  const { user } = useAuth();
  const sorted = [...entryIds].sort();
  const key = sorted.join(',');

  const { data: covers = new Map<string, MemoryMedia[]>() } = useQuery({
    queryKey: ['memory-covers', key, limit],
    queryFn: async (): Promise<Map<string, MemoryMedia[]>> => {
      const map = new Map<string, MemoryMedia[]>();
      if (sorted.length === 0) return map;
      const { data, error } = await supabase
        .from('memory_media')
        .select('*')
        .in('entry_id', sorted)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      for (const m of data ?? []) {
        const existing = map.get(m.entry_id);
        if (existing) {
          if (existing.length < limit) existing.push(m as MemoryMedia);
        } else {
          map.set(m.entry_id, [m as MemoryMedia]);
        }
      }
      return map;
    },
    enabled: !!user && sorted.length > 0,
  });

  return covers;
}
