import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider as LegacyAuthProvider, useAuth } from "./contexts/AuthContext";
import { AuthProvider as StackAuthProvider } from "./lib/stack-auth-config";
import { useStackApp, useUser } from "@stackframe/stack";
import { LoginForm } from "./components/LoginForm";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Documentation from "./pages/Documentation";
import Console from "./pages/Console";
import NotFound from "./pages/NotFound";
import { AnimatePresence, motion } from "framer-motion";

const queryClient = new QueryClient();

// Loading screen component with enhanced animations
const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 overflow-hidden">
      {/* Aurora background effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>
      
      <div className="flex flex-col items-center space-y-6 z-10">
        <motion.div
          className="relative"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="relative">
            <motion.div 
              className="rounded-full h-32 w-32 border-4 border-purple-500/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.div 
              className="absolute inset-0 rounded-full border-b-4 border-purple-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <motion.div 
              className="absolute inset-2 rounded-full border-r-4 border-cyan-400"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </motion.div>
        
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Lynxa AI
          </h2>
          <p className="text-sm text-muted-foreground">Initializing your AI workspace...</p>
          
          {/* Progress bar */}
          <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          
          <motion.div
            className="flex items-center space-x-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

// Page transition wrapper
const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Protected route wrapper with Stack Auth integration
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [stackAuthError, setStackAuthError] = useState<boolean>(false);
  const { isAuthenticated: legacyAuth, isLoading: legacyLoading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Safely try to get Stack Auth user
  useEffect(() => {
    try {
      const { useUser } = require('@stackframe/stack');
      const stackUser = useUser();
      setUser(stackUser);
      console.log('✅ Stack Auth user loaded successfully');
    } catch (error) {
      console.warn('⚠️ Stack Auth not available, using legacy auth only:', error);
      setStackAuthError(true);
      setUser(null);
    }
  }, []);
  
  // Debug authentication state
  useEffect(() => {
    console.log('🔍 Auth Debug:', {
      stackUser: !!user,
      legacyAuth,
      legacyLoading,
      stackAuthError,
      userDetails: user ? { id: user?.id, email: user?.primaryEmail } : null
    });
  }, [user, legacyAuth, legacyLoading, stackAuthError]);

  // For now, prioritize legacy auth to avoid Stack Auth issues
  const isStackAuthenticated = !stackAuthError && !!user;
  
  // Combined loading state - use legacy loading primarily
  const isLoading = legacyLoading;
  
  // Combined authentication state (legacy auth takes priority for stability)
  const isAuthenticated = legacyAuth || isStackAuthenticated;

  // Prevent infinite loading
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        if (isLoading && !isAuthenticated) {
          console.warn('⚠️ Authentication timeout, showing login form');
          setAuthError('Authentication timeout');
        }
      }, 5000); // 5 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading && !authError) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || authError) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <LoginForm />
      </motion.div>
    );
  }

  return <PageWrapper>{children}</PageWrapper>;
};

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route 
          path="/" 
          element={
            <PageWrapper>
              <Index />
            </PageWrapper>
          } 
        />
        <Route 
          path="/docs" 
          element={
            <PageWrapper>
              <Documentation />
            </PageWrapper>
          } 
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/console"
          element={
            <ProtectedRoute>
              <Console />
            </ProtectedRoute>
          }
        />
        <Route 
          path="*" 
          element={
            <PageWrapper>
              <NotFound />
            </PageWrapper>
          } 
        />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  const [useStackAuth, setUseStackAuth] = useState(true);

  useEffect(() => {
    // Test Stack Auth availability
    const testStackAuth = () => {
      try {
        // Simple test to see if @stackframe/stack is working
        require('@stackframe/stack');
        console.log('✅ Stack Auth library available');
      } catch (error) {
        console.warn('⚠️ Stack Auth library not available, using legacy auth only');
        setUseStackAuth(false);
      }
    };

    testStackAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {useStackAuth ? (
          <StackAuthProvider>
            <BrowserRouter>
              <LegacyAuthProvider>
                <AppRoutes />
              </LegacyAuthProvider>
            </BrowserRouter>
          </StackAuthProvider>
        ) : (
          <BrowserRouter>
            <LegacyAuthProvider>
              <AppRoutes />
            </LegacyAuthProvider>
          </BrowserRouter>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
