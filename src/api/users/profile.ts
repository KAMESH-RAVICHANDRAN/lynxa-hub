import { AuthService, AuditService, RateLimitService } from '../../lib/auth';
import { DatabaseUtils } from '../../lib/database';

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authentication middleware
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  let user;
  try {
    user = await AuthService.getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Rate limiting
  const rateLimitKey = `user_profile:${user.user_id}`;
  const rateLimit = await RateLimitService.checkRateLimit(rateLimitKey, 50, 15 * 60 * 1000);
  
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      reset_time: rateLimit.resetTime
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetProfile(req, res, user);
      case 'PUT':
        return await handleUpdateProfile(req, res, user);
      case 'DELETE':
        return await handleDeleteAccount(req, res, user);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('User profile error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Get user profile
async function handleGetProfile(req: any, res: any, user: any) {
  try {
    const manager = await DatabaseUtils.getManager();
    const result = await manager.query(
      `SELECT user_id, email, first_name, last_name, role, is_active, email_verified,
              created_at, last_login, company, job_title, phone, timezone, language,
              preferences, billing_email, signup_source
       FROM users WHERE user_id = $1`,
      [user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = result.rows[0];

    // Get user statistics
    const statsResult = await manager.query(
      `SELECT 
         COUNT(*) as total_api_keys,
         COUNT(*) FILTER (WHERE is_active = true) as active_api_keys,
         MAX(created_at) as latest_key_created
       FROM api_keys WHERE user_id = $1`,
      [user.user_id]
    );

    const usageResult = await manager.query(
      `SELECT 
         COUNT(*) as total_requests,
         COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days') as requests_last_30_days,
         COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days') as requests_last_7_days,
         AVG(response_time_ms) as avg_response_time
       FROM api_usage_logs WHERE user_id = $1`,
      [user.user_id]
    );

    const stats = {
      api_keys: statsResult.rows[0],
      usage: usageResult.rows[0]
    };

    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        profile,
        statistics: stats
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Failed to retrieve profile' });
  }
}

// Update user profile
async function handleUpdateProfile(req: any, res: any, user: any) {
  const {
    first_name,
    last_name,
    company,
    job_title,
    phone,
    timezone,
    language,
    preferences,
    billing_email
  } = req.body;

  // Validation
  if (first_name && first_name.length > 100) {
    return res.status(400).json({ error: 'First name must be less than 100 characters' });
  }

  if (last_name && last_name.length > 100) {
    return res.status(400).json({ error: 'Last name must be less than 100 characters' });
  }

  if (company && company.length > 255) {
    return res.status(400).json({ error: 'Company name must be less than 255 characters' });
  }

  if (job_title && job_title.length > 255) {
    return res.status(400).json({ error: 'Job title must be less than 255 characters' });
  }

  if (phone && phone.length > 50) {
    return res.status(400).json({ error: 'Phone number must be less than 50 characters' });
  }

  if (billing_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billing_email)) {
    return res.status(400).json({ error: 'Invalid billing email format' });
  }

  try {
    const manager = await DatabaseUtils.getManager();
    
    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (first_name !== undefined) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(first_name);
    }

    if (last_name !== undefined) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(last_name);
    }

    if (company !== undefined) {
      updates.push(`company = $${paramCount++}`);
      values.push(company);
    }

    if (job_title !== undefined) {
      updates.push(`job_title = $${paramCount++}`);
      values.push(job_title);
    }

    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }

    if (timezone !== undefined) {
      updates.push(`timezone = $${paramCount++}`);
      values.push(timezone);
    }

    if (language !== undefined) {
      updates.push(`language = $${paramCount++}`);
      values.push(language);
    }

    if (preferences !== undefined) {
      updates.push(`preferences = $${paramCount++}`);
      values.push(JSON.stringify(preferences));
    }

    if (billing_email !== undefined) {
      updates.push(`billing_email = $${paramCount++}`);
      values.push(billing_email);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(user.user_id);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE user_id = $${paramCount}
      RETURNING user_id, email, first_name, last_name, company, job_title, 
               phone, timezone, language, preferences, billing_email, updated_at
    `;

    const result = await manager.query(query, values);

    // Log profile update
    await AuditService.logEvent({
      user_id: user.user_id,
      event_type: 'user.profile_updated',
      event_description: 'User profile updated',
      resource_type: 'user',
      resource_id: user.user_id,
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      user_agent: req.headers['user-agent'],
      metadata: { updated_fields: updates }
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}

// Delete user account
async function handleDeleteAccount(req: any, res: any, user: any) {
  const { confirmation } = req.body;

  if (confirmation !== 'DELETE_MY_ACCOUNT') {
    return res.status(400).json({ 
      error: 'Account deletion confirmation required',
      message: 'Please provide confirmation: "DELETE_MY_ACCOUNT"'
    });
  }

  try {
    const manager = await DatabaseUtils.getManager();

    // Start transaction
    await manager.transaction(async (client) => {
      // Deactivate all API keys
      await client.query(
        'UPDATE api_keys SET is_active = false WHERE user_id = $1',
        [user.user_id]
      );

      // Deactivate all sessions
      await client.query(
        'UPDATE user_sessions SET is_active = false WHERE user_id = $1',
        [user.user_id]
      );

      // Deactivate user account (soft delete)
      await client.query(
        'UPDATE users SET is_active = false, email = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [`deleted_${user.user_id}@deleted.local`, user.user_id]
      );
    });

    // Log account deletion
    await AuditService.logEvent({
      user_id: user.user_id,
      event_type: 'user.account_deleted',
      event_description: 'User account deleted',
      resource_type: 'user',
      resource_id: user.user_id,
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      user_agent: req.headers['user-agent']
    });

    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
}