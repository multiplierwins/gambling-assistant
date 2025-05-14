import { useQuery } from '@tanstack/react-query';

export function useLeaderboard() {
  // Cash leaderboard (richest players)
  const useCashLeaderboard = (isServer: boolean = false) => {
    return useQuery({
      queryKey: [`/api/leaderboard/cash${isServer ? '?server=true' : ''}`],
    });
  };
  
  // Level leaderboard (highest level players)
  const useLevelLeaderboard = (isServer: boolean = false) => {
    return useQuery({
      queryKey: [`/api/leaderboard/level${isServer ? '?server=true' : ''}`],
    });
  };
  
  return {
    useCashLeaderboard,
    useLevelLeaderboard,
  };
}
