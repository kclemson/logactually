import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import type { BloodworkPanel } from '@/hooks/useBloodworkPanels';
import { useDuplicatePendingPanels } from '@/hooks/useBloodworkPanels';

interface DuplicateContentDialogProps {
  pending: BloodworkPanel;
}

interface PanelSummary {
  title: string;
  resultCount: number;
  collectedDate: string | null;
  filename: string | null;
}

async function summarize(panel: BloodworkPanel): Promise<PanelSummary> {
  const { count } = await supabase
    .from('bloodwork_results')
    .select('id', { count: 'exact', head: true })
    .eq('panel_id', panel.id);
  return {
    title: panel.panel_title || panel.source_filename || 'Bloodwork',
    resultCount: count ?? 0,
    collectedDate: panel.collected_date,
    filename: panel.source_filename,
  };
}

export function DuplicateContentDialog({ pending }: DuplicateContentDialogProps) {
  const { resolveDuplicate } = useDuplicatePendingPanels();
  const existingId = (pending.raw_extraction as { duplicate_of?: string } | null)?.duplicate_of ?? null;
  const [existingSummary, setExistingSummary] = useState<PanelSummary | null>(null);
  const [pendingSummary, setPendingSummary] = useState<PanelSummary | null>(null);
  const [busy, setBusy] = useState<'replace' | 'keep' | 'discard' | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!existingId) return;
      const { data: existing } = await supabase
        .from('bloodwork_panels')
        .select('*')
        .eq('id', existingId)
        .maybeSingle();
      if (!active) return;
      if (existing) setExistingSummary(await summarize(existing as BloodworkPanel));
      // Pending panel hasn't had results inserted yet — count rows in raw_extraction.
      const raw = pending.raw_extraction as { sections?: Array<{ results?: unknown[] }> } | null;
      const n = (raw?.sections ?? []).reduce((sum, s) => sum + (s.results?.length ?? 0), 0);
      if (!active) return;
      setPendingSummary({
        title: pending.panel_title || pending.source_filename || 'Bloodwork',
        resultCount: n,
        collectedDate: pending.collected_date,
        filename: pending.source_filename,
      });
    })();
    return () => { active = false; };
  }, [existingId, pending]);

  if (!existingId) return null;

  const handle = (action: 'replace' | 'keep' | 'discard') => {
    setBusy(action);
    resolveDuplicate.mutate(
      { panelId: pending.id, action, existingPanelId: existingId },
      { onSettled: () => setBusy(null) },
    );
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="top-[5%] translate-y-0 max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            These look like the same labs
          </DialogTitle>
          <DialogDescription className="pt-2">
            Both panels have the same collection date and the same list of analytes.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
          <div className="border border-border rounded p-2 space-y-1">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Existing</div>
            <div className="font-medium text-foreground truncate">{existingSummary?.title ?? '…'}</div>
            <div className="text-muted-foreground">
              {existingSummary?.collectedDate ? format(new Date(existingSummary.collectedDate), 'MMM d, yyyy') : ''}
            </div>
            <div className="text-muted-foreground">{existingSummary?.resultCount ?? '…'} results</div>
          </div>
          <div className="border border-border rounded p-2 space-y-1">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">New upload</div>
            <div className="font-medium text-foreground truncate">{pendingSummary?.title ?? '…'}</div>
            <div className="text-muted-foreground">
              {pendingSummary?.collectedDate ? format(new Date(pendingSummary.collectedDate), 'MMM d, yyyy') : ''}
            </div>
            <div className="text-muted-foreground">{pendingSummary?.resultCount ?? '…'} results</div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button variant="default" disabled={!!busy} onClick={() => handle('replace')}>
            {busy === 'replace' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Replace existing with new'}
          </Button>
          <Button variant="outline" disabled={!!busy} onClick={() => handle('keep')}>
            {busy === 'keep' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Keep both'}
          </Button>
          <Button variant="ghost" disabled={!!busy} onClick={() => handle('discard')}>
            {busy === 'discard' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Discard new upload'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
