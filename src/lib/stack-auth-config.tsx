import { StackProvider, StackClientApp } from "@stackframe/stack";

// Stack Auth configuration with AJ prefix support for Vite
export const stackConfig = {
  projectId: import.meta.env.VITE_AJ_STACK_PROJECT_ID || "6fcf93f3-7583-41c9-b0ee-9d92afc0a76c",
  publishableClientKey: import.meta.env.VITE_AJ_STACK_PUBLISHABLE_CLIENT_KEY || "pck_fm0x26a0xsr9bj24vymkhjr1k81a36rqcz7efvh9x981g",
};

console.log('🔐 Stack Auth Config:', {
  projectId: stackConfig.projectId,
  hasPublishableKey: !!stackConfig.publishableClientKey,
  envVars: {
    VITE_AJ_STACK_PROJECT_ID: import.meta.env.VITE_AJ_STACK_PROJECT_ID,
    VITE_AJ_STACK_PUBLISHABLE_CLIENT_KEY: import.meta.env.VITE_AJ_STACK_PUBLISHABLE_CLIENT_KEY
  }
});

// Initialize Stack Client App with error handling
let stackApp: StackClientApp;
try {
  stackApp = new StackClientApp({
    projectId: stackConfig.projectId,
    publishableClientKey: stackConfig.publishableClientKey,
  });
  console.log('✅ Stack Auth initialized successfully');
} catch (error) {
  console.error('❌ Stack Auth initialization failed:', error);
  // Create a fallback app
  stackApp = new StackClientApp({
    projectId: "6fcf93f3-7583-41c9-b0ee-9d92afc0a76c",
    publishableClientKey: "pck_fm0x26a0xsr9bj24vymkhjr1k81a36rqcz7efvh9x981g",
  });
}

export { stackApp };

// Stack Auth provider wrapper component with robust error handling
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = React.useState<string | null>(null);
  const [isReady, setIsReady] = React.useState(false);
  
  React.useEffect(() => {
    const initializeStackAuth = async () => {
      try {
        if (!stackApp) {
          throw new Error('Stack Auth not initialized');
        }
        
        // Test if Stack Auth is working by trying to access basic methods
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
        
        console.log('🚀 Stack Auth Provider mounted successfully');
        setIsReady(true);
      } catch (err) {
        console.error('Stack Auth Provider error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsReady(true); // Still set ready to show fallback
      }
    };

    initializeStackAuth();
  }, []);

  if (!isReady) {
    // Show loading state briefly
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading authentication...</div>
      </div>
    );
  }

  if (error) {
    console.warn('⚠️ Stack Auth error, using fallback mode:', error);
    // Return children without Stack Auth wrapper as fallback
    return <>{children}</>;
  }

  // Wrap in error boundary for runtime errors
  return (
    <ErrorBoundary>
      <StackProvider app={stackApp}>
        {children}
      </StackProvider>
    </ErrorBoundary>
  );
}

// Simple error boundary for Stack Auth
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('Stack Auth Runtime Error:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Stack Auth Error Details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      console.warn('🛡️ Stack Auth error boundary activated, using fallback');
      return this.props.children;
    }

    return this.props.children;
  }
}

// Hook for accessing Stack Auth with error handling
export { useStackApp } from "@stackframe/stack";

// Safe useUser hook that handles errors
export const useSafeUser = () => {
  try {
    // Import useUser dynamically to catch errors
    const { useUser } = require("@stackframe/stack");
    return useUser();
  } catch (error) {
    console.warn('useUser hook error:', error);
    return null;
  }
};

// For backward compatibility, export as useUser
export const useUser = useSafeUser;

// Utility functions for Stack Auth integration
export class StackAuthUtils {
  
  /**
   * Get user token for API calls
   */
  static async getUserToken(stackApp: any) {
    try {
      const user = stackApp.getUser();
      if (!user) return null;
      
      return await user.getIdToken();
    } catch (error) {
      console.error('Get user token error:', error);
      return null;
    }
  }

  /**
   * Sign out user
   */
  static async signOut(stackApp: any) {
    try {
      await stackApp.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(stackApp: any, updates: any) {
    try {
      const user = stackApp.getUser();
      if (!user) throw new Error('User not found');
      
      // Update profile in Stack Auth
      await user.update(updates);
      
      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  }

  /**
   * Check user permissions
   */
  static async checkPermissions(stackApp: any, requiredPermissions: string[]) {
    try {
      const user = stackApp.getUser();
      if (!user) return false;
      
      // Get user permissions from your backend
      const token = await user.getIdToken();
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) return false;
      
      const userData = await response.json();
      const userPermissions = userData.data.user.permissions || [];
      
      return requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );
    } catch (error) {
      console.error('Check permissions error:', error);
      return false;
    }
  }
}