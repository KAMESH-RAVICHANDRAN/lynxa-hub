import { StackProvider } from "@stackframe/stack";

// Stack Auth configuration with AJ prefix support
export const stackConfig = {
  projectId: process.env.NEXT_PUBLIC_AJ_STACK_PROJECT_ID || process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
  publishableClientKey: process.env.NEXT_PUBLIC_AJ_STACK_PUBLISHABLE_CLIENT_KEY || process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
};

// Stack Auth provider wrapper component  
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <StackProvider 
      projectId={stackConfig.projectId}
      publishableClientKey={stackConfig.publishableClientKey}
    >
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