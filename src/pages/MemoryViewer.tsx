import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Play, Trash2, Pencil } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { MemoryComposer } from '@/components/custom/MemoryComposer';
import { useCustomLogTypes } from '@/hooks/useCustomLogTypes';
import { useMemoryDays, type MemoryDay, type MemoryEntry } from '@/hooks/useMemoryDays';
import type { MemoryMedia } from '@/hooks/useMemoryMedia';
import { getSignedMemoryUrl, invalidateSignedUrl, formatDuration, formatTag } from '@/lib/memory-media';
import { useReadOnlyContext } from '@/contexts/ReadOnlyContext';
import { cn } from '@/lib/utils';

interface ViewItem {
  entry: MemoryEntry;
  media: MemoryMedia | null;
}

function buildDayItems(day: MemoryDay): ViewItem[] {
  const items: ViewItem[] = [];
  for (const entry of day.entries) {
    if (entry.media.length === 0) {
      items.push({ entry, media: null });
    } else {
      for (const m of entry.media) items.push({ entry, media: m });
    }
  }
  return items;
}

const MemoryViewer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const typeId = searchParams.get('type');
  const initialDate = searchParams.get('date');
  const initialEntry = searchParams.get('entry');
  const { logTypes } = useCustomLogTypes();
  const logType = logTypes.find((t) => t.id === typeId);
  const { days, isLoading, deleteMemory } = useMemoryDays(typeId);
  const { isReadOnly } = useReadOnlyContext();

  const [dayIndex, setDayIndex] = useState(0);
  const [itemIndex, setItemIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const startedRef = useRef(false);

  // Jump to the requested date/entry once, when data first arrives.
  useEffect(() => {
    if (startedRef.current || days.length === 0) return;
    startedRef.current = true;
    if (!initialDate && !initialEntry) return;
    const dIdx = initialDate ? days.findIndex((d) => d.date === initialDate) : -1;
    const targetDay = dIdx >= 0 ? dIdx : 0;
    if (initialEntry) {
      // Prefer the explicit entry: find its day and the first item that belongs to it.
      const byEntry = days.findIndex((d) => d.entries.some((e) => e.id === initialEntry));
      if (byEntry >= 0) {
        setDayIndex(byEntry);
        const iIdx = buildDayItems(days[byEntry]).findIndex((it) => it.entry.id === initialEntry);
        if (iIdx >= 0) setItemIndex(iIdx);
        return;
      }
    }
    if (dIdx >= 0) setDayIndex(targetDay);
  }, [days, initialDate, initialEntry]);

  const close = useCallback(() => {
    navigate('/custom');
  }, [navigate]);

  const currentDay = days[dayIndex];
  const items = useMemo(() => (currentDay ? buildDayItems(currentDay) : []), [currentDay]);
  const clampedItemIndex = Math.min(itemIndex, Math.max(0, items.length - 1));
  const currentItem = items[clampedItemIndex];

  const goNextItem = useCallback(() => {
    setDirection(1);
    if (clampedItemIndex < items.length - 1) {
      setItemIndex(clampedItemIndex + 1);
    } else if (dayIndex < days.length - 1) {
      setDayIndex(dayIndex + 1);
      setItemIndex(0);
    }
  }, [clampedItemIndex, items.length, dayIndex, days.length]);

  const goPrevItem = useCallback(() => {
    setDirection(-1);
    if (clampedItemIndex > 0) {
      setItemIndex(clampedItemIndex - 1);
    } else if (dayIndex > 0) {
      const prevDayItems = buildDayItems(days[dayIndex - 1]);
      setDayIndex(dayIndex - 1);
      setItemIndex(Math.max(0, prevDayItems.length - 1));
    }
  }, [clampedItemIndex, dayIndex, days]);

  const hasPrev = clampedItemIndex > 0 || dayIndex > 0;
  const hasNext = clampedItemIndex < items.length - 1 || dayIndex < days.length - 1;

  // Keyboard navigation (desktop).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editing || calendarOpen) return;
      if (e.key === 'ArrowRight') goNextItem();
      else if (e.key === 'ArrowLeft') goPrevItem();
      else if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNextItem, goPrevItem, close, editing, calendarOpen]);

  const datesWithData = useMemo(() => days.map((d) => parseISO(d.date)), [days]);

  // Category suggestions for the edit composer.
  const memoryCategories = useMemo(
    () =>
      Array.from(
        new Set(
          days.flatMap((d) => d.entries.map((e) => e.category)).filter((c): c is string => !!c),
        ),
      ),
    [days],
  );

  if (!typeId) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <Button onClick={close}>Back</Button>
      </div>
    );
  }

  const itemKey = `${dayIndex}:${clampedItemIndex}`;

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col select-none">
      {/* Content */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-white/60 text-sm">Loading…</div>
        ) : days.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-white/70 px-6 text-center">
            <p className="text-sm">No memories yet.</p>
            <Button variant="secondary" size="sm" onClick={close}>Back</Button>
          </div>
        ) : (
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={itemKey}
              custom={direction}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_e, info) => {
                if (info.offset.x < -80 && hasNext) goNextItem();
                else if (info.offset.x > 80 && hasPrev) goPrevItem();
              }}
              initial={{ x: direction === 0 ? 0 : direction > 0 ? '100%' : '-100%', opacity: 0.4 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction > 0 ? '-100%' : '100%', opacity: 0.4 }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="absolute inset-0"
            >
              {currentItem && <SlideContent item={currentItem} />}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Item navigation chevrons (desktop / large tap targets) */}
        {days.length > 0 && hasPrev && (
          <button
            type="button"
            onClick={goPrevItem}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center"
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {days.length > 0 && hasNext && (
          <button
            type="button"
            onClick={goNextItem}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center"
            aria-label="Next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Bottom: dots, date + tag, caption, action bar */}
      {currentItem && (
        <div className="relative z-20 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-6 bg-gradient-to-t from-black via-black/85 to-transparent">
          {items.length > 1 && (
            <div className="flex justify-center gap-1.5 mb-3">
              {items.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === clampedItemIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40',
                  )}
                />
              ))}
            </div>
          )}

          {/* Date + tag travel with the content */}
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-1">
            {currentDay && (
              <span className="text-xs font-medium text-white/80">
                {format(parseISO(currentDay.date), 'EEE, MMM d, yyyy')}
              </span>
            )}
            {currentItem.entry.category && (
              <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-500/80 text-white">
                {formatTag(currentItem.entry.category)}
              </span>
            )}
          </div>

          {currentItem.entry.text_value && (
            <p className="text-sm text-white/90 whitespace-pre-wrap leading-snug max-h-[22vh] overflow-y-auto">
              {currentItem.entry.text_value}
            </p>
          )}

          {/* Thumb-zone action bar */}
          <div className="mt-3 flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 text-white hover:bg-white/15"
              onClick={() => setCalendarOpen((v) => !v)}
              aria-label="Pick a day"
            >
              <CalendarIcon className="h-5 w-5" />
            </Button>

            {!isReadOnly && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 text-white hover:bg-white/15"
                  onClick={() => setEditing(true)}
                  aria-label="Edit memory"
                >
                  <Pencil className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 text-white/80 hover:text-white hover:bg-white/15"
                  onClick={() => {
                    if (confirm('Delete this memory and all its photos/videos?')) {
                      const entry = currentItem.entry;
                      const wasLastInDay = items.length <= 1;
                      deleteMemory.mutate(entry, {
                        onSuccess: () => {
                          if (wasLastInDay) {
                            setDayIndex((d) => Math.max(0, Math.min(d, days.length - 2)));
                            setItemIndex(0);
                          } else {
                            setItemIndex((i) => Math.max(0, i - 1));
                          }
                        },
                      });
                    }
                  }}
                  aria-label="Delete memory"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </>
            )}

            <Button
              size="icon"
              variant="ghost"
              className="ml-auto h-10 w-10 text-white hover:bg-white/15"
              onClick={close}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Calendar overlay */}
      {calendarOpen && (
        <div
          className="absolute inset-0 z-30 bg-black/70 flex items-center justify-center px-4"
          onClick={() => setCalendarOpen(false)}
        >
          <div
            className="rounded-lg bg-card text-foreground p-2 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Calendar
              mode="single"
              selected={currentDay ? parseISO(currentDay.date) : undefined}
              onSelect={(date) => {
                if (!date) return;
                const key = format(date, 'yyyy-MM-dd');
                const idx = days.findIndex((d) => d.date === key);
                if (idx >= 0) {
                  setDirection(idx > dayIndex ? 1 : -1);
                  setDayIndex(idx);
                  setItemIndex(0);
                }
                setCalendarOpen(false);
              }}
              modifiers={{ hasData: datesWithData }}
              modifiersClassNames={{ hasData: 'font-semibold text-teal-600 dark:text-teal-400' }}
              disabled={(date) => !days.some((d) => d.date === format(date, 'yyyy-MM-dd'))}
            />
          </div>
        </div>
      )}

      {/* Edit composer */}
      {editing && currentItem && (
        <MemoryComposer
          label={logType?.name ?? 'Scrapbook'}
          logTypeId={typeId}
          loggedDate={currentItem.entry.logged_date}
          existingCategories={memoryCategories}
          editEntry={currentItem.entry}
          disabled={isReadOnly}
          onSuccess={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
};

export default MemoryViewer;

/** Resolves a signed URL for the item's media and renders it full-bleed. */
function SlideContent({ item }: { item: ViewItem }) {
  const media = item.media;

  if (!media) {
    // Text-only entry.
    return (
      <div className="h-full flex items-center justify-center px-8">
        <p className="text-lg text-white/90 whitespace-pre-wrap text-center leading-relaxed max-h-[70vh] overflow-y-auto">
          {item.entry.text_value}
        </p>
      </div>
    );
  }

  return <MediaSlide media={media} />;
}

function MediaSlide({ media }: { media: MemoryMedia }) {
  const [url, setUrl] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const retriedRef = useRef(false);

  useEffect(() => {
    let active = true;
    retriedRef.current = false;
    setPlaying(false);
    setUrl(null);
    setPosterUrl(null);
    getSignedMemoryUrl(media.storage_path).then((u) => active && setUrl(u));
    if (media.poster_path) {
      getSignedMemoryUrl(media.poster_path).then((u) => active && setPosterUrl(u));
    }
    return () => {
      active = false;
    };
  }, [media.storage_path, media.poster_path]);

  const handleError = useCallback(async () => {
    // Signed URL may have expired — re-mint once and retry.
    if (retriedRef.current) return;
    retriedRef.current = true;
    invalidateSignedUrl(media.storage_path);
    const fresh = await getSignedMemoryUrl(media.storage_path);
    setUrl(fresh);
  }, [media.storage_path]);

  const backdrop = media.kind === 'image' ? url : posterUrl;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Blurred backdrop */}
      {backdrop && (
        <div
          aria-hidden
          className="absolute inset-0 bg-center bg-cover scale-110 blur-2xl opacity-40"
          style={{ backgroundImage: `url(${backdrop})` }}
        />
      )}

      <div className="relative h-full w-full flex items-center justify-center">
        {media.kind === 'image' ? (
          url ? (
            <img
              src={url}
              alt=""
              onError={handleError}
              className="max-h-full max-w-full object-contain"
              draggable={false}
            />
          ) : (
            <div className="text-white/50 text-sm">Loading…</div>
          )
        ) : playing && url ? (
          <video
            src={url}
            controls
            autoPlay
            playsInline
            onError={handleError}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="relative h-full w-full flex items-center justify-center"
            aria-label="Play video"
          >
            {posterUrl && (
              <img
                src={posterUrl}
                alt=""
                className="max-h-full max-w-full object-contain"
                draggable={false}
              />
            )}
            <span className="absolute h-16 w-16 rounded-full bg-black/50 flex items-center justify-center">
              <Play className="h-8 w-8 text-white ml-1" />
            </span>
            {media.duration_secs ? (
              <span className="absolute bottom-3 right-3 text-xs bg-black/60 px-1.5 py-0.5 rounded">
                {formatDuration(media.duration_secs)}
              </span>
            ) : null}
          </button>
        )}
      </div>
    </div>
  );
}
