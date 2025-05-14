import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function useGame() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Blackjack game
  const playBlackjack = useMutation({
    mutationFn: async ({ bet, mode }: { bet: number, mode: 'easy' | 'hard' }) => {
      const response = await apiRequest('POST', '/api/games/blackjack', { bet, mode });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to play blackjack: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Coinflip game
  const playCoinflip = useMutation({
    mutationFn: async ({ prediction, bet }: { prediction: 'heads' | 'tails', bet: number }) => {
      const response = await apiRequest('POST', '/api/games/coinflip', { prediction, bet });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to play coinflip: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Crash game
  const playCrash = useMutation({
    mutationFn: async ({ bet, mode }: { bet: number, mode: 'easy' | 'hard' }) => {
      const response = await apiRequest('POST', '/api/games/crash', { bet, mode });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to play crash: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Find The Lady game
  const playFindTheLady = useMutation({
    mutationFn: async ({ bet, mode }: { bet: number, mode: 'easy' | 'hard' }) => {
      const response = await apiRequest('POST', '/api/games/findthelady', { bet, mode });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to play Find The Lady: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Connect Four game
  const createConnectFourGame = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/games/connectfour', {});
      return response.json();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create Connect Four game: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Random game
  const playRandomGame = useMutation({
    mutationFn: async ({ bet, mode }: { bet: number, mode: 'easy' | 'hard' }) => {
      const response = await apiRequest('POST', '/api/games/gamble', { bet, mode });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to play random game: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  return {
    playBlackjack,
    playCoinflip,
    playCrash,
    playFindTheLady,
    createConnectFourGame,
    playRandomGame,
  };
}
