import { useState, useMemo, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, RefreshCw, Pin } from "lucide-react";
import { useAskTrendsAI } from "@/hooks/useAskTrendsAI";
import { useUserSettings } from "@/hooks/useUserSettings";
import { formatProfileStatsSummary } from "@/lib/calorie-burn";
import { usePinnedChats } from "@/hooks/usePinnedChats";
import { PinnedChatsView } from "@/components/PinnedChatsView";

type Mode = "food" | "exercise";

interface AskTrendsAIDialogProps {
  mode: Mode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialView?: "ask" | "pinned";
}

const SHARED_PROMPTS = [
  "What assumptions might I be making, based on what's in my logs?",
  "Do you have suggestions for simple swaps or improvements I could make?",
  "If I stopped improving for 6 months, what would likely be the reason based on this data",
  "What behavioral patterns might I not be noticing?",
  "If I continue like this, what will likely improve — and what might suffer?",
  "What's the smallest change that could meaningfully alter my trajectory?",
  "What version of me is my current eating & exercise approach building toward?",
  "What am I doing well that I may not be giving myself credit for?",
  "What questions am I not asking that this data suggests I should?",
  "What patterns emerge if you separate weekdays from weekends?",
  "If I were coaching myself based on this data, what mindset would I adopt?",
  "If a coach reviewed this, what might they focus on first?",
  "If I continue like this, what will likely improve — and what might suffer?",
  "What would I need to change to improve faster?",
  "What's the smallest change that could meaningfully alter my trajectory?",
  "Are there any interesting patterns between my eating & exercise habits?",
  "What invisible cost might I be paying for my current approach?",
  "What tends to precede my most or least consistent weeks?",
];

const FOOD_PROMPTS = [
  "How have my eating patterns changed over time?",
  "Do you see any nutritional gaps in my eating patterns?",
  "What patterns do you notice in how I eat on higher-calorie vs lower-calorie days?",
  "Can you give me ideas for some new snack foods that fit my existing eating patterns?",
  "Based on my logs, when am I most likely to overeat?",
  "If I continue eating like this, what trajectory would you predict over the next 3 months?",
  "Do I seem to operate in cycles? What might triggers shifts between them?",
  "Are there repeating weekly or monthly rhythms in my behavior?",
  "What is quietly improving even if nothing's changing on the scale?",
  "What do my habits suggest about my stress levels?",
  "What subtle behaviors tend to cascade into higher-calorie days?",
  "What small friction points in my eating patterns might be having outsized effects?",
];

const EXERCISE_PROMPTS = [
  "What exercises should I do more often?",
  "How would you restructure my week for better recovery without reducing total activity?",
  "How could I make my program more balanced?",
  "What would a 10% improvement version of this routine look like?",
  "Are there any patterns in my training I should consider changing?",
  "Can you give me suggestions of other exercises I might like that are similar to the ones I do regularly?",
  "Am I neglecting any movement patterns?",
  "If my goal is muscle gain, what in my current routine would you modify first?",
  "If my goal is overall health, what do you think I should change?",
  "Do you see any hidden tradeoffs in how I'm currently exercising?",
  "How could I improve my exercise variety?",
  "If I wanted to maintain my results with less effort, what would you keep and what would you cut?",
  "What tradeoffs am I making between performance, recovery, and body composition?",
  "Is there anything you see in how I'm exercising that increases my injury risk?",
  "Where am I pushing hard without seeing proportional return?",
];

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function AskTrendsAIDialog({ mode, open, onOpenChange, initialView = "ask" }: AskTrendsAIDialogProps) {
  // Conditional rendering resets state on close
  if (!open) return null;

  return <AskTrendsAIDialogInner mode={mode} onOpenChange={onOpenChange} initialView={initialView} />;
}

function AskTrendsAIDialogInner({ mode, onOpenChange, initialView }: { mode: Mode; onOpenChange: (open: boolean) => void; initialView: "ask" | "pinned" }) {
  const { settings } = useUserSettings();
  const { mutate, isPending, data, error, reset } = useAskTrendsAI();
  const { pinnedChats, pinCount, pinMutation, unpinMutation } = usePinnedChats();

  const [input, setInput] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [includeProfile, setIncludeProfile] = useState(true);
  const [view, setView] = useState<"ask" | "pinned">(initialView);

  const profileSummary = useMemo(() => formatProfileStatsSummary(settings), [settings]);

  const pool = useMemo(() => [...SHARED_PROMPTS, ...(mode === "food" ? FOOD_PROMPTS : EXERCISE_PROMPTS)], [mode]);
  const seen = useRef<Set<string>>(new Set());

  const pickFresh = useCallback(() => {
    let available = pool.filter((p) => !seen.current.has(p));
    if (available.length < 4) {
      seen.current.clear();
      available = pool;
    }
    const picked = pickRandom(available, 4);
    picked.forEach((p) => seen.current.add(p));
    return picked;
  }, [pool]);

  const [chips, setChips] = useState(() => {
    const picked = pickRandom(pool, 4);
    picked.forEach((p) => seen.current.add(p));
    return picked;
  });
  const refreshChips = () => setChips(pickFresh());

  const handleSubmit = (question: string) => {
    if (!question.trim() || isPending) return;
    reset();
    setSubmittedQuestion(question.trim());
    mutate({ question: question.trim(), mode, includeProfile: profileSummary ? includeProfile : false });
  };

  const handleAskAnother = () => {
    reset();
    setInput("");
    setSubmittedQuestion("");
  };

  const isAlreadyPinned = data?.answer
    ? pinnedChats.some((c) => c.question === submittedQuestion && c.answer === data.answer)
    : false;

  const handlePin = () => {
    if (!data?.answer || isAlreadyPinned) return;
    pinMutation.mutate({ question: submittedQuestion, answer: data.answer, mode });
  };

  const title = mode === "food" ? "Ask AI about your food trends" : "Ask AI about your exercise trends";

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent
        className="left-2 right-2 top-[5%] translate-y-0 translate-x-0 w-auto max-w-[calc(100vw-16px)] max-h-[85vh] max-h-[85dvh] overflow-y-auto p-3 sm:left-[50%] sm:right-auto sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:w-full sm:max-w-md border-border/50 focus-visible:ring-0 focus-visible:ring-offset-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {view === "ask" ? (
          <>
            <DialogTitle className="text-sm font-medium flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              {title}
              {!data?.answer && !isPending && (
                <div className="flex items-center gap-2 absolute right-12 top-3.5">
                  <button
                    onClick={refreshChips}
                    className="p-1.5 rounded-full border border-border bg-muted/50 hover:bg-muted active:scale-75 transition-all duration-150"
                    aria-label="Refresh suggestions"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  {pinCount > 0 && (
                    <button
                      onClick={() => setView("pinned")}
                      className="relative p-1.5 rounded-full border border-border bg-muted/50 hover:bg-muted active:scale-75 transition-all duration-150"
                      aria-label="View pinned chats"
                    >
                      <Pin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-muted border border-border text-muted-foreground text-[10px] font-medium px-1">
                        {pinCount}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </DialogTitle>

            <div className="space-y-3 mt-2">
              {/* Prompt chips (only show before a response) */}
              {!data?.answer && !isPending && (
                <div className="flex flex-wrap gap-1.5 items-start min-h-[10.5rem]">
                  {chips.map((chip) => (
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

              {/* Input row */}
              {!data?.answer && !isPending && (
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
                    placeholder="Ask a question..."
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
                      Ask
                    </Button>
                  </div>
                </div>
              )}

              {/* Profile stats checkbox */}
              {!data?.answer && !isPending && profileSummary && (
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeProfile}
                    onChange={(e) => setIncludeProfile(e.target.checked)}
                    className="mt-0.5 rounded border-border"
                  />
                  <span className="text-xs text-muted-foreground leading-tight">
                    Include my personal stats for a more personalized answer
                    <br />({profileSummary})
                  </span>
                </label>
              )}

              {/* Loading */}
              {isPending && (
                <div className="space-y-3">
                  {submittedQuestion && <p className="text-xs text-muted-foreground italic">"{submittedQuestion}"</p>}
                  <div className="flex justify-end">
                    <Button size="sm" disabled className="h-9">
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Analyzing...
                    </Button>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="text-sm text-destructive p-3 rounded-md bg-destructive/10">
                  {error.message || "Something went wrong. Please try again."}
                </div>
              )}

              {/* Response */}
              {data?.answer && (
                <div className="space-y-3">
                  {submittedQuestion && <p className="text-xs text-muted-foreground italic">"{submittedQuestion}"</p>}
                  <div
                    className="text-xs text-foreground whitespace-pre-wrap leading-snug p-2 rounded-md bg-muted/50 max-h-[50vh] overflow-y-auto [&_strong]:font-semibold"
                    dangerouslySetInnerHTML={{
                      __html: (() => {
                        const escaped = data.answer
                          .replace(/&/g, "&amp;")
                          .replace(/</g, "&lt;")
                          .replace(/>/g, "&gt;")
                          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
                        return escaped.replace(/((?:^|\n)(?:[*\-] .+(?:\n|$))+)/g, (block) => {
                          const items = block
                            .trim()
                            .split("\n")
                            .map((line) => line.replace(/^[*\-] /, "").trim())
                            .filter(Boolean)
                            .map((item) => `<li>${item}</li>`)
                            .join("");
                          return `\n<ul class="list-disc ml-4 my-1">${items}</ul>\n`;
                        });
                      })(),
                    }}
                  />
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    Not medical advice — consult a healthcare professional or registered dietitian for personal health guidance.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePin}
                      disabled={isAlreadyPinned}
                      className="gap-1 min-w-[5.5rem]"
                    >
                      <Pin className="h-3.5 w-3.5" />
                      {isAlreadyPinned ? "Pinned" : "Pin"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleAskAnother} className="flex-1">
                      Ask another question
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <DialogTitle className="sr-only">Pinned chats</DialogTitle>
            <PinnedChatsView
              pinnedChats={pinnedChats}
              onUnpin={(id) => unpinMutation.mutate(id)}
              onBack={() => setView("ask")}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
