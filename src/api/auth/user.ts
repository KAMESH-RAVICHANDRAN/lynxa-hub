import { StackAuthService, stackAuthMiddleware } from '../../lib/stack-auth';
import { DatabaseManager, DatabaseUtils } from '../../lib/database-manager';
import { users, apiKeys, auditLogs } from '../../database/schema';
import { eq, and, desc } from 'drizzle-orm';
import { RateLimitService } from '../../lib/auth';

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Database middleware
  const db = DatabaseUtils.getConnection();
  req.db = db;

  // Apply Stack Auth middleware
  await new Promise((resolve, reject) => {
    stackAuthMiddleware(req, res, (error: any) => {
      if (error) reject(error);
      else resolve(true);
    });
  }).catch((error) => {
    return res.status(401).json({ error: 'Authentication failed', details: error.message });
  });

  // Rate limiting
  const rateLimitKey = `auth_user:${req.user.id}`;
  const rateLimit = await RateLimitService.checkRateLimit(rateLimitKey, 100, 15 * 60 * 1000);
  
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      reset_time: rateLimit.resetTime
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetUser(req, res);
      case 'PUT':
        return await handleUpdateUser(req, res);
      case 'DELETE':
        return await handleDeleteUser(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Auth user endpoint error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Get authenticated user profile with Stack Auth integration
async function handleGetUser(req: any, res: any) {
  try {
    const db = req.db;
    const user = req.user;
    
    // Get user with all related data
    const userProfile = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userProfile.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's API keys count
    const apiKeyStats = await db
      .select({
        total: sql`COUNT(*)`,
        active: sql`COUNT(*) FILTER (WHERE is_active = true)`,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, user.id));

    // Get recent activity
    const recentActivity = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, user.id))
      .orderBy(desc(auditLogs.timestamp))
      .limit(10);

    // Get Stack Auth user data
    const stackUser = req.stackUser;

    const response = {
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: {
          ...userProfile[0],
          // Include Stack Auth data
          stackAuth: {
            id: stackUser.id,
            displayName: stackUser.displayName,
            profileImageUrl: stackUser.profileImageUrl,
            primaryEmail: stackUser.primaryEmail,
            primaryEmailVerified: stackUser.primaryEmailVerified,
            signedUp: stackUser.signedUpAt,
          }
        },
        statistics: {
          apiKeys: {
            total: parseInt(apiKeyStats[0].total) || 0,
            active: parseInt(apiKeyStats[0].active) || 0,
          }
        },
        recentActivity: recentActivity.map(activity => ({
          eventType: activity.eventType,
          description: activity.eventDescription,
          timestamp: activity.timestamp,
          metadata: activity.metadata,
        })),
      }
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Failed to retrieve user profile' });
  }
}

// Update user profile
async function handleUpdateUser(req: any, res: any) {
  try {
    const db = req.db;
    const user = req.user;
    const {
      firstName,
      lastName,
      company,
      jobTitle,
      phone,
      timezone,
      language,
      preferences,
      billingEmail
    } = req.body;

    // Validate input
    const updateData: any = {};
    
    if (firstName !== undefined) {
      if (typeof firstName !== 'string' || firstName.length > 100) {
        return res.status(400).json({ error: 'Invalid first name' });
      }
      updateData.firstName = firstName;
    }

    if (lastName !== undefined) {
      if (typeof lastName !== 'string' || lastName.length > 100) {
        return res.status(400).json({ error: 'Invalid last name' });
      }
      updateData.lastName = lastName;
    }

    if (company !== undefined) {
      updateData.company = company;
    }

    if (jobTitle !== undefined) {
      updateData.jobTitle = jobTitle;
    }

    if (phone !== undefined) {
      updateData.phone = phone;
    }

    if (timezone !== undefined) {
      updateData.timezone = timezone;
    }

    if (language !== undefined) {
      updateData.language = language;
    }

    if (preferences !== undefined) {
      updateData.preferences = preferences;
    }

    if (billingEmail !== undefined) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)) {
        return res.status(400).json({ error: 'Invalid billing email format' });
      }
      updateData.billingEmail = billingEmail;
    }

    // Update timestamp
    updateData.updatedAt = new Date();

    // Update user
    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id))
      .returning();

    // Log the update
    await StackAuthService.logUserActivity(
      user.id,
      'profile_updated',
      {
        ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        extra: { updatedFields: Object.keys(updateData) },
      },
      db
    );

    return res.status(200).json({
      success: true,
      message: 'User profile updated successfully',
      data: {
        user: updatedUser[0]
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: 'Failed to update user profile' });
  }
}

// Delete user account (soft delete)
async function handleDeleteUser(req: any, res: any) {
  try {
    const db = req.db;
    const user = req.user;
    const { confirmation } = req.body;

    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      return res.status(400).json({ 
        error: 'Account deletion confirmation required',
        message: 'Please provide confirmation: "DELETE_MY_ACCOUNT"'
      });
    }

    // Use transaction for safe deletion
    await DatabaseUtils.transaction(async (tx) => {
      // Deactivate all API keys
      await tx
        .update(apiKeys)
        .set({ isActive: false })
        .where(eq(apiKeys.userId, user.id));

      // Soft delete user account
      await tx
        .update(users)
        .set({ 
          isActive: false,
          email: `deleted_${user.id}@deleted.local`,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));
    });

    // Log account deletion
    await StackAuthService.logUserActivity(
      user.id,
      'account_deleted',
      {
        ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      },
      db
    );

    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
}

import { sql } from 'drizzle-orm';