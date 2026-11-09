// In-memory drafts for log text boxes. Lives outside the per-day page
// (which remounts on date change) so unsubmitted text survives day switches.
// Intentionally not persisted across full reloads.
const drafts = new Map<string, string>();

export function getDraft(key: string): string {
  return drafts.get(key) ?? '';
}

export function setDraft(key: string, value: string): void {
  if (value) drafts.set(key, value);
  else drafts.delete(key);
}
