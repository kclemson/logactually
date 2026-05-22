import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface BloodworkResult {
  id: string;
  panel_id: string;
  user_id: string;
  collected_date: string | null;
  panel_section: string | null;
  section_order: number;
  result_order: number;
  analyte_name: string;
  canonical_key: string;
  display_name: string;
  numeric_value: number | null;
  unit: string | null;
  reference_low: number | null;
  reference_high: number | null;
  reference_raw: string | null;
  flag: string | null;
}

export interface BloodworkPanel {
  id: string;
  user_id: string;
  log_type_id: string;
  collected_date: string | null;
  panel_title: string | null;
  storage_path: string;
  source_mime_type: string | null;
  source_filename: string | null;
  parse_status: 'pending' | 'success' | 'failed';
  parse_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface BloodworkPanelWithResults extends BloodworkPanel {
  results: BloodworkResult[];
}

export function useBloodworkPanelsForDate(dateStr: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: panels = [], isLoading } = useQuery({
    queryKey: ['bloodwork-panels', dateStr, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: panelsRaw, error: pErr } = await supabase
        .from('bloodwork_panels')
        .select('*')
        .eq('collected_date', dateStr)
        .order('created_at', { ascending: true });
      if (pErr) throw pErr;
      const panelIds = (panelsRaw ?? []).map(p => p.id);
      if (panelIds.length === 0) return [] as BloodworkPanelWithResults[];
      const { data: resultsRaw, error: rErr } = await supabase
        .from('bloodwork_results')
        .select('*')
        .in('panel_id', panelIds)
        .order('section_order', { ascending: true })
        .order('result_order', { ascending: true });
      if (rErr) throw rErr;
      const byPanel = new Map<string, BloodworkResult[]>();
      for (const r of resultsRaw ?? []) {
        const arr = byPanel.get(r.panel_id) ?? [];
        arr.push(r as BloodworkResult);
        byPanel.set(r.panel_id, arr);
      }
      return (panelsRaw as BloodworkPanel[]).map(p => ({ ...p, results: byPanel.get(p.id) ?? [] }));
    },
  });

  const uploadAndParse = useMutation({
    mutationFn: async ({ file, logTypeId }: { file: File; logTypeId: string }) => {
      if (!user) throw new Error('No user');
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('bloodwork-files')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { data: panel, error: insErr } = await supabase
        .from('bloodwork_panels')
        .insert({
          user_id: user.id,
          log_type_id: logTypeId,
          storage_path: path,
          source_mime_type: file.type,
          source_filename: file.name,
          parse_status: 'pending',
          collected_date: dateStr,
        })
        .select()
        .single();
      if (insErr) throw insErr;

      const { error: fnErr } = await supabase.functions.invoke('parse-bloodwork', {
        body: { panel_id: panel.id },
      });
      if (fnErr) throw fnErr;
      return panel as BloodworkPanel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloodwork-panels'] });
      queryClient.invalidateQueries({ queryKey: ['custom-log-dates'] });
    },
  });

  const retryParse = useMutation({
    mutationFn: async (panelId: string) => {
      await supabase.from('bloodwork_panels').update({ parse_status: 'pending', parse_error: null }).eq('id', panelId);
      const { error } = await supabase.functions.invoke('parse-bloodwork', { body: { panel_id: panelId } });
      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bloodwork-panels'] });
    },
  });

  const deletePanel = useMutation({
    mutationFn: async (panelId: string) => {
      const panel = panels.find(p => p.id === panelId);
      if (panel?.storage_path) {
        await supabase.storage.from('bloodwork-files').remove([panel.storage_path]);
      }
      const { error } = await supabase.from('bloodwork_panels').delete().eq('id', panelId);
      if (error) throw error;
    },
    onMutate: async (panelId) => {
      await queryClient.cancelQueries({ queryKey: ['bloodwork-panels', dateStr, user?.id] });
      const previous = queryClient.getQueryData<BloodworkPanelWithResults[]>(['bloodwork-panels', dateStr, user?.id]);
      queryClient.setQueryData<BloodworkPanelWithResults[]>(
        ['bloodwork-panels', dateStr, user?.id],
        (old) => old?.filter(p => p.id !== panelId) ?? [],
      );
      return { previous };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['bloodwork-panels', dateStr, user?.id], ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bloodwork-panels'] });
      queryClient.invalidateQueries({ queryKey: ['custom-log-dates'] });
    },
  });

  async function getSignedUrl(path: string): Promise<string | null> {
    const { data, error } = await supabase.storage.from('bloodwork-files').createSignedUrl(path, 60 * 5);
    if (error) return null;
    return data?.signedUrl ?? null;
  }

  return { panels, isLoading, uploadAndParse, retryParse, deletePanel, getSignedUrl };
}
