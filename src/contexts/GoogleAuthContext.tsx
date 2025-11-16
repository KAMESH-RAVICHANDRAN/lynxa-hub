import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleOAuthProvider, useGoogleLogin, googleLogout } from '@react-oauth/google';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  accessToken?: string;
}

interface GoogleAuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

// Google OAuth Client ID - you'll need to get this from Google Cloud Console
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "your-google-client-id.apps.googleusercontent.com";

export const GoogleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('lynxa_google_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('lynxa_google_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      setIsLoading(true);
      try {
        // Get user info from Google
        const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${codeResponse.access_token}`);
        const userInfo = await userInfoResponse.json();

        const userData: User = {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          accessToken: codeResponse.access_token
        };

        setUser(userData);
        localStorage.setItem('lynxa_google_user', JSON.stringify(userData));
        
        console.log('✅ Google login successful:', { email: userData.email, name: userData.name });
      } catch (error) {
        console.error('Google login error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google login failed:', error);
      setIsLoading(false);
    },
    scope: 'profile email'
  });

  const logout = () => {
    googleLogout();
    setUser(null);
    localStorage.removeItem('lynxa_google_user');
    console.log('👋 Google logout successful');
  };

  const value: GoogleAuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GoogleAuthContext.Provider value={value}>
        {children}
      </GoogleAuthContext.Provider>
    </GoogleOAuthProvider>
  );
};

export const useGoogleAuth = (): GoogleAuthContextType => {
  const context = useContext(GoogleAuthContext);
  if (context === undefined) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  return context;
};