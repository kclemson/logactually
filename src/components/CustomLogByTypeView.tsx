import { format, parseISO } from 'date-fns';
import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CustomLogGroupTrend } from '@/components/CustomLogGroupTrend';
import { BloodworkPanelRow } from '@/components/BloodworkPanelGroup';
import { useBloodworkPanelsForType } from '@/hooks/useBloodworkPanelsForType';
import { useBloodworkPanelsForDate } from '@/hooks/useBloodworkPanels';
import { useCustomLogEntriesForType } from '@/hooks/useCustomLogEntriesForType';
import { getMedicationMeta } from '@/lib/medication-meta';
import type { CustomLogType } from '@/hooks/useCustomLogTypes';

interface CustomLogByTypeViewProps {
  logTypes: CustomLogType[];
  isLoading: boolean;
  isReadOnly: boolean;
  onLogNew: (typeId: string) => void;
}

export function CustomLogByTypeView({ logTypes, isLoading, isReadOnly, onLogNew }: CustomLogByTypeViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded" />)}
      </div>
    );
  }

  if (logTypes.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No custom log types yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logTypes.map((lt) => (
        <TypeCard key={lt.id} logType={lt} isReadOnly={isReadOnly} onLogNew={onLogNew} />
      ))}
    </div>
  );
}

function TypeCard({ logType, isReadOnly, onLogNew }: { logType: CustomLogType; isReadOnly: boolean; onLogNew: (id: string) => void }) {
  const meta = logType.value_type === 'medication' ? getMedicationMeta(logType) : null;

  return (
    <div className="rounded-lg border border-border/60">
      <div className="flex items-baseline justify-between gap-2 px-3 py-2 border-b border-border/50">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-sm font-medium truncate">{logType.name}</span>
          {logType.unit && <span className="text-xs text-muted-foreground">{logType.unit}</span>}
          {meta && <span className="text-xs text-muted-foreground/70">· {meta}</span>}
        </div>
        {!isReadOnly && (
          <Button
            variant="ghost" size="sm"
            className="h-7 px-2 text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 hover:bg-teal-500/10"
            onClick={() => onLogNew(logType.id)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Log
          </Button>
        )}
      </div>
      <div className="p-3">
        <TypeBody logType={logType} isReadOnly={isReadOnly} />
      </div>
    </div>
  );
}

function TypeBody({ logType, isReadOnly }: { logType: CustomLogType; isReadOnly: boolean }) {
  if (logType.value_type === 'panel') {
    return <PanelHistory logTypeId={logType.id} isReadOnly={isReadOnly} />;
  }
  if (logType.value_type === 'text' || logType.value_type === 'text_multiline') {
    return <TextHistory logTypeId={logType.id} />;
  }
  // numeric, dual_numeric, medication — show all-time chart (medication still useful as count)
  if (logType.value_type === 'numeric' || logType.value_type === 'dual_numeric') {
    return (
      <div className="-mt-1">
        <CustomLogGroupTrend logType={logType} />
      </div>
    );
  }
  // medication: small "last logged" line
  return <MedicationSummary logTypeId={logType.id} unit={logType.unit} />;
}

function PanelHistory({ logTypeId, isReadOnly }: { logTypeId: string; isReadOnly: boolean }) {
  const { data: panels = [], isLoading } = useBloodworkPanelsForType(logTypeId);
  // Reuse the date-scoped hook's mutations via a tiny passthrough so delete/retry work the same.
  // We pass today's dateStr just to satisfy the hook contract; mutations are global and invalidate all panel caches.
  const today = format(new Date(), 'yyyy-MM-dd');
  const { deletePanel, retryParse, getSignedUrl } = useBloodworkPanelsForDate(today);

  const visible = panels.filter((p) => p.parse_status !== 'duplicate_pending');

  if (isLoading) return <Skeleton className="h-8 w-full" />;
  if (visible.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No panels uploaded yet. Tap "+ Log" to upload one.</p>;
  }

  return (
    <div className="space-y-0">
      {visible.map((panel) => (
        <div key={panel.id} className="space-y-0">
          {panel.collected_date && (
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground pt-1 pb-0.5">
              {format(parseISO(panel.collected_date), 'MMM d, yyyy')}
            </div>
          )}
          <BloodworkPanelRow
            panel={panel}
            isReadOnly={isReadOnly}
            onDelete={() => deletePanel.mutate(panel.id)}
            onRetry={() => retryParse.mutate(panel.id)}
            getSignedUrl={getSignedUrl}
          />
        </div>
      ))}
    </div>
  );
}

function TextHistory({ logTypeId }: { logTypeId: string }) {
  const { entries, isLoading } = useCustomLogEntriesForType(logTypeId);
  if (isLoading) return <Skeleton className="h-8 w-full" />;
  const recent = entries.slice(0, 5);
  if (recent.length === 0) return <p className="text-xs text-muted-foreground italic">No entries yet.</p>;
  return (
    <ul className="space-y-1">
      {recent.map((e) => (
        <li key={e.id} className="text-xs flex items-start gap-2 border-b border-border/40 pb-1 last:border-0">
          <span className="text-muted-foreground tabular-nums shrink-0 w-16">
            {format(parseISO(e.logged_date), 'MMM d')}
          </span>
          <span className="text-foreground/90 break-words min-w-0 flex-1">{e.text_value || '—'}</span>
        </li>
      ))}
      {entries.length > recent.length && (
        <li className="text-[11px] text-muted-foreground italic pt-1">
          + {entries.length - recent.length} more
        </li>
      )}
    </ul>
  );
}

function MedicationSummary({ logTypeId, unit }: { logTypeId: string; unit: string | null }) {
  const { entries, isLoading } = useCustomLogEntriesForType(logTypeId);
  if (isLoading) return <Skeleton className="h-8 w-full" />;
  if (entries.length === 0) return <p className="text-xs text-muted-foreground italic">No doses logged yet.</p>;
  const last = entries[0];
  return (
    <div className="text-xs text-muted-foreground">
      Last dose: <span className="text-foreground">{last.numeric_value ?? '—'}{unit ? ` ${unit}` : ''}</span>
      <span className="text-muted-foreground/70"> · {format(parseISO(last.logged_date), 'MMM d, yyyy')}</span>
      <span className="text-muted-foreground/70"> · {entries.length} total</span>
    </div>
  );
}
