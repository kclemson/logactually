import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { CustomLogType } from '@/hooks/useCustomLogTypes';

interface CustomLogTypeRowProps {
  type: CustomLogType;
  onRename: (id: string, name: string) => void;
  onUpdateUnit: (id: string, unit: string | null) => void;
  onDelete: (id: string) => void;
  openDeletePopoverId: string | null;
  setOpenDeletePopoverId: (id: string | null) => void;
  existingNames?: string[];
}

const VALUE_TYPE_LABELS: Record<string, string> = {
  numeric: 'numeric',
  text_numeric: 'text + numeric',
  text: 'text (single line)',
  text_multiline: 'text (multi line)',
};

export function CustomLogTypeRow({
  type,
  onRename,
  onUpdateUnit,
  onDelete,
  openDeletePopoverId,
  setOpenDeletePopoverId,
  existingNames = [],
}: CustomLogTypeRowProps) {
  const [flashError, setFlashError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const isDuplicateName = (newName: string) => {
    return existingNames.some(n => n.toLowerCase() === newName.toLowerCase() && n.toLowerCase() !== type.name.toLowerCase());
  };

  return (
    <li className="py-0.5">
      <div className="flex items-center gap-2">
        {/* Click-to-edit type name + unit */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <div
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            onFocus={(e) => {
              setIsEditing(true);
              e.currentTarget.dataset.original = type.name;
            }}
            onBlur={(e) => {
              setIsEditing(false);
              const newName = (e.currentTarget.textContent || '').trim();
              const original = e.currentTarget.dataset.original || type.name;
              if (!newName || isDuplicateName(newName)) {
                e.currentTarget.textContent = original;
                if (newName && isDuplicateName(newName)) {
                  setFlashError(true);
                  setTimeout(() => setFlashError(false), 1500);
                }
              } else if (newName !== original) {
                onRename(type.id, newName);
                e.currentTarget.dataset.original = newName;
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const newName = e.currentTarget.textContent?.trim();
                const original = e.currentTarget.dataset.original;
                if (newName && newName !== original && !isDuplicateName(newName)) {
                  onRename(type.id, newName);
                  e.currentTarget.dataset.original = newName;
                } else if (newName && isDuplicateName(newName)) {
                  e.currentTarget.textContent = original || type.name;
                  setFlashError(true);
                  setTimeout(() => setFlashError(false), 1500);
                }
                e.currentTarget.blur();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                e.currentTarget.textContent = e.currentTarget.dataset.original || type.name;
                e.currentTarget.blur();
              }
            }}
            className={`text-sm truncate cursor-text hover:bg-muted/50 focus:bg-focus-bg focus:ring-2 focus:ring-focus-ring focus:outline-none rounded px-1 py-0.5 transition-colors ${isEditing ? 'flex-1' : ''} ${flashError ? 'ring-2 ring-destructive bg-destructive/10' : ''}`}
          >
            {type.name}
          </div>
          {type.unit && !isEditing && <span className="text-xs text-muted-foreground shrink-0">({type.unit})</span>}
        </div>

        {/* Value type badge + editable unit */}
        <span className="text-xs text-muted-foreground shrink-0">
          {VALUE_TYPE_LABELS[type.value_type] || type.value_type}
        </span>

        {/* Delete button with popover confirmation */}
        <Popover
          open={openDeletePopoverId === type.id}
          onOpenChange={(open) => setOpenDeletePopoverId(open ? type.id : null)}
        >
          <PopoverTrigger asChild>
            <button className="p-1.5 hover:bg-muted rounded" title="Delete">
              <Trash2 className="h-4 w-4 text-destructive" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4" side="top" align="end">
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="font-medium text-sm">Delete log type?</p>
                <p className="text-xs text-muted-foreground">
                  "{type.name}" and all its entries will be permanently removed.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenDeletePopoverId(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onDelete(type.id);
                    setOpenDeletePopoverId(null);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </li>
  );
}
