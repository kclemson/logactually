import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
}

const VALUE_TYPE_LABELS: Record<string, string> = {
  numeric: 'numeric',
  text_numeric: 'text + numeric',
  text: 'text',
};

export function CustomLogTypeRow({
  type,
  onRename,
  onUpdateUnit,
  onDelete,
  openDeletePopoverId,
  setOpenDeletePopoverId,
}: CustomLogTypeRowProps) {
  const [editingUnit, setEditingUnit] = useState(false);
  const [unitDraft, setUnitDraft] = useState(type.unit || '');

  const showUnit = type.value_type === 'numeric' || type.value_type === 'text_numeric';

  const commitUnit = () => {
    const trimmed = unitDraft.trim();
    const newUnit = trimmed || null;
    if (newUnit !== (type.unit || null)) {
      onUpdateUnit(type.id, newUnit);
    }
    setEditingUnit(false);
  };

  return (
    <li className="py-0.5">
      <div className="flex items-center gap-2">
        {/* Click-to-edit type name */}
        <div
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onFocus={(e) => {
            e.currentTarget.dataset.original = type.name;
          }}
          onBlur={(e) => {
            const newName = (e.currentTarget.textContent || '').trim();
            const original = e.currentTarget.dataset.original || type.name;
            if (!newName) {
              e.currentTarget.textContent = original;
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
              if (newName && newName !== original) {
                onRename(type.id, newName);
                e.currentTarget.dataset.original = newName;
              }
              e.currentTarget.blur();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              e.currentTarget.textContent = e.currentTarget.dataset.original || type.name;
              e.currentTarget.blur();
            }
          }}
          className="flex-1 text-sm truncate cursor-text hover:bg-muted/50 focus:bg-focus-bg focus:ring-2 focus:ring-focus-ring focus:outline-none rounded px-1 py-0.5"
        >
          {type.name}
        </div>

        {/* Value type badge + editable unit */}
        <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
          {VALUE_TYPE_LABELS[type.value_type] || type.value_type}
          {showUnit && (
            <>
              <span>·</span>
              {editingUnit ? (
                <Input
                  value={unitDraft}
                  onChange={(e) => setUnitDraft(e.target.value)}
                  onBlur={commitUnit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); commitUnit(); }
                    if (e.key === 'Escape') { e.preventDefault(); setUnitDraft(type.unit || ''); setEditingUnit(false); }
                  }}
                  className="h-5 w-16 text-xs px-1 py-0 inline-block"
                  placeholder="unit"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => { setUnitDraft(type.unit || ''); setEditingUnit(true); }}
                  className="hover:bg-muted/50 rounded px-0.5 cursor-text"
                  title="Click to edit unit"
                >
                  {type.unit || <span className="italic opacity-50">unit</span>}
                </button>
              )}
            </>
          )}
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
