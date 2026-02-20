import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

interface FeedbackMessageBodyProps {
  message: string;
  createdAt: string;
  response: string | null;
  respondedAt: string | null;
  /** Storage path like `{userId}/{timestamp}.jpg` — a signed URL is generated on mount */
  imagePath?: string | null;
  /** If provided, use this userId for constructing the admin signed URL path; otherwise infer from path */
  userId?: string;
}

function FeedbackImage({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.storage
      .from("feedback-images")
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (!cancelled && data?.signedUrl) setUrl(data.signedUrl);
      });
    return () => { cancelled = true; };
  }, [path]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [lightboxOpen]);

  if (!url) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="block mt-1 focus:outline-none"
        aria-label="View attachment full size"
      >
        <img
          src={url}
          alt="Attached screenshot"
          className="max-h-64 w-auto rounded border border-border object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
        />
      </button>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-3 -right-3 bg-background rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors shadow-md z-10"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={url}
              alt="Attachment full size"
              className="max-w-[90vw] max-h-[85vh] object-contain rounded shadow-xl"
            />
          </div>
        </div>
      )}
    </>
  );
}

export function FeedbackMessageBody({
  message,
  createdAt,
  response,
  respondedAt,
  imagePath,
}: FeedbackMessageBodyProps) {
  return (
    <>
      <span className="text-xs text-muted-foreground">
        Feedback created ({format(parseISO(createdAt), "MMM d, h:mm a")}):
      </span>
      <div className="ml-3 pl-3 border-l-2 border-border">
        <p className="text-xs whitespace-pre-wrap mt-0.5">{message}</p>
        {imagePath && <FeedbackImage path={imagePath} />}
      </div>

      {response && respondedAt && (
        <>
          <span className="text-xs text-muted-foreground mt-2 block">
            Response ({format(parseISO(respondedAt), "MMM d h:mm a")}):
          </span>
          <div className="ml-3 pl-3 border-l-2 border-primary/30">
            <p className="text-xs whitespace-pre-wrap mt-0.5">{response}</p>
          </div>
        </>
      )}
    </>
  );
}
