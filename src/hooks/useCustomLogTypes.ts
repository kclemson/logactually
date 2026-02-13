import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ValueType = 'numeric' | 'text_numeric' | 'text';

export interface CustomLogType {
  id: string;
  user_id: string;
  name: string;
  value_type: ValueType;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useCustomLogTypes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: logTypes = [], isLoading } = useQuery({
    queryKey: ['custom-log-types', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_log_types')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as CustomLogType[];
    },
    enabled: !!user,
  });

  // Fetch most recent entry per log type for recency sorting
  const { data: recentUsage = {} } = useQuery({
    queryKey: ['custom-log-type-recency', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_log_entries')
        .select('log_type_id, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usage: Record<string, string> = {};
      for (const row of data || []) {
        if (!usage[row.log_type_id]) {
          usage[row.log_type_id] = row.created_at;
        }
      }
      return usage;
    },
    enabled: !!user,
  });

  const createType = useMutation({
    mutationFn: async (params: { name: string; value_type: ValueType }) => {
      if (!user) throw new Error('No user');
      const { data, error } = await supabase
        .from('custom_log_types')
        .insert({ user_id: user.id, name: params.name, value_type: params.value_type })
        .select()
        .single();
      if (error) throw error;
      return data as CustomLogType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-log-types'] });
    },
  });

  return { logTypes, isLoading, createType, recentUsage };
}
