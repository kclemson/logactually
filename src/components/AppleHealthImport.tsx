import { useState, useRef, useCallback, useMemo } from "react";
import { Upload, AlertCircle, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ACTIVITY_MAP,
  MAPPED_TYPES,
  APPLE_HEALTH_RAW_INPUT,
  shortTypeName,
  extractAttribute,
  parseStartDate,
  parseWorkoutBlock,
  type ParsedWorkout,
} from "@/lib/apple-health-mapping";

const CHUNK_SIZE = 1024 * 1024; // 1MB
const OVERLAP_SIZE = 50 * 1024; // 50KB overlap for spanning blocks
const BATCH_SIZE = 50;

type Phase = "config" | "scanning" | "select" | "importing" | "done";

interface TypeSummary {
  count: number;
  mapped: boolean;
  description: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function defaultFromDate(lastImportDate: string | null): Date {
  if (lastImportDate) return new Date(lastImportDate + "T00:00:00");
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d;
}

/** The dialog content with all import workflow logic. Resets on unmount. */
function AppleHealthImportDialog({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();

  // Config phase
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [lastImportLoaded, setLastImportLoaded] = useState(false);

  // Scanning
  const [phase, setPhase] = useState<Phase>("config");
  const [progress, setProgress] = useState({ read: 0, total: 0, found: 0 });
  const abortRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Results
  const [typeSummaries, setTypeSummaries] = useState<Record<string, TypeSummary>>({});
  const [allWorkouts, setAllWorkouts] = useState<ParsedWorkout[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());


  // Import

  // Import
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  // Load last import date on mount
  if (!lastImportLoaded && user) {
    setLastImportLoaded(true);
    supabase
      .from("weight_sets")
      .select("logged_date")
      .eq("user_id", user.id)
      .eq("raw_input", APPLE_HEALTH_RAW_INPUT)
      .order("logged_date", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        const lastDate = data?.[0]?.logged_date ?? null;
        setFromDate(defaultFromDate(lastDate));
      });
  }

  const scan = useCallback(async (file: File, cutoffDate: string) => {
    setPhase("scanning");
    setError(null);
    abortRef.current = false;
    setAllWorkouts([]);
    setTypeSummaries({});

    const cutoff = new Date(cutoffDate);
    const decoder = new TextDecoder("utf-8");
    const workouts: ParsedWorkout[] = [];
    const types: Record<string, TypeSummary> = {};
    let totalFound = 0;

    let endOffset = file.size;
    let carryover = "";

    while (endOffset > 0 && !abortRef.current) {
      const startOffset = Math.max(0, endOffset - CHUNK_SIZE);
      const blob = file.slice(startOffset, endOffset);
      const arrayBuf = await blob.arrayBuffer();
      const text = decoder.decode(arrayBuf, { stream: startOffset > 0 });

      const combined = text + carryover;

      let searchFrom = 0;
      const chunkWorkouts: ParsedWorkout[] = [];
      let oldestInChunk: Date | null = null;

      while (true) {
        const startTag = combined.indexOf("<Workout ", searchFrom);
        if (startTag === -1) break;

        const closeSlash = combined.indexOf("/>", startTag);
        const closeAngle = combined.indexOf(">", startTag);
        const isSelfClosing = closeSlash !== -1 && closeAngle !== -1 && closeSlash + 1 === closeAngle;

        let workoutXml: string;
        let endPos: number;

        if (isSelfClosing) {
          endPos = closeSlash + 2;
          workoutXml = combined.substring(startTag, endPos);
        } else {
          const endTag = combined.indexOf("</Workout>", startTag);
          if (endTag === -1) break;
          endPos = endTag + "</Workout>".length;
          workoutXml = combined.substring(startTag, endPos);
        }

        const activityType = extractAttribute(workoutXml, "workoutActivityType");
        if (activityType) {
          totalFound++;
          const isMapped = MAPPED_TYPES.has(activityType);
          const desc = isMapped ? ACTIVITY_MAP[activityType].description : shortTypeName(activityType);

          if (!types[activityType]) {
            types[activityType] = { count: 0, mapped: isMapped, description: desc };
          }
          types[activityType].count++;

          if (isMapped) {
            const parsed = parseWorkoutBlock(workoutXml);
            if (parsed) {
              if (parsed.startDate < cutoff) {
                oldestInChunk = parsed.startDate;
              } else {
                chunkWorkouts.push(parsed);
              }
            }
          }

          const sd = parseStartDate(workoutXml);
          if (sd && (!oldestInChunk || sd < oldestInChunk)) {
            oldestInChunk = sd;
          }
        }

        searchFrom = endPos;
      }

      workouts.push(...chunkWorkouts);

      if (startOffset > 0) {
        carryover = combined.substring(0, OVERLAP_SIZE);
      }

      setProgress({ read: file.size - startOffset, total: file.size, found: totalFound });

      if (oldestInChunk && oldestInChunk < cutoff) {
        break;
      }

      endOffset = startOffset;
      await new Promise((r) => setTimeout(r, 0));
    }

    setAllWorkouts(workouts);
    setTypeSummaries(types);

    const mappedKeys = Object.entries(types)
      .filter(([_, v]) => v.mapped)
      .map(([k]) => k);
    setSelectedTypes(new Set(mappedKeys));
    setPhase("select");
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && fromDate) scan(file, format(fromDate, "yyyy-MM-dd"));
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const selectedWorkouts = useMemo(
    () => allWorkouts.filter((w) => selectedTypes.has(w.activityType)),
    [allWorkouts, selectedTypes]
  );


  const handleImport = async () => {
    if (!user) return;
    setPhase("importing");
    setError(null);

    let toImport = selectedWorkouts;

    {
      const exerciseKeys = [...new Set(toImport.map((w) => w.mapping.exercise_key))];
      const dates = toImport.map((w) => w.loggedDate);
      const minDate = dates.reduce((a, b) => (a < b ? a : b), dates[0]);
      const maxDate = dates.reduce((a, b) => (a > b ? a : b), dates[0]);

      const { data: existing } = await supabase
        .from("weight_sets")
        .select("exercise_key, logged_date, duration_minutes")
        .eq("user_id", user.id)
        .eq("raw_input", APPLE_HEALTH_RAW_INPUT)
        .in("exercise_key", exerciseKeys)
        .gte("logged_date", minDate)
        .lte("logged_date", maxDate);

      const existingSet = new Set(
        (existing ?? []).map((e) => `${e.exercise_key}|${e.logged_date}|${Math.round(Number(e.duration_minutes) || 0)}`)
      );

      toImport = toImport.filter((w) => {
        const key = `${w.mapping.exercise_key}|${w.loggedDate}|${Math.round(w.durationMinutes || 0)}`;
        return !existingSet.has(key);
      });
    }

    setImportProgress({ done: 0, total: toImport.length });

    let imported = 0;
    for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
      const batch = toImport.slice(i, i + BATCH_SIZE);
      const rows = batch.map((w) => ({
        user_id: user.id,
        entry_id: crypto.randomUUID(),
        logged_date: w.loggedDate,
        exercise_key: w.mapping.exercise_key,
        exercise_subtype: w.mapping.exercise_subtype,
        description: w.mapping.description,
        duration_minutes: w.durationMinutes,
        distance_miles: w.distanceMiles,
        exercise_metadata: w.caloriesBurned ? { calories_burned: w.caloriesBurned } : null,
        sets: 1,
        reps: 1,
        weight_lbs: 0,
        raw_input: APPLE_HEALTH_RAW_INPUT,
      }));

      const { error: insertErr } = await supabase.from("weight_sets").insert(rows);
      if (insertErr) {
        setError(`Import failed at batch ${Math.floor(i / BATCH_SIZE) + 1}: ${insertErr.message}`);
        break;
      }

      imported += batch.length;
      setImportProgress({ done: imported, total: toImport.length });
    }

    setImportedCount(imported);
    setPhase("done");
  };

  const handleCancel = () => {
    abortRef.current = true;
  };

  const pct = progress.total > 0 ? (progress.read / progress.total) * 100 : 0;
  const importPct = importProgress.total > 0 ? (importProgress.done / importProgress.total) * 100 : 0;

  const sortedTypes = Object.entries(typeSummaries)
    .filter(([_, info]) => info.mapped)
    .sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="space-y-4">
      {/* Description + see how (config phase only) */}
      {phase === "config" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            First, export your exercise data from the Health app on your phone.{" "}
            (<button
              onClick={() => setShowInstructions((v) => !v)}
              className="text-xs underline underline-offset-2 hover:text-foreground transition-colors"
            >
              {showInstructions ? "hide" : "see how"}
            </button>)
          </p>
          {showInstructions && (
            <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-3">
              Open the <strong>Health</strong> app → tap your profile picture → <strong>Export All Health Data</strong>. Save and unzip the file, then select <code className="text-[11px] bg-muted px-1 rounded">export.xml</code> below.{" "}
              <a
                href="https://support.apple.com/guide/iphone/share-your-health-data-iph5ede58c3d/ios"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                Learn more
              </a>
            </p>
          )}
        </div>
      )}

      {/* Config phase */}
      {phase === "config" && (
        <>
          {/* Date picker */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Import workouts since</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 text-sm justify-start text-left font-normal",
                    !fromDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                  {fromDate ? format(fromDate, "MMM d, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={setFromDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Styled file picker */}
          <div className="flex justify-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={!fromDate}
              className="text-xs"
            >
              <Upload className="h-3.5 w-3.5 mr-1" />
              Select export.xml
            </Button>
          </div>
        </>
      )}

      {/* Scanning progress */}
      {phase === "scanning" && (
        <div className="space-y-2">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div className="bg-primary h-full transition-all duration-200" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Scanning — {formatBytes(progress.read)} / {formatBytes(progress.total)}
              {progress.found > 0 && ` — ${progress.found} workouts found`}
            </p>
            <Button variant="ghost" size="sm" className="text-xs h-6" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Type selection */}
      {phase === "select" && sortedTypes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Workout types found ({allWorkouts.length} workouts in range)
          </p>
          <div className="space-y-1">
            {sortedTypes.map(([type, info]) => {
              const inRangeCount = allWorkouts.filter((w) => w.activityType === type).length;
              return (
                <label
                  key={type}
                  className="flex items-center gap-2 py-1 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.has(type)}
                    onChange={() => toggleType(type)}
                    className="rounded border-border"
                  />
                  <span>{info.description}</span>
                  <span className="text-xs text-muted-foreground">({inRangeCount})</span>
                </label>
              );
            })}
          </div>

            <Button
              size="sm"
              onClick={handleImport}
              disabled={selectedTypes.size === 0}
              className="text-xs"
            >
              <Upload className="h-3.5 w-3.5 mr-1" />
              Import
            </Button>
        </div>
      )}

      {/* Importing progress */}
      {phase === "importing" && (
        <div className="space-y-2">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div className="bg-primary h-full transition-all duration-200" style={{ width: `${importPct}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">
            Importing — {importProgress.done} / {importProgress.total}
          </p>
        </div>
      )}

      {/* Done */}
      {phase === "done" && (
        <div className="space-y-3">
          <div className="p-3 border border-border rounded-lg bg-muted/30">
            <p className="text-sm font-medium">
              ✓ Imported {importedCount} workout{importedCount !== 1 ? "s" : ""}
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

/** Renders a trigger row in Settings + a dialog for the full import workflow. */
export function AppleHealthImport() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <>
      {/* Trigger row */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
        Import from Apple Health{" "}
          (<button
            onClick={() => setShowInstructions(!showInstructions)}
            className="text-xs underline underline-offset-2 hover:text-foreground transition-colors py-1"
          >
            {showInstructions ? "hide" : "see how"}
          </button>)
        </p>
        <button
          onClick={() => setDialogOpen(true)}
          className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
        >
          Import...
        </button>
      </div>

      {/* Collapsible instructions */}
      {showInstructions && (
        <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-3">
          To export from your iPhone: open the <strong>Health</strong> app → tap your profile picture → <strong>Export All Health Data</strong>. Save and unzip the file, then select <code className="text-[11px] bg-muted px-1 rounded">export.xml</code> in the import dialog.{" "}
          <a
            href="https://support.apple.com/guide/iphone/share-your-health-data-iph5ede58c3d/ios"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            Learn more from Apple
          </a>
        </p>
      )}

      {/* Import dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {dialogOpen && (
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base">Import from Apple Health</DialogTitle>
            </DialogHeader>
            <AppleHealthImportDialog onClose={() => setDialogOpen(false)} />
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
