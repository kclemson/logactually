// Device-local persistence for bloodwork view UI state.
// Survives navigation between /custom and /trends. Wrapped in try/catch so
// SSR or privacy-mode browsers degrade silently.
//
// All reads/writes are synchronous and meant to feed React `useState` lazy
// initializers + event-handler setters (no useEffect sync).

const TYPE_EXPANDED_PREFIX = 'bloodwork-type-expanded:';
const PANEL_QUERY_PREFIX = 'bloodwork-panel-query:';
const PANEL_ALL_COLLAPSED_PREFIX = 'bloodwork-panel-all-collapsed:';
const PANEL_OVERRIDES_PREFIX = 'bloodwork-panel-overrides:';

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}
function safeRemove(key: string): void {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

// --- Per-type expansion (so each panel-type row remembers open/closed) ---
export function readTypeExpanded(typeId: string): boolean {
  return safeGet(`${TYPE_EXPANDED_PREFIX}${typeId}`) === 'true';
}
export function writeTypeExpanded(typeId: string, value: boolean): void {
  if (value) safeSet(`${TYPE_EXPANDED_PREFIX}${typeId}`, 'true');
  else safeRemove(`${TYPE_EXPANDED_PREFIX}${typeId}`);
}

// --- Header filter query (scoped per typeId/scope so different views don't bleed) ---
export function readPanelQuery(scope: string): string {
  return safeGet(`${PANEL_QUERY_PREFIX}${scope}`) ?? '';
}
export function writePanelQuery(scope: string, value: string): void {
  if (value) safeSet(`${PANEL_QUERY_PREFIX}${scope}`, value);
  else safeRemove(`${PANEL_QUERY_PREFIX}${scope}`);
}

// --- "All collapsed" toggle ---
export function readPanelAllCollapsed(scope: string): boolean {
  return safeGet(`${PANEL_ALL_COLLAPSED_PREFIX}${scope}`) === 'true';
}
export function writePanelAllCollapsed(scope: string, value: boolean): void {
  if (value) safeSet(`${PANEL_ALL_COLLAPSED_PREFIX}${scope}`, 'true');
  else safeRemove(`${PANEL_ALL_COLLAPSED_PREFIX}${scope}`);
}

// --- Per-panel expand/collapse overrides keyed by panel id ---
// Stored as JSON: { [panelId]: boolean }  (true = expanded)
export function readPanelOverrides(scope: string, validIds?: Set<string>): Record<string, boolean> {
  const raw = safeGet(`${PANEL_OVERRIDES_PREFIX}${scope}`);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    if (!validIds) return parsed as Record<string, boolean>;
    // Prune ids no longer present.
    const pruned: Record<string, boolean> = {};
    let changed = false;
    for (const [k, v] of Object.entries(parsed as Record<string, boolean>)) {
      if (validIds.has(k)) pruned[k] = !!v;
      else changed = true;
    }
    if (changed) writePanelOverrides(scope, pruned);
    return pruned;
  } catch {
    return {};
  }
}
export function writePanelOverrides(scope: string, value: Record<string, boolean>): void {
  if (!value || Object.keys(value).length === 0) {
    safeRemove(`${PANEL_OVERRIDES_PREFIX}${scope}`);
  } else {
    safeSet(`${PANEL_OVERRIDES_PREFIX}${scope}`, JSON.stringify(value));
  }
}
