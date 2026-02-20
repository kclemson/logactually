import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

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

  if (!url) return null;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-1">
      <img
        src={url}
        alt="Attached screenshot"
        className="max-h-64 w-auto rounded border border-border object-contain"
      />
    </a>
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
