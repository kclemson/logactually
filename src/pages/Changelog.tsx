import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { FeedbackForm } from "@/components/FeedbackForm";

// ============================================
// CHANGELOG ENTRIES - Add new entries at the top
// Each entry is one line: { date: "Mon-DD", text: "description" }
// ============================================
const CHANGELOG_ENTRIES = [
{ date: "Jan-31", text: "Added support for Google authentication" },
{ date: "Jan-30", text: "Added minimal support for cardio exercises - instead of erroring out, it will now log the items and show a 'cardio' label, with minimal support on the Trends page for cardio charts. Running/walking/cycling charts also support switching between time-based view and mph-based view." },
{ date: "Jan-28", text: "Added user setting to show weights in Kg vs Lbs" },
{ date: "Jan-27", text: "Added support for logging weight lifting exercises, saved routines, charts, and exporting the full weight lifting log to CSV" },
{ date: "Jan-25", text: "Added feature for being able to save meals & quickly add saved meals to the log" },
{ date: "Jan-24", text: "Added support for dark theme" },
{ date: "Jan-23", text: "v1 of app published with support for food logging, basic charts for trends over time" },
];

const LAST_UPDATED = "Jan-31-26";
// ============================================

export default function Changelog() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleClose = () => {
    navigate(user ? "/" : "/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="relative">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-0 top-0 p-2 -mr-2 -mt-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close changelog"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <h1 className="text-2xl font-bold mb-1">Changelog</h1>
          <p className="text-sm text-muted-foreground mb-6">Last updated: {LAST_UPDATED}</p>

          {/* Entries */}
          <ul className="space-y-3">
            {CHANGELOG_ENTRIES.map((entry, index) => (
              <li key={index} className="flex gap-2 text-sm">
                <span className="text-muted-foreground shrink-0">{entry.date}:</span>
                <span className="text-foreground">{entry.text}</span>
              </li>
            ))}
          </ul>

          {/* Feedback form for authenticated users */}
          {user && (
            <div className="mt-8 pt-6 border-t border-border">
              <FeedbackForm />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
