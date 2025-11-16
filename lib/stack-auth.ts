import { StackAuth } from '@stackframe/stack';

// Stack Auth configuration with AJ prefix support
const stackAuth = new StackAuth({
  projectId: process.env.NEXT_PUBLIC_AJ_STACK_PROJECT_ID || process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
  secretServerKey: process.env.AJ_STACK_SECRET_SERVER_KEY || process.env.STACK_SECRET_SERVER_KEY!,
  publishableClientKey: process.env.NEXT_PUBLIC_AJ_STACK_PUBLISHABLE_CLIENT_KEY || process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
});

export { stackAuth };

// Stack Auth user management utilities
export class StackAuthService {
  
  /**
   * Get user information from Stack Auth
   */
  static async getUserFromToken(accessToken: string) {
    try {
      const user = await stackAuth.getUser({ accessToken });
      return user;
    } catch (error) {
      console.error('Stack Auth user fetch error:', error);
      return null;
    }
  }

  /**
   * Verify access token with Stack Auth
   */
  static async verifyAccessToken(accessToken: string) {
    try {
      const isValid = await stackAuth.verifyAccessToken(accessToken);
      return isValid;
    } catch (error) {
      console.error('Stack Auth token verification error:', error);
      return false;
    }
  }

  /**
   * Get or create user in our database based on Stack Auth user
   */
  static async syncUserWithDatabase(stackUser: any, db: any) {
    try {
      // Check if user exists in our database
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.stackAuthId, stackUser.id))
        .limit(1);

      if (existingUser.length > 0) {
        // Update existing user
        const updatedUser = await db
          .update(users)
          .set({
            email: stackUser.primaryEmail,
            firstName: stackUser.displayName?.split(' ')[0] || '',
            lastName: stackUser.displayName?.split(' ').slice(1).join(' ') || '',
            displayName: stackUser.displayName,
            profileImageUrl: stackUser.profileImageUrl,
            emailVerified: stackUser.primaryEmailVerified,
            lastLogin: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(users.stackAuthId, stackUser.id))
          .returning();

        return updatedUser[0];
      } else {
        // Create new user
        const newUser = await db
          .insert(users)
          .values({
            stackAuthId: stackUser.id,
            email: stackUser.primaryEmail,
            firstName: stackUser.displayName?.split(' ')[0] || '',
            lastName: stackUser.displayName?.split(' ').slice(1).join(' ') || '',
            displayName: stackUser.displayName,
            profileImageUrl: stackUser.profileImageUrl,
            emailVerified: stackUser.primaryEmailVerified,
            role: 'user',
            isActive: true,
            signupSource: 'stack_auth',
            lastLogin: new Date(),
          })
          .returning();

        return newUser[0];
      }
    } catch (error) {
      console.error('Database user sync error:', error);
      throw error;
    }
  }

  /**
   * Create session record in database
   */
  static async createSession(userId: string, stackAuthSessionId: string, metadata: any, db: any) {
    try {
      const session = await db
        .insert(userSessions)
        .values({
          userId,
          stackAuthSessionId,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          location: metadata.location || {},
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        })
        .returning();

      return session[0];
    } catch (error) {
      console.error('Session creation error:', error);
      throw error;
    }
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(db: any) {
    try {
      await db
        .update(userSessions)
        .set({ isActive: false })
        .where(lt(userSessions.expiresAt, new Date()));
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }

  /**
   * Log user activity
   */
  static async logUserActivity(userId: string, activity: string, metadata: any, db: any) {
    try {
      await db
        .insert(auditLogs)
        .values({
          userId,
          eventType: `user.${activity}`,
          eventDescription: `User ${activity}`,
          resourceType: 'user',
          resourceId: userId,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          metadata: metadata.extra || {},
        });
    } catch (error) {
      console.error('User activity logging error:', error);
    }
  }

  /**
   * Get user permissions and role
   */
  static async getUserPermissions(userId: string, organizationId?: string, db?: any) {
    try {
      // Get user role
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user.length) {
        return { role: 'user', permissions: [] };
      }

      // If organization context, check organization membership
      if (organizationId) {
        const membership = await db
          .select()
          .from(organizationMembers)
          .where(
            and(
              eq(organizationMembers.userId, userId),
              eq(organizationMembers.organizationId, organizationId),
              eq(organizationMembers.isActive, true)
            )
          )
          .limit(1);

        if (membership.length) {
          return {
            role: membership[0].role,
            permissions: membership[0].permissions || [],
            organization: organizationId,
          };
        }
      }

      return {
        role: user[0].role,
        permissions: [],
        isGlobalAdmin: user[0].role === 'admin' || user[0].role === 'super_admin',
      };
    } catch (error) {
      console.error('Get user permissions error:', error);
      return { role: 'user', permissions: [] };
    }
  }
}

// Middleware for Stack Auth authentication
export async function stackAuthMiddleware(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No access token provided' });
    }

    const accessToken = authHeader.substring(7);
    
    // Verify token with Stack Auth
    const isValid = await StackAuthService.verifyAccessToken(accessToken);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid access token' });
    }

    // Get user from Stack Auth
    const stackUser = await StackAuthService.getUserFromToken(accessToken);
    
    if (!stackUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Sync with our database
    const user = await StackAuthService.syncUserWithDatabase(stackUser, req.db);
    
    // Attach user to request
    req.user = user;
    req.stackUser = stackUser;
    
    next();
  } catch (error) {
    console.error('Stack Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
}

import { users, userSessions, organizationMembers, auditLogs } from '../database/schema';
import { eq, and, lt } from 'drizzle-orm';