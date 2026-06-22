import { useState } from 'react';
import { Play } from 'lucide-react';
import {
  getSignedMemoryUrl,
  invalidateSignedUrl,
  memoryThumbPath,
  MEMORY_THUMB_TRANSFORM,
} from '@/lib/memory-media';
import { cn } from '@/lib/utils';
import type { MemoryMedia } from '@/hooks/useMemoryMedia';

interface MemoryThumbProps {
  media: MemoryMedia;
  /** Pre-signed thumbnail URL, minted up-front by the list/cover hooks. */
  url: string | null | undefined;
  className?: string;
}

/**
 * Small square thumbnail for a memory media item. The signed (resized) URL is
 * supplied by the parent so a whole list resolves from one batched signing pass
 * rather than each thumbnail fetching its own. On a load error (e.g. an expired
 * URL) it re-mints once on its own.
 */
export function MemoryThumb({ media, url, className }: MemoryThumbProps) {
  const thumbPath = memoryThumbPath(media);
  const [override, setOverride] = useState<string | null>(null);
  const src = override ?? url ?? null;

  return (
    <div className={cn('relative shrink-0 overflow-hidden rounded-md bg-muted', className)}>
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={async () => {
            invalidateSignedUrl(thumbPath);
            const fresh = await getSignedMemoryUrl(thumbPath, MEMORY_THUMB_TRANSFORM);
            setOverride(fresh);
          }}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full animate-pulse bg-muted" />
      )}
      {media.kind === 'video' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Play className="h-4 w-4 text-white drop-shadow" />
        </div>
      )}
    </div>
  );
}
