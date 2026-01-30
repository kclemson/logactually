import { useState, useImperativeHandle, forwardRef, useRef, useCallback, useEffect } from "react";
import { Mic, Send, Loader2, ScanBarcode, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { SavedMealsPopover } from "@/components/SavedMealsPopover";
import { SavedRoutinesPopover } from "@/components/SavedRoutinesPopover";
import { useScanBarcode } from "@/hooks/useScanBarcode";
import { extractUpcFromText } from "@/lib/upc-utils";
import { FoodItem } from "@/types/food";
import { SavedExerciseSet } from "@/types/weight";
import { useReadOnlyContext } from "@/contexts/ReadOnlyContext";
import type { WeightUnit } from "@/lib/weight-units";

// Mode-specific configurations
export type LogMode = 'food' | 'weights';

const FOOD_PLACEHOLDER_EXAMPLES = [
  "Describe what you ate, such as: McDs egg mcmuffin and like half the hash brown",
  "Describe what you ate, such as: grande oat milk latte from Starbucks and most of a banana",
  "Describe what you ate, such as: Chipotle bowl with chicken and extra guac",
  "Describe what you ate, such as: blueberry muffin but only the top part",
  "Describe what you ate, such as: lean cuisine alfredo noodles and an apple with around 2Tb of peanut butter",
  "Describe what you ate, such as: protein bar (the kirkland ones from costco)",
  "Describe what you ate, such as: leftover Domino's, two and a half slices of pepperoni",
  "Describe what you ate, such as: a slice of banana bread from this recipe: https://natashaskitchen.com/banana-bread-recipe-video/",
];

const WEIGHTS_PLACEHOLDER_EXAMPLES_LBS = [
  "Describe your workout: 3 sets of 10 reps lat pulldown at 100 lbs",
  "Describe your workout: bench press 4x8 at 135",
  "Describe your workout: squats 5x5 at 185 lbs, then leg press 3x12 at 200",
  "Describe your workout: bicep curls 3x12 at 25 lbs",
  "Describe your workout: chest fly machine 3x10, then shoulder press 3x8",
  "Describe your workout: leg extensions and hamstring curls, 3 sets each",
  "Describe your workout: cable rows 4x10 at 80 lbs",
];

const WEIGHTS_PLACEHOLDER_EXAMPLES_KG = [
  "Describe your workout: 3 sets of 10 reps lat pulldown at 45 kg",
  "Describe your workout: bench press 4x8 at 60 kg",
  "Describe your workout: squats 5x5 at 85 kg, then leg press 3x12 at 90 kg",
  "Describe your workout: bicep curls 3x12 at 12 kg",
  "Describe your workout: chest fly machine 3x10, then shoulder press 3x8",
  "Describe your workout: leg extensions and hamstring curls, 3 sets each",
  "Describe your workout: cable rows 4x10 at 35 kg",
];

interface LogModeConfig {
  showBarcodeScanner: boolean;
  showSavedButton: boolean;
  submitLabel: string;
  submitLabelShort: string;
}

const MODE_CONFIGS: Record<LogMode, LogModeConfig> = {
  food: {
    showBarcodeScanner: true,
    showSavedButton: true,
    submitLabel: 'Add Food',
    submitLabelShort: 'Add',
  },
  weights: {
    showBarcodeScanner: false,
    showSavedButton: true,
    submitLabel: 'Add Exercise',
    submitLabelShort: 'Add',
  },
};

// Helper to get placeholders based on mode and weight unit
function getPlaceholders(mode: LogMode, weightUnit?: WeightUnit): string[] {
  if (mode === 'food') return FOOD_PLACEHOLDER_EXAMPLES;
  return weightUnit === 'kg' ? WEIGHTS_PLACEHOLDER_EXAMPLES_KG : WEIGHTS_PLACEHOLDER_EXAMPLES_LBS;
}

interface LogInputProps {
  /** Mode determines placeholders and available features */
  mode: LogMode;
  onSubmit: (text: string) => void;
  isLoading?: boolean;
  /** Food mode only: handler for barcode scan results */
  onScanResult?: (foodItem: Omit<FoodItem, "uid" | "entryId">, originalInput: string) => void;
  /** Food mode: handler for logging saved meals */
  onLogSavedMeal?: (foodItems: FoodItem[], mealId: string) => void;
  /** Food mode: callback when user clicks "Add New" in saved meals popover */
  onCreateNewMeal?: () => void;
  /** Weights mode: handler for logging saved routines */
  onLogSavedRoutine?: (exerciseSets: SavedExerciseSet[], routineId: string) => void;
  /** Weights mode: callback when user clicks "Add New" in saved routines popover */
  onCreateNewRoutine?: () => void;
  /** Optional override for textarea placeholder */
  placeholder?: string;
  /** Weights mode: user's preferred weight unit for placeholder examples */
  weightUnit?: WeightUnit;
}

export interface LogInputRef {
  clear: () => void;
}

// Backwards compatibility alias
export type FoodInputRef = LogInputRef;

// Check support once at module level (read-only, no state update during render)
const getSpeechRecognitionSupport = (): boolean => {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!((window as any).SpeechRecognition || window.webkitSpeechRecognition);
};

const getCameraSupport = (): boolean => {
  if (typeof navigator === "undefined") return false;
  return !!navigator.mediaDevices?.getUserMedia;
};

export const LogInput = forwardRef<LogInputRef, LogInputProps>(function LogInput(
  { mode, onSubmit, isLoading, onScanResult, onLogSavedMeal, onCreateNewMeal, onLogSavedRoutine, onCreateNewRoutine, placeholder: customPlaceholder, weightUnit },
  ref,
) {
  const config = MODE_CONFIGS[mode];
  const placeholders = getPlaceholders(mode, weightUnit);
  
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [savedMealsOpen, setSavedMealsOpen] = useState(false);
  // Stable random index per component instance
  const [randomIndex] = useState(() => Math.floor(Math.random() * 100));
  // Derive placeholder from current placeholders (updates when weightUnit changes)
  const defaultPlaceholder = placeholders[randomIndex % placeholders.length];

  // Use custom placeholder if provided, otherwise use random default from mode config
  const placeholderText = customPlaceholder ?? defaultPlaceholder;

  // Use ref for recognition instance - no re-renders needed
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Compute support status once (no useState to avoid render-time state updates)
  const voiceSupported = getSpeechRecognitionSupport();
  const cameraSupported = getCameraSupport();

  const { lookupUpc, createFoodItemFromScan, isScanning } = useScanBarcode();
  const { isReadOnly, triggerOverlay } = useReadOnlyContext();

  // Expose clear method to parent
  useImperativeHandle(ref, () => ({
    clear: () => setText(""),
  }));

  // Lazy initialization - only create recognition when user clicks mic
  const getOrCreateRecognition = useCallback((): SpeechRecognition | null => {
    if (recognitionRef.current) return recognitionRef.current;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionClass = (window as any).SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return null;

    try {
      const rec = new SpeechRecognitionClass();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");
        setText(transcript);
      };

      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);

      recognitionRef.current = rec;
      return rec;
    } catch (error) {
      console.error("Failed to initialize speech recognition:", error);
      return null;
    }
  }, []);

  // Cleanup on unmount - ensure microphone is released
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        // abort() is a valid Web Speech API method, but not in all TS type definitions
        (recognitionRef.current as unknown as { abort: () => void }).abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      // abort() is more aggressive than stop() - helps Safari release the microphone
      (recognitionRef.current as unknown as { abort: () => void })?.abort?.();
      setIsListening(false);  // Don't wait for onend - update immediately
      return;
    }

    const recognition = getOrCreateRecognition();
    if (!recognition) return;

    try {
      recognition.start();
      setIsListening(true);
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      setIsListening(false);
    }
  }, [isListening, getOrCreateRecognition]);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;

    // Block submit for read-only users
    if (isReadOnly) {
      triggerOverlay();
      return;
    }

    // Food mode: Check for UPC pattern - route to database lookup instead of AI
    if (mode === 'food') {
      const upc = extractUpcFromText(trimmed);

      if (upc && onScanResult) {
        console.log("Detected UPC in text input, routing to lookup-upc:", upc);
        const result = await lookupUpc(upc);

        if (result.success) {
          const foodItem = createFoodItemFromScan(result.data);
          onScanResult(foodItem, trimmed);
          setText("");
          return;
        }
        // If not found in database, fall through to analyze-food
      }
    }

    // Normal submission
    onSubmit(trimmed);
  };

  const handleBarcodeScan = async (code: string) => {
    setScannerOpen(false);
    console.log("Barcode scanned:", code);

    const result = await lookupUpc(code);

    if (result.success) {
      // Product found - add directly with scanned UPC as original input
      const foodItem = createFoodItemFromScan(result.data);
      if (onScanResult) {
        onScanResult(foodItem, `Scanned: ${code}`);
      } else {
        // Fallback: submit as text if no direct handler
        onSubmit(result.data.description);
      }
    } else if ("notFound" in result && result.notFound) {
      // Not found - populate textarea and auto-submit to analyze-food
      const fallbackText = `Scanned: ${code}`;
      setText(fallbackText);
      // Auto-submit after a brief moment so user sees what's happening
      setTimeout(() => {
        onSubmit(fallbackText);
      }, 100);
    }
  };

  const handleSelectSavedMeal = (foodItems: FoodItem[], mealId: string) => {
    if (onLogSavedMeal) {
      onLogSavedMeal(foodItems, mealId);
      setSavedMealsOpen(false);
    }
  };

  const handleSelectSavedRoutine = (exerciseSets: SavedExerciseSet[], routineId: string) => {
    if (onLogSavedRoutine) {
      onLogSavedRoutine(exerciseSets, routineId);
      setSavedMealsOpen(false);
    }
  };

  const isBusy = isLoading || isScanning;
  const showBarcode = config.showBarcodeScanner && cameraSupported && mode === 'food';
  const showSaved = config.showSavedButton && (mode === 'food' ? onLogSavedMeal : onLogSavedRoutine);

  return (
    <div className="space-y-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholderText}
        aria-label={mode === 'food' ? 'Describe what you ate' : 'Describe your workout'}
        className="min-h-[100px] resize-none"
        disabled={isBusy}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <div className="flex items-center gap-2">
        {voiceSupported && (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleListening}
            disabled={isBusy}
            className={cn("px-2", isListening && "bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground")}
          >
            <Mic className="h-4 w-4 mr-1" />
            {isListening ? "Stop" : "Voice"}
          </Button>
        )}
        {showBarcode && (
          <Button variant="outline" size="sm" className="px-2" onClick={() => setScannerOpen(true)} disabled={isBusy}>
            <ScanBarcode className="h-4 w-4 mr-1" />
            Scan
          </Button>
        )}
        {showSaved && (
          <Popover open={savedMealsOpen} onOpenChange={setSavedMealsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="px-2" disabled={isBusy}>
                <Star className="h-4 w-4 mr-1" />
                Saved
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              {mode === 'food' ? (
                <SavedMealsPopover
                  onSelectMeal={handleSelectSavedMeal}
                  onClose={() => setSavedMealsOpen(false)}
                  onCreateNew={onCreateNewMeal}
                />
              ) : (
                <SavedRoutinesPopover
                  onSelectRoutine={handleSelectSavedRoutine}
                  onClose={() => setSavedMealsOpen(false)}
                  onCreateNew={onCreateNewRoutine}
                />
              )}
            </PopoverContent>
          </Popover>
        )}
        <Button onClick={handleSubmit} disabled={!text.trim() || isBusy} size="sm" className="flex-1 px-2">
          {isBusy ? (
            <>
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">{isScanning ? "Looking up..." : "Adding..."}</span>
              <span className="sm:hidden">...</span>
            </>
          ) : (
            <>
              <Send className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">{config.submitLabel}</span>
              <span className="sm:hidden">{config.submitLabelShort}</span>
            </>
          )}
        </Button>
      </div>

      {showBarcode && (
        <BarcodeScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleBarcodeScan} />
      )}
    </div>
  );
});

// Backwards compatibility alias
export const FoodInput = LogInput;
