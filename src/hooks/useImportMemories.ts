import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { invalidateCustomLogCaches } from './invalidateCustomLogCaches';
import type { ParsedImage } from '@/lib/memory-import';

export type ImportStatus = 'pending' | 'importing' | 'done' | 'failed';

export interface ImportItem {
  /** Stable id (the source file name). */
  id: string;
  logTypeId: string;
  loggedDate: string;
  note: string | null;
  category: string | null;
  images: ParsedImage[];
}

export interface ImportSummary {
  imported: number;
  failed: number;
}

/**
 * Imports parsed posts into a memory log, one at a time, via the
 * `import-memory-entries` edge function (which downloads + stores each photo
 * server-side). Exposes per-item status so the review list can show live
 * progress, and refreshes memory/day caches once finished.
 */
export function useImportMemories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statuses, setStatuses] = useState<Record<string, ImportStatus>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const importAll = useCallback(
    async (items: ImportItem[]) => {
      if (items.length === 0) return;
      setIsImporting(true);
      setSummary(null);
      setStatuses(Object.fromEntries(items.map((i) => [i.id, 'pending' as ImportStatus])));
      setErrors({});

      let imported = 0;
      let failed = 0;
      const touchedDates = new Set<string>();
      let logTypeId = items[0].logTypeId;

      for (const item of items) {
        logTypeId = item.logTypeId;
        setStatuses((prev) => ({ ...prev, [item.id]: 'importing' }));
        try {
          const { data, error } = await supabase.functions.invoke('import-memory-entries', {
            body: {
              logTypeId: item.logTypeId,
              loggedDate: item.loggedDate,
              note: item.note,
              category: item.category,
              images: item.images,
            },
          });
          if (error) throw error;
          if (data?.error) throw new Error(typeof data.error === 'string' ? data.error : 'Import failed');
          imported += 1;
          touchedDates.add(item.loggedDate);
          setStatuses((prev) => ({ ...prev, [item.id]: 'done' }));
        } catch (err) {
          failed += 1;
          const message = err instanceof Error ? err.message : 'Import failed';
          setErrors((prev) => ({ ...prev, [item.id]: message }));
          setStatuses((prev) => ({ ...prev, [item.id]: 'failed' }));
        }
      }

      // Refresh memory + day caches for everything we touched.
      queryClient.invalidateQueries({ queryKey: ['memory-days', logTypeId] });
      for (const date of touchedDates) {
        invalidateCustomLogCaches(queryClient, { logTypeId, loggedDate: date, userId: user?.id });
      }

      setSummary({ imported, failed });
      setIsImporting(false);
    },
    [queryClient, user?.id],
  );

  return { importAll, statuses, errors, isImporting, summary };
}
