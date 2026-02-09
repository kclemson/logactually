import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";

const CHUNK_SIZE = 1024 * 1024; // 1MB
const MAX_WORKOUTS = 20;
const OVERLAP_SIZE = 50 * 1024; // 50KB overlap to catch spanning blocks

interface WorkoutSample {
  xml: string;
  activityType: string;
}

interface ScanSummary {
  workoutTypes: Record<string, number>;
  childElementNames: Set<string>;
  metadataKeys: Set<string>;
}

function extractAttribute(xml: string, attr: string): string {
  const regex = new RegExp(`${attr}=\\"([^\\"]*)\\"`, "i");
  const match = xml.match(regex);
  return match?.[1] ?? "unknown";
}

function extractChildInfo(xml: string): { childNames: string[]; metaKeys: string[] } {
  const childNames: string[] = [];
  const metaKeys: string[] = [];

  // Find all child element tag names
  const tagRegex = /<(\w+)\s/g;
  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(xml)) !== null) {
    if (m[1] !== "Workout") childNames.push(m[1]);
  }

  // Find MetadataEntry keys
  const metaRegex = /key="([^"]*)"/g;
  while ((m = metaRegex.exec(xml)) !== null) {
    metaKeys.push(m[1]);
  }

  return { childNames, metaKeys };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function AppleHealthExplorer() {
  const [workouts, setWorkouts] = useState<WorkoutSample[]>([]);
  const [summary, setSummary] = useState<ScanSummary | null>(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState({ read: 0, total: 0 });
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const abortRef = useRef(false);

  const scan = useCallback(async (file: File) => {
    setScanning(true);
    setDone(false);
    setWorkouts([]);
    setSummary(null);
    setProgress({ read: 0, total: file.size });
    abortRef.current = false;

    const decoder = new TextDecoder("utf-8");
    const found: WorkoutSample[] = [];
    const summ: ScanSummary = {
      workoutTypes: {},
      childElementNames: new Set(),
      metadataKeys: new Set(),
    };

    let buffer = "";
    let offset = 0;

    while (offset < file.size && found.length < MAX_WORKOUTS && !abortRef.current) {
      const end = Math.min(offset + CHUNK_SIZE, file.size);
      const blob = file.slice(offset, end);
      const arrayBuf = await blob.arrayBuffer();
      const text = decoder.decode(arrayBuf, { stream: end < file.size });

      buffer += text;

      // Extract complete <Workout ...>...</Workout> blocks
      let searchFrom = 0;
      while (found.length < MAX_WORKOUTS) {
        const startTag = buffer.indexOf("<Workout ", searchFrom);
        if (startTag === -1) break;

        const endTag = buffer.indexOf("</Workout>", startTag);
        if (endTag === -1) break; // incomplete block, wait for more data

        const endPos = endTag + "</Workout>".length;
        const workoutXml = buffer.substring(startTag, endPos);

        const activityType = extractAttribute(workoutXml, "workoutActivityType");
        found.push({ xml: workoutXml, activityType });

        // Update summary
        summ.workoutTypes[activityType] = (summ.workoutTypes[activityType] ?? 0) + 1;
        const { childNames, metaKeys } = extractChildInfo(workoutXml);
        childNames.forEach((n) => summ.childElementNames.add(n));
        metaKeys.forEach((k) => summ.metadataKeys.add(k));

        searchFrom = endPos;
      }

      // Also check for self-closing <Workout ... /> elements
      let selfSearchFrom = 0;
      while (found.length < MAX_WORKOUTS) {
        const idx = buffer.indexOf("<Workout ", selfSearchFrom);
        if (idx === -1) break;
        
        // Check if this is a self-closing tag (no children)
        const closeSlash = buffer.indexOf("/>", idx);
        const closeAngle = buffer.indexOf(">", idx);
        
        if (closeSlash !== -1 && closeAngle !== -1 && closeSlash < closeAngle) {
          // Self-closing, but we likely already grabbed the ones with </Workout>
          // Skip duplicates
          const endPos = closeSlash + 2;
          const workoutXml = buffer.substring(idx, endPos);
          
          // Only add if not already found (check by position)
          if (!found.some((w) => w.xml === workoutXml)) {
            const activityType = extractAttribute(workoutXml, "workoutActivityType");
            found.push({ xml: workoutXml, activityType });
            summ.workoutTypes[activityType] = (summ.workoutTypes[activityType] ?? 0) + 1;
          }
          selfSearchFrom = endPos;
        } else {
          break;
        }
      }

      // Keep overlap from end of buffer for spanning blocks
      if (buffer.length > OVERLAP_SIZE) {
        buffer = buffer.substring(buffer.length - OVERLAP_SIZE);
      }

      offset = end;
      setProgress({ read: end, total: file.size });

      // Yield to UI
      await new Promise((r) => setTimeout(r, 0));
    }

    setWorkouts(found);
    setSummary(summ);
    setScanning(false);
    setDone(true);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) scan(file);
  };

  const handleCancel = () => {
    abortRef.current = true;
  };

  const pct = progress.total > 0 ? (progress.read / progress.total) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept=".xml"
          onChange={handleFileChange}
          disabled={scanning}
          className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-muted file:text-muted-foreground"
        />
        {scanning && (
          <Button variant="ghost" size="sm" className="text-xs h-6" onClick={handleCancel}>
            Cancel
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {(scanning || done) && (
        <div className="space-y-1">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-200"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {scanning ? "Scanning" : "Done"} — {formatBytes(progress.read)} / {formatBytes(progress.total)}
            {workouts.length > 0 && ` — ${workouts.length} workouts found`}
          </p>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="space-y-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Workout Types</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(summary.workoutTypes).map(([type, count]) => (
                <span key={type} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                  {type.replace("HKWorkoutActivityType", "")} ({count})
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Child Elements</p>
            <div className="flex flex-wrap gap-1">
              {[...summary.childElementNames].sort().map((name) => (
                <span key={name} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                  {name}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Metadata Keys</p>
            <div className="flex flex-wrap gap-1">
              {[...summary.metadataKeys].sort().map((key) => (
                <span key={key} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                  {key}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Workout samples */}
      {workouts.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Sample Workouts</p>
          {workouts.map((w, i) => (
            <div key={i} className="border border-border/50 rounded">
              <button
                className="w-full text-left text-xs px-2 py-1 hover:bg-muted/50 flex justify-between items-center"
                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
              >
                <span>
                  #{i + 1} — {w.activityType.replace("HKWorkoutActivityType", "")}
                </span>
                <span className="text-muted-foreground">{expandedIdx === i ? "▼" : "▶"}</span>
              </button>
              {expandedIdx === i && (
                <pre className="text-[10px] p-2 overflow-x-auto max-h-[400px] overflow-y-auto bg-muted/30 border-t border-border/50 whitespace-pre-wrap break-all">
                  {w.xml.length > 50000 ? w.xml.substring(0, 50000) + "\n\n... [truncated]" : w.xml}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
