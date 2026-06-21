import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { getSignedMemoryUrl, invalidateSignedUrl } from '@/lib/memory-media';
import { cn } from '@/lib/utils';
import type { MemoryMedia } from '@/hooks/useMemoryMedia';

interface MemoryThumbProps {
  media: MemoryMedia;
  className?: string;
}

/** Small square thumbnail for a memory media item, using a cached signed URL. */
export function MemoryThumb({ media, className }: MemoryThumbProps) {
  const [url, setUrl] = useState<string | null>(null);
  const thumbPath = media.kind === 'video' ? media.poster_path ?? media.storage_path : media.storage_path;

  useEffect(() => {
    let active = true;
    setUrl(null);
    getSignedMemoryUrl(thumbPath).then((u) => active && setUrl(u));
    return () => {
      active = false;
    };
  }, [thumbPath]);

  return (
    <div className={cn('relative shrink-0 overflow-hidden rounded-md bg-muted', className)}>
      {url ? (
        <img
          src={url}
          alt=""
          loading="lazy"
          draggable={false}
          onError={async () => {
            invalidateSignedUrl(thumbPath);
            const fresh = await getSignedMemoryUrl(thumbPath);
            setUrl(fresh);
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
