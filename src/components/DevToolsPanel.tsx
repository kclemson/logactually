import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface ExerciseItemOutput {
  exercise_key: string;
  description: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  duration_minutes?: number | null;
  distance_miles?: number | null;
}

interface TestResult {
  id?: string;
  input: string;
  additionalContext?: string;
  output: { 
    food_items?: FoodItemOutput[];
    exercises?: ExerciseItemOutput[];
  } | null;
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

type FoodColumnKey = 
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

type WeightsColumnKey =
  | 'input'
  | 'source'
  | 'prompt'
  | 'exercise'
  | 'sets'
  | 'reps'
  | 'weight'
  | 'duration'
  | 'distance';

type ColumnKey = FoodColumnKey | WeightsColumnKey;

export function DevToolsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [testType, setTestType] = useState<'food' | 'weights'>('food');
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
  
  // Food column widths
  const [foodColumnWidths, setFoodColumnWidths] = useState({
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

  // Weights column widths
  const [weightsColumnWidths, setWeightsColumnWidths] = useState({
    input: 180,
    source: 50,
    prompt: 50,
    exercise: 150,
    sets: 40,
    reps: 40,
    weight: 50,
    duration: 60,
    distance: 60,
  });

  const { lookupUpc } = useScanBarcode();

  const handleFoodResizeMouseDown = (columnKey: FoodColumnKey) => (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = foodColumnWidths[columnKey as keyof typeof foodColumnWidths];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(50, startWidth + delta);
      setFoodColumnWidths(prev => ({ ...prev, [columnKey]: newWidth }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleWeightsResizeMouseDown = (columnKey: WeightsColumnKey) => (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = weightsColumnWidths[columnKey as keyof typeof weightsColumnWidths];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(30, startWidth + delta);
      setWeightsColumnWidths(prev => ({ ...prev, [columnKey]: newWidth }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const FoodResizeHandle = ({ columnKey }: { columnKey: FoodColumnKey }) => (
    <div
      onMouseDown={handleFoodResizeMouseDown(columnKey)}
      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
    />
  );

  const WeightsResizeHandle = ({ columnKey }: { columnKey: WeightsColumnKey }) => (
    <div
      onMouseDown={handleWeightsResizeMouseDown(columnKey)}
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

          // Only check for UPC in client mode for food tests
          if (testType === 'food' && routingMode === 'client') {
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

          // Send to appropriate function via run-prompt-tests
          const { data, error: invokeError } = await supabase.functions.invoke<RunResponse>(
            'run-prompt-tests',
            {
              body: { 
                testCases: [{ input: testCase.input, source }], 
                promptVersion, 
                iterations: 1,
                testType,
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

  // Determine which results to show based on test type
  const getFilteredResults = () => {
    return displayResults.filter(result => {
      if (testType === 'food') {
        return result.output?.food_items !== undefined || result.error;
      } else {
        return result.output?.exercises !== undefined || result.error;
      }
    });
  };

  const filteredResults = getFilteredResults();

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
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {/* Test Type */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Type:</span>
                <Select value={testType} onValueChange={(v) => setTestType(v as 'food' | 'weights')}>
                  <SelectTrigger className="w-24 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="weights">Weights</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Prompt Version */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Prompt:</span>
                <Select value={promptVersion} onValueChange={(v) => setPromptVersion(v as 'default' | 'experimental')}>
                  <SelectTrigger className="w-32 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="experimental">Experimental</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Routing Mode - only for food */}
              {testType === 'food' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Routing:</span>
                  <Select value={routingMode} onValueChange={(v) => setRoutingMode(v as 'client' | 'ai-only')}>
                    <SelectTrigger className="w-24 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="ai-only">AI Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

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
            {filteredResults.length > 0 && (
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
                  {testType === 'food' ? (
                    // Food results table
                    <table className="text-xs" style={{ tableLayout: 'fixed', minWidth: '100%' }}>
                      <thead className="bg-background sticky top-0">
                        <tr>
                          <th className="relative px-1 py-1 text-left" style={{ width: foodColumnWidths.input }} title="Test input">
                            <span className="font-medium text-xs">Input</span>
                            <FoodResizeHandle columnKey="input" />
                          </th>
                          <th className="relative px-1 py-1 text-left" style={{ width: foodColumnWidths.source }} title="Data source">
                            <span className="font-medium text-xs">Source</span>
                            <FoodResizeHandle columnKey="source" />
                          </th>
                          <th className="relative px-1 py-1 text-left" style={{ width: foodColumnWidths.prompt }} title="Prompt version">
                            <span className="font-medium text-xs">Prompt</span>
                            <FoodResizeHandle columnKey="prompt" />
                          </th>
                          <th className="relative px-1 py-1 text-left" style={{ width: foodColumnWidths.description }} title="Food description">
                            <span className="font-medium text-xs">Desc</span>
                            <FoodResizeHandle columnKey="description" />
                          </th>
                          <th className="relative px-1 py-1 text-left" style={{ width: foodColumnWidths.portion }} title="Portion size">
                            <span className="font-medium text-xs">Portion</span>
                            <FoodResizeHandle columnKey="portion" />
                          </th>
                          <th className="relative px-1 py-1 text-right" style={{ width: foodColumnWidths.calories }} title="Calories">
                            <span className="font-medium text-xs">Cal</span>
                            <FoodResizeHandle columnKey="calories" />
                          </th>
                          <th className="relative px-1 py-1 text-right" style={{ width: foodColumnWidths.protein }} title="Protein (g)">
                            <span className="font-medium text-xs">P</span>
                            <FoodResizeHandle columnKey="protein" />
                          </th>
                          <th className="relative px-1 py-1 text-right" style={{ width: foodColumnWidths.carbs }} title="Carbs (g)">
                            <span className="font-medium text-xs">C</span>
                            <FoodResizeHandle columnKey="carbs" />
                          </th>
                          <th className="relative px-1 py-1 text-right" style={{ width: foodColumnWidths.fiber }} title="Fiber (g)">
                            <span className="font-medium text-xs">Fb</span>
                            <FoodResizeHandle columnKey="fiber" />
                          </th>
                          <th className="relative px-1 py-1 text-right" style={{ width: foodColumnWidths.sugar }} title="Sugar (g)">
                            <span className="font-medium text-xs">Sg</span>
                            <FoodResizeHandle columnKey="sugar" />
                          </th>
                          <th className="relative px-1 py-1 text-right" style={{ width: foodColumnWidths.fat }} title="Fat (g)">
                            <span className="font-medium text-xs">F</span>
                            <FoodResizeHandle columnKey="fat" />
                          </th>
                          <th className="relative px-1 py-1 text-right" style={{ width: foodColumnWidths.satFat }} title="Saturated Fat (g)">
                            <span className="font-medium text-xs">SF</span>
                            <FoodResizeHandle columnKey="satFat" />
                          </th>
                          <th className="relative px-1 py-1 text-right" style={{ width: foodColumnWidths.sodium }} title="Sodium (mg)">
                            <span className="font-medium text-xs">Na</span>
                            <FoodResizeHandle columnKey="sodium" />
                          </th>
                          <th className="relative px-1 py-1 text-right" style={{ width: foodColumnWidths.cholesterol }} title="Cholesterol (mg)">
                            <span className="font-medium text-xs">Ch</span>
                            <FoodResizeHandle columnKey="cholesterol" />
                          </th>
                          <th className="relative px-1 py-1 text-left" style={{ width: foodColumnWidths.confidence }} title="AI confidence">
                            <span className="font-medium text-xs">Conf</span>
                            <FoodResizeHandle columnKey="confidence" />
                          </th>
                          <th className="relative px-1 py-1 text-left" style={{ width: foodColumnWidths.sourceNote }} title="Source note">
                            <span className="font-medium text-xs">Note</span>
                            <FoodResizeHandle columnKey="sourceNote" />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredResults.map((result, i) => (
                          <tr key={i} className="border-t align-top">
                            <td className="px-1 py-1 text-xs" style={{ width: foodColumnWidths.input, maxWidth: foodColumnWidths.input }} title={result.input}>
                              <div className="break-words line-clamp-5">{result.input}</div>
                            </td>
                            <td className="px-1 py-1 text-xs" style={{ width: foodColumnWidths.source, maxWidth: foodColumnWidths.source }}>
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
                            <td className="px-1 py-1 text-xs" style={{ width: foodColumnWidths.prompt, maxWidth: foodColumnWidths.prompt }}>
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
                                <td className="px-1 py-1 text-xs" style={{ width: foodColumnWidths.description, maxWidth: foodColumnWidths.description }}>
                                  <div className="space-y-0.5">
                                    {result.output?.food_items?.map((f, idx) => (
                                      <div key={idx} className="truncate" title={f.description}>{f.description}</div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-1 py-1 text-xs" style={{ width: foodColumnWidths.portion, maxWidth: foodColumnWidths.portion }}>
                                  <div className="space-y-0.5">
                                    {result.output?.food_items?.map((f, idx) => (
                                      <div key={idx} className="truncate" title={f.portion}>{f.portion || '—'}</div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-1 py-1 text-xs text-right" style={{ width: foodColumnWidths.calories, maxWidth: foodColumnWidths.calories }}>
                                  <div className="space-y-0.5">
                                    {result.output?.food_items?.map((f, idx) => (
                                      <div key={idx}>{f.calories}</div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-1 py-1 text-xs text-right" style={{ width: foodColumnWidths.protein, maxWidth: foodColumnWidths.protein }}>
                                  <div className="space-y-0.5">
                                    {result.output?.food_items?.map((f, idx) => (
                                      <div key={idx}>{f.protein ?? '—'}</div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-1 py-1 text-xs text-right" style={{ width: foodColumnWidths.carbs, maxWidth: foodColumnWidths.carbs }}>
                                  <div className="space-y-0.5">
                                    {result.output?.food_items?.map((f, idx) => (
                                      <div key={idx}>{f.carbs ?? '—'}</div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-1 py-1 text-xs text-right" style={{ width: foodColumnWidths.fiber, maxWidth: foodColumnWidths.fiber }}>
                                  <div className="space-y-0.5">
                                    {result.output?.food_items?.map((f, idx) => (
                                      <div key={idx}>{f.fiber ?? '—'}</div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-1 py-1 text-xs text-right" style={{ width: foodColumnWidths.sugar, maxWidth: foodColumnWidths.sugar }}>
                                  <div className="space-y-0.5">
                                    {result.output?.food_items?.map((f, idx) => (
                                      <div key={idx}>{f.sugar ?? '—'}</div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-1 py-1 text-xs text-right" style={{ width: foodColumnWidths.fat, maxWidth: foodColumnWidths.fat }}>
                                  <div className="space-y-0.5">
                                    {result.output?.food_items?.map((f, idx) => (
                                      <div key={idx}>{f.fat ?? '—'}</div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-1 py-1 text-xs text-right" style={{ width: foodColumnWidths.satFat, maxWidth: foodColumnWidths.satFat }}>
                                  <div className="space-y-0.5">
                                    {result.output?.food_items?.map((f, idx) => (
                                      <div key={idx}>{f.saturated_fat ?? '—'}</div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-1 py-1 text-xs text-right" style={{ width: foodColumnWidths.sodium, maxWidth: foodColumnWidths.sodium }}>
                                  <div className="space-y-0.5">
                                    {result.output?.food_items?.map((f, idx) => (
                                      <div key={idx}>{f.sodium ?? '—'}</div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-1 py-1 text-xs text-right" style={{ width: foodColumnWidths.cholesterol, maxWidth: foodColumnWidths.cholesterol }}>
                                  <div className="space-y-0.5">
                                    {result.output?.food_items?.map((f, idx) => (
                                      <div key={idx}>{f.cholesterol ?? '—'}</div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-1 py-1 text-xs" style={{ width: foodColumnWidths.confidence, maxWidth: foodColumnWidths.confidence }}>
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
                                <td className="px-1 py-1 text-xs text-muted-foreground" style={{ width: foodColumnWidths.sourceNote, maxWidth: foodColumnWidths.sourceNote }}>
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
                  ) : (
                    // Weights results table
                    <table className="text-xs" style={{ tableLayout: 'fixed', minWidth: '100%' }}>
                      <thead className="bg-background sticky top-0">
                        <tr>
                          <th className="relative px-1 py-1 text-left" style={{ width: weightsColumnWidths.input }} title="Test input">
                            <span className="font-medium text-xs">Input</span>
                            <WeightsResizeHandle columnKey="input" />
                          </th>
                          <th className="relative px-1 py-1 text-left" style={{ width: weightsColumnWidths.source }} title="Data source">
                            <span className="font-medium text-xs">Source</span>
                            <WeightsResizeHandle columnKey="source" />
                          </th>
                          <th className="relative px-1 py-1 text-left" style={{ width: weightsColumnWidths.prompt }} title="Prompt version">
                            <span className="font-medium text-xs">Prompt</span>
                            <WeightsResizeHandle columnKey="prompt" />
                          </th>
                          <th className="relative px-1 py-1 text-left" style={{ width: weightsColumnWidths.exercise }} title="Exercise name">
                            <span className="font-medium text-xs">Exercise</span>
                            <WeightsResizeHandle columnKey="exercise" />
                          </th>
                          <th className="relative px-1 py-1 text-right" style={{ width: weightsColumnWidths.sets }} title="Sets">
                            <span className="font-medium text-xs">Sets</span>
                            <WeightsResizeHandle columnKey="sets" />
                          </th>
                          <th className="relative px-1 py-1 text-right" style={{ width: weightsColumnWidths.reps }} title="Reps">
                            <span className="font-medium text-xs">Reps</span>
                            <WeightsResizeHandle columnKey="reps" />
                          </th>
                          <th className="relative px-1 py-1 text-right" style={{ width: weightsColumnWidths.weight }} title="Weight (lbs)">
                            <span className="font-medium text-xs">Lbs</span>
                            <WeightsResizeHandle columnKey="weight" />
                          </th>
                          <th className="relative px-1 py-1 text-right" style={{ width: weightsColumnWidths.duration }} title="Duration (minutes)">
                            <span className="font-medium text-xs">Mins</span>
                            <WeightsResizeHandle columnKey="duration" />
                          </th>
                          <th className="relative px-1 py-1 text-right" style={{ width: weightsColumnWidths.distance }} title="Distance (miles)">
                            <span className="font-medium text-xs">Miles</span>
                            <WeightsResizeHandle columnKey="distance" />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredResults.map((result, i) => (
                          <tr key={i} className="border-t align-top">
                            <td className="px-1 py-1 text-xs" style={{ width: weightsColumnWidths.input, maxWidth: weightsColumnWidths.input }} title={result.input}>
                              <div className="break-words line-clamp-5">{result.input}</div>
                            </td>
                            <td className="px-1 py-1 text-xs" style={{ width: weightsColumnWidths.source, maxWidth: weightsColumnWidths.source }}>
                              <span className="text-muted-foreground">AI</span>
                            </td>
                            <td className="px-1 py-1 text-xs" style={{ width: weightsColumnWidths.prompt, maxWidth: weightsColumnWidths.prompt }}>
                              <span className={
                                result.promptVersion === 'experimental' 
                                  ? 'text-purple-500' 
                                  : 'text-muted-foreground'
                              }>
                                {result.promptVersion === 'experimental' ? 'Exp' : 'Def'}
                              </span>
                            </td>
                            {result.error ? (
                              <td colSpan={6} className="px-1 py-1 text-xs text-destructive">
                                {result.error}
                              </td>
                            ) : (
                              <>
                                <td className="px-1 py-1 text-xs" style={{ width: weightsColumnWidths.exercise, maxWidth: weightsColumnWidths.exercise }}>
                                  <div className="space-y-0.5">
                                    {result.output?.exercises?.map((e, idx) => (
                                      <div key={idx} className="truncate" title={e.description}>{e.description}</div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-1 py-1 text-xs text-right" style={{ width: weightsColumnWidths.sets, maxWidth: weightsColumnWidths.sets }}>
                                  <div className="space-y-0.5">
                                    {result.output?.exercises?.map((e, idx) => (
                                      <div key={idx}>{e.sets || '—'}</div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-1 py-1 text-xs text-right" style={{ width: weightsColumnWidths.reps, maxWidth: weightsColumnWidths.reps }}>
                                  <div className="space-y-0.5">
                                    {result.output?.exercises?.map((e, idx) => (
                                      <div key={idx}>{e.reps || '—'}</div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-1 py-1 text-xs text-right" style={{ width: weightsColumnWidths.weight, maxWidth: weightsColumnWidths.weight }}>
                                  <div className="space-y-0.5">
                                    {result.output?.exercises?.map((e, idx) => (
                                      <div key={idx}>{e.weight_lbs || '—'}</div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-1 py-1 text-xs text-right" style={{ width: weightsColumnWidths.duration, maxWidth: weightsColumnWidths.duration }}>
                                  <div className="space-y-0.5">
                                    {result.output?.exercises?.map((e, idx) => (
                                      <div key={idx}>{e.duration_minutes ?? '—'}</div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-1 py-1 text-xs text-right" style={{ width: weightsColumnWidths.distance, maxWidth: weightsColumnWidths.distance }}>
                                  <div className="space-y-0.5">
                                    {result.output?.exercises?.map((e, idx) => (
                                      <div key={idx}>{e.distance_miles ?? '—'}</div>
                                    ))}
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
