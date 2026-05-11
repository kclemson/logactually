import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MultiplierInputProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}

function formatMultiplier(n: number): string {
  if (Number.isInteger(n)) return String(n);
  // Trim trailing zeros, max 2 decimals
  return parseFloat(n.toFixed(2)).toString();
}

/**
 * Tap-to-edit portion multiplier label. Shows "1.5x" as a button;
 * click/tap turns it into a numeric input for arbitrary decimal values
 * (e.g. 0.33 for "one third of recipe"). Commit on Enter/blur, revert on Escape.
 */
export function MultiplierInput({ value, onChange, min = 0.1, max = 10 }: MultiplierInputProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed === '') {
      setEditing(false);
      return;
    }
    const parsed = parseFloat(trimmed);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setEditing(false);
      return;
    }
    const clamped = Math.min(max, Math.max(min, parsed));
    const rounded = Math.round(clamped * 100) / 100;
    if (rounded !== value) onChange(rounded);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            setEditing(false);
          }
        }}
        className={cn(
          'text-sm font-medium min-w-[3rem] w-[3rem] text-center tabular-nums',
          'bg-background border border-input rounded px-1 py-0.5 outline-none',
          'focus:ring-1 focus:ring-primary',
          value !== 1.0 && 'text-primary'
        )}
        aria-label="Portion multiplier"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(formatMultiplier(value));
        setEditing(true);
      }}
      className={cn(
        'text-sm font-medium min-w-[3rem] text-center tabular-nums',
        'rounded px-1 py-0.5 hover:bg-muted cursor-text',
        value !== 1.0 && 'text-primary'
      )}
      aria-label={`Portion multiplier ${formatMultiplier(value)}x, tap to edit`}
    >
      {formatMultiplier(value)}x
    </button>
  );
}
