import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, Play, Loader2 } from 'lucide-react';
import { extractUpcFromText } from '@/lib/upc-utils';
import { useScanBarcode } from '@/hooks/useScanBarcode';

interface FoodItemOutput {
  description: string;
  calories: number;
  confidence?: 'high' | 'medium' | 'low';
  source_note?: string;
}

interface TestResult {
  id?: string;
  input: string;
  additionalContext?: string;
  output: { food_items?: FoodItemOutput[] } | null;
  latencyMs: number;
  error?: string;
  isHallucination?: boolean;
  promptVersion?: 'default' | 'experimental';
  source?: 'upc-lookup' | 'ai' | 'ai-fallback';
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
  const [routingMode, setRoutingMode] = useState<'client' | 'ai-only'>('client');
  const [testCasesText, setTestCasesText] = useState(
    () => localStorage.getItem('devtools-test-cases') ?? ''
  );
  const [iterations, setIterations] = useState(3);
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { lookupUpc } = useScanBarcode();

  // Fetch historical results from database
  const { data: historicalResults } = useQuery({
    queryKey: ['prompt-tests-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompt_tests')
        .select('test_input, actual_output, latency_ms, is_hallucination, prompt_version, run_id, source')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      return data.map(row => ({
        input: row.test_input,
        output: row.actual_output as TestResult['output'],
        latencyMs: row.latency_ms ?? 0,
        isHallucination: row.is_hallucination ?? false,
        promptVersion: row.prompt_version as 'default' | 'experimental',
        source: (row.source as TestResult['source']) || 'ai',
        error: undefined,
      }));
    },
  });

  // Combine session results with historical
  const displayResults = [...results, ...(historicalResults ?? [])];

  const runTests = async () => {
    localStorage.setItem('devtools-test-cases', testCasesText);
    setIsRunning(true);
    setError(null);

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

    const allResults: TestResult[] = [];
    let currentRunId: string | null = null;

    try {
      for (const testCase of testCases) {
        for (let iter = 0; iter < iterations; iter++) {
          let source: 'upc-lookup' | 'ai' | 'ai-fallback' = 'ai';

          // Only check for UPC in client mode
          if (routingMode === 'client') {
            const upc = extractUpcFromText(testCase.input);
            const startTime = Date.now();

            if (upc) {
              // UPC detected - call lookup-upc directly (mirrors FoodInput behavior)
              const result = await lookupUpc(upc);
              const latencyMs = Date.now() - startTime;

              if (result.success) {
                // Found in database - add as UPC lookup result
                allResults.push({
                  input: testCase.input,
                  output: {
                    food_items: [{
                      description: result.data.description,
                      calories: result.data.calories,
                    }]
                  },
                  latencyMs,
                  promptVersion,
                  source: 'upc-lookup',
                });
                continue;
              }
              // Not found - mark as fallback and proceed to AI
              source = 'ai-fallback';
            }
          }

          // Send to analyze-food via run-prompt-tests
          
          const { data, error: invokeError } = await supabase.functions.invoke<RunResponse>(
            'run-prompt-tests',
            {
              body: { 
                testCases: [{ input: testCase.input, source }], 
                promptVersion, 
                iterations: 1 
              },
            }
          );

          if (invokeError) {
            throw new Error(invokeError.message);
          }

          if (data) {
            if (!currentRunId) {
              currentRunId = data.run_id;
              setRunId(currentRunId);
            }
            const taggedResults = data.results.map(r => ({
              ...r,
              promptVersion,
              source,
            }));
            allResults.push(...taggedResults);
          }
        }
      }

      setResults(prev => [...allResults, ...prev].slice(0, 100));
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

  const hallucinationCount = displayResults.filter(r => r.isHallucination).length;
  const successCount = displayResults.filter(r => !r.error).length;

  return (
    <div className="hidden md:block border-t bg-background">
    <div className="mx-auto max-w-4xl px-3">
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
                className="h-24 font-mono text-sm"
              />
            </div>

            {/* Controls Row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {/* Prompt Version */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Prompt:</span>
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="promptVersion"
                    checked={promptVersion === 'default'}
                    onChange={() => setPromptVersion('default')}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  Default
                </label>
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="promptVersion"
                    checked={promptVersion === 'experimental'}
                    onChange={() => setPromptVersion('experimental')}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  Experimental
                </label>
              </div>

              {/* Routing Mode */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Routing:</span>
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="routingMode"
                    checked={routingMode === 'client'}
                    onChange={() => setRoutingMode('client')}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  Client
                </label>
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="routingMode"
                    checked={routingMode === 'ai-only'}
                    onChange={() => setRoutingMode('ai-only')}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  AI Only
                </label>
              </div>

              {/* Iterations */}
              <div className="flex items-center gap-2">
                <Label htmlFor="iterations" className="text-xs text-muted-foreground">Iterations:</Label>
                <Input
                  id="iterations"
                  type="number"
                  min={1}
                  max={10}
                  value={iterations}
                  onChange={e => setIterations(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-14 h-7 text-sm"
                />
              </div>

              {/* Run Button */}
              <Button size="sm" onClick={runTests} disabled={isRunning} className="ml-auto">
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
            {displayResults.length > 0 && (
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
                  <table className="w-full text-xs">
                    <thead className="bg-background sticky top-0">
                      <tr>
                        <th className="px-1 py-1 text-left font-medium text-xs">Input</th>
                        <th className="px-1 py-1 text-left font-medium text-xs">Source</th>
                        <th className="px-1 py-1 text-left font-medium text-xs">Prompt</th>
                        <th className="px-1 py-1 text-left font-medium text-xs">Output</th>
                        <th className="px-1 py-1 text-left font-medium text-xs">Source Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayResults.map((result, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-1 py-1 font-mono text-xs max-w-[200px] truncate">
                            {result.input}
                          </td>
                          <td className="px-1 py-1 text-xs">
                            <span className={
                              result.source === 'upc-lookup' 
                                ? 'text-green-600' 
                                : result.source === 'ai-fallback'
                                  ? 'text-amber-600'
                                  : 'text-muted-foreground'
                            }>
                              {result.source === 'upc-lookup' ? 'UPC' : result.source === 'ai-fallback' ? 'AI (fallback)' : 'AI'}
                            </span>
                          </td>
                          <td className="px-1 py-1 text-xs">
                            <span className={
                              result.promptVersion === 'experimental' 
                                ? 'text-purple-500' 
                                : 'text-muted-foreground'
                            }>
                              {result.promptVersion === 'experimental' ? 'Experimental' : 'Default'}
                            </span>
                          </td>
                          <td className="px-1 py-1 text-xs max-w-[300px]">
                            {result.error ? (
                              <span className="text-destructive">{result.error}</span>
                            ) : (
                              <div className="space-y-0.5">
                                {result.output?.food_items?.map((f, idx) => (
                                  <div key={idx} className="flex items-center gap-1 truncate" title={f.source_note || undefined}>
                                    {/* Confidence indicator dot */}
                                    <span 
                                      className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                                        f.confidence === 'high' 
                                          ? 'bg-green-500' 
                                          : f.confidence === 'medium' 
                                            ? 'bg-yellow-500' 
                                            : f.confidence === 'low' 
                                              ? 'bg-red-500' 
                                              : 'bg-muted-foreground/30'
                                      }`}
                                      title={f.confidence ? `Confidence: ${f.confidence}${f.source_note ? ` - ${f.source_note}` : ''}` : 'No confidence data'}
                                    />
                                    <span className="truncate">
                                      {f.description} ({f.calories} cal)
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-1 py-1 text-xs text-muted-foreground max-w-[200px]">
                            {result.error ? null : (
                              <div className="space-y-0.5">
                                {result.output?.food_items?.map((f, idx) => (
                                  <div key={idx} className="truncate" title={f.source_note || undefined}>
                                    {f.source_note || "—"}
                                  </div>
                                ))}
                              </div>
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
