import { useState, useImperativeHandle, forwardRef, useRef, useCallback } from "react";
import { Mic, Send, Loader2, ScanBarcode, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { SavedMealsPopover } from "@/components/SavedMealsPopover";
import { useScanBarcode } from "@/hooks/useScanBarcode";
import { extractUpcFromText, SCANNED_BARCODE_PREFIX } from "@/lib/upc-utils";
import { FoodItem } from "@/types/food";

const PLACEHOLDER_EXAMPLES = [
  "Describe what you ate, such as: McDs egg mcmuffin and like half the hash brown",
  "Describe what you ate, such as: grande oat milk latte from Starbucks and most of a banana",
  "Describe what you ate, such as: Chipotle bowl with chicken and extra guac",
  "Describe what you ate, such as: blueberry muffin but only the top part",
  "Describe what you ate, such as: lean cuisine alfredo noodles and an apple with around 2Tb of peanut butter",
  "Describe what you ate, such as: protein bar (the kirkland ones from costco)",
  "Describe what you ate, such as: leftover Domino's, two and a half slices of pepperoni",
  "Describe what you ate, such as: a slice of banana bread from this recipe but without the nuts: https://natashaskitchen.com/banana-bread-recipe-video/",
];

interface FoodInputProps {
  onSubmit: (text: string) => void;
  isLoading?: boolean;
  onScanResult?: (foodItem: Omit<FoodItem, "uid" | "entryId">, originalInput: string) => void;
  onLogSavedMeal?: (foodItems: FoodItem[], mealId: string) => void;
  onCreateNewMeal?: () => void; // Callback when user clicks "Add New Meal" in saved meals popover
  placeholder?: string; // Optional override for textarea placeholder
}

export interface FoodInputRef {
  clear: () => void;
}

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

export const FoodInput = forwardRef<FoodInputRef, FoodInputProps>(function FoodInput(
  { onSubmit, isLoading, onScanResult, onLogSavedMeal, onCreateNewMeal, placeholder: customPlaceholder },
  ref,
) {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [savedMealsOpen, setSavedMealsOpen] = useState(false);
  const [defaultPlaceholder] = useState(
    () => PLACEHOLDER_EXAMPLES[Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length)],
  );

  // Use custom placeholder if provided, otherwise use random default
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

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
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

    // Check for UPC pattern - route to database lookup instead of AI
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

    // Normal food description - use analyze-food
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

  const isBusy = isLoading || isScanning;

  return (
    <div className="space-y-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholderText}
        aria-label="Describe what you ate"
        className="min-h-[80px] resize-none"
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
            className={cn("px-2", isListening && "bg-destructive text-destructive-foreground")}
          >
            <Mic className="h-4 w-4 mr-1" />
            {isListening ? "Stop" : "Voice"}
          </Button>
        )}
        {cameraSupported && (
          <Button variant="outline" size="sm" className="px-2" onClick={() => setScannerOpen(true)} disabled={isBusy}>
            <ScanBarcode className="h-4 w-4 mr-1" />
            Scan
          </Button>
        )}
        {onLogSavedMeal && (
          <Popover open={savedMealsOpen} onOpenChange={setSavedMealsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="px-2" disabled={isBusy}>
                <Star className="h-4 w-4 mr-1" />
                Saved
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <SavedMealsPopover
                onSelectMeal={handleSelectSavedMeal}
                onClose={() => setSavedMealsOpen(false)}
                onCreateNew={onCreateNewMeal}
              />
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
              <span className="hidden sm:inline">Add Food</span>
              <span className="sm:hidden">Add</span>
            </>
          )}
        </Button>
      </div>

      <BarcodeScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleBarcodeScan} />
    </div>
  );
});
