import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, BarChart3, RefreshCw, ShieldCheck } from "lucide-react";
import { useGenerateChart, type DailyTotals } from "@/hooks/useGenerateChart";
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
  // Food timing & patterns
  "Average calories by hour of day",
  "Which day of the week do I eat the most?",
  "How many meals do I log per day on average?",
  // Nutrient trends
  "Daily fiber intake over time",
  "Sodium intake trend",
  "Average sugar per day",
  "Fat as percentage of total calories over time",
  "Protein to calorie ratio over time",
  // High/low analysis
  "My highest calorie days",
  "Days where I exceeded 2000 calories",
  // Exercise
  "Exercise frequency by day of week",
  "Total exercise duration per week",
  "Which exercises do I do most often?",
  "How many days per week did I exercise?",
  // Cross-domain
  "Average calories on workout days vs rest days",
  "Average protein on workout days vs rest days",
  "Do I eat more on days I exercise?",
  // Weekday/weekend
  "Average carbs on weekdays vs weekends",
  "Calorie comparison: weekdays vs weekends",
  // Volume/strength
  "Training volume trend over time",
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
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>(
    initialChart ? [{ role: "user", content: initialChart.question }] : []
  );
  const [currentSpec, setCurrentSpec] = useState<ChartSpec | null>(initialChart?.chartSpec ?? null);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [lastQuestion, setLastQuestion] = useState(initialChart?.question ?? "");
  const [showDebug, setShowDebug] = useState(false);

  // Track whether we're editing an existing chart or creating new
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
      });
      setCurrentSpec(result.chartSpec);
      setDailyTotals(result.dailyTotals);
      } catch (err) {
      console.error("[generate-chart] mutation error:", err);
    }
  };

  const handleStartOver = () => {
    setMessages([]);
    setCurrentSpec(null);
    setDailyTotals(null);
    setVerification(null);
    setLastQuestion("");
    setInput("");
    editingIdRef.current = null;
    generateChart.reset();
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

  const isSaving = saveMutation.isPending || updateMutation.isPending;
  const isEditing = !!initialChart;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent
        className="left-2 right-2 top-[5%] translate-y-0 translate-x-0 w-auto max-w-[calc(100vw-16px)] max-h-[85vh] max-h-[85dvh] overflow-y-auto p-3 sm:left-[50%] sm:right-auto sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:w-full sm:max-w-md border-border/50 focus-visible:ring-0 focus-visible:ring-offset-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="text-sm font-medium flex items-center gap-1.5">
          <BarChart3 className="h-4 w-4" />
          {isEditing ? "Edit Chart" : "Create Chart"}
          {!currentSpec && !generateChart.isPending && messages.length === 0 && (
            <button
              onClick={refreshChips}
              className="absolute right-12 top-3.5 p-1.5 rounded-full border border-border bg-muted/50 hover:bg-muted active:scale-75 transition-all duration-150"
              aria-label="Refresh suggestions"
            >
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </DialogTitle>

        <div className="space-y-3 mt-2">
          {!currentSpec && !generateChart.isPending && messages.length === 0 && (
            <div className="flex flex-wrap gap-1.5 items-start">
              {visibleChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setInput(chip);
                    handleSubmit(chip);
                  }}
                  className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/50 text-foreground hover:bg-muted transition-colors text-left"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {!generateChart.isPending && (
            <div className="space-y-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(input);
                  }
                }}
                placeholder={
                  currentSpec
                    ? "Refine this chart... (e.g. 'make it a line chart')"
                    : "Describe the chart you'd like to see..."
                }
                className="min-h-[60px] max-h-[120px] resize-none text-sm"
                maxLength={500}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => handleSubmit(input)}
                  disabled={!input.trim()}
                  className="h-9"
                >
                  {currentSpec ? "Refine" : "Create"}
                </Button>
              </div>
            </div>
          )}

          {generateChart.isPending && (
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

          {generateChart.error && (
            <div className="text-sm text-destructive p-3 rounded-md bg-destructive/10">
              {generateChart.error.message || "Something went wrong. Please try again."}
            </div>
          )}

          {currentSpec && !generateChart.isPending && (
            <div className="space-y-3">
              {lastQuestion && (
                <p className="text-xs text-muted-foreground italic">"{lastQuestion}"</p>
              )}
              <div className="flex justify-center">
                <div className="w-[60%] min-w-[220px] border border-border rounded-md overflow-hidden">
                  <DynamicChart spec={currentSpec} />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : null}
                  {editingIdRef.current ? "Save Changes" : "Save to Trends"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleStartOver}>
                  Start over
                </Button>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDebug((v) => !v)}
                  className="text-xs text-muted-foreground h-7 px-2"
                >
                  {showDebug ? "Hide debug JSON" : "Show debug JSON"}
                </Button>
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
                        Accuracy: {verification.matched}/{verification.total} match ({verification.accuracy}%)
                      </p>
                      {verification.mismatches && verification.mismatches.length > 0 && (
                        <div className="space-y-0.5 mt-1">
                          <p className="text-[10px] font-medium opacity-70">Mismatches:</p>
                          {verification.mismatches.map((m) => (
                            <p key={m.date} className="text-[10px] font-mono">
                              {m.date}: AI={m.ai}, actual={m.actual} (Δ{m.delta > 0 ? "+" : ""}{m.delta})
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
                value={JSON.stringify(currentSpec, null, 2)}
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
