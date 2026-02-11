import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AskTrendsAIParams {
  question: string;
  mode: 'food' | 'exercise';
  includeProfile: boolean;
}

interface AskTrendsAIResponse {
  answer: string;
}

export function useAskTrendsAI() {
  return useMutation({
    mutationFn: async ({ question, mode, includeProfile }: AskTrendsAIParams): Promise<AskTrendsAIResponse> => {
      const { data, error } = await supabase.functions.invoke('ask-trends-ai', {
        body: { question, mode, includeProfile },
      });

      if (error) throw error;

      // Handle rate limit / payment errors surfaced from the edge function
      if (data?.error) {
        throw new Error(data.error);
      }

      return data as AskTrendsAIResponse;
    },
  });
}
