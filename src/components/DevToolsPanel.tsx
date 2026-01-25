import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, Play, Loader2 } from 'lucide-react';

interface TestResult {
  id?: string;
  input: string;
  additionalContext?: string;
  output: { food_items?: Array<{ description: string; calories: number }> } | null;
  latencyMs: number;
  error?: string;
  isHallucination?: boolean;
}

interface RunResponse {
  run_id: string;
  prompt_version: string;
  total: number;
  successful: number;
  failed: number;
  results: TestResult[];
}

export function DevToolsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [promptVersion, setPromptVersion] = useState<'default' | 'experimental'>('default');
  const [testCasesText, setTestCasesText] = useState('2 eggs scrambled\nchicken salad with ranch\nlarge coffee with oat milk');
  const [iterations, setIterations] = useState(1);
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    setError(null);
    setResults([]);

    const testCases = testCasesText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(input => ({ input }));

    if (testCases.length === 0) {
      setError('Enter at least one test case');
      setIsRunning(false);
      return;
    }

    try {
      const { data, error: invokeError } = await supabase.functions.invoke<RunResponse>(
        'run-prompt-tests',
        {
          body: { testCases, promptVersion, iterations },
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (data) {
        setRunId(data.run_id);
        setResults(data.results);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run tests');
    } finally {
      setIsRunning(false);
    }
  };

  const toggleHallucination = async (index: number) => {
    if (!runId) return;

    const result = results[index];
    const newValue = !result.isHallucination;

    // Update local state immediately
    setResults(prev => prev.map((r, i) => 
      i === index ? { ...r, isHallucination: newValue } : r
    ));

    // Update database
    const { error: updateError } = await supabase
      .from('prompt_tests')
      .update({ is_hallucination: newValue })
      .eq('run_id', runId)
      .eq('test_input', result.input)
      .order('created_at', { ascending: true })
      .limit(1);

    if (updateError) {
      console.error('Failed to update hallucination flag:', updateError);
    }
  };

  const hallucinationCount = results.filter(r => r.isHallucination).length;
  const successCount = results.filter(r => !r.error).length;

  return (
    <div className="hidden md:block border-t bg-background">
    <div className="mx-auto max-w-lg px-3">
        {/* Toggle Header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <span>🧪 Prompt Eval Tools</span>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>

        {/* Panel Content */}
        {isOpen && (
          <div className="pb-4 space-y-3">
            {/* Test Cases - Full Width */}
            <div className="space-y-2">
              <Label htmlFor="test-cases">Test Cases (one per line)</Label>
              <Textarea
                id="test-cases"
                value={testCasesText}
                onChange={e => setTestCasesText(e.target.value)}
                placeholder="2 eggs scrambled&#10;chicken salad with ranch&#10;large coffee with oat milk"
                className="h-24 font-mono text-sm"
              />
            </div>

            {/* Controls Row: Radio + Iterations + Run Button */}
            <div className="flex items-center justify-between gap-4">
              {/* Prompt Version Radio */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="promptVersion"
                    checked={promptVersion === 'default'}
                    onChange={() => setPromptVersion('default')}
                    className="h-4 w-4 accent-primary"
                  />
                  Default
                </label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="promptVersion"
                    checked={promptVersion === 'experimental'}
                    onChange={() => setPromptVersion('experimental')}
                    className="h-4 w-4 accent-primary"
                  />
                  Experimental
                </label>
              </div>

              {/* Iterations */}
              <div className="flex items-center gap-2">
                <Label htmlFor="iterations" className="text-sm whitespace-nowrap">Iterations</Label>
                <Input
                  id="iterations"
                  type="number"
                  min={1}
                  max={10}
                  value={iterations}
                  onChange={e => setIterations(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-16 h-8"
                />
              </div>

              {/* Run Button */}
              <Button size="sm" onClick={runTests} disabled={isRunning}>
                {isRunning ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="mr-1.5 h-4 w-4" />
                    Run Tests
                  </>
                )}
              </Button>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    Results: {successCount}/{results.length} successful
                  </span>
                  <span className="text-muted-foreground">
                    Hallucinations: {hallucinationCount}/{successCount} ({successCount > 0 ? Math.round((hallucinationCount / successCount) * 100) : 0}%)
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Input</th>
                        <th className="px-3 py-2 text-left font-medium">Output</th>
                        <th className="px-3 py-2 text-center font-medium">Halluc?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2 font-mono text-xs max-w-[200px] truncate">
                            {result.input}
                          </td>
                          <td className="px-3 py-2 text-xs max-w-[300px]">
                            {result.error ? (
                              <span className="text-destructive">{result.error}</span>
                            ) : (
                              <span className="truncate block">
                                {result.output?.food_items?.map(f => `${f.description} (${f.calories} cal)`).join(', ')}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {!result.error && (
                              <input
                                type="checkbox"
                                checked={result.isHallucination || false}
                                onChange={() => toggleHallucination(i)}
                                className="h-4 w-4 rounded border-muted-foreground"
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
