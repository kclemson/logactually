import { useState, useEffect } from "react";
import { useReadOnlyContext } from "@/contexts/ReadOnlyContext";
import { MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitFeedback, useUserFeedback, useDeleteFeedback, useMarkFeedbackRead } from "@/hooks/feedback";
import { format, parseISO } from "date-fns";
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

// ============================================
// EDITABLE CONTENT
// ============================================
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
// ============================================

export function FeedbackForm() {
  const [message, setMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const submitFeedback = useSubmitFeedback();
  const { data: feedbackHistory } = useUserFeedback();
  const deleteFeedback = useDeleteFeedback();
  const markRead = useMarkFeedbackRead();
  const { isReadOnly } = useReadOnlyContext();

  // Mark unread responses as read when component mounts
  useEffect(() => {
    markRead.mutate();
  }, []);

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

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-medium">{FEEDBACK_CONTENT.title}</h2>
      </div>

      {!isReadOnly && (
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
      )}

      {feedbackHistory && feedbackHistory.length > 0 && (
        <div className="pt-4 border-t space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground">{FEEDBACK_CONTENT.historyTitle}</h3>
          {feedbackHistory.map((item) => (
            <div key={item.id} className="text-sm space-y-1 pb-3 border-b border-border/50 last:border-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(item.created_at), "MMM d, yyyy")}
                  </span>
                  <p className="whitespace-pre-wrap">{item.message}</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      disabled={deleteFeedback.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
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
              {item.response && (
                <div className="ml-3 pl-3 border-l-2 border-primary/30">
                  <span className="text-xs text-muted-foreground">
                    Response ({format(parseISO(item.responded_at!), "MMM d")})
                  </span>
                  <p className="whitespace-pre-wrap text-muted-foreground">{item.response}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
