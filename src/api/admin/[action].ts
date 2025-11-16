import { AuthService, RateLimitService, AuditService } from '../../lib/auth';
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

  // Check if user has admin role
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // Rate limiting for admin endpoints
  const rateLimitKey = `admin:${user.user_id}`;
  const rateLimit = await RateLimitService.checkRateLimit(rateLimitKey, 200, 15 * 60 * 1000);
  
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      reset_time: rateLimit.resetTime
    });
  }

  try {
    const { action } = req.query;

    switch (action) {
      case 'dashboard':
        return await handleAdminDashboard(req, res, user);
      case 'users':
        return await handleUserManagement(req, res, user);
      case 'system':
        return await handleSystemStats(req, res, user);
      case 'audit':
        return await handleAuditLogs(req, res, user);
      case 'health':
        return await handleHealthCheck(req, res, user);
      default:
        return res.status(400).json({ error: 'Invalid admin action' });
    }
  } catch (error) {
    console.error('Admin endpoint error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Admin Dashboard Overview
async function handleAdminDashboard(req: any, res: any, user: any) {
  try {
    const manager = await DatabaseUtils.getManager();

    // Get overall system statistics
    const systemStatsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE is_active = true) as total_active_users,
        (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_30d,
        (SELECT COUNT(*) FROM api_keys WHERE is_active = true) as total_active_keys,
        (SELECT COUNT(*) FROM api_usage_logs WHERE timestamp >= CURRENT_DATE - INTERVAL '24 hours') as requests_24h,
        (SELECT COUNT(*) FROM api_usage_logs WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days') as requests_30d,
        (SELECT AVG(response_time_ms) FROM api_usage_logs WHERE timestamp >= CURRENT_DATE - INTERVAL '24 hours') as avg_response_time,
        (SELECT COUNT(*) FROM api_usage_logs WHERE timestamp >= CURRENT_DATE - INTERVAL '24 hours' AND status_code >= 400) as errors_24h,
        (SELECT SUM(cost_usd) FROM api_usage_logs WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days') as revenue_30d
    `;

    const systemStats = await manager.query(systemStatsQuery);

    // Get daily usage over the last 30 days
    const dailyUsageQuery = `
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as requests,
        COUNT(DISTINCT user_id) as active_users,
        AVG(response_time_ms) as avg_response_time,
        COUNT(*) FILTER (WHERE status_code >= 400) as errors,
        SUM(cost_usd) as revenue
      FROM api_usage_logs 
      WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(timestamp)
      ORDER BY date
    `;

    const dailyUsage = await manager.query(dailyUsageQuery);

    // Get top users by usage
    const topUsersQuery = `
      SELECT 
        u.user_id,
        u.email,
        u.first_name,
        u.last_name,
        u.created_at,
        COUNT(l.request_id) as total_requests,
        SUM(l.tokens_used) as total_tokens,
        SUM(l.cost_usd) as total_cost,
        MAX(l.timestamp) as last_activity
      FROM users u
      LEFT JOIN api_usage_logs l ON u.user_id = l.user_id AND l.timestamp >= CURRENT_DATE - INTERVAL '30 days'
      WHERE u.is_active = true
      GROUP BY u.user_id, u.email, u.first_name, u.last_name, u.created_at
      ORDER BY total_requests DESC NULLS LAST
      LIMIT 10
    `;

    const topUsers = await manager.query(topUsersQuery);

    // Get most used endpoints
    const endpointStatsQuery = `
      SELECT 
        endpoint,
        COUNT(*) as requests,
        AVG(response_time_ms) as avg_response_time,
        COUNT(*) FILTER (WHERE status_code >= 400) as errors
      FROM api_usage_logs 
      WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY endpoint
      ORDER BY requests DESC
      LIMIT 10
    `;

    const endpointStats = await manager.query(endpointStatsQuery);

    // Get recent audit events
    const recentAuditQuery = `
      SELECT 
        event_type,
        event_description,
        user_id,
        resource_type,
        timestamp,
        ip_address
      FROM audit_logs 
      WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY timestamp DESC
      LIMIT 20
    `;

    const recentAudit = await manager.query(recentAuditQuery);

    return res.status(200).json({
      success: true,
      message: 'Admin dashboard data retrieved successfully',
      data: {
        system_stats: systemStats.rows[0],
        daily_usage: dailyUsage.rows,
        top_users: topUsers.rows,
        endpoint_stats: endpointStats.rows,
        recent_audit_events: recentAudit.rows,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({ error: 'Failed to retrieve admin dashboard data' });
  }
}

// User Management
async function handleUserManagement(req: any, res: any, user: any) {
  const { method } = req;
  
  try {
    const manager = await DatabaseUtils.getManager();

    switch (method) {
      case 'GET':
        // List users with pagination and filtering
        const { page = 1, limit = 50, search, role, status } = req.query;
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        let whereConditions = [];
        let queryParams = [];
        let paramCount = 0;

        if (search) {
          whereConditions.push(`(email ILIKE $${++paramCount} OR first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount})`);
          queryParams.push(`%${search}%`);
        }

        if (role) {
          whereConditions.push(`role = $${++paramCount}`);
          queryParams.push(role);
        }

        if (status) {
          whereConditions.push(`is_active = $${++paramCount}`);
          queryParams.push(status === 'active');
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const usersQuery = `
          SELECT 
            user_id,
            email,
            first_name,
            last_name,
            role,
            is_active,
            email_verified,
            created_at,
            last_login,
            (SELECT COUNT(*) FROM api_keys WHERE user_id = users.user_id AND is_active = true) as active_api_keys,
            (SELECT COUNT(*) FROM api_usage_logs WHERE user_id = users.user_id AND timestamp >= CURRENT_DATE - INTERVAL '30 days') as requests_30d
          FROM users 
          ${whereClause}
          ORDER BY created_at DESC
          LIMIT $${++paramCount} OFFSET $${++paramCount}
        `;

        queryParams.push(parseInt(limit as string), offset);

        const users = await manager.query(usersQuery, queryParams);

        const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
        const totalCount = await manager.query(countQuery, queryParams.slice(0, -2));

        return res.status(200).json({
          success: true,
          data: {
            users: users.rows,
            pagination: {
              page: parseInt(page as string),
              limit: parseInt(limit as string),
              total: parseInt(totalCount.rows[0].total),
              pages: Math.ceil(parseInt(totalCount.rows[0].total) / parseInt(limit as string))
            }
          }
        });

      case 'PUT':
        // Update user (activate/deactivate, change role, etc.)
        const { user_id, updates } = req.body;
        
        if (!user_id || !updates) {
          return res.status(400).json({ error: 'User ID and updates are required' });
        }

        // Only super_admin can change admin roles
        if (updates.role === 'admin' || updates.role === 'super_admin') {
          if (user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Super admin access required to modify admin roles' });
          }
        }

        const allowedUpdates = ['is_active', 'role', 'email_verified'];
        const updateFields = [];
        const updateValues = [];
        let updateParamCount = 0;

        for (const [key, value] of Object.entries(updates)) {
          if (allowedUpdates.includes(key)) {
            updateFields.push(`${key} = $${++updateParamCount}`);
            updateValues.push(value);
          }
        }

        if (updateFields.length === 0) {
          return res.status(400).json({ error: 'No valid fields to update' });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(user_id);

        const updateQuery = `
          UPDATE users 
          SET ${updateFields.join(', ')}
          WHERE user_id = $${++updateParamCount}
          RETURNING user_id, email, role, is_active, email_verified, updated_at
        `;

        const updatedUser = await manager.query(updateQuery, updateValues);

        // Log admin action
        await AuditService.logEvent({
          user_id: user.user_id,
          event_type: 'admin.user_updated',
          event_description: `Admin updated user ${user_id}`,
          resource_type: 'user',
          resource_id: user_id,
          ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          user_agent: req.headers['user-agent'],
          metadata: { updates, admin_user: user.user_id }
        });

        return res.status(200).json({
          success: true,
          message: 'User updated successfully',
          data: { user: updatedUser.rows[0] }
        });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('User management error:', error);
    return res.status(500).json({ error: 'Failed to manage users' });
  }
}

// System Statistics
async function handleSystemStats(req: any, res: any, user: any) {
  try {
    const manager = await DatabaseUtils.getManager();

    // Database health check
    const dbHealthQuery = `
      SELECT 
        pg_database_size(current_database()) as db_size,
        (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
    `;

    const dbHealth = await manager.query(dbHealthQuery);

    // Table statistics
    const tableStatsQuery = `
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
    `;

    const tableStats = await manager.query(tableStatsQuery);

    // Performance metrics
    const performanceQuery = `
      SELECT 
        (SELECT AVG(response_time_ms) FROM api_usage_logs WHERE timestamp >= CURRENT_DATE - INTERVAL '1 hour') as avg_response_time_1h,
        (SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) FROM api_usage_logs WHERE timestamp >= CURRENT_DATE - INTERVAL '1 hour') as p95_response_time_1h,
        (SELECT COUNT(*) FROM api_usage_logs WHERE timestamp >= CURRENT_DATE - INTERVAL '1 hour' AND status_code >= 500) as server_errors_1h,
        (SELECT COUNT(*) FROM api_usage_logs WHERE timestamp >= CURRENT_DATE - INTERVAL '1 hour' AND status_code >= 400 AND status_code < 500) as client_errors_1h
    `;

    const performance = await manager.query(performanceQuery);

    return res.status(200).json({
      success: true,
      message: 'System statistics retrieved successfully',
      data: {
        database_health: dbHealth.rows[0],
        table_statistics: tableStats.rows,
        performance_metrics: performance.rows[0],
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('System stats error:', error);
    return res.status(500).json({ error: 'Failed to retrieve system statistics' });
  }
}

// Audit Logs
async function handleAuditLogs(req: any, res: any, user: any) {
  try {
    const manager = await DatabaseUtils.getManager();
    
    const { 
      page = 1, 
      limit = 100, 
      event_type, 
      user_id, 
      resource_type, 
      start_date, 
      end_date 
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (event_type) {
      whereConditions.push(`event_type = $${++paramCount}`);
      queryParams.push(event_type);
    }

    if (user_id) {
      whereConditions.push(`user_id = $${++paramCount}`);
      queryParams.push(user_id);
    }

    if (resource_type) {
      whereConditions.push(`resource_type = $${++paramCount}`);
      queryParams.push(resource_type);
    }

    if (start_date) {
      whereConditions.push(`timestamp >= $${++paramCount}`);
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push(`timestamp <= $${++paramCount}`);
      queryParams.push(end_date);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const auditQuery = `
      SELECT 
        a.audit_id,
        a.user_id,
        u.email,
        a.event_type,
        a.event_description,
        a.resource_type,
        a.resource_id,
        a.ip_address,
        a.user_agent,
        a.metadata,
        a.timestamp
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.user_id
      ${whereClause}
      ORDER BY a.timestamp DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;

    queryParams.push(parseInt(limit as string), offset);

    const auditLogs = await manager.query(auditQuery, queryParams);

    const countQuery = `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`;
    const totalCount = await manager.query(countQuery, queryParams.slice(0, -2));

    return res.status(200).json({
      success: true,
      data: {
        audit_logs: auditLogs.rows,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: parseInt(totalCount.rows[0].total),
          pages: Math.ceil(parseInt(totalCount.rows[0].total) / parseInt(limit as string))
        }
      }
    });
  } catch (error) {
    console.error('Audit logs error:', error);
    return res.status(500).json({ error: 'Failed to retrieve audit logs' });
  }
}

// Health Check
async function handleHealthCheck(req: any, res: any, user: any) {
  try {
    const manager = await DatabaseUtils.getManager();
    
    // Test database connectivity
    const dbTest = await manager.query('SELECT NOW() as current_time, version() as db_version');
    
    // Check recent error rates
    const errorRateQuery = `
      SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE status_code >= 500) as server_errors,
        COUNT(*) FILTER (WHERE status_code >= 400 AND status_code < 500) as client_errors
      FROM api_usage_logs 
      WHERE timestamp >= CURRENT_DATE - INTERVAL '1 hour'
    `;
    
    const errorRate = await manager.query(errorRateQuery);
    
    const stats = errorRate.rows[0];
    const serverErrorRate = stats.total_requests > 0 ? (stats.server_errors / stats.total_requests) * 100 : 0;
    const clientErrorRate = stats.total_requests > 0 ? (stats.client_errors / stats.total_requests) * 100 : 0;

    const healthStatus = {
      status: 'healthy',
      database: {
        connected: true,
        current_time: dbTest.rows[0].current_time,
        version: dbTest.rows[0].db_version
      },
      api: {
        server_error_rate: Math.round(serverErrorRate * 100) / 100,
        client_error_rate: Math.round(clientErrorRate * 100) / 100,
        total_requests_1h: parseInt(stats.total_requests)
      },
      timestamp: new Date().toISOString()
    };

    // Determine overall health status
    if (serverErrorRate > 5) {
      healthStatus.status = 'unhealthy';
    } else if (serverErrorRate > 1 || clientErrorRate > 10) {
      healthStatus.status = 'degraded';
    }

    return res.status(200).json({
      success: true,
      data: healthStatus
    });
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(503).json({ 
      success: false,
      error: 'Health check failed',
      data: {
        status: 'unhealthy',
        database: { connected: false },
        timestamp: new Date().toISOString()
      }
    });
  }
}