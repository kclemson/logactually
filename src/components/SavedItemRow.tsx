import { type ReactNode, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeleteConfirmPopover } from '@/components/DeleteConfirmPopover';

interface SavedItemRowProps {
  id: string;
  name: string;
  onUpdateName: (newName: string) => void;
  onDelete: () => void;
  deleteConfirmLabel: string;
  deleteConfirmDescription: string;
  openDeletePopoverId: string | null;
  setOpenDeletePopoverId: (id: string | null) => void;
  expandable?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  meta?: ReactNode;
  children?: ReactNode;
  existingNames?: string[];
}

export function SavedItemRow({
  id,
  name,
  onUpdateName,
  onDelete,
  deleteConfirmLabel,
  deleteConfirmDescription,
  openDeletePopoverId,
  setOpenDeletePopoverId,
  expandable = true,
  isExpanded = false,
  onToggleExpand,
  meta,
  children,
  existingNames = [],
}: SavedItemRowProps) {
  const originalNameRef = useRef(name);
  const [isEditing, setIsEditing] = useState(false);
  const [flashError, setFlashError] = useState(false);

  const isDuplicateName = (newName: string) =>
    existingNames.some(
      (n) => n.toLowerCase() === newName.toLowerCase() && n.toLowerCase() !== name.toLowerCase()
    );

  const handleSave = (el: HTMLElement) => {
    const newName = (el.textContent || '').trim();
    const original = originalNameRef.current;

    if (!newName || isDuplicateName(newName)) {
      el.textContent = original;
      if (newName && isDuplicateName(newName)) {
        setFlashError(true);
        setTimeout(() => setFlashError(false), 1500);
      }
    } else if (newName !== original) {
      onUpdateName(newName);
      originalNameRef.current = newName;
    }
  };

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

        <div className="flex items-center gap-1 flex-1 min-w-0">
          <div
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            onFocus={() => {
              setIsEditing(true);
              originalNameRef.current = name;
            }}
            onBlur={(e) => {
              setIsEditing(false);
              handleSave(e.currentTarget);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.currentTarget.blur();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                e.currentTarget.textContent = originalNameRef.current;
                e.currentTarget.blur();
              }
            }}
            className={cn(
              'text-sm truncate cursor-text hover:bg-muted/50 focus:bg-focus-bg focus:ring-2 focus:ring-focus-ring focus:outline-none rounded px-1 py-0.5 transition-colors',
              isEditing ? 'flex-1' : '',
              flashError && 'ring-2 ring-destructive bg-destructive/10'
            )}
          >
            {name}
          </div>
        </div>

        {meta && !isEditing && (
          <span className="text-xs text-muted-foreground shrink-0">{meta}</span>
        )}

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
