import { useDuplicatePendingPanels } from '@/hooks/useBloodworkPanels';
import { DuplicateContentDialog } from '@/components/DuplicateContentDialog';

/**
 * Renders the Layer-2 duplicate-content resolution dialog for ANY of the user's
 * duplicate_pending panels, regardless of which day's view they're on. One panel
 * at a time — additional ones surface as the user resolves each.
 */
export function DuplicateContentDialogHost() {
  const { panels } = useDuplicatePendingPanels();
  const next = panels[0];
  if (!next) return null;
  return <DuplicateContentDialog key={next.id} pending={next} />;
}
