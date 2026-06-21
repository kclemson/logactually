import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A single, config-driven action in the shared memory action bar. Both the
 * immersive viewer and the editor describe their controls with these so the
 * bar's layout and styling stay identical across view and edit modes.
 */
export interface MemoryAction {
  key: string;
  icon: LucideIcon;
  /** Accessible label (also used as button text when `prominent`). */
  label: string;
  /** Visible text for the prominent pill (defaults to `label`). */
  text?: string;
  onClick: () => void;
  disabled?: boolean;
  /** 'start' (default) sits on the left; the first 'end' action is pushed right. */
  align?: 'start' | 'end';
  tone?: 'default' | 'danger';
  /** Renders a filled teal pill (e.g. Save) instead of a ghost icon button. */
  prominent?: boolean;
  /** Renders a rounded glass (backdrop-blur) icon button, e.g. the viewer close. */
  glass?: boolean;
  /** Shows a spinner in place of the icon (e.g. while saving). */
  busy?: boolean;
}

const ICON_BTN =
  'inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors disabled:opacity-40 disabled:pointer-events-none';

export function MemoryActionBar({ actions }: { actions: MemoryAction[] }) {
  const firstEndKey = actions.find((a) => a.align === 'end')?.key;

  return (
    <div className="mt-3 flex items-center gap-1">
      {actions.map((a) => {
        const Icon = a.icon;
        const pushRight = a.key === firstEndKey;

        if (a.prominent) {
          return (
            <button
              key={a.key}
              type="button"
              onClick={a.onClick}
              disabled={a.disabled}
              aria-label={a.label}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full bg-teal-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-400 disabled:opacity-40',
                pushRight && 'ml-auto',
              )}
            >
              {a.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
              {a.text ?? a.label}
            </button>
          );
        }

        if (a.glass) {
          return (
            <button
              key={a.key}
              type="button"
              onClick={a.onClick}
              disabled={a.disabled}
              aria-label={a.label}
              className={cn(
                'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 disabled:opacity-40',
                pushRight && 'ml-auto',
              )}
            >
              {a.busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
            </button>
          );
        }

        return (
          <button
            key={a.key}
            type="button"
            onClick={a.onClick}
            disabled={a.disabled}
            aria-label={a.label}
            className={cn(
              ICON_BTN,
              a.tone === 'danger'
                ? 'text-white/80 hover:text-white hover:bg-white/15'
                : 'text-white hover:bg-white/15',
              pushRight && 'ml-auto',
            )}
          >
            {a.busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
          </button>
        );
      })}
    </div>
  );
}
