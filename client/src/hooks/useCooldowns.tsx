import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export interface Cooldown {
  type: string;
  label: string;
  description: string;
  isReady: boolean;
  timeLeft: number;
}

export function useCooldowns() {
  const queryClient = useQueryClient();
  
  const { data: cooldowns, isLoading, error } = useQuery<Cooldown[]>({
    queryKey: ['/api/cooldowns'],
  });
  
  // Set up a timer to refresh cooldowns periodically
  useEffect(() => {
    // Only set up timer if we have cooldowns that aren't ready
    if (cooldowns && cooldowns.some(c => !c.isReady)) {
      const timer = setInterval(() => {
        // Update cooldowns every second
        queryClient.invalidateQueries({ queryKey: ['/api/cooldowns'] });
      }, 10000); // Refresh every 10 seconds
      
      return () => clearInterval(timer);
    }
  }, [cooldowns, queryClient]);
  
  // Format a cooldown time in seconds to a readable string
  const formatCooldown = (seconds: number): string => {
    if (seconds <= 0) return 'Ready';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m ${secs}s`;
    }
  };
  
  // Check if a specific cooldown is ready
  const isCooldownReady = (type: string): boolean => {
    if (!cooldowns) return false;
    const cooldown = cooldowns.find(c => c.type === type);
    return cooldown ? cooldown.isReady : true;
  };
  
  // Get the time left for a specific cooldown
  const getCooldownTimeLeft = (type: string): number => {
    if (!cooldowns) return 0;
    const cooldown = cooldowns.find(c => c.type === type);
    return cooldown ? cooldown.timeLeft : 0;
  };
  
  return {
    cooldowns,
    isLoading,
    error,
    formatCooldown,
    isCooldownReady,
    getCooldownTimeLeft,
  };
}
