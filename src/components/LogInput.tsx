import { useState, useImperativeHandle, forwardRef, useRef, useCallback, useEffect } from "react";
import { Mic, Send, Loader2, ScanBarcode, Star, Camera, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { PhotoCapture, PhotoCaptureRef } from "@/components/PhotoCapture";
import { SavedMealsPopover } from "@/components/SavedMealsPopover";
import { SavedRoutinesPopover } from "@/components/SavedRoutinesPopover";
import { useScanBarcode } from "@/hooks/useScanBarcode";
import { extractUpcFromText, SCANNED_BARCODE_PREFIX } from "@/lib/upc-utils";
import { FoodItem } from "@/types/food";
import { SavedExerciseSet } from "@/types/weight";
import type { WeightUnit } from "@/lib/weight-units";

// Mode-specific configurations
export type LogMode = 'food' | 'weights';

const FOOD_PLACEHOLDER_EXAMPLES = [
  "Describe what you ate, such as: McDs egg mcmuffin and like half the hash brown",
  "Describe what you ate, such as: grande oat milk latte from Starbucks and most of a banana",
  "Describe what you ate, such as: Chipotle bowl with chicken and extra guac",
  "Describe what you ate, such as: blueberry muffin but only the top part",
  "Describe what you ate, such as: protein bar (the kirkland ones from costco)",
  "Describe what you ate, such as: leftover Domino's, two and a half slices of pepperoni",
  "Describe what you ate, such as: a slice of banana bread from this recipe but without the nuts: https://natashaskitchen.com/banana-bread-recipe-video/",
  "Describe what you ate, such as: In-N-Out double double animal style and half a chocolate shake",
  "Describe what you ate, such as: two cups of coffee with a splash of oat milk",
  "Describe what you ate, such as: a few bites of brownie batter while baking, maybe 150 calories worth",
];

const WEIGHTS_PLACEHOLDER_EXAMPLES_LBS = [
  "Describe your workout: bench press 4x8 at 135",
  "Describe your workout: squats 5x5 at 185 lbs, then leg press 3x12 at 200",
  "Describe your workout: ran 2 miles in 18 minutes, avg heart rate 145bpm",
  "Describe your workout: 45 min bike ride, moderate pace, about 8 miles",
  "Describe your workout: swam laps for 30 minutes, felt like a hard effort",
  "Describe your workout: walked the dog for 40 minutes, 1.2 miles, 108 avg HR",
  "Describe your workout: 20 min on the stairmaster at level 7, burned about 200 cal",
  "Describe your workout: gardening for 30 minutes, just pruning so not too heavy",
  "Describe your workout: leg extensions and hamstring curls, 3 sets each",
];

const WEIGHTS_PLACEHOLDER_EXAMPLES_KG = [
  "Describe your workout: bench press 4x8 at 60 kg",
  "Describe your workout: squats 5x5 at 85 kg, then leg press 3x12 at 90 kg",
  "Describe your workout: ran 3k in 18 minutes, avg heart rate 145bpm",
  "Describe your workout: 45 min bike ride, moderate pace, about 13 km",
  "Describe your workout: swam laps for 30 minutes, felt like a hard effort",
  "Describe your workout: walked the dog for 40 minutes, 3 km, 112 avg HR",
  "Describe your workout: 20 min on the stairmaster at level 7, burned about 200 cal",
  "Describe your workout: gardening for 30 minutes, just pruning so not too heavy",
  "Describe your workout: leg extensions and hamstring curls, 3 sets each",
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
  /** Food mode: handler for photo analysis */
  onPhotoSubmit?: (base64: string) => void;
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
  { mode, onSubmit, isLoading, onScanResult, onPhotoSubmit, onLogSavedMeal, onCreateNewMeal, onLogSavedRoutine, onCreateNewRoutine, placeholder: customPlaceholder, weightUnit },
  ref,
) {
  const config = MODE_CONFIGS[mode];
  const placeholders = getPlaceholders(mode, weightUnit);
  
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [savedMealsOpen, setSavedMealsOpen] = useState(false);
  const [photoPopoverOpen, setPhotoPopoverOpen] = useState(false);
  const photoCaptureRef = useRef<PhotoCaptureRef>(null);
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

    // Note: read-only check moved to parent components (FoodLog/WeightLog)
    // This allows demo users to see AI analysis results before the preview dialog

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
        onScanResult(foodItem, `${SCANNED_BARCODE_PREFIX} ${code}`);
      } else {
        // Fallback: submit as text if no direct handler
        onSubmit(result.data.description);
      }
    } else if ("notFound" in result && result.notFound) {
      // Not found - populate textarea and auto-submit to analyze-food
      const fallbackText = `${SCANNED_BARCODE_PREFIX} ${code}`;
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

  const handlePhotoSelected = useCallback((base64: string) => {
    setPhotoPopoverOpen(false);
    onPhotoSubmit?.(base64);
  }, [onPhotoSubmit]);

  const isBusy = isLoading || isScanning;
  const showBarcode = config.showBarcodeScanner && cameraSupported && mode === 'food';
  const showPhoto = mode === 'food' && onPhotoSubmit;
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
            <Mic className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">{isListening ? "Stop" : "Voice"}</span>
          </Button>
        )}
        {showPhoto && (
          <Popover open={photoPopoverOpen} onOpenChange={setPhotoPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="px-2" disabled={isBusy}>
                <Camera className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Photo</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="start">
              <button
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
                onClick={() => {
                  photoCaptureRef.current?.openCamera();
                  setPhotoPopoverOpen(false);
                }}
              >
                <Camera className="h-4 w-4" />
                Take Photo
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
                onClick={() => {
                  photoCaptureRef.current?.openGallery();
                  setPhotoPopoverOpen(false);
                }}
              >
                <ImagePlus className="h-4 w-4" />
                Choose Photo
              </button>
            </PopoverContent>
          </Popover>
        )}
        {showBarcode && (
          <Button variant="outline" size="sm" className="px-2" onClick={() => setScannerOpen(true)} disabled={isBusy}>
            <ScanBarcode className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Scan</span>
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
        <Button 
          onClick={handleSubmit} 
          disabled={!text.trim() || isBusy} 
          size="sm" 
          className={cn(
            "flex-1 px-2",
            mode === 'food' 
              ? "bg-blue-600 hover:bg-blue-700 text-white" 
              : "bg-purple-600 hover:bg-purple-700 text-white"
          )}
        >
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
      {showPhoto && (
        <PhotoCapture ref={photoCaptureRef} onPhotoSelected={handlePhotoSelected} />
      )}
    </div>
  );
});

// Backwards compatibility alias
export const FoodInput = LogInput;
