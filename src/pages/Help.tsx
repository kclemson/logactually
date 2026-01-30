import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lightbulb, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitFeedback } from "@/hooks/useFeedback";

// ============================================
// EDITABLE CONTENT - Modify strings here
// ============================================
const HELP_CONTENT = {
  tips: {
    title: "Tips",
    items: [
      {
        text: "Braindump your inputs however you want (via text, voice, or scan a barcode) — the AI figures out the formatting and does the math.",
        highlights: ["braindump"],
      },
      {
        text: "Once an item's logged, click or tap on it to make changes. Editing calories auto-scales protein, carbs, and fat proportionally.",
        highlights: ["editing calories"],
      },
      {
        text: "Select the > next to a row to see what you originally wrote, and then save it as a meal or weight lifting routine for easy access in the future.",
        highlights: ["save it"],
      },
      {
        text: "Switch to dark theme, show weight in Kgs, or export to CSV in Settings.",
        highlights: ["Export to CSV"],
      },
      {
        text: 'Pin this app to your phone\'s home screen for quick access — tap Share (or your browser menu), then "Add to Home Screen."',
        highlights: ["Pin this app"],
      },
    ],
  },
  feedback: {
    title: "Feedback",
    placeholder: "Let us know what you think, or if you have any feature requests or bug reports",
    submitButton: "Send Feedback",
    submittingButton: "Sending...",
    successMessage: "Thanks for the feedback!",
  },
};
// ============================================

function highlightText(text: string, highlights: string[]) {
  if (!highlights.length) return text;

  const pattern = new RegExp(`(${highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, i) => {
    const isHighlight = highlights.some((h) => h.toLowerCase() === part.toLowerCase());
    return isHighlight ? (
      <span key={i} className="text-foreground">
        {part}
      </span>
    ) : (
      part
    );
  });
}

export default function Help() {
  const navigate = useNavigate();
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
    <div className="space-y-6 relative">
      {/* Close button */}
      <button
        onClick={() => navigate("/")}
        className="absolute right-0 top-0 p-2 -mr-2 -mt-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Close help"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Tips Section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">{HELP_CONTENT.tips.title}</h2>
        </div>
        <ul className="space-y-3 text-sm text-muted-foreground">
          {HELP_CONTENT.tips.items.map((item, index) => (
            <li key={index} className="flex gap-2">
              <span className="text-foreground">•</span>
              <span>{highlightText(item.text, item.highlights)}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Feedback Section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">{HELP_CONTENT.feedback.title}</h2>
        </div>

        {submitted ? (
          <p className="text-sm text-muted-foreground">{HELP_CONTENT.feedback.successMessage}</p>
        ) : (
          <div className="space-y-2">
            <Textarea
              placeholder={HELP_CONTENT.feedback.placeholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[80px] text-sm resize-none"
              maxLength={1000}
            />
            <Button size="sm" onClick={handleSubmit} disabled={!message.trim() || submitFeedback.isPending}>
              {submitFeedback.isPending ? HELP_CONTENT.feedback.submittingButton : HELP_CONTENT.feedback.submitButton}
            </Button>
          </div>
        )}
      </section>

      {/* Footer */}
      <div className="pt-4 text-center">
        <Link
          to="/privacy"
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
        >
          Privacy & Security
        </Link>
      </div>
    </div>
  );
}
