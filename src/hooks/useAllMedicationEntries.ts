import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { CustomLogEntry } from './useCustomLogEntries';

export function useAllMedicationEntries(medTypeIds: string[]) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['custom-log-entries-all-meds', medTypeIds],
    queryFn: async () => {
      if (!medTypeIds.length) return [];
      const { data, error } = await supabase
        .from('custom_log_entries')
        .select('*')
        .in('log_type_id', medTypeIds)
        .order('logged_date', { ascending: false })
        .order('logged_time', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(500);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-log-entries-all-meds'] });
      queryClient.invalidateQueries({ queryKey: ['custom-log-entries'] });
      queryClient.invalidateQueries({ queryKey: ['custom-log-dates'] });
    },
  });

  return { entries, isLoading, deleteEntry };
}
