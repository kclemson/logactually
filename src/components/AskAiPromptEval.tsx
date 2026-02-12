import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { Play, Loader2, Check, X, Copy, ChevronDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AskAiResult {
  prompt: string;
  mode: 'food' | 'exercise';
  answer: string;
  latencyMs: number;
  error?: string;
  approved: boolean;
}

export function AskAiPromptEval() {
  const [foodText, setFoodText] = useState(
    () => localStorage.getItem('askai-food-prompts') ?? ''
  );
  const [exerciseText, setExerciseText] = useState(
    () => localStorage.getItem('askai-exercise-prompts') ?? ''
  );
  const [results, setResults] = useState<AskAiResult[]>([]);
  const [running, setRunning] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsePrompts = (text: string): string[] =>
    text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const runAll = async () => {
    localStorage.setItem('askai-food-prompts', foodText);
    localStorage.setItem('askai-exercise-prompts', exerciseText);
    setRunning(true);
    setError(null);

    const foodPrompts = parsePrompts(foodText);
    const exercisePrompts = parsePrompts(exerciseText);

    if (foodPrompts.length === 0 && exercisePrompts.length === 0) {
      setError('Enter at least one prompt');
      setRunning(false);
      return;
    }

    const allResults: AskAiResult[] = [];

    const runOne = async (question: string, mode: 'food' | 'exercise') => {
      const start = Date.now();
      try {
        const { data, error: invokeErr } = await supabase.functions.invoke('ask-trends-ai', {
          body: { question, mode, includeProfile: true },
        });
        const latencyMs = Date.now() - start;
        if (invokeErr) throw invokeErr;
        if (data?.error) throw new Error(data.error);
        allResults.push({
          prompt: question,
          mode,
          answer: data.answer ?? 'No response',
          latencyMs,
          approved: false,
        });
      } catch (err) {
        allResults.push({
          prompt: question,
          mode,
          answer: '',
          latencyMs: Date.now() - start,
          error: err instanceof Error ? err.message : 'Unknown error',
          approved: false,
        });
      }
      // Update results progressively
      setResults([...allResults]);
    };

    for (const q of foodPrompts) await runOne(q, 'food');
    for (const q of exercisePrompts) await runOne(q, 'exercise');

    setRunning(false);
  };

  const toggleApproved = (idx: number) => {
    setResults(prev => prev.map((r, i) => i === idx ? { ...r, approved: !r.approved } : r));
  };

  const copyApproved = (mode: 'food' | 'exercise') => {
    const approved = results
      .filter(r => r.mode === mode && r.approved)
      .map(r => {
        const clean = r.prompt.replace(/[\u201C\u201D]/g, '"');
        return `  "${clean}",`;
      });
    if (approved.length === 0) return;
    navigator.clipboard.writeText(approved.join('\n'));
  };

  const foodResults = results.filter(r => r.mode === 'food');
  const exerciseResults = results.filter(r => r.mode === 'exercise');
  const foodApproved = foodResults.filter(r => r.approved).length;
  const exerciseApproved = exerciseResults.filter(r => r.approved).length;

  const ResultSection = ({ mode, items, approvedCount }: { mode: 'food' | 'exercise'; items: AskAiResult[]; approvedCount: number }) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {mode === 'food' ? 'Food' : 'Exercise'} ({items.length} prompts, {approvedCount} approved)
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1"
            onClick={() => copyApproved(mode)}
            disabled={approvedCount === 0}
          >
            <Copy className="h-3 w-3" />
            Copy Approved
          </Button>
        </div>
        {items.map((r) => {
          const globalIdx = results.indexOf(r);
          const isExpanded = expandedIdx === globalIdx;
          return (
            <div key={globalIdx} className={cn(
              "rounded border text-xs",
              r.error ? "border-destructive/30 bg-destructive/5" : "border-border",
              r.approved && "border-green-500/40 bg-green-500/5"
            )}>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <button
                  onClick={() => setExpandedIdx(isExpanded ? null : globalIdx)}
                  className="flex-1 text-left flex items-center gap-1.5 min-w-0"
                >
                  <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform", !isExpanded && "-rotate-90")} />
                  <span className="truncate font-medium">"{r.prompt}"</span>
                  <span className="text-muted-foreground shrink-0">({(r.latencyMs / 1000).toFixed(1)}s)</span>
                </button>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => toggleApproved(globalIdx)}
                    className={cn(
                      "p-1 rounded hover:bg-accent",
                      r.approved ? "text-green-600" : "text-muted-foreground"
                    )}
                    title="Approve"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => { if (r.approved) toggleApproved(globalIdx); }}
                    className={cn(
                      "p-1 rounded hover:bg-accent",
                      !r.approved && !r.error ? "text-muted-foreground" : r.error ? "text-destructive" : "text-muted-foreground/40"
                    )}
                    title="Reject"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div className="px-3 pb-2 pt-0.5 text-xs text-muted-foreground whitespace-pre-wrap border-t border-border/50">
                  {r.error ? (
                    <span className="text-destructive">{r.error}</span>
                  ) : (
                    r.answer
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <CollapsibleSection
      title="Ask AI Prompt Eval"
      icon={Sparkles}
      storageKey="ask-ai-eval"
      iconClassName="text-amber-500"
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Food Prompts (one per line)</Label>
            <Textarea
              value={foodText}
              onChange={e => setFoodText(e.target.value)}
              className="h-24 text-xs"
              placeholder="How has my diet changed over the past month?"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Exercise Prompts (one per line)</Label>
            <Textarea
              value={exerciseText}
              onChange={e => setExerciseText(e.target.value)}
              className="h-24 text-xs"
              placeholder="What are my strongest lifts?"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button size="sm" onClick={runAll} disabled={running}>
            {running ? (
              <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Running...</>
            ) : (
              <><Play className="mr-1.5 h-4 w-4" />Run All</>
            )}
          </Button>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            <ResultSection mode="food" items={foodResults} approvedCount={foodApproved} />
            <ResultSection mode="exercise" items={exerciseResults} approvedCount={exerciseApproved} />
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
