import { useState } from 'react';
import { Lightbulb, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSubmitFeedback } from '@/hooks/useFeedback';

export default function Help() {
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const submitFeedback = useSubmitFeedback();

  const handleSubmit = async () => {
    if (!message.trim()) return;
    
    try {
      await submitFeedback.mutateAsync(message.trim());
      setMessage('');
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tips Section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Tips</h2>
        </div>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-foreground">•</span>
            <span>Log <span className="text-foreground">food</span> and <span className="text-foreground">weight lifting</span> now. More tracking types coming soon.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-foreground">•</span>
            <span>Just <span className="text-foreground">braindump</span> your inputs however you want — the AI figures out the formatting.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-foreground">•</span>
            <span>Editing <span className="text-foreground">calories</span> auto-scales protein, carbs, and fat proportionally.</span>
          </li>
        </ul>
      </section>

      {/* Feedback Section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Feedback</h2>
        </div>
        
        {submitted ? (
          <p className="text-sm text-muted-foreground">Thanks for the feedback!</p>
        ) : (
          <div className="space-y-2">
            <Textarea
              placeholder="Feature requests, bugs, or ideas..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[80px] text-sm resize-none"
              maxLength={1000}
            />
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!message.trim() || submitFeedback.isPending}
            >
              {submitFeedback.isPending ? 'Sending...' : 'Send Feedback'}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
