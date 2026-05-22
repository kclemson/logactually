import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { Plus, ChevronRight, Search, X, ChevronsUpDown, ChevronsDownUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CustomLogGroupTrend } from '@/components/CustomLogGroupTrend';
import { BloodworkPanelRow, BloodworkPanelToolbar, panelHasMatch } from '@/components/BloodworkPanelGroup';
import { useBloodworkPanelsForType } from '@/hooks/useBloodworkPanelsForType';
import { useBloodworkPanelsForDate } from '@/hooks/useBloodworkPanels';
import { useCustomLogEntriesForType } from '@/hooks/useCustomLogEntriesForType';
import { CustomLogTypeDayRows } from '@/components/CustomLogEntriesView';
import { getMedicationMeta } from '@/lib/medication-meta';
import type { CustomLogType } from '@/hooks/useCustomLogTypes';
import type { CustomLogEntry } from '@/hooks/useCustomLogEntries';

const MAX_DATES = 30;

interface CustomLogByTypeViewProps {
  logTypes: CustomLogType[];
  isLoading: boolean;
  isReadOnly: boolean;
  onLogNew: (typeId: string) => void;
  onEditEntry?: (entry: CustomLogEntry) => void;
  onDeleteEntry?: (id: string) => void;
  onUpdateEntry?: (params: { id: string; numeric_value?: number | null; numeric_value_2?: number | null; text_value?: string | null }) => void;
}

export function CustomLogByTypeView({
  logTypes,
  isLoading,
  isReadOnly,
  onLogNew,
  onEditEntry,
  onDeleteEntry,
  onUpdateEntry,
}: CustomLogByTypeViewProps) {
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
        <TypeCard
          key={lt.id}
          logType={lt}
          isReadOnly={isReadOnly}
          onLogNew={onLogNew}
          onEditEntry={onEditEntry}
          onDeleteEntry={onDeleteEntry}
          onUpdateEntry={onUpdateEntry}
        />
      ))}
    </div>
  );
}

function TypeCard({
  logType,
  isReadOnly,
  onLogNew,
  onEditEntry,
  onDeleteEntry,
  onUpdateEntry,
}: {
  logType: CustomLogType;
  isReadOnly: boolean;
  onLogNew: (id: string) => void;
  onEditEntry?: (entry: CustomLogEntry) => void;
  onDeleteEntry?: (id: string) => void;
  onUpdateEntry?: (params: { id: string; numeric_value?: number | null; numeric_value_2?: number | null; text_value?: string | null }) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = logType.value_type === 'medication' ? getMedicationMeta(logType) : null;
  const isPanel = logType.value_type === 'panel';

  // Panel-only header state (filter query + collapse-all toggle), lifted up so it can sit in the header.
  const [panelQuery, setPanelQuery] = useState('');
  const [panelAllCollapsed, setPanelAllCollapsed] = useState(false);
  // Bump to broadcast collapse-all toggles down to PanelHistory.
  const [panelCollapseTick, setPanelCollapseTick] = useState(0);

  return (
    <div className="rounded-lg border border-border/60">
      <div
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 ${expanded ? 'border-b border-border/50' : ''}`}
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-baseline gap-2 min-w-0 flex-1 text-left hover:opacity-80 transition-opacity"
        >
          <ChevronRight
            className={`h-3.5 w-3.5 shrink-0 self-center text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`}
          />
          <span className="text-sm font-medium truncate">{logType.name}</span>
          {logType.unit && <span className="text-xs text-muted-foreground">{logType.unit}</span>}
          {meta && <span className="text-xs text-muted-foreground/70">· {meta}</span>}
        </button>
        {expanded && isPanel && (
          <PanelHeaderControls
            query={panelQuery}
            onQueryChange={setPanelQuery}
            allCollapsed={panelAllCollapsed}
            onToggleAll={() => {
              setPanelAllCollapsed((v) => !v);
              setPanelCollapseTick((t) => t + 1);
            }}
          />
        )}
        {!isReadOnly && (
          <Button
            variant="ghost" size="sm"
            className="h-7 px-2 text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 hover:bg-teal-500/10 shrink-0"
            onClick={(e) => { e.stopPropagation(); onLogNew(logType.id); }}
          >
            <Plus className="h-3 w-3 mr-1" />
            Log
          </Button>
        )}
      </div>
      {expanded && (
        <div className="p-3">
          <TypeBody
            logType={logType}
            isReadOnly={isReadOnly}
            onEditEntry={onEditEntry}
            onDeleteEntry={onDeleteEntry}
            onUpdateEntry={onUpdateEntry}
            panelQuery={panelQuery}
            panelAllCollapsed={panelAllCollapsed}
            panelCollapseTick={panelCollapseTick}
          />
        </div>
      )}
    </div>
  );
}

function PanelHeaderControls({
  query,
  onQueryChange,
  allCollapsed,
  onToggleAll,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  allCollapsed: boolean;
  onToggleAll: () => void;
}) {
  return (
    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
      <div className="relative">
        <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Filter…"
          autoComplete="off"
          className="w-28 h-7 pl-6 pr-6 text-xs rounded border border-border bg-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label="Clear filter"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      {!query && (
        <Button
          variant="ghost" size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={onToggleAll}
          aria-label={allCollapsed ? 'Expand all' : 'Collapse all'}
          title={allCollapsed ? 'Expand all' : 'Collapse all'}
        >
          {allCollapsed ? <ChevronsUpDown className="h-3.5 w-3.5" /> : <ChevronsDownUp className="h-3.5 w-3.5" />}
        </Button>
      )}
    </div>
  );
}

function TypeBody({
  logType,
  isReadOnly,
  onEditEntry,
  onDeleteEntry,
  onUpdateEntry,
  panelQuery,
  panelAllCollapsed,
  panelCollapseTick,
}: {
  logType: CustomLogType;
  isReadOnly: boolean;
  onEditEntry?: (entry: CustomLogEntry) => void;
  onDeleteEntry?: (id: string) => void;
  onUpdateEntry?: (params: { id: string; numeric_value?: number | null; numeric_value_2?: number | null; text_value?: string | null }) => void;
  panelQuery: string;
  panelAllCollapsed: boolean;
  panelCollapseTick: number;
}) {
  // Panels live in a separate table; keep their own history view.
  if (logType.value_type === 'panel') {
    return (
      <PanelHistory
        logTypeId={logType.id}
        isReadOnly={isReadOnly}
        query={panelQuery}
        allCollapsed={panelAllCollapsed}
        collapseTick={panelCollapseTick}
      />
    );
  }
  return (
    <EntryHistory
      logType={logType}
      isReadOnly={isReadOnly}
      onEditEntry={onEditEntry}
      onDeleteEntry={onDeleteEntry}
      onUpdateEntry={onUpdateEntry}
    />
  );
}


function EntryHistory({
  logType,
  isReadOnly,
  onEditEntry,
  onDeleteEntry,
  onUpdateEntry,
}: {
  logType: CustomLogType;
  isReadOnly: boolean;
  onEditEntry?: (entry: CustomLogEntry) => void;
  onDeleteEntry?: (id: string) => void;
  onUpdateEntry?: (params: { id: string; numeric_value?: number | null; numeric_value_2?: number | null; text_value?: string | null }) => void;
}) {
  const { entries, isLoading, deleteEntry } = useCustomLogEntriesForType(logType.id);
  const showTrend = logType.value_type === 'numeric' || logType.value_type === 'dual_numeric';

  if (isLoading) return <Skeleton className="h-8 w-full" />;
  if (entries.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No entries yet.</p>;
  }

  // Group by logged_date, preserving the hook's desc order.
  const byDate: { date: string; items: CustomLogEntry[] }[] = [];
  const seen = new Map<string, number>();
  for (const entry of entries) {
    const idx = seen.get(entry.logged_date);
    if (idx !== undefined) {
      byDate[idx].items.push(entry);
    } else {
      seen.set(entry.logged_date, byDate.length);
      byDate.push({ date: entry.logged_date, items: [entry] });
    }
  }

  const visibleDates = byDate.slice(0, MAX_DATES);
  const hiddenCount = byDate.length - visibleDates.length;

  const handleDelete = (id: string) => {
    if (onDeleteEntry) onDeleteEntry(id);
    else deleteEntry.mutate(id);
  };

  return (
    <div className="space-y-3">
      {showTrend && (
        <div className="-mt-1">
          <CustomLogGroupTrend logType={logType} />
        </div>
      )}
      <div className="space-y-2">
        {visibleDates.map(({ date, items }) => (
          <div key={date} className="space-y-0">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground pt-1 pb-0.5">
              {format(parseISO(date), 'MMM d, yyyy')}
            </div>
            <CustomLogTypeDayRows
              logType={logType}
              entries={items}
              dateStr={date}
              isReadOnly={isReadOnly}
              onDelete={handleDelete}
              onEdit={onEditEntry}
              onUpdate={onUpdateEntry}
              showTypeHeader={false}
              showTrend={false}
            />
          </div>
        ))}
        {hiddenCount > 0 && (
          <p className="text-[11px] text-muted-foreground italic pt-1">
            + {hiddenCount} more date{hiddenCount === 1 ? '' : 's'}
          </p>
        )}
      </div>
    </div>
  );
}

function PanelHistory({ logTypeId, isReadOnly }: { logTypeId: string; isReadOnly: boolean }) {
  const { data: panels = [], isLoading } = useBloodworkPanelsForType(logTypeId);
  // Reuse the date-scoped hook's mutations via a tiny passthrough so delete/retry work the same.
  const today = format(new Date(), 'yyyy-MM-dd');
  const { deletePanel, retryParse, getSignedUrl } = useBloodworkPanelsForDate(today);

  const [query, setQuery] = useState('');
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});
  const [allCollapsed, setAllCollapsed] = useState(false);

  const visible = panels.filter((p) => p.parse_status !== 'duplicate_pending');

  if (isLoading) return <Skeleton className="h-8 w-full" />;
  if (visible.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No panels uploaded yet. Tap "+ Log" to upload one.</p>;
  }

  const filtered = query ? visible.filter((p) => panelHasMatch(p, query)) : visible;

  const toggleAll = () => {
    const next = !allCollapsed ? true : false;
    setAllCollapsed(next);
    const m: Record<string, boolean> = {};
    for (const p of visible) m[p.id] = !next;
    setCollapsedMap(m);
  };

  return (
    <div className="space-y-0">
      {visible.length >= 2 && (
        <BloodworkPanelToolbar
          query={query}
          onQueryChange={setQuery}
          allExpanded={!allCollapsed}
          onToggleAll={toggleAll}
          showToggle
        />
      )}
      {filtered.map((panel) => {
        const forcedExpanded = query ? true : collapsedMap[panel.id];
        return (
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
              expanded={forcedExpanded}
              onToggle={() => setCollapsedMap((m) => ({ ...m, [panel.id]: !(m[panel.id] ?? true) }))}
              filterQuery={query}
            />
          </div>
        );
      })}
    </div>
  );
}

