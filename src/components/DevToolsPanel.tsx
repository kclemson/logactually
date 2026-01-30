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
  portion?: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fiber?: number;
  sugar?: number;
  fat?: number;
  saturated_fat?: number;
  sodium?: number;
  cholesterol?: number;
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

type ColumnKey = 
  | 'input' 
  | 'source' 
  | 'prompt' 
  | 'description'
  | 'portion'
  | 'calories'
  | 'protein'
  | 'carbs'
  | 'fiber'
  | 'sugar'
  | 'fat'
  | 'satFat'
  | 'sodium'
  | 'cholesterol'
  | 'confidence'
  | 'sourceNote';

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
  const [columnWidths, setColumnWidths] = useState({
    input: 180,
    source: 50,
    prompt: 50,
    description: 150,
    portion: 100,
    calories: 35,
    protein: 30,
    carbs: 30,
    fiber: 30,
    sugar: 30,
    fat: 30,
    satFat: 30,
    sodium: 35,
    cholesterol: 30,
    confidence: 55,
    sourceNote: 180,
  });

  const { lookupUpc } = useScanBarcode();

  const handleResizeMouseDown = (columnKey: ColumnKey) => (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = columnWidths[columnKey];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(50, startWidth + delta);
      setColumnWidths(prev => ({ ...prev, [columnKey]: newWidth }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const ResizeHandle = ({ columnKey }: { columnKey: ColumnKey }) => (
    <div
      onMouseDown={handleResizeMouseDown(columnKey)}
      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
    />
  );

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
    <div className="mx-auto max-w-[1200px] px-6">
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

                <div className="max-h-80 overflow-x-auto overflow-y-auto rounded-md border">
                  <table className="text-xs" style={{ tableLayout: 'fixed', minWidth: '100%' }}>
                    <thead className="bg-background sticky top-0">
                      <tr>
                        <th className="relative px-1 py-1 text-left" style={{ width: columnWidths.input }} title="Test input">
                          <span className="font-medium text-xs">Input</span>
                          <ResizeHandle columnKey="input" />
                        </th>
                        <th className="relative px-1 py-1 text-left" style={{ width: columnWidths.source }} title="Data source">
                          <span className="font-medium text-xs">Source</span>
                          <ResizeHandle columnKey="source" />
                        </th>
                        <th className="relative px-1 py-1 text-left" style={{ width: columnWidths.prompt }} title="Prompt version">
                          <span className="font-medium text-xs">Prompt</span>
                          <ResizeHandle columnKey="prompt" />
                        </th>
                        <th className="relative px-1 py-1 text-left" style={{ width: columnWidths.description }} title="Food description">
                          <span className="font-medium text-xs">Desc</span>
                          <ResizeHandle columnKey="description" />
                        </th>
                        <th className="relative px-1 py-1 text-left" style={{ width: columnWidths.portion }} title="Portion size">
                          <span className="font-medium text-xs">Portion</span>
                          <ResizeHandle columnKey="portion" />
                        </th>
                        <th className="relative px-1 py-1 text-right" style={{ width: columnWidths.calories }} title="Calories">
                          <span className="font-medium text-xs">Cal</span>
                          <ResizeHandle columnKey="calories" />
                        </th>
                        <th className="relative px-1 py-1 text-right" style={{ width: columnWidths.protein }} title="Protein (g)">
                          <span className="font-medium text-xs">P</span>
                          <ResizeHandle columnKey="protein" />
                        </th>
                        <th className="relative px-1 py-1 text-right" style={{ width: columnWidths.carbs }} title="Carbs (g)">
                          <span className="font-medium text-xs">C</span>
                          <ResizeHandle columnKey="carbs" />
                        </th>
                        <th className="relative px-1 py-1 text-right" style={{ width: columnWidths.fiber }} title="Fiber (g)">
                          <span className="font-medium text-xs">Fb</span>
                          <ResizeHandle columnKey="fiber" />
                        </th>
                        <th className="relative px-1 py-1 text-right" style={{ width: columnWidths.sugar }} title="Sugar (g)">
                          <span className="font-medium text-xs">Sg</span>
                          <ResizeHandle columnKey="sugar" />
                        </th>
                        <th className="relative px-1 py-1 text-right" style={{ width: columnWidths.fat }} title="Fat (g)">
                          <span className="font-medium text-xs">F</span>
                          <ResizeHandle columnKey="fat" />
                        </th>
                        <th className="relative px-1 py-1 text-right" style={{ width: columnWidths.satFat }} title="Saturated Fat (g)">
                          <span className="font-medium text-xs">SF</span>
                          <ResizeHandle columnKey="satFat" />
                        </th>
                        <th className="relative px-1 py-1 text-right" style={{ width: columnWidths.sodium }} title="Sodium (mg)">
                          <span className="font-medium text-xs">Na</span>
                          <ResizeHandle columnKey="sodium" />
                        </th>
                        <th className="relative px-1 py-1 text-right" style={{ width: columnWidths.cholesterol }} title="Cholesterol (mg)">
                          <span className="font-medium text-xs">Ch</span>
                          <ResizeHandle columnKey="cholesterol" />
                        </th>
                        <th className="relative px-1 py-1 text-left" style={{ width: columnWidths.confidence }} title="AI confidence">
                          <span className="font-medium text-xs">Conf</span>
                          <ResizeHandle columnKey="confidence" />
                        </th>
                        <th className="relative px-1 py-1 text-left" style={{ width: columnWidths.sourceNote }} title="Source note">
                          <span className="font-medium text-xs">Note</span>
                          <ResizeHandle columnKey="sourceNote" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayResults.map((result, i) => (
                        <tr key={i} className="border-t align-top">
                          <td className="px-1 py-1 font-mono text-xs" style={{ width: columnWidths.input, maxWidth: columnWidths.input }} title={result.input}>
                            <div className="line-clamp-2 break-words">{result.input}</div>
                          </td>
                          <td className="px-1 py-1 text-xs" style={{ width: columnWidths.source, maxWidth: columnWidths.source }}>
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
                          <td className="px-1 py-1 text-xs" style={{ width: columnWidths.prompt, maxWidth: columnWidths.prompt }}>
                            <span className={
                              result.promptVersion === 'experimental' 
                                ? 'text-purple-500' 
                                : 'text-muted-foreground'
                            }>
                              {result.promptVersion === 'experimental' ? 'Exp' : 'Def'}
                            </span>
                          </td>
                          {result.error ? (
                            <td colSpan={13} className="px-1 py-1 text-xs text-destructive">
                              {result.error}
                            </td>
                          ) : (
                            <>
                              <td className="px-1 py-1 text-xs" style={{ width: columnWidths.description, maxWidth: columnWidths.description }}>
                                <div className="space-y-0.5">
                                  {result.output?.food_items?.map((f, idx) => (
                                    <div key={idx} className="truncate" title={f.description}>{f.description}</div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-1 py-1 text-xs" style={{ width: columnWidths.portion, maxWidth: columnWidths.portion }}>
                                <div className="space-y-0.5">
                                  {result.output?.food_items?.map((f, idx) => (
                                    <div key={idx} className="truncate" title={f.portion}>{f.portion || '—'}</div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-1 py-1 text-xs text-right" style={{ width: columnWidths.calories, maxWidth: columnWidths.calories }}>
                                <div className="space-y-0.5">
                                  {result.output?.food_items?.map((f, idx) => (
                                    <div key={idx}>{f.calories}</div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-1 py-1 text-xs text-right" style={{ width: columnWidths.protein, maxWidth: columnWidths.protein }}>
                                <div className="space-y-0.5">
                                  {result.output?.food_items?.map((f, idx) => (
                                    <div key={idx}>{f.protein ?? '—'}</div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-1 py-1 text-xs text-right" style={{ width: columnWidths.carbs, maxWidth: columnWidths.carbs }}>
                                <div className="space-y-0.5">
                                  {result.output?.food_items?.map((f, idx) => (
                                    <div key={idx}>{f.carbs ?? '—'}</div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-1 py-1 text-xs text-right" style={{ width: columnWidths.fiber, maxWidth: columnWidths.fiber }}>
                                <div className="space-y-0.5">
                                  {result.output?.food_items?.map((f, idx) => (
                                    <div key={idx}>{f.fiber ?? '—'}</div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-1 py-1 text-xs text-right" style={{ width: columnWidths.sugar, maxWidth: columnWidths.sugar }}>
                                <div className="space-y-0.5">
                                  {result.output?.food_items?.map((f, idx) => (
                                    <div key={idx}>{f.sugar ?? '—'}</div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-1 py-1 text-xs text-right" style={{ width: columnWidths.fat, maxWidth: columnWidths.fat }}>
                                <div className="space-y-0.5">
                                  {result.output?.food_items?.map((f, idx) => (
                                    <div key={idx}>{f.fat ?? '—'}</div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-1 py-1 text-xs text-right" style={{ width: columnWidths.satFat, maxWidth: columnWidths.satFat }}>
                                <div className="space-y-0.5">
                                  {result.output?.food_items?.map((f, idx) => (
                                    <div key={idx}>{f.saturated_fat ?? '—'}</div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-1 py-1 text-xs text-right" style={{ width: columnWidths.sodium, maxWidth: columnWidths.sodium }}>
                                <div className="space-y-0.5">
                                  {result.output?.food_items?.map((f, idx) => (
                                    <div key={idx}>{f.sodium ?? '—'}</div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-1 py-1 text-xs text-right" style={{ width: columnWidths.cholesterol, maxWidth: columnWidths.cholesterol }}>
                                <div className="space-y-0.5">
                                  {result.output?.food_items?.map((f, idx) => (
                                    <div key={idx}>{f.cholesterol ?? '—'}</div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-1 py-1 text-xs" style={{ width: columnWidths.confidence, maxWidth: columnWidths.confidence }}>
                                <div className="space-y-0.5">
                                  {result.output?.food_items?.map((f, idx) => (
                                    <div key={idx} className={
                                      f.confidence === 'high' 
                                        ? 'text-green-600' 
                                        : f.confidence === 'medium' 
                                          ? 'text-yellow-600' 
                                          : f.confidence === 'low' 
                                            ? 'text-red-600' 
                                            : 'text-muted-foreground'
                                    }>
                                      {f.confidence || '—'}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-1 py-1 text-xs text-muted-foreground" style={{ width: columnWidths.sourceNote, maxWidth: columnWidths.sourceNote }}>
                                <div className="space-y-0.5">
                                  {result.output?.food_items?.map((f, idx) => (
                                    <div key={idx} className="line-clamp-2 break-words" title={f.source_note || undefined}>
                                      {f.source_note || '—'}
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </>
                          )}
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
