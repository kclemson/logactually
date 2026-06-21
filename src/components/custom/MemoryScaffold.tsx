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
  /**
   * 'stacked' (default): the stage and the bottom block sit in a flex column —
   * the media is letterboxed above its own controls (used by the editor).
   * 'overlay': the stage fills the whole surface and the bottom block floats
   * over the bottom of the media with a legibility scrim (used by the viewer).
   */
  bottomPlacement?: 'stacked' | 'overlay';
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
  bottomPlacement = 'stacked',
}: MemoryScaffoldProps) {
  const keyboardInset = useKeyboardInset();
  const lift =
    liftWithKeyboard && keyboardInset ? { transform: `translateY(-${keyboardInset}px)` } : undefined;
  const hasBottom = dots || dateRow || caption || actions || error;
  const isOverlay = bottomPlacement === 'overlay';

  const bottomBlock = hasBottom ? (
    <div
      className={cn(
        'z-20 bg-gradient-to-t from-black/90 via-black/30 to-transparent px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]',
        isOverlay ? 'absolute inset-x-0 bottom-0 pt-16' : 'relative pt-6',
      )}
      style={lift}
    >
      {dots}
      {dateRow}
      {caption}
      {actions}
      {error}
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col select-none bg-black text-white">
      <div className={cn('relative min-h-0 flex-1 overflow-hidden', isOverlay && 'min-h-full')}>
        {stage}
        {isOverlay && bottomBlock}
      </div>

      {!isOverlay && bottomBlock}

      {overlay}
    </div>
  );
}
