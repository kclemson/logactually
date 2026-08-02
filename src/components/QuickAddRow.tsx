import { useState } from 'react';
import { Plus, MoreHorizontal, Pin, PinOff, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface QuickAddItem {
  id: string;
  name: string;
  /** Optional small trailing figure. Omitted by default — habitual items don't need it. */
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

// Resting state is deliberately muted: these are suggestions, not logged
// content. Accent colour only appears on hover/press (and for pinned chips).
const ACCENT = {
  blue: 'border-border text-muted-foreground hover:border-blue-500/40 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-500/10 active:bg-blue-500/20',
  purple: 'border-border text-muted-foreground hover:border-purple-500/40 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-500/10 active:bg-purple-500/20',
} as const;

const ACCENT_PINNED = {
  blue: 'border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 active:bg-blue-500/30',
  purple: 'border-purple-500/50 bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 active:bg-purple-500/30',
} as const;


/** Max characters shown on a collapsed chip before shortening. */
const NAME_BUDGET = 18;

/**
 * Shorten at the last word boundary that fits, so chips never cut a word in
 * half. Falls back to a hard cut for single very long words.
 */
export function shortenChipName(name: string, budget = NAME_BUDGET): string {
  const trimmed = name.trim();
  if (trimmed.length <= budget) return trimmed;
  const head = trimmed.slice(0, budget);
  const lastSpace = head.lastIndexOf(' ');
  const cut = lastSpace >= Math.ceil(budget / 2) ? head.slice(0, lastSpace) : head;
  return `${cut.replace(/[\s,.;:–-]+$/, '')}…`;
}

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
          <div
            key={item.id}
            className={cn(
              'flex items-stretch rounded-full border overflow-hidden transition-colors',
              isPinned ? ACCENT_PINNED[accent] : ACCENT[accent]
            )}
          >
            <button
              type="button"
              onClick={() => onAdd(item.id)}
              disabled={isPending}
              // Native tooltip shows the full name on hover without any reflow —
              // expanding the chip re-wrapped the row and caused hover flicker.
              title={item.name}
              aria-label={`Quick add ${item.name}`}
              className="flex items-center gap-1 pl-2 pr-1.5 py-1 text-xs font-medium disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : isPinned ? (
                <Pin className="h-3 w-3 fill-current" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
              <span className="whitespace-nowrap">{shortenChipName(item.name)}</span>

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
