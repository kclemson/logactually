import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { invalidateCustomLogCaches } from './invalidateCustomLogCaches';
import type { CustomLogEntry } from './useCustomLogEntries';
import type { MemoryMedia } from './useMemoryMedia';

export interface MemoryEntry extends CustomLogEntry {
  category: string | null;
  created_by: string | null;
  media: MemoryMedia[];
}

export interface MemoryDay {
  date: string;
  entries: MemoryEntry[];
}

/**
 * Fetch all memory entries for a memory-type log, grouped by day (newest day
 * first). Within a day, entries are ordered oldest-first and each entry's media
 * is ordered by sort_order.
 */
export function useMemoryDays(logTypeId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: days = [], isLoading } = useQuery({
    queryKey: ['memory-days', logTypeId],
    queryFn: async (): Promise<MemoryDay[]> => {
      if (!logTypeId) return [];
      const { data: entries, error } = await supabase
        .from('custom_log_entries')
        .select('*')
        .eq('log_type_id', logTypeId)
        .order('logged_date', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(2000);
      if (error) throw error;

      const entryIds = (entries ?? []).map((e) => e.id);
      let mediaByEntry = new Map<string, MemoryMedia[]>();
      if (entryIds.length > 0) {
        const { data: media, error: mediaErr } = await supabase
          .from('memory_media')
          .select('*')
          .in('entry_id', entryIds)
          .order('sort_order', { ascending: true });
        if (mediaErr) throw mediaErr;
        mediaByEntry = (media ?? []).reduce((acc, m) => {
          const list = acc.get(m.entry_id) ?? [];
          list.push(m as MemoryMedia);
          acc.set(m.entry_id, list);
          return acc;
        }, new Map<string, MemoryMedia[]>());
      }

      const dayList: MemoryDay[] = [];
      const seen = new Map<string, number>();
      for (const e of entries ?? []) {
        const entry: MemoryEntry = {
          ...(e as CustomLogEntry),
          category: (e as { category: string | null }).category ?? null,
          created_by: (e as { created_by: string | null }).created_by ?? null,
          media: mediaByEntry.get(e.id) ?? [],
        };
        const idx = seen.get(e.logged_date);
        if (idx !== undefined) {
          dayList[idx].entries.push(entry);
        } else {
          seen.set(e.logged_date, dayList.length);
          dayList.push({ date: e.logged_date, entries: [entry] });
        }
      }
      return dayList;
    },
    enabled: !!user && !!logTypeId,
  });

  const deleteMemory = useMutation({
    mutationFn: async (entry: MemoryEntry) => {
      // Remove storage files first (best-effort), then the entry row.
      // memory_media rows cascade-delete with the entry.
      const paths = entry.media.flatMap((m) =>
        [m.storage_path, m.poster_path].filter(Boolean) as string[],
      );
      if (paths.length > 0) {
        try {
          await supabase.storage.from('memory-media').remove(paths);
        } catch {
          /* best-effort */
        }
      }
      const { error } = await supabase
        .from('custom_log_entries')
        .delete()
        .eq('id', entry.id);
      if (error) throw error;
      return entry;
    },
    onSuccess: (entry) => {
      queryClient.invalidateQueries({ queryKey: ['memory-days', logTypeId] });
      invalidateCustomLogCaches(queryClient, {
        logTypeId: entry.log_type_id,
        loggedDate: entry.logged_date,
        userId: user?.id,
      });
    },
  });

  return { days, isLoading, deleteMemory };
}
