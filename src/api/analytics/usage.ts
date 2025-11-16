import { AuthService, RateLimitService } from '../../lib/auth';
import { DatabaseUtils } from '../../lib/database';

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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
  const rateLimitKey = `analytics:${user.user_id}`;
  const rateLimit = await RateLimitService.checkRateLimit(rateLimitKey, 100, 15 * 60 * 1000);
  
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      reset_time: rateLimit.resetTime
    });
  }

  try {
    const { timeframe = '30d', api_key_id } = req.query;
    return await getUsageAnalytics(req, res, user, timeframe as string, api_key_id as string);
  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function getUsageAnalytics(req: any, res: any, user: any, timeframe: string, apiKeyId?: string) {
  try {
    const manager = await DatabaseUtils.getManager();
    
    // Calculate date range based on timeframe
    let dateInterval: string;
    let groupBy: string;
    
    switch (timeframe) {
      case '1d':
        dateInterval = '1 day';
        groupBy = "DATE_TRUNC('hour', timestamp)";
        break;
      case '7d':
        dateInterval = '7 days';
        groupBy = "DATE_TRUNC('day', timestamp)";
        break;
      case '30d':
        dateInterval = '30 days';
        groupBy = "DATE_TRUNC('day', timestamp)";
        break;
      case '90d':
        dateInterval = '90 days';
        groupBy = "DATE_TRUNC('week', timestamp)";
        break;
      case '1y':
        dateInterval = '1 year';
        groupBy = "DATE_TRUNC('month', timestamp)";
        break;
      default:
        dateInterval = '30 days';
        groupBy = "DATE_TRUNC('day', timestamp)";
    }

    // Build base WHERE clause
    let whereClause = 'WHERE l.user_id = $1 AND l.timestamp >= CURRENT_DATE - INTERVAL $2';
    let queryParams = [user.user_id, dateInterval];
    let paramCount = 2;

    if (apiKeyId) {
      whereClause += ` AND l.api_key_id = $${++paramCount}`;
      queryParams.push(apiKeyId);
    }

    // Get overall statistics
    const overallStatsQuery = `
      SELECT 
        COUNT(*) as total_requests,
        COUNT(DISTINCT l.api_key_id) as unique_api_keys,
        COUNT(DISTINCT DATE_TRUNC('day', l.timestamp)) as active_days,
        AVG(l.response_time_ms) as avg_response_time,
        COUNT(*) FILTER (WHERE l.status_code >= 200 AND l.status_code < 300) as successful_requests,
        COUNT(*) FILTER (WHERE l.status_code >= 400) as error_requests,
        SUM(l.tokens_used) as total_tokens,
        SUM(l.cost_usd) as total_cost
      FROM api_usage_logs l
      ${whereClause}
    `;

    const overallStats = await manager.query(overallStatsQuery, queryParams);

    // Get usage over time
    const timeSeriesQuery = `
      SELECT 
        ${groupBy} as period,
        COUNT(*) as requests,
        AVG(response_time_ms) as avg_response_time,
        COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300) as successful_requests,
        COUNT(*) FILTER (WHERE status_code >= 400) as error_requests,
        SUM(tokens_used) as tokens,
        SUM(cost_usd) as cost
      FROM api_usage_logs l
      ${whereClause}
      GROUP BY ${groupBy}
      ORDER BY period
    `;

    const timeSeries = await manager.query(timeSeriesQuery, queryParams);

    // Get endpoint statistics
    const endpointStatsQuery = `
      SELECT 
        l.endpoint,
        COUNT(*) as requests,
        AVG(l.response_time_ms) as avg_response_time,
        COUNT(*) FILTER (WHERE l.status_code >= 200 AND l.status_code < 300) as successful_requests,
        COUNT(*) FILTER (WHERE l.status_code >= 400) as error_requests,
        SUM(l.tokens_used) as tokens,
        SUM(l.cost_usd) as cost
      FROM api_usage_logs l
      ${whereClause}
      GROUP BY l.endpoint
      ORDER BY requests DESC
      LIMIT 10
    `;

    const endpointStats = await manager.query(endpointStatsQuery, queryParams);

    // Get status code distribution
    const statusCodeQuery = `
      SELECT 
        l.status_code,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ()), 2) as percentage
      FROM api_usage_logs l
      ${whereClause}
      GROUP BY l.status_code
      ORDER BY count DESC
    `;

    const statusCodes = await manager.query(statusCodeQuery, queryParams);

    // Get API key usage breakdown
    const apiKeyStatsQuery = `
      SELECT 
        k.key_name,
        k.api_key_id,
        COUNT(*) as requests,
        AVG(l.response_time_ms) as avg_response_time,
        SUM(l.tokens_used) as tokens,
        SUM(l.cost_usd) as cost,
        MAX(l.timestamp) as last_used
      FROM api_usage_logs l
      JOIN api_keys k ON l.api_key_id = k.api_key_id
      ${whereClause}
      GROUP BY k.api_key_id, k.key_name
      ORDER BY requests DESC
      LIMIT 10
    `;

    const apiKeyStats = await manager.query(apiKeyStatsQuery, queryParams);

    // Get geographic distribution (if IP data is available)
    const geoQuery = `
      SELECT 
        l.ip_address,
        COUNT(*) as requests,
        AVG(l.response_time_ms) as avg_response_time
      FROM api_usage_logs l
      ${whereClause} AND l.ip_address IS NOT NULL
      GROUP BY l.ip_address
      ORDER BY requests DESC
      LIMIT 20
    `;

    const geoStats = await manager.query(geoQuery, queryParams);

    // Get error analysis
    const errorAnalysisQuery = `
      SELECT 
        l.status_code,
        l.error_message,
        COUNT(*) as count,
        MAX(l.timestamp) as last_occurrence
      FROM api_usage_logs l
      ${whereClause} AND l.status_code >= 400
      GROUP BY l.status_code, l.error_message
      ORDER BY count DESC
      LIMIT 20
    `;

    const errorAnalysis = await manager.query(errorAnalysisQuery, queryParams);

    // Calculate growth metrics
    const growthQuery = `
      WITH current_period AS (
        SELECT COUNT(*) as current_requests
        FROM api_usage_logs l
        ${whereClause}
      ),
      previous_period AS (
        SELECT COUNT(*) as previous_requests
        FROM api_usage_logs l
        WHERE l.user_id = $1 
        AND l.timestamp >= CURRENT_DATE - INTERVAL '${timeframe === '1d' ? '2 days' : timeframe === '7d' ? '14 days' : timeframe === '30d' ? '60 days' : '180 days'}'
        AND l.timestamp < CURRENT_DATE - INTERVAL $2
      )
      SELECT 
        c.current_requests,
        p.previous_requests,
        CASE 
          WHEN p.previous_requests > 0 THEN 
            ROUND(((c.current_requests - p.previous_requests) * 100.0 / p.previous_requests), 2)
          ELSE 0
        END as growth_percentage
      FROM current_period c, previous_period p
    `;

    const growthStats = await manager.query(growthQuery, [user.user_id, dateInterval]);

    return res.status(200).json({
      success: true,
      message: 'Analytics retrieved successfully',
      data: {
        timeframe,
        date_range: {
          start: new Date(Date.now() - getDaysFromTimeframe(timeframe) * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        },
        overall_stats: overallStats.rows[0],
        growth_stats: growthStats.rows[0],
        time_series: timeSeries.rows,
        endpoint_stats: endpointStats.rows,
        status_codes: statusCodes.rows,
        api_key_stats: apiKeyStats.rows,
        geographic_stats: geoStats.rows,
        error_analysis: errorAnalysis.rows,
        summary: {
          success_rate: overallStats.rows[0].total_requests > 0 
            ? Math.round((overallStats.rows[0].successful_requests / overallStats.rows[0].total_requests) * 100 * 100) / 100
            : 0,
          error_rate: overallStats.rows[0].total_requests > 0 
            ? Math.round((overallStats.rows[0].error_requests / overallStats.rows[0].total_requests) * 100 * 100) / 100
            : 0,
          avg_daily_requests: overallStats.rows[0].active_days > 0
            ? Math.round(overallStats.rows[0].total_requests / overallStats.rows[0].active_days * 100) / 100
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return res.status(500).json({ error: 'Failed to retrieve analytics' });
  }
}

function getDaysFromTimeframe(timeframe: string): number {
  switch (timeframe) {
    case '1d': return 1;
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    case '1y': return 365;
    default: return 30;
  }
}