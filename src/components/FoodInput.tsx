import { useState, useImperativeHandle, forwardRef, useRef, useCallback } from 'react';
import { Mic, MicOff, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface FoodInputProps {
  onSubmit: (text: string) => void;
  isLoading?: boolean;
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

export const FoodInput = forwardRef<FoodInputRef, FoodInputProps>(
  function FoodInput({ onSubmit, isLoading }, ref) {
    const [text, setText] = useState('');
    const [isListening, setIsListening] = useState(false);
    
    // Use ref for recognition instance - no re-renders needed
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    
    // Compute support status once (no useState to avoid render-time state updates)
    const voiceSupported = getSpeechRecognitionSupport();

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
      if (text.trim() && !isLoading) {
        onSubmit(text.trim());
      }
    };

    return (
      <div className="space-y-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What did you eat?"
          className="min-h-[120px] resize-none text-body"
          disabled={isLoading}
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
              size="icon"
              onClick={toggleListening}
              disabled={isLoading}
              className={isListening ? 'bg-destructive text-destructive-foreground' : ''}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!text.trim() || isLoading}
            className="flex-1"
          >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Add Food
            </>
          )}
          </Button>
        </div>
      </div>
    );
  }
);
