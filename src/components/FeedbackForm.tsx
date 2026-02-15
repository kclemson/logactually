import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useReadOnlyContext } from "@/contexts/ReadOnlyContext";
import { MessageSquare, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitFeedback, useUserFeedback, useDeleteFeedback, useMarkFeedbackRead } from "@/hooks/feedback";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
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

export function FeedbackForm() {
  const [message, setMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
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

  if (isReadOnly) {
    return null;
  }

  const handleSubmit = async () => {
    if (!message.trim()) return;
    try {
      await submitFeedback.mutateAsync(message.trim());
      setMessage("");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };

  const handleReply = (item: { id: string; message: string }, isReopen: boolean) => async () => {
    const updatedMessage = `${item.message}\n\n---\nFollow-up:\n${followUp.trim()}`;
    const updatePayload: any = { message: updatedMessage };
    if (isReopen) {
      updatePayload.resolved_at = null;
      updatePayload.resolved_reason = null;
    }
    await supabase.from('feedback').update(updatePayload).eq('id', item.id);
    queryClient.invalidateQueries({ queryKey: ['userFeedback'] });
    queryClient.invalidateQueries({ queryKey: ['adminFeedback'] });
    setReplyingId(null);
    setFollowUp("");
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedIds(next);
    if (replyingId && replyingId !== id) {
      setReplyingId(null);
      setFollowUp("");
    }
  };

  const truncate = (text: string, maxLen = 80) => {
    const firstLine = text.split('\n')[0];
    if (firstLine.length <= maxLen) return firstLine;
    return firstLine.slice(0, maxLen) + "…";
  };

  const resolvedLabel = (reason: string | null) => {
    if (reason === 'fixed') return 'Resolved (Fixed)';
    return 'Resolved';
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
        />
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handleSubmit} disabled={!message.trim() || submitFeedback.isPending}>
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
                      <span className={cn(
                        "text-xs",
                        item.resolved_reason === 'fixed'
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                      )}>
                        ✓ {resolvedLabel(item.resolved_reason)}
                      </span>
                    )}
                    {item.response && !isResolved && (
                      <span className="text-xs text-[hsl(217_91%_60%)]">• Response</span>
                    )}
                    <ChevronDown className={cn(
                      "h-3 w-3 ml-auto text-muted-foreground transition-transform",
                      isExpanded && "rotate-180"
                    )} />
                  </div>
                  {!isExpanded && (
                    <p className="text-xs text-muted-foreground truncate">
                      {truncate(item.message)}
                    </p>
                  )}
                </button>

                {/* Expanded view */}
                {isExpanded && (
                  <div className="pb-3 space-y-2">
                    <p className="text-xs whitespace-pre-wrap">{item.message}</p>

                    {item.response && (
                      <div className="ml-3 pl-3 border-l-2 border-primary/30">
                        <span className="text-xs text-muted-foreground">
                          Response ({format(parseISO(item.responded_at!), "MMM d")})
                        </span>
                        <p className="text-xs whitespace-pre-wrap text-muted-foreground">{item.response}</p>
                      </div>
                    )}

                    {/* Actions row */}
                    <div className="flex items-center gap-3 text-xs">
                      {/* Reply / Re-open */}
                      {!isReplying && (
                        <>
                          {isResolved ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); setReplyingId(item.id); }}
                              className="text-orange-500 hover:text-orange-600 hover:underline"
                            >
                              Re-open
                            </button>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setReplyingId(item.id); }}
                              className="text-[hsl(217_91%_60%)] hover:underline"
                            >
                              Reply
                            </button>
                          )}
                        </>
                      )}

                      {/* Delete */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="text-muted-foreground hover:text-destructive flex items-center gap-1">
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{FEEDBACK_CONTENT.deleteConfirmTitle}</AlertDialogTitle>
                            <AlertDialogDescription>{FEEDBACK_CONTENT.deleteConfirmDescription}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteFeedback.mutate(item.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {/* Reply textarea */}
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
                          <Button size="sm" variant="ghost" onClick={() => { setReplyingId(null); setFollowUp(""); }}>
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
