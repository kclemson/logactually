import { useState, useEffect } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface FoodInputProps {
  onSubmit: (text: string) => void;
  isLoading?: boolean;
  shouldClear?: boolean;
  onCleared?: () => void;
}

export function FoodInput({ onSubmit, isLoading, shouldClear, onCleared }: FoodInputProps) {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<typeof window.webkitSpeechRecognition.prototype | null>(null);

  useEffect(() => {
    if (shouldClear) {
      setText('');
      onCleared?.();
    }
  }, [shouldClear, onCleared]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionClass = window.webkitSpeechRecognition;
      const rec = new SpeechRecognitionClass();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('');
        setText(transcript);
      };

      rec.onend = () => setIsListening(false);
      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          variant: 'destructive',
          title: 'Voice input failed',
          description: 'Please try again or type your food.',
        });
      };

      setRecognition(rec);
    }
  }, [toast]);

  const toggleListening = () => {
    if (!recognition) {
      toast({
        variant: 'destructive',
        title: 'Voice not supported',
        description: 'Your browser does not support voice input.',
      });
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

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
        placeholder="What did you eat? (e.g., 'grilled chicken breast with rice and broccoli')"
        className="min-h-[120px] resize-none text-base"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleListening}
          className={isListening ? 'bg-destructive text-destructive-foreground' : ''}
        >
          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading}
          className="flex-1"
        >
          {isLoading ? (
            'Analyzing...'
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Analyze
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
