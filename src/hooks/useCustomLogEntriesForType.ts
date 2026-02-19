import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format } from 'date-fns';
import type { CustomLogEntry } from './useCustomLogEntries';

export function useCustomLogEntriesForType(logTypeId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['custom-log-entries-for-type', logTypeId],
    queryFn: async () => {
      if (!logTypeId) return [];
      const { data, error } = await supabase
        .from('custom_log_entries')
        .select('*')
        .eq('log_type_id', logTypeId)
        .order('logged_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data as CustomLogEntry[];
    },
    enabled: !!user && !!logTypeId,
  });

  const createEntry = useMutation({
    mutationFn: async (params: {
      log_type_id: string;
      logged_date?: string;
      numeric_value?: number | null;
      numeric_value_2?: number | null;
      text_value?: string | null;
      unit?: string | null;
      dose_time?: string | null;
      entry_notes?: string | null;
    }) => {
      if (!user) throw new Error('No user');
      const { logged_date, ...rest } = params;
      const dateToUse = logged_date ?? format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('custom_log_entries')
        .insert({ user_id: user.id, logged_date: dateToUse, ...rest })
        .select()
        .single();
      if (error) throw error;
      return data as CustomLogEntry;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['custom-log-entries-for-type', data.log_type_id] });
      queryClient.invalidateQueries({ queryKey: ['custom-log-entries', data.logged_date] });
      queryClient.invalidateQueries({ queryKey: ['custom-log-dates'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-log-entries-for-type', logTypeId] });
      queryClient.invalidateQueries({ queryKey: ['custom-log-entries'] });
      queryClient.invalidateQueries({ queryKey: ['custom-log-dates'] });
    },
  });

  return { entries, isLoading, createEntry, deleteEntry };
}
