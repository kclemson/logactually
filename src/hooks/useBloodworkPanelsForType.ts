import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { BloodworkPanel, BloodworkPanelWithResults, BloodworkResult } from './useBloodworkPanels';

/**
 * All bloodwork panels for a given log type across all dates, newest first.
 * Used by the "By Type" view on /custom where date navigation is hidden.
 */
export function useBloodworkPanelsForType(logTypeId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bloodwork-panels-for-type', logTypeId, user?.id],
    enabled: !!user && !!logTypeId,
    queryFn: async (): Promise<BloodworkPanelWithResults[]> => {
      if (!logTypeId) return [];
      const { data: panelsRaw } = await supabase
        .from('bloodwork_panels')
        .select('*')
        .eq('log_type_id', logTypeId)
        .order('collected_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      const panels = (panelsRaw ?? []) as BloodworkPanel[];
      const panelIds = panels.map((p) => p.id);
      if (panelIds.length === 0) return [];

      const { data: resultsRaw } = await supabase
        .from('bloodwork_results')
        .select('*')
        .in('panel_id', panelIds)
        .order('section_order', { ascending: true })
        .order('result_order', { ascending: true });

      const byPanel = new Map<string, BloodworkResult[]>();
      for (const r of (resultsRaw ?? []) as BloodworkResult[]) {
        const arr = byPanel.get(r.panel_id) ?? [];
        arr.push(r);
        byPanel.set(r.panel_id, arr);
      }
      return panels.map((p) => ({ ...p, results: byPanel.get(p.id) ?? [] }));
    },
  });
}
