import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ValueType = 'numeric' | 'text_numeric' | 'text' | 'text_multiline' | 'dual_numeric' | 'medication';

export interface CustomLogType {
  id: string;
  user_id: string;
  name: string;
  value_type: ValueType;
  unit: string | null;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  default_dose: number | null;
  doses_per_day: number;
  dose_times: string[] | null;
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
    mutationFn: async (params: { name: string; value_type: ValueType; unit?: string | null; description?: string | null; default_dose?: number | null; doses_per_day?: number; dose_times?: string[] | null }) => {
      if (!user) throw new Error('No user');
      const { data, error } = await supabase
        .from('custom_log_types')
        .insert({
          user_id: user.id,
          name: params.name,
          value_type: params.value_type,
          unit: params.unit ?? null,
          description: params.description ?? null,
          default_dose: params.default_dose ?? null,
          doses_per_day: params.doses_per_day ?? 0,
          dose_times: params.dose_times ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CustomLogType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-log-types'] });
    },
  });

  const updateType = useMutation({
    mutationFn: async (params: { id: string; name?: string; unit?: string | null; description?: string | null; default_dose?: number | null; doses_per_day?: number; dose_times?: string[] | null }) => {
      const updates: Record<string, unknown> = {};
      if (params.name !== undefined) updates.name = params.name;
      if (params.unit !== undefined) updates.unit = params.unit;
      if (params.description !== undefined) updates.description = params.description;
      if (params.default_dose !== undefined) updates.default_dose = params.default_dose;
      if (params.doses_per_day !== undefined) updates.doses_per_day = params.doses_per_day;
      if (params.dose_times !== undefined) updates.dose_times = params.dose_times;
      const { error } = await supabase
        .from('custom_log_types')
        .update(updates)
        .eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-log-types'] });
    },
  });

  const deleteType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_log_types')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-log-types'] });
    },
  });

  return { logTypes, isLoading, createType, updateType, deleteType, recentUsage };
}
