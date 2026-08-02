import { useState } from 'react';
import { Plus, MoreHorizontal, Pin, PinOff, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface QuickAddItem {
  id: string;
  name: string;
  /** Small trailing figure, e.g. "310 cal" or "4 exercises". */
  meta?: string;
}

interface QuickAddRowProps {
  items: QuickAddItem[];
  accent: 'blue' | 'purple';
  pinnedIds: string[];
  pendingId?: string | null;
  onAdd: (id: string) => void;
  onTogglePin: (id: string) => void;
  onHide: (id: string) => void;
  onDisable: () => void;
}

const ACCENT = {
  blue: 'border-blue-500/40 text-blue-700 dark:text-blue-300 hover:bg-blue-500/10 active:bg-blue-500/20',
  purple: 'border-purple-500/40 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 active:bg-purple-500/20',
} as const;

/**
 * Presentational row of one-tap "add this again" chips.
 * Holds no data or domain logic so any log domain can reuse it.
 */
export function QuickAddRow({
  items,
  accent,
  pinnedIds,
  pendingId,
  onAdd,
  onTogglePin,
  onHide,
  onDisable,
}: QuickAddRowProps) {
  const [menuId, setMenuId] = useState<string | null>(null);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Quick add">
      {items.map((item) => {
        const isPending = pendingId === item.id;
        const isPinned = pinnedIds.includes(item.id);
        return (
          <div key={item.id} className={cn('flex items-stretch rounded-full border overflow-hidden', ACCENT[accent])}>
            <button
              type="button"
              onClick={() => onAdd(item.id)}
              disabled={isPending}
              aria-label={`Quick add ${item.name}`}
              className="flex items-center gap-1 pl-2 pr-1.5 py-1 text-xs font-medium disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
              <span className="truncate max-w-[9rem]">{item.name}</span>
              {item.meta && (
                <span className="text-[10px] text-muted-foreground tabular-nums">{item.meta}</span>
              )}
            </button>
            <Popover open={menuId === item.id} onOpenChange={(open) => setMenuId(open ? item.id : null)}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={`Quick add options for ${item.name}`}
                  className="px-1.5 border-l border-inherit text-muted-foreground"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-48 p-1">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => {
                    onTogglePin(item.id);
                    setMenuId(null);
                  }}
                >
                  {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                  {isPinned ? 'Unpin' : 'Always show'}
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => {
                    onHide(item.id);
                    setMenuId(null);
                  }}
                >
                  <EyeOff className="h-4 w-4" />
                  Hide this
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent"
                  onClick={() => {
                    onDisable();
                    setMenuId(null);
                  }}
                >
                  Turn off Quick Add
                </button>
              </PopoverContent>
            </Popover>
          </div>
        );
      })}
    </div>
  );
}
