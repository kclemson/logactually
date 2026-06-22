import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface RadialProgressProps {
  /** Target progress, 0..1. */
  value: number;
  /** Outer diameter in px. */
  size?: number;
  /** Stroke width in px. */
  stroke?: number;
  /** Optional centered label (e.g. a percentage). */
  showPercent?: boolean;
  className?: string;
}

/**
 * An elegant circular progress ring. The displayed value eases toward `value`
 * on each update so byte-level jumps feel smooth rather than snapping. Uses the
 * composer's teal accent and a soft track so it reads on any media backdrop.
 */
export function RadialProgress({
  value,
  size = 56,
  stroke = 4,
  showPercent = false,
  className,
}: RadialProgressProps) {
  const [display, setDisplay] = useState(value);
  const raf = useRef<number>();
  const from = useRef(value);
  const start = useRef(0);

  // Ease the rendered value toward the latest target over ~400ms.
  useEffect(() => {
    from.current = display;
    start.current = performance.now();
    const target = Math.max(0, Math.min(1, value));
    const duration = 400;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start.current) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(from.current + (target - from.current) * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const clamped = Math.max(0, Math.min(1, display));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped);

  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(172 66% 50%)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ filter: 'drop-shadow(0 0 4px hsl(172 66% 50% / 0.6))' }}
        />
      </svg>
      {showPercent && (
        <span className="absolute text-xs font-semibold tabular-nums text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
          {Math.round(clamped * 100)}%
        </span>
      )}
    </div>
  );
}
