import { ApiKeyService, AuthService, AuditService, RateLimitService } from '../../lib/auth';
import { DatabaseUtils } from '../../lib/database';

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
  const rateLimitKey = `api_keys:${user.user_id}`;
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
        return await handleGetApiKeys(req, res, user);
      case 'POST':
        return await handleCreateApiKey(req, res, user);
      case 'DELETE':
        return await handleDeleteApiKey(req, res, user);
      case 'PUT':
        return await handleUpdateApiKey(req, res, user);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Keys error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Get user's API keys
async function handleGetApiKeys(req: any, res: any, user: any) {
  try {
    const apiKeys = await ApiKeyService.getUserApiKeys(user.user_id);

    return res.status(200).json({
      success: true,
      message: 'API keys retrieved successfully',
      data: {
        api_keys: apiKeys,
        total_count: apiKeys.length
      }
    });
  } catch (error) {
    console.error('Get API keys error:', error);
    return res.status(500).json({ error: 'Failed to retrieve API keys' });
  }
}

// Create new API key
async function handleCreateApiKey(req: any, res: any, user: any) {
  const { name, permissions, rate_limit, expires_days } = req.body;

  // Validation
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'API key name is required' });
  }

  if (name.length > 100) {
    return res.status(400).json({ error: 'API key name must be less than 100 characters' });
  }

  // Check if user already has too many API keys (limit: 10)
  const existingKeys = await ApiKeyService.getUserApiKeys(user.user_id);
  const activeKeys = existingKeys.filter(key => key.is_active);
  
  if (activeKeys.length >= 10) {
    return res.status(400).json({ 
      error: 'Maximum number of API keys (10) reached. Please delete some existing keys.' 
    });
  }

  try {
    const result = await ApiKeyService.createApiKey(user.user_id, {
      name: name.trim(),
      permissions: permissions || ['lynxa:read', 'lynxa:write'],
      rate_limit: rate_limit || 1000,
      expires_days: expires_days
    });

    // Log API key creation
    await AuditService.logEvent({
      user_id: user.user_id,
      event_type: 'api_key.created',
      event_description: `Created API key: ${name}`,
      resource_type: 'api_key',
      resource_id: result.keyInfo.key_id,
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      user_agent: req.headers['user-agent']
    });

    return res.status(201).json({
      success: true,
      message: 'API key created successfully',
      data: {
        api_key: result.key, // Full key returned only once
        key_info: result.keyInfo,
        warning: 'This is the only time you will see the full API key. Please store it securely.'
      }
    });
  } catch (error) {
    console.error('Create API key error:', error);
    return res.status(500).json({ error: 'Failed to create API key' });
  }
}

// Delete API key
async function handleDeleteApiKey(req: any, res: any, user: any) {
  const { key_id } = req.query;

  if (!key_id) {
    return res.status(400).json({ error: 'API key ID is required' });
  }

  try {
    const success = await ApiKeyService.revokeApiKey(user.user_id, key_id as string);

    if (!success) {
      return res.status(404).json({ error: 'API key not found' });
    }

    // Log API key deletion
    await AuditService.logEvent({
      user_id: user.user_id,
      event_type: 'api_key.deleted',
      event_description: `Deleted API key`,
      resource_type: 'api_key',
      resource_id: key_id as string,
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      user_agent: req.headers['user-agent']
    });

    return res.status(200).json({
      success: true,
      message: 'API key deleted successfully'
    });
  } catch (error) {
    console.error('Delete API key error:', error);
    return res.status(500).json({ error: 'Failed to delete API key' });
  }
}

// Update API key (name only for now)
async function handleUpdateApiKey(req: any, res: any, user: any) {
  const { key_id } = req.query;
  const { name } = req.body;

  if (!key_id) {
    return res.status(400).json({ error: 'API key ID is required' });
  }

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'API key name is required' });
  }

  if (name.length > 100) {
    return res.status(400).json({ error: 'API key name must be less than 100 characters' });
  }

  try {
    const manager = await DatabaseUtils.getManager();
    const result = await manager.query(
      'UPDATE api_keys SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE key_id = $2 AND user_id = $3 RETURNING *',
      [name.trim(), key_id, user.user_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    // Log API key update
    await AuditService.logEvent({
      user_id: user.user_id,
      event_type: 'api_key.updated',
      event_description: `Updated API key name to: ${name}`,
      resource_type: 'api_key',
      resource_id: key_id as string,
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      user_agent: req.headers['user-agent']
    });

    return res.status(200).json({
      success: true,
      message: 'API key updated successfully',
      data: {
        key_info: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update API key error:', error);
    return res.status(500).json({ error: 'Failed to update API key' });
  }
}