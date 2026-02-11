import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { useAskTrendsAI } from '@/hooks/useAskTrendsAI';
import { useUserSettings } from '@/hooks/useUserSettings';
import { formatProfileStatsSummary } from '@/lib/calorie-burn';

type Mode = 'food' | 'exercise';

interface AskTrendsAIDialogProps {
  mode: Mode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FOOD_PROMPTS = [
  "What's my average daily calorie intake?",
  "Am I getting enough protein?",
  "What are my most common foods?",
  "How consistent is my eating pattern?",
  "Do I eat more on weekends?",
  "What's my macro split look like?",
  "Am I eating enough fiber?",
  "How has my diet changed over time?",
  "What days do I eat the most?",
  "Any patterns in my carb intake?",
  "What could I improve about my diet?",
  "Do I have any nutritional gaps?",
  "How much variety is in my diet?",
  "What's my highest calorie day?",
  "Am I hitting a good protein-to-calorie ratio?",
];

const EXERCISE_PROMPTS = [
  "What's my most trained muscle group?",
  "Am I making strength progress?",
  "How consistent is my workout schedule?",
  "What exercises should I do more?",
  "How has my training volume changed?",
  "Am I training enough each week?",
  "What's my strongest lift?",
  "Do I have any muscle imbalances?",
  "How much cardio am I doing?",
  "What does my workout frequency look like?",
  "Am I overtraining any body part?",
  "What's my average workout intensity?",
  "How many calories am I burning?",
  "What exercises have I improved the most?",
  "Any gaps in my training program?",
];

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function AskTrendsAIDialog({ mode, open, onOpenChange }: AskTrendsAIDialogProps) {
  // Conditional rendering resets state on close
  if (!open) return null;

  return <AskTrendsAIDialogInner mode={mode} onOpenChange={onOpenChange} />;
}

function AskTrendsAIDialogInner({ mode, onOpenChange }: { mode: Mode; onOpenChange: (open: boolean) => void }) {
  const { settings } = useUserSettings();
  const { mutate, isPending, data, error, reset } = useAskTrendsAI();

  const [input, setInput] = useState('');
  const [includeProfile, setIncludeProfile] = useState(true);

  const profileSummary = useMemo(() => formatProfileStatsSummary(settings), [settings]);

  const chips = useMemo(() => {
    const pool = mode === 'food' ? FOOD_PROMPTS : EXERCISE_PROMPTS;
    return pickRandom(pool, 4);
  }, [mode]);

  const handleSubmit = (question: string) => {
    if (!question.trim() || isPending) return;
    reset();
    mutate({ question: question.trim(), mode, includeProfile: profileSummary ? includeProfile : false });
  };

  const handleAskAnother = () => {
    reset();
    setInput('');
  };

  const title = mode === 'food'
    ? 'Ask AI about your food trends'
    : 'Ask AI about your exercise trends';

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="left-2 right-2 translate-x-0 w-auto max-w-[calc(100vw-16px)] p-4 sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md">
        <DialogTitle className="text-sm font-medium flex items-center gap-1.5">
          <Sparkles className="h-4 w-4" />
          {title}
        </DialogTitle>

        <div className="space-y-3 mt-2">
          {/* Prompt chips (only show before a response) */}
          {!data?.answer && !isPending && (
            <div className="flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setInput(chip);
                    handleSubmit(chip);
                  }}
                  className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/50 text-foreground hover:bg-muted transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          {!data?.answer && (
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit(input);
                }}
                placeholder="Ask a question..."
                disabled={isPending}
                className="flex-1 h-9 text-sm rounded-md border border-input bg-background px-3 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                maxLength={500}
                autoFocus
              />
              <Button
                size="sm"
                onClick={() => handleSubmit(input)}
                disabled={!input.trim() || isPending}
                className="h-9"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ask'}
              </Button>
            </div>
          )}

          {/* Profile stats checkbox */}
          {!data?.answer && profileSummary && (
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeProfile}
                onChange={(e) => setIncludeProfile(e.target.checked)}
                className="mt-0.5 rounded border-border"
              />
              <span className="text-xs text-muted-foreground leading-tight">
                Include my personal stats for a more personalized answer ({profileSummary})
              </span>
            </label>
          )}

          {/* Loading */}
          {isPending && (
            <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Analyzing your data...</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-sm text-destructive p-3 rounded-md bg-destructive/10">
              {error.message || 'Something went wrong. Please try again.'}
            </div>
          )}

          {/* Response */}
          {data?.answer && (
            <div className="space-y-3">
              <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed p-3 rounded-md bg-muted/50 max-h-[50vh] overflow-y-auto">
                {data.answer}
              </div>
              <Button variant="outline" size="sm" onClick={handleAskAnother} className="w-full">
                Ask another question
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
