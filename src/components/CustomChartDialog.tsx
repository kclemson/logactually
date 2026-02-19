import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, BarChart3, RefreshCw, ShieldCheck } from "lucide-react";
import { useGenerateChart, type DailyTotals, type GenerateChartResult } from "@/hooks/useGenerateChart";
import { useSavedCharts } from "@/hooks/useSavedCharts";
import { DynamicChart, type ChartSpec } from "@/components/trends/DynamicChart";
import { verifyChartData, type VerificationResult } from "@/lib/chart-verification";

interface CustomChartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  period: number;
  initialChart?: { id: string; question: string; chartSpec: ChartSpec };
}

const ALL_CHIPS = [
  // Basics — obvious but useful
  "Daily fiber intake over time",
  "Sodium intake trend",
  "Average sugar per day",
  "My highest calorie days",
  // Meal timing & patterns
  "Average calories by hour of day",
  "Which day of the week do I eat the most?",
  "How many meals do I log per day on average?",
  "Which meals have the most calories?",
  // Insights — deeper analysis
  "Weekly calorie average trend",
  "How consistent is my logging?",
  "Protein per meal over time",
  "My most common foods",
  "Calorie comparison: weekdays vs weekends",
  // Workout–nutrition correlation
  "Average calories on workout days vs rest days",
  "Cardio vs strength training split",
  // Training insights
  "Exercise frequency by day of week",
  "Which exercises do I do most often?",
  "Average heart rate by exercise",
  "Rest days between workouts",
];

export function CustomChartDialog({ open, onOpenChange, initialChart, period }: CustomChartDialogProps) {
  if (!open) return null;
  return <CustomChartDialogInner onOpenChange={onOpenChange} period={period} initialChart={initialChart} />;
}

function CustomChartDialogInner({
  onOpenChange,
  period,
  initialChart,
}: {
  onOpenChange: (open: boolean) => void;
  period: number;
  initialChart?: { id: string; question: string; chartSpec: ChartSpec };
}) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"v1" | "v2">(() => (localStorage.getItem("chart-mode") as "v1" | "v2") || "v1");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>(
    initialChart ? [{ role: "user", content: initialChart.question }] : []
  );
  const [currentSpec, setCurrentSpec] = useState<ChartSpec | null>(initialChart?.chartSpec ?? null);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals | null>(null);
  const [chartDSL, setChartDSL] = useState<unknown>(null);
  const [chartOptions, setChartOptions] = useState<GenerateChartResult["chartOptions"] | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [lastQuestion, setLastQuestion] = useState(initialChart?.question ?? "");
  const [showDebug, setShowDebug] = useState(false);
  const [refining, setRefining] = useState(false);

  const editingIdRef = useRef<string | null>(initialChart?.id ?? null);

  const generateChart = useGenerateChart();
  const { saveMutation, updateMutation } = useSavedCharts();

  const seen = useRef<Set<string>>(new Set());

  const pickFresh = useCallback(() => {
    let available = ALL_CHIPS.filter((c) => !seen.current.has(c));
    if (available.length < 6) {
      seen.current.clear();
      available = [...ALL_CHIPS];
    }
    const picked = [...available].sort(() => Math.random() - 0.5).slice(0, 6);
    picked.forEach((c) => seen.current.add(c));
    return picked;
  }, []);

  const [visibleChips, setVisibleChips] = useState(() => {
    const picked = [...ALL_CHIPS].sort(() => Math.random() - 0.5).slice(0, 6);
    picked.forEach((c) => seen.current.add(c));
    return picked;
  });

  const refreshChips = () => setVisibleChips(pickFresh());

  // Existing refinement-aware submit (appends to conversation history)
  const handleSubmit = async (question: string) => {
    if (!question.trim() || generateChart.isPending) return;

    const userMsg = { role: "user" as const, content: question.trim() };
    const newMessages = [...messages, userMsg];

    if (currentSpec) {
      const assistantMsg = {
        role: "assistant" as const,
        content: JSON.stringify(currentSpec),
      };
      newMessages.splice(newMessages.length - 1, 0, assistantMsg);
    }

    setMessages(newMessages);
    setLastQuestion(question.trim());
    setInput("");

    try {
      const result = await generateChart.mutateAsync({
        messages: newMessages,
        period,
        mode,
      });
      if (result.chartOptions && result.chartOptions.length > 1) {
        setChartOptions(result.chartOptions);
        setCurrentSpec(null);
      } else {
        setCurrentSpec(result.chartSpec);
        setDailyTotals(result.dailyTotals);
        setChartDSL(result.chartDSL ?? null);
        setChartOptions(null);
        setVerification(mode === "v2" ? null : verifyChartData(result.chartSpec, result.dailyTotals));
      }
      setRefining(false);
    } catch (err) {
      console.error("[generate-chart] mutation error:", err);
    }
  };

  // Fresh request — clears all state and submits as a brand-new conversation
  const handleNewRequest = async (question: string) => {
    if (!question.trim() || generateChart.isPending) return;

    const trimmed = question.trim();
    const freshMessages = [{ role: "user" as const, content: trimmed }];

    // Atomically reset everything
    setMessages(freshMessages);
    setCurrentSpec(null);
    setDailyTotals(null);
    setChartDSL(null);
    setChartOptions(null);
    setVerification(null);
    setShowDebug(false);
    setRefining(false);
    setLastQuestion(trimmed);
    setInput("");
    editingIdRef.current = null;
    generateChart.reset();

    try {
      const result = await generateChart.mutateAsync({
        messages: freshMessages,
        period,
        mode,
      });
      if (result.chartOptions && result.chartOptions.length > 1) {
        setChartOptions(result.chartOptions);
        setCurrentSpec(null);
      } else {
        setCurrentSpec(result.chartSpec);
        setDailyTotals(result.dailyTotals);
        setChartDSL(result.chartDSL ?? null);
        setChartOptions(null);
        setVerification(mode === "v2" ? null : verifyChartData(result.chartSpec, result.dailyTotals));
      }
    } catch (err) {
      console.error("[generate-chart] mutation error:", err);
    }
  };

  const handleSave = () => {
    if (!currentSpec || !lastQuestion) return;

    if (editingIdRef.current) {
      updateMutation.mutate(
        { id: editingIdRef.current, question: lastQuestion, chartSpec: currentSpec },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      saveMutation.mutate(
        { question: lastQuestion, chartSpec: currentSpec },
        { onSuccess: () => onOpenChange(false) }
      );
    }
  };

  // Decide which submit path to use from textarea
  const handleTextareaSubmit = (question: string) => {
    if (refining) {
      handleSubmit(question); // refinement — keep conversation
    } else if (currentSpec) {
      handleNewRequest(question); // new request while chart showing
    } else {
      handleSubmit(question); // first request
    }
  };

  const isSaving = saveMutation.isPending || updateMutation.isPending;
  const isEditing = !!initialChart;
  const hasExistingContent = !!currentSpec || !!lastQuestion || !!chartOptions;
  const showOverlay = generateChart.isPending && hasExistingContent;
  const showChips = !generateChart.isPending || hasExistingContent;
  const showTextarea = !generateChart.isPending || hasExistingContent;
  const showResult = !!currentSpec;
  const showDisambiguation = !currentSpec && !!chartOptions && chartOptions.length > 1;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent
        className="left-2 right-2 top-[5%] translate-y-0 translate-x-0 w-auto max-w-[calc(100vw-16px)] max-h-[85vh] max-h-[85dvh] overflow-y-auto p-3 sm:left-[50%] sm:right-auto sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:w-full sm:max-w-md border-border/50 focus-visible:ring-0 focus-visible:ring-offset-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="text-sm font-medium flex items-center gap-1.5">
          <BarChart3 className="h-4 w-4" />
          {isEditing ? "Edit Chart" : "Create Chart"}
          {showChips && (
            <button
              onClick={refreshChips}
              className="absolute right-12 top-3.5 p-1.5 rounded-full border border-border bg-muted/50 hover:bg-muted active:scale-75 transition-all duration-150"
              aria-label="Refresh suggestions"
            >
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </DialogTitle>

        {/* Mode toggle */}
        <div className="flex gap-1 mt-1">
          <button
            onClick={() => { setMode("v1"); localStorage.setItem("chart-mode", "v1"); }}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
              mode === "v1"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            v1 · AI data
          </button>
          <button
            onClick={() => { setMode("v2"); localStorage.setItem("chart-mode", "v2"); }}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
              mode === "v2"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            v2 · AI schema
          </button>
        </div>

        <div className="space-y-3 mt-2 relative">
          {/* Loading overlay — covers existing content instead of collapsing */}
          {showOverlay && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-md">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </div>
            </div>
          )}

          {/* Chips — visible whenever not loading (or overlay covers them) */}
          {showChips && (
            <div className="flex flex-wrap gap-1.5 items-start">
              {visibleChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleNewRequest(chip)}
                  disabled={generateChart.isPending}
                  className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/50 text-foreground hover:bg-muted transition-colors text-left"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Textarea — visible when no chart, or when refining */}
          {showTextarea && (
            <div className="space-y-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleTextareaSubmit(input);
                  }
                }}
                placeholder={
                  refining
                    ? "Refine this chart... (e.g. 'make it a line chart')"
                    : currentSpec
                    ? "Describe another chart..."
                    : "Describe the chart you'd like to see..."
                }
                className="min-h-[60px] max-h-[120px] resize-none text-sm"
                maxLength={500}
                disabled={generateChart.isPending}
              />
              <div className="flex justify-end gap-2">
                {refining && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRefining(false);
                      setInput("");
                    }}
                    className="h-9"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => handleTextareaSubmit(input)}
                  disabled={!input.trim() || generateChart.isPending}
                  className="h-9"
                >
                  {refining ? "Refine" : "Create"}
                </Button>
              </div>
            </div>
          )}

          {/* Loading — only shown for first-ever request (no existing content) */}
          {generateChart.isPending && !hasExistingContent && (
            <div className="space-y-3">
              {lastQuestion && (
                <p className="text-xs text-muted-foreground italic">"{lastQuestion}"</p>
              )}
              <div className="flex justify-end">
                <Button size="sm" disabled className="h-9">
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Generating...
                </Button>
              </div>
            </div>
          )}

          {/* Error */}
          {generateChart.error && (
            <div className="text-sm text-destructive p-3 rounded-md bg-destructive/10">
              {generateChart.error.message || "Something went wrong. Please try again."}
            </div>
          )}

          {/* Disambiguation picker */}
          {showDisambiguation && (
            <div className="space-y-3">
              {lastQuestion && (
                <p className="text-xs text-muted-foreground italic">"{lastQuestion}"</p>
              )}
              <p className="text-xs font-medium text-foreground">Which did you mean?</p>
              <div className="flex gap-2">
                {chartOptions!.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentSpec(opt.chartSpec);
                      setDailyTotals(opt.dailyTotals);
                      setChartDSL(opt.chartDSL);
                      setChartOptions(null);
                    }}
                    className="flex-1 flex flex-col items-stretch gap-1.5 rounded-md border border-border hover:border-primary/60 bg-muted/30 hover:bg-muted/60 transition-colors overflow-hidden p-0 cursor-pointer"
                  >
                    <div className="w-full pointer-events-none">
                      <DynamicChart spec={opt.chartSpec} />
                    </div>
                    {opt.chartDSL.aiNote && (
                      <p className="text-[10px] text-muted-foreground px-2 pb-2 text-center leading-tight">
                        {opt.chartDSL.aiNote}
                      </p>
                    )}
                  </button>
                ))}
              </div>
              {/* DSL columns for debugging */}
              <div className="flex gap-2">
                {chartOptions!.map((opt, i) => (
                  <div key={i} className="flex-1 rounded border border-border/40 bg-muted/20 p-1.5 overflow-auto max-h-48">
                    <pre className="text-[9px] leading-tight text-muted-foreground whitespace-pre-wrap break-all font-mono">
                      {JSON.stringify(opt.chartDSL, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setChartOptions(null);
                  setLastQuestion("");
                }}
                className="w-full text-xs"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Result section */}
          {showResult && (
            <div className="space-y-3">
              {lastQuestion && (
                <p className="text-xs text-muted-foreground italic">"{lastQuestion}"</p>
              )}
              <div className="flex justify-center">
                <div className="w-[50%] min-w-[220px] border border-border rounded-md overflow-hidden">
                  <DynamicChart spec={currentSpec} />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || generateChart.isPending}
                  className="flex-1"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : null}
                  {editingIdRef.current ? "Save Changes" : "Save to Trends"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRefining(true)}
                  disabled={generateChart.isPending}
                >
                  Refine
                </Button>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDebug((v) => !v)}
                  className="text-xs text-muted-foreground h-7 px-2"
                >
                  {mode === "v2"
                    ? (showDebug ? "Hide DSL" : "Show DSL")
                    : (showDebug ? "Hide debug JSON" : "Show debug JSON")}
                </Button>
                {mode === "v1" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (currentSpec && dailyTotals) {
                        setVerification(verifyChartData(currentSpec, dailyTotals));
                      } else {
                        setVerification({ status: "unavailable", reason: "No daily totals available (try regenerating the chart)" });
                      }
                    }}
                    className="text-xs text-muted-foreground h-7 px-2"
                  >
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Verify accuracy
                  </Button>
                )}
              </div>

              {verification && (
                <div className={`text-xs p-2 rounded-md border ${
                  verification.status === "unavailable"
                    ? "bg-muted/50 text-muted-foreground"
                    : verification.accuracy! > 95
                    ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400"
                    : verification.accuracy! > 80
                    ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400"
                    : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400"
                }`}>
                  {verification.status === "unavailable" ? (
                    <p>{verification.reason}</p>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-medium">
                        {verification.matched}/{verification.total} AI values matched your logs{" "}
                        {verification.allExact ? "exactly" : `(${verification.toleranceLabel || "within 1% or 5 units"})`}
                      </p>
                      {verification.method && (
                        <p className="text-[10px] opacity-70">
                          {verification.method === "deterministic"
                            ? "Verified mathematically"
                            : "Cross-checked with your data"}
                        </p>
                      )}
                      {verification.allComparisons && verification.allComparisons.length > 0 && (
                        <div className="space-y-0.5 mt-1">
                          <p className="text-[10px] font-medium opacity-70">Details:</p>
                          {verification.allComparisons.map((c) => (
                            <p
                              key={c.label}
                              className={`text-[10px] font-mono ${
                                c.match
                                  ? "text-green-700 dark:text-green-400"
                                  : "text-red-700 dark:text-red-400"
                              }`}
                            >
                              {c.label}: AI={c.ai}, actual={c.actual}
                              {!c.match && ` (Δ${c.delta > 0 ? "+" : ""}${c.delta})`}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {showDebug && (
                <Textarea
                  readOnly
                  value={JSON.stringify(mode === "v2" ? chartDSL : currentSpec, null, 2)}
                  className="text-[10px] font-mono bg-muted/50 rounded p-2 min-h-[300px] resize-y"
                />
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
