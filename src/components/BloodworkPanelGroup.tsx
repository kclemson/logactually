import { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, Trash2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBloodworkPanelsForDate, type BloodworkPanelWithResults } from '@/hooks/useBloodworkPanels';
import { cn } from '@/lib/utils';

interface BloodworkPanelGroupProps {
  dateStr: string;
  logTypeId: string;
  isReadOnly: boolean;
}

export function BloodworkPanelGroup({ dateStr, logTypeId, isReadOnly }: BloodworkPanelGroupProps) {
  const { panels, deletePanel, retryParse, getSignedUrl } = useBloodworkPanelsForDate(dateStr);
  // duplicate_pending panels are resolved via the global DuplicateContentDialogHost.
  const myPanels = panels.filter((p) => p.log_type_id === logTypeId && p.parse_status !== 'duplicate_pending');
  if (myPanels.length === 0) return null;

  return (
    <div className="space-y-0">
      {myPanels.map((panel) => (
        <BloodworkPanelRow
          key={panel.id}
          panel={panel}
          isReadOnly={isReadOnly}
          onDelete={() => deletePanel.mutate(panel.id)}
          onRetry={() => retryParse.mutate(panel.id)}
          getSignedUrl={getSignedUrl}
        />
      ))}
    </div>
  );
}

interface BloodworkPanelRowProps {
  panel: BloodworkPanelWithResults;
  isReadOnly: boolean;
  onDelete: () => void;
  onRetry: () => void;
  getSignedUrl: (path: string) => Promise<string | null>;
}

export function BloodworkPanelRow({ panel, isReadOnly, onDelete, onRetry, getSignedUrl }: BloodworkPanelRowProps) {
  const [expanded, setExpanded] = useState(true);
  const isPending = panel.parse_status === 'pending';
  const isFailed = panel.parse_status === 'failed';

  const openOriginal = async () => {
    const url = await getSignedUrl(panel.storage_path);
    if (url) window.open(url, '_blank');
  };

  // Group results by panel_section, preserving section_order/result_order from query.
  const sections: { title: string | null; results: typeof panel.results }[] = [];
  const idx = new Map<string, number>();
  for (const r of panel.results) {
    const key = r.panel_section ?? '';
    if (!idx.has(key)) {
      idx.set(key, sections.length);
      sections.push({ title: r.panel_section, results: [] });
    }
    sections[idx.get(key)!].results.push(r);
  }

  return (
    <div className="border-b border-border/50 last:border-0 group">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 py-1 pl-1">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="h-6 w-6 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label={expanded ? 'Collapse' : 'Expand'}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>
        <div className="min-w-0 flex items-center gap-2">
          {!isPending && !isFailed ? (() => {
            const sectionParts = sections.map((s) => {
              const title = s.title || 'Other';
              return `${title} (${s.results.length})`;
            });
            const summary = sectionParts.length
              ? sectionParts.join(' · ')
              : (panel.panel_title || panel.source_filename || 'Bloodwork');
            return (
              <span className="text-xs text-muted-foreground truncate min-w-0" title={summary}>
                {summary}
              </span>
            );
          })() : (
            <span className="text-sm truncate min-w-0">
              {panel.panel_title || panel.source_filename || 'Bloodwork'}
            </span>
          )}
          {isPending && <span className="text-xs text-muted-foreground italic shrink-0">parsing…</span>}
          {isFailed && (
            <span className="text-xs text-destructive shrink-0 inline-flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> failed
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost" size="icon"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
            onClick={openOriginal}
            aria-label="View original document"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
          {isFailed && !isReadOnly && (
            <Button
              variant="ghost" size="icon"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
              onClick={onRetry}
              aria-label="Retry"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
          {!isReadOnly && (
            <Button
              variant="ghost" size="icon"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
              onClick={onDelete}
              aria-label="Delete panel"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {isFailed && panel.parse_error && (
        <p className="pl-8 pr-2 pb-1 text-xs text-destructive/80 italic">{panel.parse_error}</p>
      )}

      {expanded && !isPending && !isFailed && (
        <div className="pl-8 pr-2 pb-2 space-y-2">
          {sections.map((section, i) => (
            <div key={i} className="space-y-0">
              {section.title && (
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground pt-1 pb-0.5">
                  {section.title}
                </div>
              )}
              {section.results.map((r) => {
                const refRange =
                  r.reference_low != null && r.reference_high != null
                    ? `${r.reference_low}–${r.reference_high}`
                    : r.reference_raw ?? '';
                const valueStr =
                  r.numeric_value != null
                    ? `${r.numeric_value}`
                    : r.reference_raw && r.numeric_value == null
                      ? r.reference_raw
                      : '—';
                return (
                  <div key={r.id} className="grid grid-cols-[minmax(0,1fr)_6rem_auto] items-baseline gap-x-3 py-0.5 text-xs">
                    <span className="truncate">{r.display_name}</span>
                    <span className="tabular-nums whitespace-nowrap">
                      <span className={cn(
                        r.flag === 'H' || r.flag === 'High' ? 'text-orange-600 dark:text-orange-400 font-medium' :
                        r.flag === 'L' || r.flag === 'Low' ? 'text-blue-600 dark:text-blue-400 font-medium' :
                        ''
                      )}>{valueStr}</span>
                      {r.flag && (
                        <span className={cn(
                          'ml-1 text-[10px]',
                          r.flag === 'H' || r.flag === 'High' ? 'text-orange-600 dark:text-orange-400' :
                          r.flag === 'L' || r.flag === 'Low' ? 'text-blue-600 dark:text-blue-400' :
                          'text-muted-foreground'
                        )}>{r.flag}</span>
                      )}
                    </span>
                    <span className="text-muted-foreground tabular-nums whitespace-nowrap text-[10px]">
                      {refRange}
                    </span>
                  </div>
                );

              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
