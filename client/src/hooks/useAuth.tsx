import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface User {
  id: number;
  username: string;
  cash: number;
  level: number;
  xp: number;
  nextLevelXP: number;
  wins: number;
  losses: number;
  winRate: number;
  highestWin: number;
  stats: {
    favoriteGame: string;
    globalRank: number;
    serverRank: number;
  };
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // This is a simplified auth system since we don't have real authentication
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/users/me', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      
      // In a real app, this would be a login endpoint
      // For now, we'll simulate a successful login
      const response = await apiRequest('POST', '/api/auth/login', {
        username,
        password,
      });
      
      const data = await response.json();
      setUser(data);
      setIsAuthenticated(true);
      
      // Invalidate cached data
      queryClient.invalidateQueries();
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      
      toast({
        title: 'Login Failed',
        description: 'Invalid username or password.',
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // In a real app, this would call a logout endpoint
      await apiRequest('POST', '/api/auth/logout', {});
      
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear cached data
      queryClient.clear();
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
  };
}
