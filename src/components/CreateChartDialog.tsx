import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, BarChart3 } from "lucide-react";
import { useGenerateChart } from "@/hooks/useGenerateChart";
import { useSavedCharts } from "@/hooks/useSavedCharts";
import { DynamicChart, type ChartSpec } from "@/components/trends/DynamicChart";

interface CreateChartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  period: number;
}

const EXAMPLE_CHIPS = [
  "Calories consumed by hour of day, averaged over last 30 days",
  "Which days of the week do I eat the most?",
  "Protein on workout days vs rest days",
  "How often do I exercise each day of the week?",
  "Average fiber intake per day over time",
  "My sodium intake trend over the past month",
];

export function CreateChartDialog({ open, onOpenChange, period }: CreateChartDialogProps) {
  if (!open) return null;
  return <CreateChartDialogInner onOpenChange={onOpenChange} period={period} />;
}

function CreateChartDialogInner({
  onOpenChange,
  period,
}: {
  onOpenChange: (open: boolean) => void;
  period: number;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [currentSpec, setCurrentSpec] = useState<ChartSpec | null>(null);
  const [lastQuestion, setLastQuestion] = useState("");
  const [showDebug, setShowDebug] = useState(false);

  const generateChart = useGenerateChart();
  const { saveMutation } = useSavedCharts();

  const handleSubmit = async (question: string) => {
    if (!question.trim() || generateChart.isPending) return;

    const userMsg = { role: "user" as const, content: question.trim() };
    const newMessages = [...messages, userMsg];

    // If refining, include prior spec as assistant message
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
      const spec = await generateChart.mutateAsync({
        messages: newMessages,
        period,
      });
      setCurrentSpec(spec);
    } catch (err) {
      console.error("[generate-chart] mutation error:", err);
    }
  };

  const handleStartOver = () => {
    setMessages([]);
    setCurrentSpec(null);
    setLastQuestion("");
    setInput("");
    generateChart.reset();
  };

  const handleSave = () => {
    if (!currentSpec || !lastQuestion) return;
    saveMutation.mutate(
      { question: lastQuestion, chartSpec: currentSpec },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent
        className="left-2 right-2 top-[5%] translate-y-0 translate-x-0 w-auto max-w-[calc(100vw-16px)] max-h-[85vh] max-h-[85dvh] overflow-y-auto p-3 sm:left-[50%] sm:right-auto sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:w-full sm:max-w-md border-border/50 focus-visible:ring-0 focus-visible:ring-offset-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="text-sm font-medium flex items-center gap-1.5">
          <BarChart3 className="h-4 w-4" />
          Create Chart
        </DialogTitle>

        <div className="space-y-3 mt-2">
          {/* Example chips (only before first chart) */}
          {!currentSpec && !generateChart.isPending && messages.length === 0 && (
            <div className="flex flex-wrap gap-1.5 items-start">
              {EXAMPLE_CHIPS.map((chip) => (
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

          {/* Input area */}
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

          {/* Loading */}
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

          {/* Error */}
          {generateChart.error && (
            <div className="text-sm text-destructive p-3 rounded-md bg-destructive/10">
              {generateChart.error.message || "Something went wrong. Please try again."}
            </div>
          )}

          {/* Chart preview */}
          {currentSpec && !generateChart.isPending && (
            <div className="space-y-3">
              {lastQuestion && (
                <p className="text-xs text-muted-foreground italic">"{lastQuestion}"</p>
              )}
              <div className="border border-border rounded-md overflow-hidden">
                <DynamicChart spec={currentSpec} />
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="flex-1"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : null}
                  Save to Trends
                </Button>
                <Button variant="outline" size="sm" onClick={handleStartOver}>
                  Start over
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDebug((v) => !v)}
                className="text-xs text-muted-foreground h-7 px-2"
              >
                {showDebug ? "Hide debug JSON" : "Show debug JSON"}
              </Button>
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
