import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CustomLogEntry {
  id: string;
  user_id: string;
  log_type_id: string;
  logged_date: string;
  numeric_value: number | null;
  numeric_value_2: number | null;
  text_value: string | null;
  unit: string | null;
  dose_time: string | null;
  entry_notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useCustomLogEntries(dateStr: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['custom-log-entries', dateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_log_entries')
        .select('*')
        .eq('logged_date', dateStr)
        .order('dose_time', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as CustomLogEntry[];
    },
    enabled: !!user,
  });

  const createEntry = useMutation({
    mutationFn: async (params: {
      log_type_id: string;
      logged_date: string;
      numeric_value?: number | null;
      numeric_value_2?: number | null;
      text_value?: string | null;
      unit?: string | null;
      dose_time?: string | null;
      entry_notes?: string | null;
    }) => {
      if (!user) throw new Error('No user');
      const { data, error } = await supabase
        .from('custom_log_entries')
        .insert({ user_id: user.id, ...params })
        .select()
        .single();
      if (error) throw error;
      return data as CustomLogEntry;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['custom-log-entries', data.logged_date] });
      queryClient.invalidateQueries({ queryKey: ['custom-log-dates'] });
      queryClient.invalidateQueries({ queryKey: ['custom-log-trend-single'] });
    },
  });

  const updateEntry = useMutation({
    mutationFn: async (params: {
      id: string;
      numeric_value?: number | null;
      numeric_value_2?: number | null;
      text_value?: string | null;
      entry_notes?: string | null;
    }) => {
      const { id, ...updates } = params;
      const { error } = await supabase
        .from('custom_log_entries')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: ['custom-log-entries', dateStr] });
      const previous = queryClient.getQueryData<CustomLogEntry[]>(['custom-log-entries', dateStr]);
      queryClient.setQueryData<CustomLogEntry[]>(['custom-log-entries', dateStr], (old) =>
        old?.map(e => e.id === params.id ? { ...e, ...params } : e)
      );
      return { previous };
    },
    onError: (_err, _params, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['custom-log-entries', dateStr], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-log-entries', dateStr] });
      queryClient.invalidateQueries({ queryKey: ['custom-log-trend-single'] });
    },
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
      await queryClient.cancelQueries({ queryKey: ['custom-log-entries', dateStr] });
      const previous = queryClient.getQueryData<CustomLogEntry[]>(['custom-log-entries', dateStr]);
      const removed = previous?.find((e) => e.id === id);

      // Optimistically remove from day entries
      queryClient.setQueryData<CustomLogEntry[]>(['custom-log-entries', dateStr], (old) =>
        old?.filter((e) => e.id !== id)
      );

      // Optimistically remove from medications-all cache (if present)
      const medCaches = queryClient.getQueriesData<CustomLogEntry[]>({ queryKey: ['custom-log-entries-all-meds'] });
      for (const [key, data] of medCaches) {
        if (data) queryClient.setQueryData<CustomLogEntry[]>(key, data.filter((e) => e.id !== id));
      }

      // Optimistically remove matching date point from this log type's trend cache
      if (removed && user) {
        const trendKey = ['custom-log-trend-single', removed.log_type_id, user.id];
        const trend = queryClient.getQueryData<any>(trendKey);
        if (trend?.series) {
          queryClient.setQueryData(trendKey, {
            ...trend,
            series: trend.series.map((s: any) => ({
              ...s,
              data: s.data.filter((d: any) => d.date !== removed.logged_date),
            })),
          });
        }
      }
      return { previous, removed };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['custom-log-entries', dateStr], context.previous);
      }
    },
    onSettled: (_data, _err, _id, context) => {
      queryClient.invalidateQueries({ queryKey: ['custom-log-entries', dateStr] });
      queryClient.invalidateQueries({ queryKey: ['custom-log-dates'] });
      const logTypeId = context?.removed?.log_type_id;
      if (logTypeId && user) {
        queryClient.invalidateQueries({ queryKey: ['custom-log-trend-single', logTypeId, user.id] });
      }
    },
  });

  return { entries, isLoading, createEntry, updateEntry, deleteEntry };
}
