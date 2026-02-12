import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  "How consistent is my eating pattern?",
  "How has my diet changed over time?",
  "Any patterns in my carb intake?",
  "What could I improve about my diet?",
  "Do I have any nutritional gaps?",
  "How much variety is in my diet?",
  "What nutrients am I consistently lacking?",
  "Are there any surprising patterns in my eating?",
  "How balanced are my meals throughout the day?",
  "What healthy swaps could I make?",
  "What's the weakest area of my diet?",
  "Am I relying too heavily on any one food?",
];

const EXERCISE_PROMPTS = [
  "What exercises should I do more?",
  "Do I have any muscle imbalances?",
  "Am I overtraining any body part?",
  "Any gaps in my training program?",
  "How could I make my program more balanced?",
  "What weak points should I prioritize?",
  "Are there any patterns in my training I should change?",
  "What would a trainer suggest I adjust?",
  "Am I neglecting any movement patterns?",
  "How could I improve my exercise variety?",
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
      <DialogContent className="left-2 right-2 translate-x-0 w-auto max-w-[calc(100vw-16px)] p-4 sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
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
            <div className="space-y-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(input);
                  }
                }}
                placeholder="Ask a question..."
                disabled={isPending}
                className="min-h-[60px] max-h-[120px] resize-none text-sm"
                maxLength={500}
                autoFocus
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => handleSubmit(input)}
                  disabled={!input.trim() || isPending}
                  className="h-9"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ask'}
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
              <div
                className="text-xs text-foreground whitespace-pre-wrap leading-snug p-3 rounded-md bg-muted/50 max-h-[50vh] overflow-y-auto [&_strong]:font-semibold"
                dangerouslySetInnerHTML={{
                  __html: (() => {
                    const escaped = data.answer
                      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                    // Convert lines starting with * or - into <ul><li> blocks
                    return escaped.replace(/((?:^|\n)(?:[*\-] .+(?:\n|$))+)/g, (block) => {
                      const items = block.trim().split('\n')
                        .map(line => line.replace(/^[*\-] /, '').trim())
                        .filter(Boolean)
                        .map(item => `<li>${item}</li>`)
                        .join('');
                      return `\n<ul class="list-disc ml-4 my-1">${items}</ul>\n`;
                    });
                  })()
                }}
              />
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
