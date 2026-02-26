import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { CustomLogTrendSeries } from './useCustomLogTrends';

const CHARTABLE_TYPES = ['numeric', 'dual_numeric'];

/**
 * Fetches all-time trend data for a single custom log type.
 * Only enabled for numeric and dual_numeric types.
 */
export function useCustomLogTrendSingle(
  logTypeId: string | null,
  logTypeName: string | undefined,
  valueType: string | undefined,
) {
  const { user } = useAuth();
  const enabled = !!user && !!logTypeId && !!valueType && CHARTABLE_TYPES.includes(valueType);

  return useQuery<CustomLogTrendSeries | null>({
    queryKey: ['custom-log-trend-single', logTypeId, user?.id],
    queryFn: async () => {
      if (!logTypeId || !valueType || !logTypeName) return null;

      const { data: entries, error } = await supabase
        .from('custom_log_entries')
        .select('logged_date, numeric_value, numeric_value_2')
        .eq('log_type_id', logTypeId)
        .order('logged_date')
        .limit(10000);
      if (error) throw error;
      if (!entries || entries.length === 0) return null;

      if (valueType === 'dual_numeric') {
        return {
          logTypeId,
          logTypeName,
          valueType,
          series: [
            {
              label: 'Diastolic',
              data: entries.map((e) => ({
                date: e.logged_date,
                value: Number(e.numeric_value_2),
              })),
            },
            {
              label: 'Systolic',
              data: entries.map((e) => ({
                date: e.logged_date,
                value: Number(e.numeric_value),
              })),
            },
          ],
        };
      }

      // numeric
      return {
        logTypeId,
        logTypeName,
        valueType,
        series: [{
          label: logTypeName,
          data: entries.map((e) => ({
            date: e.logged_date,
            value: Number(e.numeric_value),
          })),
        }],
      };
    },
    enabled,
    staleTime: 30_000,
  });
}
