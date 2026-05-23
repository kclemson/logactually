import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { canonicalize } from '@/lib/bloodwork-canonical';
import { useAuth } from './useAuth';

type BloodworkResultInsert = {
  user_id: string;
  panel_id: string;
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
};

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

export type BloodworkParseStatus = 'pending' | 'success' | 'failed' | 'duplicate_pending';

export interface BloodworkPanel {
  id: string;
  user_id: string;
  log_type_id: string;
  collected_date: string | null;
  panel_title: string | null;
  storage_path: string;
  source_mime_type: string | null;
  source_filename: string | null;
  file_sha256: string | null;
  content_signature: string | null;
  parse_status: BloodworkParseStatus;
  parse_error: string | null;
  raw_extraction: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface BloodworkPanelWithResults extends BloodworkPanel {
  results: BloodworkResult[];
}

export class DuplicateFileError extends Error {
  constructor(public existingPanel: BloodworkPanel) {
    super('Duplicate file');
    this.name = 'DuplicateFileError';
  }
}

async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function loadPanelsAndResults(panelsRaw: BloodworkPanel[], resultsRaw: BloodworkResult[]): BloodworkPanelWithResults[] {
  const byPanel = new Map<string, BloodworkResult[]>();
  for (const r of resultsRaw) {
    const arr = byPanel.get(r.panel_id) ?? [];
    arr.push(r);
    byPanel.set(r.panel_id, arr);
  }
  return panelsRaw.map((p) => ({ ...p, results: byPanel.get(p.id) ?? [] }));
}

export function useBloodworkPanelsForDate(dateStr: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: panels = [], isLoading } = useQuery({
    queryKey: ['bloodwork-panels', dateStr, user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Show panels collected on this date PLUS in-flight (pending) panels with no
      // collected_date yet, so the user sees their upload progress before extraction
      // resolves a date. Failed panels are intentionally excluded — they're surfaced
      // under the Bloodwork log type in Settings instead.
      const { data: byDate } = await supabase
        .from('bloodwork_panels')
        .select('*')
        .eq('collected_date', dateStr)
        .neq('parse_status', 'failed');

      const { data: inFlight } = await supabase
        .from('bloodwork_panels')
        .select('*')
        .eq('parse_status', 'pending')
        .is('collected_date', null);

      const merged = new Map<string, BloodworkPanel>();
      for (const p of (byDate ?? []) as BloodworkPanel[]) merged.set(p.id, p);
      for (const p of (inFlight ?? []) as BloodworkPanel[]) merged.set(p.id, p);
      const panelsRaw = Array.from(merged.values()).sort((a, b) => a.created_at.localeCompare(b.created_at));

      const panelIds = panelsRaw.map((p) => p.id);
      if (panelIds.length === 0) return [] as BloodworkPanelWithResults[];
      const { data: resultsRaw } = await supabase
        .from('bloodwork_results')
        .select('*')
        .in('panel_id', panelIds)
        .order('section_order', { ascending: true })
        .order('result_order', { ascending: true });
      return loadPanelsAndResults(panelsRaw, (resultsRaw ?? []) as BloodworkResult[]);
    },
  });

  const uploadAndParse = useMutation({
    mutationFn: async ({ file, logTypeId }: { file: File; logTypeId: string }) => {
      if (!user) throw new Error('No user');

      // Layer 1: hash the file and check globally for an existing panel.
      const hash = await sha256Hex(file);
      const { data: existing } = await supabase
        .from('bloodwork_panels')
        .select('*')
        .eq('user_id', user.id)
        .eq('file_sha256', hash)
        .neq('parse_status', 'failed')
        .limit(1)
        .maybeSingle();
      if (existing) {
        throw new DuplicateFileError(existing as BloodworkPanel);
      }

      const ext = file.name.split('.').pop() || 'bin';
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('bloodwork-files')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      // Insert panel WITHOUT collected_date — edge function sets it from extraction.
      const { data: panel, error: insErr } = await supabase
        .from('bloodwork_panels')
        .insert({
          user_id: user.id,
          log_type_id: logTypeId,
          storage_path: path,
          source_mime_type: file.type,
          source_filename: file.name,
          file_sha256: hash,
          parse_status: 'pending',
        })
        .select()
        .single();
      if (insErr) throw insErr;

      const { data: fnData, error: fnErr } = await supabase.functions.invoke('parse-bloodwork', {
        body: { panel_id: panel.id },
      });
      if (fnErr) throw fnErr;
      return {
        panel: panel as BloodworkPanel,
        extractedDate: (fnData?.collected_date as string | null) ?? null,
        sections: (fnData?.sections as Array<{ title: string; count: number }> | undefined) ?? [],
        resultCount: (fnData?.result_count as number | undefined) ?? 0,
        filename: file.name,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloodwork-panels'] });
      queryClient.invalidateQueries({ queryKey: ['custom-log-dates'] });
      queryClient.invalidateQueries({ queryKey: ['custom-log-type-recency'] });
    },

  });

  const retryParse = useMutation({
    mutationFn: async (panelId: string) => {
      await supabase.from('bloodwork_panels').update({ parse_status: 'pending', parse_error: null }).eq('id', panelId);
      const { error } = await supabase.functions.invoke('parse-bloodwork', { body: { panel_id: panelId } });
      if (error) throw error;
    },
    onMutate: async (panelId) => {
      await queryClient.cancelQueries({ queryKey: ['bloodwork-panels', dateStr, user?.id] });
      const previous = queryClient.getQueryData<BloodworkPanelWithResults[]>(['bloodwork-panels', dateStr, user?.id]);
      queryClient.setQueryData<BloodworkPanelWithResults[]>(
        ['bloodwork-panels', dateStr, user?.id],
        (old) => old?.map((p) => p.id === panelId
          ? { ...p, parse_status: 'pending', parse_error: null }
          : p,
        ) ?? [],
      );
      return { previous };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['bloodwork-panels', dateStr, user?.id], ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bloodwork-panels'] });
    },
  });

  const deletePanel = useMutation({
    mutationFn: async (panelId: string) => {
      const panel = panels.find((p) => p.id === panelId);
      if (panel?.storage_path) {
        await supabase.storage.from('bloodwork-files').remove([panel.storage_path]);
      }
      await supabase.from('bloodwork_results').delete().eq('panel_id', panelId);
      const { error } = await supabase.from('bloodwork_panels').delete().eq('id', panelId);
      if (error) throw error;
    },
    onMutate: async (panelId) => {
      await queryClient.cancelQueries({ queryKey: ['bloodwork-panels', dateStr, user?.id] });
      const previous = queryClient.getQueryData<BloodworkPanelWithResults[]>(['bloodwork-panels', dateStr, user?.id]);
      queryClient.setQueryData<BloodworkPanelWithResults[]>(
        ['bloodwork-panels', dateStr, user?.id],
        (old) => old?.filter((p) => p.id !== panelId) ?? [],
      );
      return { previous };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['bloodwork-panels', dateStr, user?.id], ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bloodwork-panels'] });
      queryClient.invalidateQueries({ queryKey: ['custom-log-dates'] });
      queryClient.invalidateQueries({ queryKey: ['custom-log-type-recency'] });

    },
  });

  async function getSignedUrl(path: string): Promise<string | null> {
    const { data, error } = await supabase.storage.from('bloodwork-files').createSignedUrl(path, 60 * 5);
    if (error) return null;
    return data?.signedUrl ?? null;
  }

  return { panels, isLoading, uploadAndParse, retryParse, deletePanel, getSignedUrl };
}

/**
 * Watches all of the user's `duplicate_pending` panels — so the Layer 2 dialog
 * can surface regardless of which day the panel landed on after parsing.
 */
export function useDuplicatePendingPanels() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: panels = [] } = useQuery({
    queryKey: ['bloodwork-duplicate-pending', user?.id],
    enabled: !!user,
    refetchInterval: 4000, // poll while a parse may still resolve
    queryFn: async () => {
      const { data } = await supabase
        .from('bloodwork_panels')
        .select('*')
        .eq('parse_status', 'duplicate_pending')
        .order('created_at', { ascending: true });
      return (data ?? []) as BloodworkPanel[];
    },
  });

  const resolveDuplicate = useMutation({
    mutationFn: async ({
      panelId,
      action,
      existingPanelId,
    }: {
      panelId: string;
      action: 'replace' | 'keep' | 'discard';
      existingPanelId: string;
    }) => {
      if (!user) throw new Error('No user');
      const { data: panel, error: pErr } = await supabase
        .from('bloodwork_panels')
        .select('*')
        .eq('id', panelId)
        .maybeSingle();
      if (pErr || !panel) throw pErr ?? new Error('Panel missing');

      if (action === 'discard') {
        if (panel.storage_path) {
          await supabase.storage.from('bloodwork-files').remove([panel.storage_path]);
        }
        await supabase.from('bloodwork_results').delete().eq('panel_id', panelId);
        await supabase.from('bloodwork_panels').delete().eq('id', panelId);
        return;
      }

      if (action === 'replace') {
        // Fetch old panel's storage path, then delete it (cascades nothing — results have no FK; explicit delete).
        const { data: oldPanel } = await supabase
          .from('bloodwork_panels')
          .select('storage_path')
          .eq('id', existingPanelId)
          .maybeSingle();
        if (oldPanel?.storage_path) {
          await supabase.storage.from('bloodwork-files').remove([oldPanel.storage_path]);
        }
        await supabase.from('bloodwork_results').delete().eq('panel_id', existingPanelId);
        await supabase.from('bloodwork_panels').delete().eq('id', existingPanelId);
      }

      // For both 'keep' and 'replace': commit the pending panel by inserting its results
      // from raw_extraction and flipping status to success.
      const raw = panel.raw_extraction as
        | { sections?: Array<{ section_title?: string | null; results?: Array<Record<string, unknown>> }> }
        | null;
      const rows: BloodworkResultInsert[] = [];
      const toNum = (v: unknown): number | null => {
        if (v === null || v === undefined || v === '') return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };
      raw?.sections?.forEach((section, sIdx) => {
        (section.results ?? []).forEach((r, rIdx) => {
          const analyte = (r.analyte_name as string) ?? '';
          if (!analyte) return;
          const { canonical_key, display_name } = canonicalize(analyte);
          rows.push({
            user_id: user.id,
            panel_id: panelId,
            collected_date: panel.collected_date,
            panel_section: (section.section_title as string) ?? null,
            section_order: sIdx,
            result_order: rIdx,
            analyte_name: analyte,
            canonical_key,
            display_name,
            numeric_value: toNum(r.numeric_value),
            unit: (r.unit as string) ?? null,
            reference_low: toNum(r.reference_low),
            reference_high: toNum(r.reference_high),
            reference_raw: (r.reference_raw as string) ?? null,
            flag: (r.flag as string) ?? null,
          });
        });
      });

      if (rows.length > 0) {
        await supabase.from('bloodwork_results').insert(rows);
      }
      await supabase
        .from('bloodwork_panels')
        .update({ parse_status: 'success', parse_error: null })
        .eq('id', panelId);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bloodwork-panels'] });
      queryClient.invalidateQueries({ queryKey: ['bloodwork-duplicate-pending'] });
      queryClient.invalidateQueries({ queryKey: ['custom-log-dates'] });
      queryClient.invalidateQueries({ queryKey: ['custom-log-type-recency'] });
    },

  });

  return { panels, resolveDuplicate };
}

/**
 * Failed bloodwork panels for a given log type, surfaced in Settings so the user
 * can retry or delete them outside the daily log view.
 */
export function useFailedBloodworkPanels(logTypeId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['bloodwork-panels', 'failed', logTypeId, user?.id];

  const { data: panels = [] } = useQuery({
    queryKey,
    enabled: !!user && !!logTypeId,
    queryFn: async () => {
      const { data } = await supabase
        .from('bloodwork_panels')
        .select('*')
        .eq('user_id', user!.id)
        .eq('log_type_id', logTypeId!)
        .eq('parse_status', 'failed')
        .order('created_at', { ascending: false });
      return (data ?? []) as BloodworkPanel[];
    },
  });

  const retryParse = useMutation({
    mutationFn: async (panelId: string) => {
      await supabase.from('bloodwork_panels').update({ parse_status: 'pending', parse_error: null }).eq('id', panelId);
      const { error } = await supabase.functions.invoke('parse-bloodwork', { body: { panel_id: panelId } });
      if (error) throw error;
    },
    // No optimistic removal — keep the row visible (with a spinner on the retry
    // button) until the parse settles. If it succeeds the refetch drops it; if
    // it fails again the row stays with the updated parse_error.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bloodwork-panels'] });
    },
  });

  const deletePanel = useMutation({
    mutationFn: async (panelId: string) => {
      const panel = panels.find((p) => p.id === panelId);
      if (panel?.storage_path) {
        await supabase.storage.from('bloodwork-files').remove([panel.storage_path]);
      }
      await supabase.from('bloodwork_results').delete().eq('panel_id', panelId);
      const { error } = await supabase.from('bloodwork_panels').delete().eq('id', panelId);
      if (error) throw error;
    },
    onMutate: async (panelId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BloodworkPanel[]>(queryKey);
      queryClient.setQueryData<BloodworkPanel[]>(queryKey, (old) => old?.filter((p) => p.id !== panelId) ?? []);
      return { previous };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bloodwork-panels'] });
    },
  });

  return { failedPanels: panels, retryParse, deletePanel };
}

