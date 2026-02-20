import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SubmitFeedbackPayload {
  message: string;
  imageFile?: File;
}

export function useSubmitFeedback() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ message, imageFile }: SubmitFeedbackPayload) => {
      if (!user) throw new Error('Not authenticated');

      let image_url: string | null = null;

      if (imageFile) {
        const timestamp = Date.now();
        const path = `${user.id}/${timestamp}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('feedback-images')
          .upload(path, imageFile, { contentType: 'image/jpeg', upsert: false });
        if (uploadError) throw uploadError;
        image_url = path;
      }

      const { error } = await supabase
        .from('feedback')
        .insert({ user_id: user.id, message, image_url } as any);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFeedback'] });
      queryClient.invalidateQueries({ queryKey: ['userFeedback'] });
    },
  });
}
