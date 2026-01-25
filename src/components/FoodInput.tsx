import { useState, useImperativeHandle, forwardRef, useRef, useCallback } from "react";
import { Mic, MicOff, Send, Loader2, ScanBarcode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useScanBarcode } from "@/hooks/useScanBarcode";
import { extractUpcFromText } from "@/lib/upc-utils";
import { FoodItem } from "@/types/food";

const PLACEHOLDER_EXAMPLES = [
  "Describe what you ate, such as: McDs egg mcmuffin and like half the hash brown",
  "Describe what you ate, such as: grande oat milk latte from Starbucks and most of a banana",
  "Describe what you ate, such as: Chipotle bowl with chicken and extra guac",
  "Describe what you ate, such as: blueberry muffin but only the top part",
  "Describe what you ate, such as: iced coffee, couple bites of my friend's bagel",
  "Describe what you ate, such as: lean cuisine alfredo noodles and an apple with around 2Tb of peanut butter",
  "Describe what you ate, such as: protein bar (the kirkland ones from costco)",
  "Describe what you ate, such as: leftover Domino's, two and a half slices of pepperoni",
];

interface FoodInputProps {
  onSubmit: (text: string) => void;
  isLoading?: boolean;
  onScanResult?: (foodItem: Omit<FoodItem, "uid" | "entryId">, originalInput: string) => void;
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
  { onSubmit, isLoading, onScanResult },
  ref,
) {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [placeholder] = useState(() => PLACEHOLDER_EXAMPLES[Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length)]);

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

  const isBusy = isLoading || isScanning;

  return (
    <div className="space-y-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
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
            className={isListening ? "bg-destructive text-destructive-foreground" : ""}
          >
            {isListening ? <MicOff className="h-4 w-4 mr-1" /> : <Mic className="h-4 w-4 mr-1" />}
            Voice
          </Button>
        )}
        {cameraSupported && (
          <Button variant="outline" size="sm" onClick={() => setScannerOpen(true)} disabled={isBusy}>
            <ScanBarcode className="h-4 w-4 mr-1" />
            Bar Code
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={!text.trim() || isBusy} size="sm" className="flex-1">
          {isBusy ? (
            <>
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              {isScanning ? "Looking up..." : "Adding..."}
            </>
          ) : (
            <>
              <Send className="mr-1 h-4 w-4" />
              Add Food
            </>
          )}
        </Button>
      </div>

      <BarcodeScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleBarcodeScan} />
    </div>
  );
});
