import { StackProvider, StackClientApp } from "@stackframe/stack";

// Stack Auth configuration with AJ prefix support for Vite
export const stackConfig = {
  projectId: import.meta.env.VITE_AJ_STACK_PROJECT_ID || "6fcf93f3-7583-41c9-b0ee-9d92afc0a76c",
  publishableClientKey: import.meta.env.VITE_AJ_STACK_PUBLISHABLE_CLIENT_KEY || "pck_fm0x26a0xsr9bj24vymkhjr1k81a36rqcz7efvh9x981g",
};

console.log('🔐 Stack Auth Config:', {
  projectId: stackConfig.projectId,
  hasPublishableKey: !!stackConfig.publishableClientKey
});

// Initialize Stack Client App
export const stackApp = new StackClientApp({
  projectId: stackConfig.projectId,
  publishableClientKey: stackConfig.publishableClientKey,
});

// Stack Auth provider wrapper component  
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <StackProvider app={stackApp}>
      {children}
    </StackProvider>
  );
}

// Hook for accessing Stack Auth
export { useStackApp, useUser } from "@stackframe/stack";

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