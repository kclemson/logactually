import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { CustomLogEntry } from './useCustomLogEntries';

export function useAllMedicationEntries(medTypeIds: string[], dateStr: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['custom-log-entries-all-meds', medTypeIds, dateStr],
    queryFn: async () => {
      if (!medTypeIds.length) return [];
      const { data, error } = await supabase
        .from('custom_log_entries')
        .select('*')
        .in('log_type_id', medTypeIds)
        .eq('logged_date', dateStr)
        .order('dose_time', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as CustomLogEntry[];
    },
    enabled: !!user && medTypeIds.length >= 2,
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_log_entries')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['custom-log-entries-all-meds', medTypeIds, dateStr] });
      const previous = queryClient.getQueryData<CustomLogEntry[]>(['custom-log-entries-all-meds', medTypeIds, dateStr]);
      const removed = previous?.find((e) => e.id === id);
      queryClient.setQueryData<CustomLogEntry[]>(
        ['custom-log-entries-all-meds', medTypeIds, dateStr],
        (old) => old?.filter((e) => e.id !== id)
      );
      // Also optimistically remove from per-day entries cache if present
      const dayCaches = queryClient.getQueriesData<CustomLogEntry[]>({ queryKey: ['custom-log-entries'] });
      for (const [key, data] of dayCaches) {
        if (data) queryClient.setQueryData<CustomLogEntry[]>(key, data.filter((e) => e.id !== id));
      }
      return { previous, removed };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['custom-log-entries-all-meds', medTypeIds, dateStr], context.previous);
      }
    },
    onSettled: (_data, _err, _id, context) => {
      queryClient.invalidateQueries({ queryKey: ['custom-log-entries-all-meds', medTypeIds, dateStr] });
      queryClient.invalidateQueries({ queryKey: ['custom-log-entries', dateStr] });
      queryClient.invalidateQueries({ queryKey: ['custom-log-dates'] });
      const logTypeId = context?.removed?.log_type_id;
      if (logTypeId && user) {
        queryClient.invalidateQueries({ queryKey: ['custom-log-trend-single', logTypeId, user.id] });
      }
    },
  });

  return { entries, isLoading, deleteEntry };
}
