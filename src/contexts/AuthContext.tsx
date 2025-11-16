import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  role: string;
  organization_id?: string;
  first_name?: string;
  last_name?: string;
}

interface AuthContextType {
  user: User | null;
  apiKey: string | null;
  isLoading: boolean;
  login: (apiKey: string) => Promise<boolean>;
  logout: () => void;
  setApiKey: (key: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const API_BASE_URL = 'https://lynxa-pro-backend.vercel.app';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    return localStorage.getItem('lynxa_api_key');
  });
  const [isLoading, setIsLoading] = useState(false);

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    localStorage.setItem('lynxa_api_key', key);
  };

  const login = async (key: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Validate API key by calling the analytics endpoint
      const response = await fetch(`${API_BASE_URL}/api/analytics`, {
        headers: {
          'X-API-Key': key,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApiKey(key);
        
        // Mock user data based on successful API call
        setUser({
          id: 'user_' + Math.random().toString(36).substr(2, 9),
          email: 'user@nexariq.com',
          role: 'user',
          first_name: 'Nexariq',
          last_name: 'User'
        });
        
        toast({
          title: '🚀 Welcome to Nexariq AI',
          description: 'Successfully connected to Lynxa Pro Backend',
        });
        
        return true;
      } else {
        toast({
          title: '❌ Invalid API Key',
          description: 'Please check your API key and try again.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: '🔌 Connection Error',
        description: 'Unable to connect to Lynxa Pro Backend. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setApiKeyState(null);
    localStorage.removeItem('lynxa_api_key');
    toast({
      title: '👋 Logged out',
      description: 'You have been successfully logged out.',
    });
  };

  // Auto-login on mount if API key exists
  useEffect(() => {
    if (apiKey && !user) {
      login(apiKey);
    }
  }, []);

  const value = {
    user,
    apiKey,
    isLoading,
    login,
    logout,
    setApiKey,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
