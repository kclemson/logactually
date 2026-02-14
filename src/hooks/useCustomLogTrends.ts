import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CustomLogTrendPoint {
  date: string;
  value: number;
  textLabel?: string;
}

export interface CustomLogTrendSeries {
  logTypeId: string;
  logTypeName: string;
  valueType: string;
  // For numeric: single series; for text_numeric: one series per unique text_value
  series: { label: string; data: CustomLogTrendPoint[] }[];
}

export function useCustomLogTrends(days: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['custom-log-trends', days, user?.id],
    queryFn: async () => {
      const startDate = format(subDays(startOfDay(new Date()), days - 1), 'yyyy-MM-dd');

      // Fetch types
      const { data: types, error: typesError } = await supabase
        .from('custom_log_types')
        .select('*')
        .order('sort_order');
      if (typesError) throw typesError;

      // Fetch entries in range
      const { data: entries, error: entriesError } = await supabase
        .from('custom_log_entries')
        .select('*')
        .gte('logged_date', startDate)
        .order('logged_date');
      if (entriesError) throw entriesError;

      const result: CustomLogTrendSeries[] = [];

      for (const type of types || []) {
        if (type.value_type === 'text' || type.value_type === 'text_multiline') {
          const typeEntries = (entries || []).filter((e: any) => e.log_type_id === type.id);
          if (typeEntries.length === 0) continue;

          const byDate = new Map<string, { count: number; previews: string[] }>();
          typeEntries.forEach((e: any) => {
            const existing = byDate.get(e.logged_date) || { count: 0, previews: [] };
            existing.count++;
            const text = (e.text_value || '').substring(0, 50);
            if (text) existing.previews.push(text);
            byDate.set(e.logged_date, existing);
          });

          result.push({
            logTypeId: type.id,
            logTypeName: type.name,
            valueType: type.value_type,
            series: [{
              label: type.name,
              data: Array.from(byDate.entries()).map(([date, info]) => ({
                date,
                value: info.count,
                textLabel: info.previews.join(' | '),
              })),
            }],
          });
          continue;
        }

        const typeEntries = (entries || []).filter((e: any) => e.log_type_id === type.id);
        if (typeEntries.length === 0) continue;

        if (type.value_type === 'numeric') {
          result.push({
            logTypeId: type.id,
            logTypeName: type.name,
            valueType: type.value_type,
            series: [{
              label: type.name,
              data: typeEntries.map((e: any) => ({
                date: e.logged_date,
                value: Number(e.numeric_value),
              })),
            }],
          });
        } else if (type.value_type === 'dual_numeric') {
          result.push({
            logTypeId: type.id,
            logTypeName: type.name,
            valueType: type.value_type,
            series: [
              {
                label: 'High',
                data: typeEntries.map((e: any) => ({
                  date: e.logged_date,
                  value: Number(e.numeric_value),
                })),
              },
              {
                label: 'Low',
                data: typeEntries.map((e: any) => ({
                  date: e.logged_date,
                  value: Number(e.numeric_value_2),
                })),
              },
            ],
          });
        } else if (type.value_type === 'text_numeric') {
          // Group by text_value (label)
          const byLabel = new Map<string, CustomLogTrendPoint[]>();
          typeEntries.forEach((e: any) => {
            const label = e.text_value || 'Unknown';
            const points = byLabel.get(label) || [];
            points.push({ date: e.logged_date, value: Number(e.numeric_value) });
            byLabel.set(label, points);
          });

          result.push({
            logTypeId: type.id,
            logTypeName: type.name,
            valueType: type.value_type,
            series: Array.from(byLabel.entries()).map(([label, data]) => ({ label, data })),
          });
        }
      }

      return result;
    },
    enabled: !!user,
  });
}
