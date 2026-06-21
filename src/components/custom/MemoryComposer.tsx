import { useRef, useState, useEffect, useCallback } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  ImagePlus,
  Loader2,
  Play,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import {
  useCreateMemory,
  useUpdateMemory,
  type FileUploadStatus,
  type EditMediaItem,
  type MemoryMedia,
} from '@/hooks/useMemoryMedia';
import type { MemoryEntry } from '@/hooks/useMemoryDays';
import { mediaKindFromMime, getSignedMemoryUrl, type MediaKind } from '@/lib/memory-media';
import { cn } from '@/lib/utils';

interface MemoryComposerProps {
  label: string;
  logTypeId: string;
  loggedDate: string;
  existingCategories?: string[];
  /** When provided, the composer edits this memory instead of creating one. */
  editEntry?: MemoryEntry;
  onSuccess?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
}

/**
 * A slide in the composer: either a newly-picked local file (object URL preview)
 * or an existing media row being edited (signed URL preview, resolved on mount).
 */
type PendingFile =
  | {
      id: string;
      source: 'new';
      file: File;
      kind: MediaKind;
      previewUrl: string;
      status: FileUploadStatus;
    }
  | {
      id: string;
      source: 'existing';
      media: MemoryMedia;
      kind: MediaKind;
      previewUrl: string; // '' until the signed URL resolves
      status: FileUploadStatus;
    };

/**
 * Tracks how much of the layout viewport the on-screen keyboard is covering, so
 * the overlaid caption bar can lift above it on mobile. Subscribes to the
 * visualViewport API (an external browser system), which is the appropriate use
 * of an effect.
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

// Fixed, tasteful backdrop for text-only memories (and the empty canvas).
const TEXT_GRADIENT =
  'linear-gradient(150deg, hsl(174 64% 18%) 0%, hsl(199 70% 14%) 45%, hsl(222 47% 11%) 100%)';

export function MemoryComposer({
  label,
  logTypeId,
  loggedDate,
  existingCategories = [],
  editEntry,
  onSuccess,
  onCancel,
  disabled,
}: MemoryComposerProps) {
  const isEditing = !!editEntry;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState(() => editEntry?.text_value ?? '');
  const [category, setCategory] = useState(() => editEntry?.category ?? '');
  const [files, setFiles] = useState<PendingFile[]>(() =>
    (editEntry?.media ?? []).map((m) => ({
      id: m.id,
      source: 'existing' as const,
      media: m,
      kind: m.kind,
      previewUrl: '',
      status: 'done' as FileUploadStatus,
    })),
  );
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { createMemory } = useCreateMemory();
  const { updateMemory } = useUpdateMemory();
  const saving = createMemory.isPending || updateMemory.isPending;
  const keyboardInset = useKeyboardInset();

  // Resolve signed preview URLs for any existing media (external storage), once.
  useEffect(() => {
    let active = true;
    for (const m of editEntry?.media ?? []) {
      getSignedMemoryUrl(m.poster_path || m.storage_path).then((url) => {
        if (active && url) {
          setFiles((prev) =>
            prev.map((f) => (f.id === m.id ? { ...f, previewUrl: url } : f)),
          );
        }
      });
    }
    return () => {
      active = false;
    };
  }, [editEntry]);

  // Revoke object URLs for newly-picked files when the composer unmounts.
  const filesRef = useRef<PendingFile[]>([]);
  filesRef.current = files;
  useEffect(() => {
    return () => {
      filesRef.current.forEach((f) => {
        if (f.source === 'new') URL.revokeObjectURL(f.previewUrl);
      });
    };
  }, []);

  const hasMedia = files.length > 0;
  const current = files[Math.min(index, files.length - 1)];
  const canSave = !disabled && !saving && (note.trim().length > 0 || hasMedia);

  const dateObj = parseISO(loggedDate);
  const dateLabel = isToday(dateObj) ? 'Today' : format(dateObj, 'EEE, MMM d');


  const handlePick = () => fileInputRef.current?.click();

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (picked.length === 0) return;
    setError(null);
    const added: PendingFile[] = [];
    for (const file of picked) {
      const kind = mediaKindFromMime(file.type);
      if (!kind) continue;
      added.push({
        id: crypto.randomUUID(),
        file,
        kind,
        previewUrl: URL.createObjectURL(file),
        status: 'queued',
      });
    }
    if (added.length === 0) return;
    setFiles((prev) => {
      const next = [...prev, ...added];
      setIndex(prev.length); // jump to the first newly-added item
      return next;
    });
  };

  const removeCurrent = () => {
    setFiles((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      const next = prev.filter((_, i) => i !== index);
      setIndex((i) => Math.max(0, Math.min(i, next.length - 1)));
      return next;
    });
  };

  const moveCurrent = (dir: -1 | 1) => {
    setFiles((prev) => {
      const swap = index + dir;
      if (swap < 0 || swap >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
    setIndex((i) => Math.max(0, Math.min(i + dir, files.length - 1)));
  };

  const goTo = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => {
        const n = i + dir;
        if (n < 0 || n >= filesRef.current.length) return i;
        return n;
      });
    },
    [],
  );

  const handleSave = () => {
    if (!canSave) return;
    setError(null);
    createMemory.mutate(
      {
        logTypeId,
        loggedDate,
        note,
        category,
        files: files.map((f) => f.file),
        onFileProgress: (i, status) => {
          setFiles((prev) => prev.map((f, fi) => (fi === i ? { ...f, status } : f)));
        },
      },
      {
        onSuccess: () => onSuccess?.(),
        onError: (err) => {
          setError(err instanceof Error ? err.message : 'Could not save memory');
          setFiles((prev) => prev.map((f) => ({ ...f, status: 'queued' })));
        },
      },
    );
  };

  const uniqueCategories = Array.from(new Set(existingCategories.filter(Boolean)));

  const glassBtn =
    'flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60 disabled:opacity-30 disabled:hover:bg-black/40';

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(o) => {
        if (!o && !saving) onCancel?.();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          asChild
        >
          {/* Outer element handles positioning so framer's inline transform
              (used for the entrance animation) never fights the centering. */}
          <div className="pointer-events-none fixed inset-0 z-50 flex sm:items-center sm:justify-center">
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className={cn(
                'pointer-events-auto relative flex h-full w-full flex-col overflow-hidden bg-black text-white',
                // desktop: centered cinematic card
                'sm:h-[88vh] sm:max-h-[920px] sm:w-[min(600px,92vw)] sm:rounded-3xl sm:shadow-2xl sm:ring-1 sm:ring-white/10',
              )}
            >
              <DialogPrimitive.Title className="sr-only">
                Add memory to {label}
              </DialogPrimitive.Title>


            {/* ───────────── Stage ───────────── */}
            <div className="relative min-h-0 flex-1 overflow-hidden">
              {hasMedia && current ? (
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.div
                    key={current.id}
                    drag={files.length > 1 ? 'x' : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.18}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -60) goTo(1);
                      else if (info.offset.x > 60) goTo(-1);
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0 flex items-center justify-center bg-black"
                  >
                    {current.kind === 'image' ? (
                      <img
                        src={current.previewUrl}
                        alt=""
                        draggable={false}
                        className="h-full w-full object-cover sm:object-contain"
                      />
                    ) : (
                      <video
                        src={current.previewUrl}
                        controls
                        playsInline
                        className="h-full w-full object-cover sm:object-contain"
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              ) : (
                // Empty / text-only canvas
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ backgroundImage: TEXT_GRADIENT }}
                >
                  {note.trim().length > 0 ? (
                    <p className="max-h-[60%] overflow-y-auto px-10 text-center text-xl font-medium leading-relaxed text-white/90 whitespace-pre-wrap">
                      {note}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePick}
                      disabled={disabled || saving}
                      className="flex flex-col items-center gap-3 rounded-3xl border border-white/15 bg-white/5 px-10 py-9 backdrop-blur-sm transition-colors hover:bg-white/10 disabled:opacity-50"
                    >
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/20 ring-1 ring-teal-400/40">
                        <ImagePlus className="h-7 w-7 text-teal-300" />
                      </span>
                      <span className="text-base font-medium">Add photos or video</span>
                      <span className="text-xs text-white/55">or just write a note below</span>
                    </button>
                  )}
                </div>
              )}

              {/* Top scrim */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent" />

              {/* Top bar */}
              <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 px-3 pt-[max(0.6rem,env(safe-area-inset-top))]">
                <button
                  type="button"
                  onClick={() => !saving && onCancel?.()}
                  className={glassBtn}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
                <span className="rounded-full bg-black/35 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-md">
                  {dateLabel}
                </span>
                <div className="flex items-center gap-1.5">
                  {files.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => moveCurrent(-1)}
                        disabled={index === 0 || saving}
                        className={glassBtn}
                        aria-label="Move earlier"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveCurrent(1)}
                        disabled={index === files.length - 1 || saving}
                        className={glassBtn}
                        aria-label="Move later"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {hasMedia && (
                    <button
                      type="button"
                      onClick={removeCurrent}
                      disabled={saving}
                      className={glassBtn}
                      aria-label="Remove photo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress dots */}
              {files.length > 1 && (
                <div className="absolute inset-x-0 top-[calc(env(safe-area-inset-top)+3.2rem)] z-20 flex items-center justify-center gap-1.5">
                  {files.map((f, i) => (
                    <span
                      key={f.id}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/40',
                      )}
                    />
                  ))}
                </div>
              )}

              {/* Desktop nav chevrons */}
              {files.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => goTo(-1)}
                    disabled={index === 0}
                    className={cn(glassBtn, 'absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 sm:flex')}
                    aria-label="Previous"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => goTo(1)}
                    disabled={index === files.length - 1}
                    className={cn(glassBtn, 'absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 sm:flex')}
                    aria-label="Next"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* ───────────── Bottom overlay: caption, category, filmstrip, save ───────────── */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-30"
              style={keyboardInset ? { transform: `translateY(-${keyboardInset}px)` } : undefined}
            >
              <div className="pointer-events-auto bg-gradient-to-t from-black via-black/85 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-12">
                {/* Filmstrip */}
                {hasMedia && (
                  <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1">
                    {files.map((f, i) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setIndex(i)}
                        className={cn(
                          'relative h-12 w-12 shrink-0 overflow-hidden rounded-lg ring-2 transition-all',
                          i === index ? 'ring-teal-400' : 'ring-transparent opacity-65 hover:opacity-100',
                        )}
                      >
                        {f.kind === 'image' ? (
                          <img src={f.previewUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <>
                            <video src={f.previewUrl} muted playsInline className="h-full w-full object-cover" />
                            <span className="absolute inset-0 flex items-center justify-center">
                              <Play className="h-4 w-4 text-white drop-shadow" />
                            </span>
                          </>
                        )}
                        {f.status === 'uploading' && (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                          </span>
                        )}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handlePick}
                      disabled={disabled || saving}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-white/30 text-white/70 transition-colors hover:border-white/60 hover:text-white disabled:opacity-40"
                      aria-label="Add more"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {/* Caption */}
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Write a caption…"
                  autoComplete="off"
                  rows={2}
                  disabled={saving}
                  className="w-full resize-none border-0 bg-transparent text-lg leading-snug text-white placeholder:italic placeholder:text-white/45 focus:outline-none"
                />

                {/* Category + Save */}
                <div className="mt-1 flex items-center gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-1 rounded-full bg-white/10 px-3 py-1.5">
                    <span className="text-sm text-teal-300">#</span>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="category"
                      autoComplete="off"
                      list="memory-composer-categories"
                      disabled={saving}
                      className="min-w-0 flex-1 border-0 bg-transparent text-sm text-white placeholder:italic placeholder:text-white/45 focus:outline-none"
                    />
                    <datalist id="memory-composer-categories">
                      {uniqueCategories.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!canSave}
                    className="flex shrink-0 items-center gap-1.5 rounded-full bg-teal-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-400 disabled:opacity-40"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      'Save'
                    )}
                  </button>
                </div>

                {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
            </motion.div>
          </div>
        </DialogPrimitive.Content>

      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
