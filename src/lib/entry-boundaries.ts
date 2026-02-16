import { cn } from '@/lib/utils';

/**
 * Represents a contiguous range of items belonging to a single entry
 * in the flat items array. Used by both FoodItemsTable and WeightItemsTable
 * to determine visual grouping, chevron placement, and highlight animation.
 */
export interface EntryBoundary {
  entryId: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Returns the boundary if `index` is the first item in any entry group,
 * or null otherwise. Used to decide where to start the highlight outline
 * and where to place entry-level UI at the top of a group.
 */
export function isFirstInBoundary(index: number, boundaries: EntryBoundary[]): EntryBoundary | null {
  const boundary = boundaries.find(b => b.startIndex === index);
  return boundary || null;
}

/**
 * Returns the boundary if `index` is the last item in any entry group,
 * or null otherwise. Used to decide where to place the chevron, the
 * entry-level delete button, and where to end the highlight outline.
 */
export function isLastInBoundary(index: number, boundaries: EntryBoundary[]): EntryBoundary | null {
  const boundary = boundaries.find(b => b.endIndex === index);
  return boundary || null;
}

/**
 * Returns true if an entry ID is in the "new" set — i.e., it was just
 * logged and should show the blue highlight glow animation.
 */
export function isEntryNew(entryId: string | null | undefined, newEntryIds?: Set<string>): boolean {
  return entryId ? (newEntryIds?.has(entryId) ?? false) : false;
}

/**
 * Returns the CSS classes for the blue highlight outline animation on
 * a newly logged entry. The outline is segmented so multi-item entries
 * look like a single connected rounded rectangle:
 *
 * - Single item (first AND last): full rounded outline
 * - First of many: rounded top only, no bottom border
 * - Last of many: rounded bottom only, no top border
 * - Middle: no rounding, side borders only
 *
 * Returns empty string when the entry is not new (no animation needed).
 */
export function getEntryHighlightClasses(
  isNew: boolean,
  isFirst: boolean,
  isLast: boolean
): string {
  if (!isNew) return '';

  return cn(
    // Padding for inset shadow
    "pl-0.5",
    isLast && "pb-0.5",
    // Segmented outline classes
    isFirst && !isLast && "rounded-t-md animate-outline-fade-top",
    !isFirst && isLast && "rounded-b-md animate-outline-fade-bottom",
    !isFirst && !isLast && "animate-outline-fade-middle",
    isFirst && isLast && "rounded-md animate-outline-fade"
  );
}

/**
 * Returns true if the item has any user-edited fields (shown as a blue * indicator).
 * Works with both FoodItem and WeightSet since both have `editedFields?: string[]`.
 */
export function hasAnyEditedFields(item: { editedFields?: string[] }): boolean {
  return (item.editedFields?.length ?? 0) > 0;
}

/**
 * Formats edited field names into a tooltip string like "Edited: Calories, Protein".
 * Returns null if no fields were edited.
 */
export function formatEditedFields(item: { editedFields?: string[] }): string | null {
  if (!item.editedFields || item.editedFields.length === 0) return null;
  const fieldLabels = item.editedFields.map(field =>
    field.charAt(0).toUpperCase() + field.slice(1)
  );
  return `Edited: ${fieldLabels.join(', ')}`;
}
