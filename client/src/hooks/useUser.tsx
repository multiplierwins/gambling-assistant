import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function useUser() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/users/me'],
  });
  
  const claimDaily = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/economy/daily', {});
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cooldowns'] });
      
      toast({
        title: 'Daily Reward Claimed!',
        description: `You received ${data.reward.toLocaleString()} cash.`,
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to claim daily reward: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const work = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/economy/work', {});
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cooldowns'] });
      
      toast({
        title: 'Work Completed!',
        description: `You earned ${data.reward.toLocaleString()} cash.`,
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to work: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  return {
    user,
    isLoading,
    error,
    claimDaily,
    work,
  };
}
