import { type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Shared media stage for the immersive viewer and editor: a full-bleed,
 * swipeable region with large tap-target chevrons. The actual media (with its
 * blurred backdrop + object-contain framing) is provided as children so the
 * viewer (signed URLs) and editor (object URLs / loading previews) render in the
 * exact same place with the same gestures.
 */
interface MemoryStageProps {
  /** Identity of the current slide — drives enter/exit animation. */
  itemKey: string;
  children: ReactNode;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  /** Enable horizontal drag-to-swipe (default true). */
  swipeable?: boolean;
  /** 'slide' animates horizontally (viewer); 'fade' cross-fades (editor). */
  animation?: 'slide' | 'fade';
  direction?: number;
  /** Show chevrons on mobile too (viewer) vs desktop-only (editor). */
  chevronsOnMobile?: boolean;
}

export function MemoryStage({
  itemKey,
  children,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  swipeable = true,
  animation = 'slide',
  direction = 0,
  chevronsOnMobile = true,
}: MemoryStageProps) {
  const slide = animation === 'slide';

  return (
    <div className="relative h-full w-full overflow-hidden">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={itemKey}
          custom={direction}
          drag={swipeable ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_e, info) => {
            if (info.offset.x < -80 && hasNext) onNext();
            else if (info.offset.x > 80 && hasPrev) onPrev();
          }}
          initial={
            slide
              ? { x: direction === 0 ? 0 : direction > 0 ? '100%' : '-100%', opacity: 0.4 }
              : { opacity: 0 }
          }
          animate={slide ? { x: 0, opacity: 1 } : { opacity: 1 }}
          exit={slide ? { x: direction > 0 ? '-100%' : '100%', opacity: 0.4 } : { opacity: 0 }}
          transition={slide ? { type: 'spring', stiffness: 320, damping: 34 } : { duration: 0.25 }}
          className="absolute inset-0"
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {hasPrev && (
        <button
          type="button"
          onClick={onPrev}
          className={cn(
            'absolute left-1 top-1/2 z-20 h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60',
            chevronsOnMobile ? 'flex' : 'hidden sm:flex',
          )}
          aria-label="Previous"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {hasNext && (
        <button
          type="button"
          onClick={onNext}
          className={cn(
            'absolute right-1 top-1/2 z-20 h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60',
            chevronsOnMobile ? 'flex' : 'hidden sm:flex',
          )}
          aria-label="Next"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
