import { type ReactNode, useState } from 'react';
import { ChevronRight, Pencil, Pin, PinOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeleteConfirmPopover } from '@/components/DeleteConfirmPopover';
import { DescriptionCell } from '@/components/DescriptionCell';

interface SavedItemRowProps {
  id: string;
  name: string;
  onUpdateName: (newName: string) => void;
  onDelete: () => void;
  onEdit?: () => void;
  deleteConfirmLabel: string;
  deleteConfirmDescription: string;
  openDeletePopoverId: string | null;
  setOpenDeletePopoverId: (id: string | null) => void;
  expandable?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  nameAppend?: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  existingNames?: string[];
  /** When defined, renders a Quick Add pin toggle. */
  isPinned?: boolean;
  /** Why the item is in Quick Add: manually pinned, auto-detected, or not at all. */
  pinSource?: 'manual' | 'auto' | null;
  onTogglePin?: () => void;
}

export function SavedItemRow({
  id,
  name,
  onUpdateName,
  onDelete,
  onEdit,
  deleteConfirmLabel,
  deleteConfirmDescription,
  openDeletePopoverId,
  setOpenDeletePopoverId,
  expandable = true,
  isExpanded = false,
  onToggleExpand,
  nameAppend,
  meta,
  children,
  existingNames = [],
  isPinned,
  pinSource,
  onTogglePin,
}: SavedItemRowProps) {
  const [flashError, setFlashError] = useState(false);

  const isDuplicateName = (newName: string) =>
    existingNames.some(
      (n) => n.toLowerCase() === newName.toLowerCase() && n.toLowerCase() !== name.toLowerCase()
    );

  return (
    <li className="py-0.5">
      <div className="flex items-center gap-2">
        {expandable && (
          <button
            onClick={onToggleExpand}
            className="p-0.5 text-muted-foreground hover:text-foreground transition-transform"
          >
            <ChevronRight
              className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-90')}
            />
          </button>
        )}

        <div className="flex items-center gap-1 min-w-0 flex-1">
          <div
            className={cn(
              'min-w-0 text-sm cursor-text hover:bg-muted/50 focus-within:bg-focus-bg focus-within:ring-2 focus-within:ring-focus-ring rounded px-1 py-0.5 transition-colors',
              flashError && 'ring-2 ring-destructive bg-destructive/10'
            )}
          >
            <DescriptionCell
              value={name}
              onSave={onUpdateName}
              validate={(newName) => !isDuplicateName(newName)}
              onValidationFail={() => {
                setFlashError(true);
                setTimeout(() => setFlashError(false), 1500);
              }}
              className="focus:outline-none"
            />
          </div>
          {nameAppend && (
            <span className="text-xs text-muted-foreground shrink-0">{nameAppend}</span>
          )}
        </div>

        {meta && (
          <span className="text-xs text-muted-foreground shrink-0">{meta}</span>
        )}

        {onEdit && (
          <button
            onClick={onEdit}
            className="p-0.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Edit details"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}

        {onTogglePin && (() => {
          const source = pinSource !== undefined ? pinSource : isPinned ? 'manual' : null;
          const inQuickAdd = source !== null;
          const label = !inQuickAdd
            ? 'Add to Quick Add'
            : source === 'auto'
              ? 'In Quick Add (automatic) - tap to remove'
              : 'Pinned to Quick Add - tap to remove';
          return (
            <button
              onClick={onTogglePin}
              title={label}
              aria-label={label}
              aria-pressed={inQuickAdd}
              className={cn(
                'p-0.5 shrink-0 transition-colors',
                source === 'manual'
                  ? 'text-primary'
                  : source === 'auto'
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/50 hover:text-foreground'
              )}
            >
              {inQuickAdd ? (
                <Pin className="h-3.5 w-3.5 fill-current" />
              ) : (
                <PinOff className="h-3.5 w-3.5" />
              )}
            </button>
          );
        })()}

        <DeleteConfirmPopover
          id={id}
          label={deleteConfirmLabel}
          description={deleteConfirmDescription}
          onDelete={onDelete}
          openPopoverId={openDeletePopoverId}
          setOpenPopoverId={setOpenDeletePopoverId}
        />
      </div>

      {expandable && isExpanded && children && (
        <div className="pl-6 mt-1">{children}</div>
      )}
    </li>
  );
}
