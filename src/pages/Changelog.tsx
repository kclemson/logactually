import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { FeedbackForm } from "@/components/FeedbackForm";

// ============================================
// CHANGELOG ENTRIES - Add new entries at the top
// Each entry: { date: "Mon-DD", text: "description", image?: "feature.png" }
// Images go in /public/changelog/ folder
// ============================================

type ChangelogEntry = {
  date: string;
  text: string;
  image?: string;   // Single image (existing)
  images?: string[]; // Multiple images side-by-side (new)
};

// prettier-ignore
const CHANGELOG_ENTRIES: ChangelogEntry[] = [
{ date: "Feb-04", text: "Log similar items 3+ times? You'll get a prompt to save them as a meal or routine. Already have one saved? You can update it with your latest values in one click.", images: ["save-suggestion-food.png", "save-suggestion-routine.png"] },
{ date: "Feb-03", text: "Added smart detection for similar past food entries - when logging something you've had before, it'll suggest using your previous entry.", image: "similar-entry.png" },
{ date: "Feb-01", text: "Updated demo mode so you can see a preview of what would be logged based on the input you entered." },
  { date: "Jan-31", text: "Added support for Google authentication, and this changelog page." },
  { date: "Jan-30", text: "Added (minimal) support for cardio exercises - instead of erroring out, it will now log the items and show a 'cardio' label, with simple charts for cardio exercises on the Trends page. Running/walking/cycling charts also support switching between time-based view and mph-based view." },
  { date: "Jan-28", text: "Added user setting to show weights in Kg vs Lbs." },
  { date: "Jan-27", text: "Added support for logging weight lifting exercises, saved routines, charts, and exporting the full weight lifting log to CSV. Refactored a bunch of code to be shared between Food and Weights. Also added 'demo mode', a read-only account that has pre-populated content in it so people can see the basic UI of the app without having to create an account." },
  { date: "Jan-26", text: "Added support for requesting additional food metadata from the model (fiber, sugar, saturated fat, sodium, cholesterol) but they're not shown in the UI for now as it's already fairly dense. These fields are available in the exported CSV of the food log." },
  { date: "Jan-25", text: "Added the ability to save meals (click/tap the > next to the logged food to access it) and then quickly add a saved meal to the log." },
  { date: "Jan-24", text: "Added barcode scanning support for logging food, and user setting for dark theme." },
  { date: "Jan-23", text: "It's alive! v1 of app published with support for food logging & AI integration, editing logged items (and editing calories auto-scales protein/carbs/fat), charts for trends over time, mobile & desktop layouts, PWA support for pinning to home screen." },
];

const LAST_UPDATED = "Feb-04-26";
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
              <li key={index} className="text-sm">
                <div className="flex gap-2">
                  <span className="text-muted-foreground shrink-0">{entry.date}:</span>
                  <div className="flex flex-col">
                    <span className="text-foreground">{entry.text}</span>
                    {entry.image && (
                      <img 
                        src={`/changelog/${entry.image}`} 
                        alt={`Screenshot for ${entry.date} update`}
                        className="mt-2 rounded-lg max-h-[200px] w-auto object-contain"
                      />
                    )}
                    {entry.images && (
                      <div className="flex gap-2 mt-2">
                        {entry.images.map((img, i) => (
                          <img 
                            key={i}
                            src={`/changelog/${img}`}
                            alt={`Screenshot ${i + 1} for ${entry.date} update`}
                            className="rounded-lg max-h-[200px] w-auto object-contain"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
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
