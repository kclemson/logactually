import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitFeedback } from "@/hooks/useFeedback";

// ============================================
// EDITABLE CONTENT
// ============================================
const FEEDBACK_CONTENT = {
  title: "Feedback",
  placeholder: "Let us know what you think, or if you have any feature requests or bug reports",
  submitButton: "Send Feedback",
  submittingButton: "Sending...",
  successMessage: "Thanks for the feedback!",
};
// ============================================

export function FeedbackForm() {
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const submitFeedback = useSubmitFeedback();

  const handleSubmit = async () => {
    if (!message.trim()) return;

    try {
      await submitFeedback.mutateAsync(message.trim());
      setMessage("");
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-medium">{FEEDBACK_CONTENT.title}</h2>
      </div>

      {submitted ? (
        <p className="text-sm text-muted-foreground">{FEEDBACK_CONTENT.successMessage}</p>
      ) : (
        <div className="space-y-2">
          <Textarea
            placeholder={FEEDBACK_CONTENT.placeholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[80px] text-sm resize-none"
            maxLength={1000}
          />
          <Button size="sm" onClick={handleSubmit} disabled={!message.trim() || submitFeedback.isPending}>
            {submitFeedback.isPending ? FEEDBACK_CONTENT.submittingButton : FEEDBACK_CONTENT.submitButton}
          </Button>
        </div>
      )}
    </section>
  );
}
