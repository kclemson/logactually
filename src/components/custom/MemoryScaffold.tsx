import { type ReactNode, useEffect, useState } from 'react';

/**
 * Tracks how much of the layout viewport the on-screen keyboard is covering, so
 * the bottom block can lift above it on mobile. Subscribes to the visualViewport
 * API (an external browser system), which is the appropriate use of an effect.
 */
function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const overlap = window.innerHeight - vv.height - vv.offsetTop;
      setInset(overlap > 60 ? overlap : 0);
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);
  return inset;
}

/**
 * The shared full-screen shell for immersive memory surfaces. The stage fills the
 * screen; a single bottom block holds (in order) progress dots, the date row, the
 * caption, and the action bar. Both the viewer and the editor compose onto this so
 * their hierarchy is identical and nothing shifts when switching between them.
 */
interface MemoryScaffoldProps {
  stage: ReactNode;
  dots?: ReactNode;
  dateRow?: ReactNode;
  caption?: ReactNode;
  actions?: ReactNode;
  error?: ReactNode;
  /** Rendered inside the fixed root so `absolute` overlays position correctly. */
  overlay?: ReactNode;
  /** Lift the bottom block above the on-screen keyboard (editor). */
  liftWithKeyboard?: boolean;
}

export function MemoryScaffold({
  stage,
  dots,
  dateRow,
  caption,
  actions,
  error,
  overlay,
  liftWithKeyboard,
}: MemoryScaffoldProps) {
  const keyboardInset = useKeyboardInset();
  const lift =
    liftWithKeyboard && keyboardInset ? { transform: `translateY(-${keyboardInset}px)` } : undefined;
  const hasBottom = dots || dateRow || caption || actions || error;

  return (
    <div className="fixed inset-0 z-50 flex flex-col select-none bg-black text-white">
      <div className="relative min-h-0 flex-1 overflow-hidden">{stage}</div>

      {hasBottom && (
        <div
          className="relative z-20 bg-gradient-to-t from-black via-black/85 to-transparent px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-6"
          style={lift}
        >
          {dots}
          {dateRow}
          {caption}
          {actions}
          {error}
        </div>
      )}

      {overlay}
    </div>
  );
}
