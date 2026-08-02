import { format } from "date-fns";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDemoPopulateProgress } from "@/hooks/useDemoPopulateProgress";

/**
 * Live row counts for the demo account while a populate run is in flight.
 * Lives on the Admin page (not the dialog) so closing the dialog — or reloading
 * the page — doesn't lose sight of the background job.
 */
export function DemoPopulateProgress() {
  const progress = useDemoPopulateProgress();

  if (!progress.active) return null;

  return (
    <div
      className={cn(
        "mt-3 text-xs p-2 rounded border",
        progress.settled
          ? "bg-green-500/10 border-green-500/30 text-green-600"
          : "bg-blue-500/10 border-blue-500/30 text-blue-600"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">
          {progress.settled ? "Demo data population — likely finished" : "⏳ Demo data population running"}
        </p>
        <button
          onClick={progress.dismiss}
          aria-label="Dismiss progress"
          className="p-0.5 text-muted-foreground hover:text-foreground shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {progress.counts ? (
        <ul className="list-disc list-inside mt-1">
          <li>Food entries: {progress.counts.foodEntries}</li>
          <li>Exercise sets: {progress.counts.weightSets}</li>
          <li>Custom logs: {progress.counts.customLogEntries}</li>
          <li>Saved meals: {progress.counts.savedMeals}</li>
          <li>Saved routines: {progress.counts.savedRoutines}</li>
        </ul>
      ) : progress.error ? (
        <p className="text-destructive mt-1">Couldn't read counts: {progress.error.message}</p>
      ) : (
        <p className="text-muted-foreground mt-1">Checking current totals…</p>
      )}

      <p className="text-muted-foreground mt-1">
        {progress.settled
          ? "Counts stopped changing."
          : progress.updatedAt
            ? `Counts update as data is written · last checked ${format(progress.updatedAt, "h:mm:ss a")}`
            : `Started ${progress.startedAt ? format(progress.startedAt, "h:mm:ss a") : ""}`}
      </p>
    </div>
  );
}
