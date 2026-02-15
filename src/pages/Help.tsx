import { useNavigate, Link } from "react-router-dom";
import { Lightbulb, X } from "lucide-react";
import { FeedbackForm } from "@/components/FeedbackForm";

// ============================================
// EDITABLE CONTENT - Modify strings here
// ============================================
const HELP_CONTENT = {
  tips: {
    title: "Tips",
    items: [
      {
        text: "This app is under active development and new features are released regularly, sometimes multiple times a week — see the changelog for the latest.",
        highlights: ["changelog"],
        link: "/changelog",
      },
      {
        text: "Braindump your inputs however you want (via text, voice, photo, or scan a barcode) — the AI figures out the formatting and does the math.",
        highlights: ["braindump"],
      },
      {
        text: "Once an item's logged, click or tap on it to make changes. Adjust portions with the +/- controls, or edit calories to auto-scale protein, carbs, and fat proportionally.",
        highlights: ["portions"],
      },
      {
        text: "Select the > next to a row to see what you originally wrote, and then save it as a meal or exercise routine for easy access in the future.",
        highlights: ["save it"],
      },
      {
        text: "There's a lot you can customize in Settings — dark theme, calorie targets, estimated exercise burn, weight units, CSV export, and more.",
        highlights: ["Settings"],
      },
      {
        text: 'Pin this app to your phone\'s home screen for quick access — tap Share (or your browser menu), then "Add to Home Screen."',
        highlights: ["Pin this app"],
      },
      {
        text: "Have questions about your data? Use Ask AI on the Trends page to spot patterns, get insights, and ask questions about your food and exercise history in plain language.",
        highlights: ["Ask AI"],
      },
      {
        text: "Track more than food and exercise — enable Custom Logs in Settings to log things like body weight, blood pressure, sleep, or anything else you want to track over time.",
        highlights: ["Custom Logs"],
      },
    ],
  },
};
// ============================================

function highlightText(text: string, highlights: string[], link?: string) {
  if (!highlights.length) return text;

  const pattern = new RegExp(`(${highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, i) => {
    const isHighlight = highlights.some((h) => h.toLowerCase() === part.toLowerCase());
    if (isHighlight && link) {
      return (
        <Link key={i} to={link} className="text-foreground underline underline-offset-2 hover:text-primary transition-colors">
          {part}
        </Link>
      );
    }
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
              <span>{highlightText(item.text, item.highlights, (item as { link?: string }).link)}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Feedback Section */}
      <FeedbackForm />

      {/* Footer */}
      <div className="pt-4 text-center text-sm">
        <Link
          to="/privacy"
          className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
        >
          Privacy & Security
        </Link>
      </div>
    </div>
  );
}
