import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  role: string;
  organization_id?: string;
  first_name?: string;
  last_name?: string;
  created_at?: string;
  plan?: string;
  organization?: string;
  stripe_customer_id?: string;
  subscription_status?: string;
  avatar_url?: string;
}

interface ApiKey {
  id: string;
  api_key: string;
  name: string;
  created_at: string;
  last_used: string | null;
  usage_count: number;
  is_active: boolean;
  user_email: string;
  plan_type?: string;
  rate_limit?: number;
}

interface Subscription {
  id: string;
  plan_name: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  price: number;
  billing_interval: string;
}

interface UsageStats {
  total_requests: number;
  total_api_calls: number;
  avg_response_time: number;
  error_count: number;
  active_keys: number;
  current_month_usage: number;
  plan_limit: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  apiKey: string | null;
  userApiKeys: ApiKey[];
  subscription: Subscription | null;
  usageStats: UsageStats | null;
  login: (email: string, password?: string) => Promise<boolean>;
  signup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  generateApiKey: (name: string, email: string, planType?: string) => Promise<string | null>;
  revokeApiKey: (keyId: string) => Promise<boolean>;
  getUserApiKeys: () => Promise<void>;
  getBillingInfo: () => Promise<void>;
  getUsageStats: () => Promise<void>;
  createCheckoutSession: (planId: string) => Promise<string | null>;
  cancelSubscription: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const API_BASE_URL = 'https://lynxa-pro-backend.vercel.app';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userApiKeys, setUserApiKeys] = useState<ApiKey[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    return localStorage.getItem('lynxa_api_key');
  });

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    localStorage.setItem('lynxa_api_key', key);
  };

  useEffect(() => {
    // Check for existing API key on mount
    const storedKey = localStorage.getItem('lynxa_api_key');
    const storedUser = localStorage.getItem('lynxa_user');
    
    if (storedKey && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setApiKeyState(storedKey);
        setIsAuthenticated(true);
        getUserApiKeys();
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('lynxa_user');
        localStorage.removeItem('lynxa_api_key');
      }
    }
    setIsLoading(false);
  }, []);

  const validateAndLogin = async (key: string) => {
    setIsLoading(true);
    try {
      // Validate API key by calling the analytics endpoint
      const response = await fetch(`${API_BASE_URL}/api/analytics`, {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setApiKey(key);
        setIsAuthenticated(true);
        
        // Try to get user info from the API key
        // For now, we'll create a mock user from the key
        const userData: User = {
          id: 'user_' + Math.random().toString(36).substr(2, 9),
          email: extractEmailFromKey(key) || 'user@nexariq.com',
          role: 'user',
          first_name: 'Nexariq',
          last_name: 'User',
          plan: 'free',
          created_at: new Date().toISOString()
        };
        
        setUser(userData);
        localStorage.setItem('lynxa_user', JSON.stringify(userData));
        
        // Load user's API keys
        await getUserApiKeys();
        
        return true;
      } else {
        // Invalid key, clear everything
        clearAuth();
        return false;
      }
    } catch (error) {
      console.error('Login validation failed:', error);
      clearAuth();
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const extractEmailFromKey = (key: string): string | null => {
    // Try to extract email from key if it's encoded or contains it
    // For now, return null as keys don't contain emails directly
    return null;
  };

  const clearAuth = () => {
    setIsAuthenticated(false);
    setUser(null);
    setApiKeyState(null);
    setUserApiKeys([]);
    localStorage.removeItem('lynxa_api_key');
    localStorage.removeItem('lynxa_user');
  };

  const login = async (email: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // For demo purposes, authenticate with email and generate API key
      if (password) {
        // Generate API key for user authentication
        const response = await fetch(`${API_BASE_URL}/api/generate-key`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            name: 'Login Session Key',
            first_name: 'User',
            last_name: 'Account'
          })
        });

        const data = await response.json();

        if (response.ok && data.apiKey) {
          // Create user object
          const userData: User = {
            id: 'user_' + Math.random().toString(36).substr(2, 9),
            email: email.trim(),
            role: 'user',
            first_name: 'Nexariq',
            last_name: 'User',
            plan: 'free',
            created_at: new Date().toISOString()
          };
          
          setUser(userData);
          setApiKeyState(data.apiKey);
          localStorage.setItem('lynxa_user', JSON.stringify(userData));
          localStorage.setItem('lynxa_api_key', data.apiKey);
          setIsAuthenticated(true);
          
          // Load additional data
          await Promise.all([
            getUserApiKeys(),
            getBillingInfo(),
            getUsageStats()
          ]);
          
          toast({
            title: '🚀 Welcome to Nexariq!',
            description: `Successfully logged in as ${email}`,
          });
          return true;
        }
      } else {
        // Fallback to API key validation
        const success = await validateAndLogin(email);
        if (success) {
          toast({
            title: '🚀 Welcome to Nexariq AI',
            description: 'Successfully connected with API key',
          });
          return true;
        }
      }
      
      toast({
        title: '❌ Authentication Failed',
        description: 'Unable to authenticate. Please check your credentials.',
        variant: 'destructive',
      });
      return false;
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

  const signup = async (email: string, password: string, firstName?: string, lastName?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Generate API key for new user
      const response = await fetch(`${API_BASE_URL}/api/generate-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          name: 'Account Registration Key',
          first_name: firstName || 'User',
          last_name: lastName || 'Account'
        })
      });

      const data = await response.json();

      if (response.ok && data.apiKey) {
        // Create user object
        const userData: User = {
          id: 'user_' + Math.random().toString(36).substr(2, 9),
          email: email.trim(),
          role: 'user',
          first_name: firstName || 'User',
          last_name: lastName || 'Account',
          plan: 'free',
          created_at: new Date().toISOString()
        };
        
        // Auto-login after successful signup
        setUser(userData);
        setApiKeyState(data.apiKey);
        localStorage.setItem('lynxa_user', JSON.stringify(userData));
        localStorage.setItem('lynxa_api_key', data.apiKey);
        setIsAuthenticated(true);
        
        toast({
          title: '🎉 Account Created!',
          description: `Welcome to Nexariq AI, ${firstName || email}!`,
        });
        
        return true;
      } else {
        toast({
          title: 'Signup Failed',
          description: data.error || 'Failed to create account',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: 'Registration Error',
        description: 'Unable to create account. Please try again.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
    toast({
      title: '👋 Logged out',
      description: 'You have been successfully logged out.',
    });
  };

  const refreshUser = async () => {
    if (isAuthenticated && apiKey) {
      await validateAndLogin(apiKey);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('lynxa_user', JSON.stringify(updatedUser));
    }
  };

  const generateApiKey = async (name: string, email: string, planType?: string): Promise<string | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          email: email,
          first_name: user?.first_name,
          last_name: user?.last_name,
          organization: user?.organization,
          plan_type: planType || 'free'
        })
      });

      const data = await response.json();

      if (response.ok && data.apiKey) {
        // Refresh the user's API keys list
        await getUserApiKeys();
        
        toast({
          title: '🎉 API Key Generated!',
          description: `Your ${planType || 'free'} tier API key has been created successfully.`,
        });
        
        return data.apiKey;
      } else {
        throw new Error(data.error || 'Failed to generate API key');
      }
    } catch (error) {
      console.error('API key generation failed:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate API key',
        variant: 'destructive'
      });
      return null;
    }
  };

  const revokeApiKey = async (keyId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/revoke-key`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key_id: keyId })
      });

      if (response.ok) {
        // Refresh the API keys list
        await getUserApiKeys();
        
        toast({
          title: 'Key Revoked',
          description: 'API key has been revoked successfully',
        });
        
        return true;
      } else {
        throw new Error('Failed to revoke API key');
      }
    } catch (error) {
      console.error('Failed to revoke key:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke API key',
        variant: 'destructive'
      });
      return false;
    }
  };

  const getUserApiKeys = async (): Promise<void> => {
    if (!user?.email || !apiKey) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/keys`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserApiKeys(data.keys || []);
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  const getBillingInfo = async (): Promise<void> => {
    if (!apiKey) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/billing?action=subscription`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Failed to load billing info:', error);
    }
  };

  const getUsageStats = async (): Promise<void> => {
    if (!apiKey) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/billing?action=usage&period=current_month`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsageStats(data.usage.summary);
      }
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    }
  };

  const createCheckoutSession = async (planId: string): Promise<string | null> => {
    // Payment processing placeholder - to be implemented later
    toast({
      title: 'Payment Processing',
      description: 'Payment integration will be available soon. For now, enjoy free tier features!',
      variant: 'default'
    });
    return null;
  };

  const cancelSubscription = async (): Promise<boolean> => {
    if (!apiKey) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/billing`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await getBillingInfo(); // Refresh billing info
        toast({
          title: 'Subscription Cancelled',
          description: 'Your subscription has been cancelled successfully.',
        });
        return true;
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast({
        title: 'Cancellation Failed',
        description: 'Failed to cancel subscription. Please try again.',
        variant: 'destructive'
      });
    }
    return false;
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    apiKey,
    userApiKeys,
    subscription,
    usageStats,
    login,
    signup,
    logout,
    refreshUser,
    updateUser,
    generateApiKey,
    revokeApiKey,
    getUserApiKeys,
    getBillingInfo,
    getUsageStats,
    createCheckoutSession,
    cancelSubscription,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};