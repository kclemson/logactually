import { useState, useMemo, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { X, Calendar as CalendarIcon, Play, Trash2, Pencil } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { MemoryComposer } from '@/components/custom/MemoryComposer';
import { MemoryScaffold } from '@/components/custom/MemoryScaffold';
import { MemoryStage } from '@/components/custom/MemoryStage';
import { MemoryActionBar, type MemoryAction } from '@/components/custom/MemoryActionBar';
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

/**
 * Resolve the starting day/item index from the requested date/entry. Returns
 * null when the data isn't ready yet (so we can defer to a layout effect).
 * Prefers the explicit entry, then the date, then the first day.
 */
function computeStart(
  days: MemoryDay[],
  initialDate: string | null,
  initialEntry: string | null,
): { dayIndex: number; itemIndex: number } | null {
  if (days.length === 0) return null;
  if (initialEntry) {
    const byEntry = days.findIndex((d) => d.entries.some((e) => e.id === initialEntry));
    if (byEntry >= 0) {
      const iIdx = buildDayItems(days[byEntry]).findIndex((it) => it.entry.id === initialEntry);
      return { dayIndex: byEntry, itemIndex: iIdx >= 0 ? iIdx : 0 };
    }
  }
  if (initialDate) {
    const dIdx = days.findIndex((d) => d.date === initialDate);
    if (dIdx >= 0) return { dayIndex: dIdx, itemIndex: 0 };
  }
  return { dayIndex: 0, itemIndex: 0 };
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

  // Resolve the starting position synchronously when data is already cached, so
  // the requested memory is shown from the first painted frame (no stale flash).
  const initialStart = useRef(computeStart(days, initialDate, initialEntry));
  const [dayIndex, setDayIndex] = useState(initialStart.current?.dayIndex ?? 0);
  const [itemIndex, setItemIndex] = useState(initialStart.current?.itemIndex ?? 0);
  const [direction, setDirection] = useState(0);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const startedRef = useRef(initialStart.current !== null);

  // Cold-load fallback: when the viewer mounts before data has arrived, apply the
  // start position once, before paint. The viewer shows "Loading…" until then, so
  // no stale entry is ever visible.
  useLayoutEffect(() => {
    if (startedRef.current) return;
    const start = computeStart(days, initialDate, initialEntry);
    if (!start) return;
    startedRef.current = true;
    setDayIndex(start.dayIndex);
    setItemIndex(start.itemIndex);
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

  const handleDelete = () => {
    if (!currentItem) return;
    if (!confirm('Delete this memory and all its photos/videos?')) return;
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
  };

  // Stage: loading / empty / the current slide.
  const stage = isLoading ? (
    <div className="flex h-full items-center justify-center text-sm text-white/60">Loading…</div>
  ) : days.length === 0 ? (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-white/70">
      <p className="text-sm">No memories yet.</p>
      <Button variant="secondary" size="sm" onClick={close}>
        Back
      </Button>
    </div>
  ) : (
    <MemoryStage
      itemKey={itemKey}
      direction={direction}
      hasPrev={hasPrev}
      hasNext={hasNext}
      onPrev={goPrevItem}
      onNext={goNextItem}
    >
      {currentItem && <SlideContent item={currentItem} />}
    </MemoryStage>
  );

  const dots =
    currentItem && items.length > 1 ? (
      <div className="mb-3 flex justify-center gap-1.5">
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
    ) : undefined;

  const dateRow = currentItem ? (
    <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
      {currentDay && (
        <span className="text-xs font-medium text-white/80">
          {format(parseISO(currentDay.date), 'EEE, MMM d, yyyy')}
        </span>
      )}
      {currentItem.entry.category && (
        <span className="inline-block rounded-full bg-teal-500/80 px-2 py-0.5 text-[11px] font-medium text-white">
          {formatTag(currentItem.entry.category)}
        </span>
      )}
    </div>
  ) : undefined;

  const caption =
    currentItem && currentItem.entry.text_value ? (
      <p className="max-h-[22vh] overflow-y-auto whitespace-pre-wrap text-sm leading-snug text-white/90">
        {currentItem.entry.text_value}
      </p>
    ) : undefined;

  const viewerActions: MemoryAction[] = currentItem
    ? [
        {
          key: 'calendar',
          icon: CalendarIcon,
          label: 'Pick a day',
          onClick: () => setCalendarOpen((v) => !v),
        },
        ...(!isReadOnly
          ? ([
              {
                key: 'edit',
                icon: Pencil,
                label: 'Edit memory',
                onClick: () => setEditing(true),
              },
              {
                key: 'delete',
                icon: Trash2,
                label: 'Delete memory',
                tone: 'danger',
                onClick: handleDelete,
              },
            ] as MemoryAction[])
          : []),
        { key: 'close', icon: X, label: 'Close', align: 'end', glass: true, onClick: close },
      ]
    : [];

  const overlay = (
    <>
      {/* Calendar overlay */}
      {calendarOpen && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setCalendarOpen(false)}
        >
          <div
            className="rounded-lg bg-card p-2 text-foreground shadow-xl"
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
    </>
  );

  return (
    <MemoryScaffold
      stage={stage}
      dots={dots}
      dateRow={dateRow}
      caption={caption}
      actions={currentItem ? <MemoryActionBar actions={viewerActions} /> : undefined}
      overlay={overlay}
      bottomPlacement="overlay"
    />
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
