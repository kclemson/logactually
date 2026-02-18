import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { FeedbackForm } from "@/components/FeedbackForm";

// ============================================
// CHANGELOG ENTRIES - Add new entries at the top
// Each entry: { date: "Mon-DD", text: "description", image?: "feature.png" }
// Images go in /public/changelog/ folder
//
// NOTE: When updating entries, also update the changelog link text
// in src/pages/Settings.tsx which displays the last-updated date to users.
// ============================================

type ChangelogEntry = {
  date: string;
  text: string;
  image?: string; // Single image (existing)
  images?: string[]; // Multiple images side-by-side (new)
};

// prettier-ignore
const CHANGELOG_ENTRIES: ChangelogEntry[] = [
{ date: "Feb-18", text: "Added a detail view for logged food and exercise items — tap 'Details' in the expanded panel to see all fields at a glance, or switch to edit mode to update values directly. Uses a two-column layout on wider screens with dropdowns for category fields.", image: "detailed-dialog.png" },
{ date: "Feb-17", text: "Added a 'First day of week' preference in Settings — choose Sunday or Monday, and it'll be reflected in the Calendar view on the History page and the date picker on the Food, Exercise, and Custom log pages.", image: "first-day-of-week.png" },
{ date: "Feb-17", text: "Updated grouping UI for food & exercise logs - log a picture of food or a saved meal with multiple items in it, and it'll show up as a single collapsed row by default. Food groups also support portion scaling — adjust the multiplier on the group header and all child items scale proportionally.", image: "grouped-entries.png" },
{ date: "Feb-17", text: "Tweaked UX of exercise log so that if a given day only has cardio and no strength training logged, the sets/reps/lbs will be hidden.", image: "cardio-only-columns.png" },
{ date: "Feb-16", text: "Added rolling 7-day and 30-day average calorie summaries to the Calendar view, with color-coded status dots showing whether you're on track relative to your daily target. Works across all calorie target modes — fixed, exercise-adjusted, and estimated burn rate. Also added tooltips on the Food Log and Calendar pages that break down the math behind your target.", image: "calorie-rolling.png" },
{ date: "Feb-15", text: "Expanded the existing 'daily calorie target' feature to support two new modes: 'Exercise adjusted' mode offsets the calorie count from your food intake by calories burned from logged exercises. 'Estimated burn rate minus a deficit' uses your activity level and body stats to calculate your BMR/TDEE and then subtracts a daily deficit you set.", image: "calorie-target-modes.png" },
{ date: "Feb-15", text: "Updated the feedback system — submit bug reports, feature requests, or questions directly from the Help page. See responses and status updates inline, and reply or re-open resolved items.", image: "feedback.png" },
{ date: "Feb-14", text: "Added portion scaling — tap any portion label to adjust it with +/- controls. Scales the quantity, unit, and all nutritional values proportionally.", image: "portion-scaling.png" },
{ date: "Feb-14", text: "Added custom logging — track anything beyond food and exercise. Enable it in Settings to create your own log types (body weight, measurements, mood, journal notes, and more). Supports numeric, text + numeric, and text entries with optional units. Custom logs get their own trends charts on the Trends page.", image: "custom-logs.png" },
{ date: "Feb-12", text: "Added \"Ask AI\" on the Trends page — tap it next to Food Trends or Exercise Trends to ask questions about your data. It pulls in up to 90 days of your log history and uses AI to spot patterns, suggest improvements, and answer questions in plain language. Optionally include your personal stats for more tailored answers. Comes with randomized starter questions to get you going.", image: "ask-ai.png" },
{ date: "Feb-11", text: "Added estimated calorie burn for exercises. Enable it in Settings to see per-exercise and daily burn estimates on your Weight Log, calculated using MET values from the 2024 Compendium of Physical Activities. Optionally provide your body weight, height, age, and metabolic profile to narrow the estimated range.", image: "calorie-burn-config.png" },
{ date: "Feb-11", text: "Added photo-based food logging — snap a photo or choose one from your gallery, and AI will identify the food items, estimate portions, and log the nutritional breakdown automatically.", image: "photo-food-logging.png" },
{ date: "Feb-10", text: "Added support for importing workouts from Apple Health. If you use an Apple Watch, export your exercise data on your phone and then import that XML file in Settings. Also improved general UX for cardio.", image: "apple-health-import.png" },
{ date: "Feb-09", text: "Set a daily calorie target in Settings and see color-coded indicators on the Calendar view — green when you're on track, amber when slightly over, and red when well above your goal.", image: "calorie-target-indicators.png" },
{ date: "Feb-05", text: "The 'Save as Meal' and 'Save as Routine' shortcuts now let you include other items logged on the same day. Also added color-coded 'Add' buttons—blue for food, purple for exercise—to make it easier to tell which page you're on.", image: "save-meal-select-items.png" },
{ date: "Feb-04", text: "Log similar items 3+ times, and you'll see a prompt to save them as a meal or routine. If you already have one saved, update it with the latest values in one step.", images: ["save-suggestion-food.png", "save-suggestion-routine.png"] },
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

export const LAST_UPDATED = "Feb-18-26";
// ============================================

export default function Changelog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!lightboxSrc) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxSrc(null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [lightboxSrc]);

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
                  <div className="flex flex-col items-center">
                    <span className="text-foreground self-start">{entry.text}</span>
                    {entry.image && (
                      <img
                        src={`/changelog/${entry.image}`}
                        alt={`Screenshot for ${entry.date} update`}
                        className="mt-2 max-h-[200px] max-w-[280px] w-auto object-contain cursor-pointer"
                        onClick={() => setLightboxSrc(`/changelog/${entry.image}`)}
                      />
                    )}
                    {entry.images && (
                      <div className="flex flex-wrap gap-2 mt-2 justify-center">
                        {entry.images.map((img, i) => (
                          <img
                            key={i}
                            src={`/changelog/${img}`}
                            alt={`Screenshot ${i + 1} for ${entry.date} update`}
                            className="max-h-[200px] max-w-[280px] w-auto object-contain cursor-pointer"
                            onClick={() => setLightboxSrc(`/changelog/${img}`)}
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

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setLightboxSrc(null)}
        >
          <div
            className="relative max-w-3xl w-auto mx-4 bg-background rounded-lg p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute -top-3 -right-3 bg-background rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors shadow-md"
              onClick={() => setLightboxSrc(null)}
              aria-label="Close image"
            >
              <X className="h-5 w-5" />
            </button>
            <img src={lightboxSrc} alt="Enlarged screenshot" className="max-h-[85vh] w-auto object-contain rounded" />
          </div>
        </div>
      )}
    </div>
  );
}
