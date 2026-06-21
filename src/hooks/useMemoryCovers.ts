import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { MemoryMedia } from './useMemoryMedia';

/**
 * Fetches the first (cover) media item for each of the given memory entry ids,
 * so list rows can show a leading thumbnail. Returns a map of entryId -> media.
 * Entries with no media (text-only) are simply absent from the map.
 */
export function useMemoryCovers(entryIds: string[]) {
  const { user } = useAuth();
  const sorted = [...entryIds].sort();
  const key = sorted.join(',');

  const { data: covers = new Map<string, MemoryMedia>() } = useQuery({
    queryKey: ['memory-covers', key],
    queryFn: async (): Promise<Map<string, MemoryMedia>> => {
      const map = new Map<string, MemoryMedia>();
      if (sorted.length === 0) return map;
      const { data, error } = await supabase
        .from('memory_media')
        .select('*')
        .in('entry_id', sorted)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      for (const m of data ?? []) {
        // First row per entry wins (already ordered by sort_order asc).
        if (!map.has(m.entry_id)) map.set(m.entry_id, m as MemoryMedia);
      }
      return map;
    },
    enabled: !!user && sorted.length > 0,
  });

  return covers;
}
