import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface PinnedChat {
  id: string;
  question: string;
  answer: string;
  mode: 'food' | 'exercise';
  created_at: string;
}

export function usePinnedChats() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pinnedChats = [] } = useQuery({
    queryKey: ['pinned-chats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pinned_chats')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PinnedChat[];
    },
    enabled: !!user,
  });

  const pinMutation = useMutation({
    mutationFn: async ({ question, answer, mode }: { question: string; answer: string; mode: 'food' | 'exercise' }) => {
      const { data, error } = await supabase
        .from('pinned_chats')
        .insert({ user_id: user!.id, question, answer, mode })
        .select()
        .single();
      if (error) throw error;
      return data as PinnedChat;
    },
    onMutate: async ({ question, answer, mode }) => {
      await queryClient.cancelQueries({ queryKey: ['pinned-chats'] });
      const previous = queryClient.getQueryData<PinnedChat[]>(['pinned-chats']) ?? [];
      const optimistic: PinnedChat = {
        id: crypto.randomUUID(),
        question,
        answer,
        mode,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<PinnedChat[]>(['pinned-chats'], [optimistic, ...previous]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['pinned-chats'], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['pinned-chats'] }),
  });

  const unpinMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pinned_chats').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['pinned-chats'] });
      const previous = queryClient.getQueryData<PinnedChat[]>(['pinned-chats']) ?? [];
      queryClient.setQueryData<PinnedChat[]>(['pinned-chats'], previous.filter((c) => c.id !== id));
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['pinned-chats'], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['pinned-chats'] }),
  });

  return {
    pinnedChats,
    pinCount: pinnedChats.length,
    pinMutation,
    unpinMutation,
  };
}
