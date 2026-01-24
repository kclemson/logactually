import { useState, useImperativeHandle, forwardRef, useRef, useCallback } from 'react';
import { Mic, MicOff, Send, Loader2, ScanBarcode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { useScanBarcode } from '@/hooks/useScanBarcode';
import { FoodItem } from '@/types/food';

interface FoodInputProps {
  onSubmit: (text: string) => void;
  isLoading?: boolean;
  onScanResult?: (foodItem: Omit<FoodItem, 'uid' | 'entryId'>) => void;
}

export interface FoodInputRef {
  clear: () => void;
}

// Check support once at module level (read-only, no state update during render)
const getSpeechRecognitionSupport = (): boolean => {
  if (typeof window === 'undefined') return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!((window as any).SpeechRecognition || window.webkitSpeechRecognition);
};

const getCameraSupport = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return !!navigator.mediaDevices?.getUserMedia;
};

export const FoodInput = forwardRef<FoodInputRef, FoodInputProps>(
  function FoodInput({ onSubmit, isLoading, onScanResult }, ref) {
    const [text, setText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [scannerOpen, setScannerOpen] = useState(false);
    
    // Use ref for recognition instance - no re-renders needed
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    
    // Compute support status once (no useState to avoid render-time state updates)
    const voiceSupported = getSpeechRecognitionSupport();
    const cameraSupported = getCameraSupport();

    const { lookupUpc, createFoodItemFromScan, isScanning } = useScanBarcode();

    // Expose clear method to parent
    useImperativeHandle(ref, () => ({
      clear: () => setText(''),
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
        rec.lang = 'en-US';

        rec.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join('');
          setText(transcript);
        };

        rec.onend = () => setIsListening(false);
        rec.onerror = () => setIsListening(false);

        recognitionRef.current = rec;
        return rec;
      } catch (error) {
        console.error('Failed to initialize speech recognition:', error);
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
        console.error('Failed to start speech recognition:', error);
        setIsListening(false);
      }
    }, [isListening, getOrCreateRecognition]);

    const handleSubmit = () => {
      if (text.trim() && !isLoading && !isScanning) {
        onSubmit(text.trim());
      }
    };

    const handleBarcodeScan = async (code: string) => {
      setScannerOpen(false);
      console.log('Barcode scanned:', code);

      const result = await lookupUpc(code);

      if (result.success) {
        // Product found - add directly
        const foodItem = createFoodItemFromScan(result.data);
        if (onScanResult) {
          onScanResult(foodItem);
        } else {
          // Fallback: submit as text if no direct handler
          onSubmit(result.data.description);
        }
      } else if ('notFound' in result && result.notFound) {
        // Not found - populate textarea and auto-submit to analyze-food
        const fallbackText = `UPC barcode: ${result.upc}`;
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
          placeholder="What did you eat?"
          className="min-h-[120px] resize-none"
          disabled={isBusy}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
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
              className={isListening ? 'bg-destructive text-destructive-foreground' : ''}
            >
              {isListening ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
              Voice
            </Button>
          )}
          {cameraSupported && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScannerOpen(true)}
              disabled={isBusy}
            >
              <ScanBarcode className="h-4 w-4 mr-2" />
              Scan Bar Code
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!text.trim() || isBusy}
            size="sm"
            className="flex-1"
          >
            {isBusy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isScanning ? 'Looking up...' : 'Adding...'}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Add Food
              </>
            )}
          </Button>
        </div>

        <BarcodeScanner
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScan={handleBarcodeScan}
        />
      </div>
    );
  }
);
