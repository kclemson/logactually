import { useState } from 'react';
import { Plus, MoreHorizontal, Pin, PinOff, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface QuickAddItem {
  id: string;
  name: string;
}

interface QuickAddGhostRowsProps {
  items: QuickAddItem[];
  accent: 'blue' | 'purple';
  pinnedIds: string[];
  pendingId?: string | null;
  onAdd: (id: string) => void;
  onTogglePin: (id: string) => void;
  onHide: (id: string) => void;
  onDisable: () => void;
}

// Resting state is deliberately muted: these are suggestions, not logged
// content. Accent only appears on hover/press (and on the pin for pinned rows).
const ACCENT_HOVER = {
  blue: 'hover:bg-blue-500/5 hover:text-blue-700 dark:hover:text-blue-300 active:bg-blue-500/10',
  purple: 'hover:bg-purple-500/5 hover:text-purple-700 dark:hover:text-purple-300 active:bg-purple-500/10',
} as const;

const ACCENT_PIN = {
  blue: 'text-blue-600 dark:text-blue-400',
  purple: 'text-purple-600 dark:text-purple-400',
} as const;

/**
 * Presentational "ghost" rows: a tentative, faded version of a logged entry row.
 * Name-only by design — these are one-tap shortcuts for items the user already
 * logs constantly, so metrics would be noise. Holds no data, query or domain
 * logic so any log domain can reuse it.
 */
export function QuickAddGhostRows({
  items,
  accent,
  pinnedIds,
  pendingId,
  onAdd,
  onTogglePin,
  onHide,
  onDisable,
}: QuickAddGhostRowsProps) {
  const [menuId, setMenuId] = useState<string | null>(null);

  if (items.length === 0) return null;

  return (
    <div className="mt-3" aria-label="Quick add">
      <div className="flex items-center gap-2 border-t border-dashed border-border pt-1.5">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Quick add</span>
      </div>

      {items.map((item) => {
        const isPending = pendingId === item.id;
        const isPinned = pinnedIds.includes(item.id);
        return (
          <div
            key={item.id}
            className={cn(
              'flex items-center gap-1 group text-muted-foreground/70 transition-colors rounded',
              ACCENT_HOVER[accent]
            )}
          >
            <button
              type="button"
              onClick={() => onAdd(item.id)}
              disabled={isPending}
              title={`Add ${item.name}`}
              aria-label={`Quick add ${item.name}`}
              className="flex min-h-[28px] flex-1 items-center gap-1.5 min-w-0 pl-1 py-0.5 text-left leading-tight disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
              ) : isPinned ? (
                <Pin className={cn('h-3 w-3 shrink-0 fill-current', ACCENT_PIN[accent])} />
              ) : (
                <Plus className="h-3 w-3 shrink-0" />
              )}
              <span className="truncate italic text-xs">{item.name}</span>
            </button>


            <Popover open={menuId === item.id} onOpenChange={(open) => setMenuId(open ? item.id : null)}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={`Quick add options for ${item.name}`}
                  className="flex h-6 w-6 items-center justify-center text-muted-foreground/70"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-1">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    onTogglePin(item.id);
                    setMenuId(null);
                  }}
                >
                  {isPinned ? <PinOff className="h-4 w-4 shrink-0" /> : <Pin className="h-4 w-4 shrink-0" />}
                  {isPinned ? 'Stop always showing' : 'Always show here'}
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    onHide(item.id);
                    setMenuId(null);
                  }}
                >
                  <EyeOff className="h-4 w-4 shrink-0" />
                  Remove from Quick Add
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent"
                  onClick={() => {
                    onDisable();
                    setMenuId(null);
                  }}
                >
                  Turn off Quick Add everywhere
                </button>

              </PopoverContent>
            </Popover>
          </div>
        );
      })}
    </div>
  );
}
