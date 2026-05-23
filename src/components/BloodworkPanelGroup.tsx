import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, Trash2, AlertCircle, Loader2, RefreshCw, ChevronsDownUp, ChevronsUpDown, Search, X, Pin, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBloodworkPanelsForDate, type BloodworkPanelWithResults } from '@/hooks/useBloodworkPanels';
import { usePinnedBloodworkCharts } from '@/hooks/usePinnedBloodworkCharts';
import {
  readPanelQuery, writePanelQuery,
  readPanelAllCollapsed, writePanelAllCollapsed,
  readPanelOverrides, writePanelOverrides,
} from '@/lib/bloodwork-ui-state';
import { cn } from '@/lib/utils';

interface BloodworkPanelGroupProps {
  dateStr: string;
  logTypeId: string;
  isReadOnly: boolean;
}

// Normalize raw flag strings (H, High, HH, L, Low, LL, etc.) to canonical labels.
// Unrecognized flags (e.g. "Alert") return null and render no flag label.
function normalizeFlag(flag: string | null | undefined): 'High' | 'Low' | null {
  if (!flag) return null;
  const upper = flag.trim().toUpperCase();
  if (upper.startsWith('H')) return 'High';
  if (upper.startsWith('L')) return 'Low';
  return null;
}

// Substring match against display_name, analyte_name, panel_section, and normalized flag.
export function resultMatchesQuery(
  r: BloodworkPanelWithResults['results'][number],
  q: string,
): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  const nf = normalizeFlag(r.flag);
  return (
    (r.display_name?.toLowerCase().includes(needle) ?? false) ||
    (r.analyte_name?.toLowerCase().includes(needle) ?? false) ||
    (r.panel_section?.toLowerCase().includes(needle) ?? false) ||
    (nf?.toLowerCase().includes(needle) ?? false)
  );
}

export function panelHasMatch(panel: BloodworkPanelWithResults, q: string): boolean {
  if (!q) return true;
  return panel.results.some((r) => resultMatchesQuery(r, q));
}

export function BloodworkPanelToolbar({
  query,
  onQueryChange,
  allExpanded,
  onToggleAll,
  showToggle,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  allExpanded: boolean;
  onToggleAll: () => void;
  showToggle: boolean;
}) {
  return (
    <div className="flex items-center gap-1 mb-2">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Filter results…"
          autoComplete="off"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          className="w-full h-7 pl-7 pr-7 text-xs rounded border border-border bg-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
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
      {showToggle && (
        <Button
          variant="ghost" size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={onToggleAll}
          aria-label={allExpanded ? 'Collapse all' : 'Expand all'}
          title={allExpanded ? 'Collapse all' : 'Expand all'}
        >
          {allExpanded ? <ChevronsDownUp className="h-3.5 w-3.5" /> : <ChevronsUpDown className="h-3.5 w-3.5" />}
        </Button>
      )}
    </div>
  );
}

export function BloodworkPanelGroup({ dateStr, logTypeId, isReadOnly }: BloodworkPanelGroupProps) {
  const { panels, deletePanel, retryParse, getSignedUrl } = useBloodworkPanelsForDate(dateStr);
  // duplicate_pending panels are resolved via the global DuplicateContentDialogHost.
  const myPanels = useMemo(
    () => panels.filter((p) => p.log_type_id === logTypeId && p.parse_status !== 'duplicate_pending'),
    [panels, logTypeId]
  );

  // Shared scope across all dates for this log type — panel ids are globally
  // unique, and the overrides map prunes stale ids on read.
  const scope = `dated:${logTypeId}`;
  const [query, setQuery] = useState(() => readPanelQuery(scope));
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>(() => {
    const ids = new Set(myPanels.map((p) => p.id));
    return readPanelOverrides(scope, ids.size > 0 ? ids : undefined);
  });
  const [allCollapsed, setAllCollapsed] = useState(() => readPanelAllCollapsed(scope));

  if (myPanels.length === 0) return null;

  const visiblePanels = query ? myPanels.filter((p) => panelHasMatch(p, query)) : myPanels;

  const handleQueryChange = (q: string) => {
    setQuery(q);
    writePanelQuery(scope, q);
  };

  const toggleAll = () => {
    const next = !allCollapsed ? true : false;
    setAllCollapsed(next);
    writePanelAllCollapsed(scope, next);
    const m: Record<string, boolean> = { ...collapsedMap };
    for (const p of myPanels) m[p.id] = !next;
    setCollapsedMap(m);
    writePanelOverrides(scope, m);
  };

  const handleToggleRow = (panelId: string) => {
    setCollapsedMap((m) => {
      const next = { ...m, [panelId]: !(m[panelId] ?? true) };
      writePanelOverrides(scope, next);
      return next;
    });
  };

  return (
    <div className="space-y-0">
      {myPanels.length >= 2 && (
        <BloodworkPanelToolbar
          query={query}
          onQueryChange={handleQueryChange}
          allExpanded={!allCollapsed}
          onToggleAll={toggleAll}
          showToggle
        />
      )}
      {visiblePanels.map((panel) => {
        const forcedExpanded = query ? true : collapsedMap[panel.id];
        return (
          <BloodworkPanelRow
            key={panel.id}
            panel={panel}
            isReadOnly={isReadOnly}
            onDelete={() => deletePanel.mutate(panel.id)}
            onRetry={() => retryParse.mutate(panel.id)}
            getSignedUrl={getSignedUrl}
            expanded={forcedExpanded}
            onToggle={() => handleToggleRow(panel.id)}
            filterQuery={query}
          />
        );
      })}
    </div>
  );
}

interface BloodworkPanelRowProps {
  panel: BloodworkPanelWithResults;
  isReadOnly: boolean;
  onDelete: () => void;
  onRetry: () => void;
  getSignedUrl: (path: string) => Promise<string | null>;
  expanded?: boolean;
  onToggle?: () => void;
  filterQuery?: string;
}

export function BloodworkPanelRow({ panel, isReadOnly, onDelete, onRetry, getSignedUrl, expanded: controlledExpanded, onToggle, filterQuery = '' }: BloodworkPanelRowProps) {
  const { pinnedKeys, pin, unpin } = usePinnedBloodworkCharts();
  const togglePin = (canonicalKey: string, displayName: string) => {
    if (isReadOnly) return;
    if (pinnedKeys.has(canonicalKey)) unpin.mutate(canonicalKey);
    else pin.mutate({ canonicalKey, displayName });
  };
  const renderPin = (canonicalKey: string, displayName: string) => {
    const pinned = pinnedKeys.has(canonicalKey);
    return (
      <button
        type="button"
        onClick={() => togglePin(canonicalKey, displayName)}
        disabled={isReadOnly}
        aria-label={pinned ? 'Unpin from Trends' : 'Pin to Trends'}
        title={pinned ? 'Pinned to Trends' : 'Pin to Trends'}
        className={cn(
          'inline-flex h-4 w-4 shrink-0 items-center justify-center transition-colors',
          pinned ? 'text-teal-500 dark:text-teal-400' : 'text-muted-foreground/40 hover:text-foreground',
          isReadOnly && 'opacity-30 cursor-not-allowed',
        )}
      >
        <Pin className={cn('h-3 w-3', pinned && 'fill-current')} />
      </button>
    );
  };
  const renderLookup = (displayName: string) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(`${displayName} blood test`)}`;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        aria-label={`Look up ${displayName}`}
        title={`Look up "${displayName} blood test"`}
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground/40 hover:text-foreground transition-opacity md:opacity-0 md:group-hover/row:opacity-100"
      >
        <HelpCircle className="h-3 w-3" />
      </a>
    );
  };
  const [internalExpanded, setInternalExpanded] = useState(true);
  const expanded = controlledExpanded ?? internalExpanded;
  const isPending = panel.parse_status === 'pending';
  const isFailed = panel.parse_status === 'failed';

  const openOriginal = async () => {
    const url = await getSignedUrl(panel.storage_path);
    if (url) window.open(url, '_blank');
  };

  // Group results by panel_section, preserving section_order/result_order from query.
  // When a filter is active, drop results that don't match and skip sections that become empty.
  const sections: { title: string | null; results: typeof panel.results }[] = [];
  const idx = new Map<string, number>();
  for (const r of panel.results) {
    if (filterQuery && !resultMatchesQuery(r, filterQuery)) continue;
    const key = r.panel_section ?? '';
    if (!idx.has(key)) {
      idx.set(key, sections.length);
      sections.push({ title: r.panel_section, results: [] });
    }
    sections[idx.get(key)!].results.push(r);
  }

  const isFiltering = !!filterQuery;

  // Rows-only mode: when filtering, drop the panel chrome (header + section titles + indent)
  // and just render matching rows under the parent's date label.
  if (isFiltering) {
    if (isPending || isFailed) return null;
    const flatResults = sections.flatMap((s) => s.results);
    if (flatResults.length === 0) return null;
    return (
      <div className="pb-1">
        <div className="grid grid-cols-[minmax(0,1fr)_3.5rem_3.5rem] items-baseline gap-x-3 text-xs">
          {flatResults.map((r) => {
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
              <div key={r.id} className="contents">
                <span className="flex items-center gap-1 min-w-0 py-0.5 group/row">
                  {renderPin(r.canonical_key, r.display_name)}
                  <span className="truncate">{r.display_name}</span>
                  {renderLookup(r.display_name)}
                </span>
                <span className="tabular-nums whitespace-nowrap py-0.5">
                  {(() => {
                    const nf = normalizeFlag(r.flag);
                    const flagColor = nf === 'High'
                      ? 'text-amber-600 dark:text-amber-400'
                      : nf === 'Low'
                        ? 'text-blue-600 dark:text-blue-400'
                        : '';
                    return (
                      <>
                        <span className={cn(flagColor, nf ? 'font-medium' : '')}>{valueStr}</span>
                        {nf && (
                          <span className={cn('ml-1 text-[10px]', flagColor)}>{nf}</span>
                        )}
                      </>
                    );
                  })()}
                </span>
                <span className="text-muted-foreground tabular-nums whitespace-nowrap text-[10px] text-right truncate py-0.5">
                  {refRange}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border/50 last:border-0 group">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 py-1 pl-1">
        <button
          onClick={() => (onToggle ? onToggle() : setInternalExpanded((v) => !v))}
          className="h-6 w-6 inline-flex items-center justify-start text-muted-foreground hover:text-foreground"
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
        <div className="pl-1 pr-2 pb-2 space-y-2">
          {sections.map((section, i) => (
            <div key={i} className="space-y-0">
              {section.title && (
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground pt-1 pb-0.5">
                  {section.title}
                </div>
              )}
              <div className="grid grid-cols-[minmax(0,1fr)_3.5rem_3.5rem] items-baseline gap-x-3 text-xs">
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
                    <div key={r.id} className="contents">
                      <span className="flex items-center gap-1 min-w-0 py-0.5 group/row">
                        {renderPin(r.canonical_key, r.display_name)}
                        <span className="truncate">{r.display_name}</span>
                        {renderLookup(r.display_name)}
                      </span>
                      <span className="tabular-nums whitespace-nowrap py-0.5">
                        {(() => {
                          const nf = normalizeFlag(r.flag);
                          const flagColor = nf === 'High'
                            ? 'text-amber-600 dark:text-amber-400'
                            : nf === 'Low'
                              ? 'text-blue-600 dark:text-blue-400'
                              : '';
                          return (
                            <>
                              <span className={cn(flagColor, nf ? 'font-medium' : '')}>{valueStr}</span>
                              {nf && (
                                <span className={cn('ml-1 text-[10px]', flagColor)}>{nf}</span>
                              )}
                            </>
                          );
                        })()}
                      </span>
                      <span className="text-muted-foreground tabular-nums whitespace-nowrap text-[10px] text-right truncate py-0.5">
                        {refRange}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

