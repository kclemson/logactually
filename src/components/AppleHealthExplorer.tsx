import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";

const CHUNK_SIZE = 1024 * 1024; // 1MB
const SAMPLES_PER_TYPE = 3;
const MAX_TOTAL_SAMPLES = 50;
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
  const tagRegex = /<(\w+)\s/g;
  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(xml)) !== null) {
    if (m[1] !== "Workout") childNames.push(m[1]);
  }
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

function shortType(t: string): string {
  return t.replace("HKWorkoutActivityType", "");
}

export function AppleHealthExplorer() {
  const [samplesByType, setSamplesByType] = useState<Record<string, WorkoutSample[]>>({});
  const [summary, setSummary] = useState<ScanSummary | null>(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState({ read: 0, total: 0, found: 0 });
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const abortRef = useRef(false);

  const scan = useCallback(async (file: File) => {
    setScanning(true);
    setDone(false);
    setSamplesByType({});
    setSummary(null);
    setProgress({ read: 0, total: file.size, found: 0 });
    abortRef.current = false;

    const decoder = new TextDecoder("utf-8");
    const samples: Record<string, WorkoutSample[]> = {};
    const summ: ScanSummary = {
      workoutTypes: {},
      childElementNames: new Set(),
      metadataKeys: new Set(),
    };
    let totalSamples = 0;
    let totalFound = 0;

    let buffer = "";
    let offset = 0;

    while (offset < file.size && !abortRef.current) {
      const end = Math.min(offset + CHUNK_SIZE, file.size);
      const blob = file.slice(offset, end);
      const arrayBuf = await blob.arrayBuffer();
      const text = decoder.decode(arrayBuf, { stream: end < file.size });
      buffer += text;

      // Extract complete <Workout ...>...</Workout> blocks
      let searchFrom = 0;
      while (true) {
        const startTag = buffer.indexOf("<Workout ", searchFrom);
        if (startTag === -1) break;

        // Check self-closing first
        const closeSlash = buffer.indexOf("/>", startTag);
        const closeAngle = buffer.indexOf(">", startTag);
        const isSelfClosing = closeSlash !== -1 && closeAngle !== -1 && closeSlash + 1 === closeAngle;

        let workoutXml: string;
        let endPos: number;

        if (isSelfClosing) {
          endPos = closeSlash + 2;
          workoutXml = buffer.substring(startTag, endPos);
        } else {
          const endTag = buffer.indexOf("</Workout>", startTag);
          if (endTag === -1) break; // incomplete, wait for more data
          endPos = endTag + "</Workout>".length;
          workoutXml = buffer.substring(startTag, endPos);
        }

        const activityType = extractAttribute(workoutXml, "workoutActivityType");
        totalFound++;

        // Always count
        summ.workoutTypes[activityType] = (summ.workoutTypes[activityType] ?? 0) + 1;

        // Collect child/meta info
        const { childNames, metaKeys } = extractChildInfo(workoutXml);
        childNames.forEach((n) => summ.childElementNames.add(n));
        metaKeys.forEach((k) => summ.metadataKeys.add(k));

        // Store sample if under limit for this type
        if (!samples[activityType]) samples[activityType] = [];
        if (samples[activityType].length < SAMPLES_PER_TYPE && totalSamples < MAX_TOTAL_SAMPLES) {
          samples[activityType].push({ xml: workoutXml, activityType });
          totalSamples++;
        }

        searchFrom = endPos;
      }

      // Keep overlap from end of buffer for spanning blocks
      if (buffer.length > OVERLAP_SIZE) {
        buffer = buffer.substring(buffer.length - OVERLAP_SIZE);
      }

      offset = end;
      setProgress({ read: end, total: file.size, found: totalFound });

      // Yield to UI
      await new Promise((r) => setTimeout(r, 0));
    }

    setSamplesByType(samples);
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
  const sortedTypes = summary
    ? Object.entries(summary.workoutTypes).sort((a, b) => b[1] - a[1])
    : [];

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
            {progress.found > 0 && ` — ${progress.found} workouts found`}
          </p>
        </div>
      )}

      {summary && (
        <div className="space-y-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Workout Types ({sortedTypes.length} types, {Object.values(summary.workoutTypes).reduce((a, b) => a + b, 0)} total)
            </p>
            <div className="flex flex-wrap gap-1">
              {sortedTypes.map(([type, count]) => (
                <span key={type} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                  {shortType(type)} ({count})
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

      {/* Samples grouped by type */}
      {Object.keys(samplesByType).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Sample Workouts (up to {SAMPLES_PER_TYPE} per type)</p>
          {Object.entries(samplesByType)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([type, samples]) => (
              <div key={type} className="border border-border/50 rounded">
                <button
                  className="w-full text-left text-xs px-2 py-1 hover:bg-muted/50 flex justify-between items-center font-medium"
                  onClick={() => setExpandedKey(expandedKey === type ? null : type)}
                >
                  <span>{shortType(type)} ({samples.length} samples)</span>
                  <span className="text-muted-foreground">{expandedKey === type ? "▼" : "▶"}</span>
                </button>
                {expandedKey === type && (
                  <div className="border-t border-border/50">
                    {samples.map((w, i) => (
                      <pre
                        key={i}
                        className="text-[10px] p-2 overflow-x-auto max-h-[400px] overflow-y-auto bg-muted/30 whitespace-pre-wrap break-all border-b border-border/30 last:border-b-0"
                      >
                        {w.xml.length > 50000 ? w.xml.substring(0, 50000) + "\n\n... [truncated]" : w.xml}
                      </pre>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
