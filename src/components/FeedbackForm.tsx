import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useReadOnlyContext } from "@/contexts/ReadOnlyContext";
import { MessageSquare, Trash2, ChevronDown, Paperclip, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitFeedback, useUserFeedback, useDeleteFeedback, useMarkFeedbackRead } from "@/hooks/feedback";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { truncate } from "@/lib/feedback-utils";
import { FeedbackMessageBody } from "@/components/FeedbackMessageBody";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const FEEDBACK_CONTENT = {
  title: "Feedback",
  placeholder: "Let me know what you think about the app, or if you have any feature requests or bug reports",
  submitButton: "Send Feedback",
  submittingButton: "Sending...",
  successMessage: "Thanks for the feedback!",
  historyTitle: "Your Previous Feedback",
  deleteConfirmTitle: "Delete feedback?",
  deleteConfirmDescription: "This will permanently delete this feedback message.",
};

function compressImageToFile(src: string): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        const scale = MAX / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Canvas toBlob failed"));
          resolve(new File([blob], "image.jpg", { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.82,
      );
    };
    img.onerror = reject;
    img.src = src;
  });
}

function fileToPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

export function FeedbackForm() {
  const [message, setMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // On mount, pick up any screenshot that was captured during navigation
  useEffect(() => {
    const pending = sessionStorage.getItem("feedback-pending-screenshot");
    if (!pending) return;
    sessionStorage.removeItem("feedback-pending-screenshot");
    compressImageToFile(pending).then((file) => {
      setAttachedFile(file);
      setPreviewUrl(fileToPreviewUrl(file));
    }).catch(console.error);
  }, []);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showPagePicker, setShowPagePicker] = useState(false);
  const navigate = useNavigate();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("feedback-expanded-ids");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const submitFeedback = useSubmitFeedback();
  const { data: feedbackHistory } = useUserFeedback();
  const deleteFeedback = useDeleteFeedback();
  const markRead = useMarkFeedbackRead();
  const { isReadOnly } = useReadOnlyContext();

  useEffect(() => {
    if (!isReadOnly) {
      markRead.mutate();
    }
  }, [isReadOnly]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const clearAttachment = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setAttachedFile(null);
    setPreviewUrl(null);
    setLightboxOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [previewUrl]);

  const handleFileSelected = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const compressed = await compressImageToFile(e.target?.result as string);
        setAttachedFile(compressed);
        setPreviewUrl(fileToPreviewUrl(compressed));
      } catch (err) {
        console.error("Image compression failed:", err);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelected(file);
      e.target.value = "";
    },
    [handleFileSelected],
  );

  const CAPTURABLE_PAGES = [
    { label: "Food Log", path: "/" },
    { label: "Exercise Log", path: "/weights" },
    { label: "Trends", path: "/trends" },
    { label: "History", path: "/history" },
    { label: "Custom Log", path: "/custom" },
  ];

  const handleCapturePage = useCallback(async (path: string) => {
    setShowPagePicker(false);
    setIsCapturing(true);
    try {
      navigate(path);
      // Wait for React Router to render the route + data to load
      await new Promise((resolve) => setTimeout(resolve, 600));
      const html2canvas = (await import("html2canvas")).default;
      const target = document.querySelector("main") as HTMLElement;
      if (!target) throw new Error("No <main> element found");
      const htmlEl = document.documentElement;
      const wasDark = htmlEl.classList.contains("dark");
      if (wasDark) htmlEl.classList.remove("dark");
      let canvas: HTMLCanvasElement;
      try {
        canvas = await html2canvas(target, {
          useCORS: true,
          allowTaint: false,
          scale: 1,
          logging: false,
        });
      } finally {
        if (wasDark) htmlEl.classList.add("dark");
      }
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      // Store in sessionStorage so the screenshot survives the unmount/remount
      // that happens when we navigate back to /help
      sessionStorage.setItem("feedback-pending-screenshot", dataUrl);
    } catch (err) {
      console.error("Screenshot failed:", err);
    } finally {
      navigate("/help");
      setIsCapturing(false);
    }
  }, [navigate]);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    try {
      await submitFeedback.mutateAsync({
        message: message.trim(),
        imageFile: attachedFile ?? undefined,
      });
      setMessage("");
      clearAttachment();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };

  const handleReply = (item: { id: string; message: string }, isReopen: boolean) => async () => {
    const updatedMessage = `${item.message}\n---\nFollow-up on ${format(new Date(), "MMM d h:mm a")}:\n${followUp.trim()}`;
    const updatePayload: any = { message: updatedMessage };
    if (isReopen) {
      updatePayload.resolved_at = null;
      updatePayload.resolved_reason = null;
    }
    await supabase.from("feedback").update(updatePayload).eq("id", item.id);
    queryClient.invalidateQueries({ queryKey: ["userFeedback"] });
    queryClient.invalidateQueries({ queryKey: ["adminFeedback"] });
    setReplyingId(null);
    setFollowUp("");
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
    if (next.size > 0) {
      localStorage.setItem("feedback-expanded-ids", JSON.stringify([...next]));
    } else {
      localStorage.removeItem("feedback-expanded-ids");
    }
    if (replyingId && replyingId !== id) {
      setReplyingId(null);
      setFollowUp("");
    }
  };

  const resolvedLabel = (reason: string | null) => {
    if (reason === "fixed") return "Resolved (Fixed)";
    return "Resolved";
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-medium">{FEEDBACK_CONTENT.title}</h2>
      </div>

      <div className="space-y-2">
        <Textarea
          placeholder={FEEDBACK_CONTENT.placeholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[80px] text-sm resize-none"
          maxLength={1000}
          disabled={isReadOnly}
        />

        {/* Attachment buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
          />
          <button
            type="button"
            disabled={isReadOnly}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors",
              isReadOnly && "opacity-50 pointer-events-none",
            )}
          >
            <Paperclip className="h-3.5 w-3.5" />
            Attach photo
          </button>
          <span className="text-muted-foreground/40 text-xs">·</span>
          <div className="relative">
            <button
              type="button"
              disabled={isReadOnly || isCapturing}
              onClick={() => setShowPagePicker((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors",
                (isReadOnly || isCapturing) && "opacity-50 pointer-events-none",
              )}
            >
              <Camera className="h-3.5 w-3.5" />
              {isCapturing ? "Capturing…" : "Screenshot a page"}
            </button>
            {showPagePicker && (
              <div className="absolute left-0 top-5 z-50 bg-popover border border-border rounded-md shadow-md py-1 min-w-[140px]">
                {CAPTURABLE_PAGES.map((page) => (
                  <button
                    key={page.path}
                    type="button"
                    onClick={() => handleCapturePage(page.path)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    {page.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail preview */}
        {previewUrl && (
          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="block focus:outline-none"
              aria-label="View attachment full size"
            >
              <img
                src={previewUrl}
                alt="Attachment preview"
                className="h-24 w-auto rounded border border-border object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
              />
            </button>
            <button
              type="button"
              onClick={clearAttachment}
              className="absolute -top-1.5 -right-1.5 bg-background border border-border rounded-full p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Remove attachment"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Lightbox */}
        {lightboxOpen && previewUrl && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 bg-background/20 hover:bg-background/40 text-white rounded-full p-1.5 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={previewUrl}
              alt="Attachment full size"
              className="max-w-[90vw] max-h-[85vh] object-contain rounded shadow-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isReadOnly || !message.trim() || submitFeedback.isPending}
          >
            {submitFeedback.isPending ? FEEDBACK_CONTENT.submittingButton : FEEDBACK_CONTENT.submitButton}
          </Button>
          {showSuccess && (
            <span className="text-sm text-muted-foreground animate-in fade-in">
              {FEEDBACK_CONTENT.successMessage}
            </span>
          )}
        </div>
      </div>

      {feedbackHistory && feedbackHistory.length > 0 && (
        <div className="pt-4 border-t space-y-1">
          <h3 className="text-xs font-medium text-muted-foreground mb-2">{FEEDBACK_CONTENT.historyTitle}</h3>
          {feedbackHistory.map((item) => {
            const isExpanded = expandedIds.has(item.id);
            const isResolved = !!item.resolved_at;
            const isReplying = replyingId === item.id;

            return (
              <div key={item.id} className="border-b border-border/50 last:border-0">
                {/* Collapsed row - clickable */}
                <button
                  type="button"
                  onClick={() => toggleExpand(item.id)}
                  className="w-full text-left py-2 flex flex-col gap-0.5"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground font-mono">#{item.feedback_id}</span>
                    <span className="text-muted-foreground">
                      {format(parseISO(item.created_at), "MMM d, yyyy")}
                    </span>
                    {isResolved && (
                      <span
                        className={cn(
                          "text-xs",
                          item.resolved_reason === "fixed"
                            ? "text-green-600 dark:text-green-400"
                            : "text-[hsl(217_91%_60%)]",
                        )}
                      >
                        ✓ {resolvedLabel(item.resolved_reason)}
                      </span>
                    )}
                    {!isResolved && !item.response && (
                      <span className="text-xs text-foreground">Active</span>
                    )}
                    {item.response && !isResolved && (
                      <span className="text-xs text-[hsl(217_91%_60%)]">• Response</span>
                    )}
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 ml-auto text-muted-foreground transition-transform",
                        isExpanded && "rotate-180",
                      )}
                    />
                  </div>
                  {!isExpanded && (
                    <p className="text-xs text-muted-foreground truncate">{truncate(item.message)}</p>
                  )}
                </button>

                {/* Expanded view */}
                {isExpanded && (
                  <div className="pb-3 space-y-2">
                    <FeedbackMessageBody
                      message={item.message}
                      createdAt={item.created_at}
                      response={item.response}
                      respondedAt={item.responded_at}
                      imagePath={item.image_url}
                    />

                    {/* Actions row */}
                    <div className="flex items-center gap-3 text-xs">
                      {!isReplying && (
                        <>
                          {isResolved ? (
                            <button
                              disabled={isReadOnly}
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplyingId(item.id);
                              }}
                              className={cn(
                                "text-orange-500 hover:text-orange-600 hover:underline",
                                isReadOnly && "opacity-50 pointer-events-none",
                              )}
                            >
                              Re-open
                            </button>
                          ) : (
                            <button
                              disabled={isReadOnly}
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplyingId(item.id);
                              }}
                              className={cn(
                                "text-[hsl(217_91%_60%)] hover:underline",
                                isReadOnly && "opacity-50 pointer-events-none",
                              )}
                            >
                              Reply
                            </button>
                          )}
                        </>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            disabled={isReadOnly}
                            className={cn(
                              "text-destructive flex items-center gap-1",
                              isReadOnly && "opacity-50 pointer-events-none",
                            )}
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{FEEDBACK_CONTENT.deleteConfirmTitle}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {FEEDBACK_CONTENT.deleteConfirmDescription}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteFeedback.mutate(item.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {isReplying && (
                      <div className="space-y-1">
                        <Textarea
                          placeholder="Add a follow-up message..."
                          value={followUp}
                          onChange={(e) => setFollowUp(e.target.value)}
                          className="min-h-[60px] text-sm resize-none"
                          maxLength={1000}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleReply(item, isResolved)} disabled={!followUp.trim()}>
                            {isResolved ? "Send & Re-open" : "Send"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setReplyingId(null);
                              setFollowUp("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
