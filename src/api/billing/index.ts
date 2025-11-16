import { AuthService, RateLimitService, AuditService } from '../../lib/auth';
import { DatabaseUtils } from '../../lib/database';

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
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
  const rateLimitKey = `billing:${user.user_id}`;
  const rateLimit = await RateLimitService.checkRateLimit(rateLimitKey, 30, 15 * 60 * 1000);
  
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      reset_time: rateLimit.resetTime
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetBilling(req, res, user);
      case 'POST':
        return await handleCreateSubscription(req, res, user);
      case 'PUT':
        return await handleUpdateBilling(req, res, user);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Billing error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Get billing information
async function handleGetBilling(req: any, res: any, user: any) {
  try {
    const manager = await DatabaseUtils.getManager();

    // Get user billing info
    const userResult = await manager.query(
      `SELECT billing_email, company, preferences 
       FROM users WHERE user_id = $1`,
      [user.user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userInfo = userResult.rows[0];

    // Get current usage statistics
    const usageResult = await manager.query(
      `SELECT 
         COUNT(*) as current_month_requests,
         SUM(tokens_used) as current_month_tokens,
         SUM(cost_usd) as current_month_cost,
         COUNT(DISTINCT api_key_id) as active_api_keys
       FROM api_usage_logs 
       WHERE user_id = $1 
       AND DATE_TRUNC('month', timestamp) = DATE_TRUNC('month', CURRENT_DATE)`,
      [user.user_id]
    );

    const usage = usageResult.rows[0];

    // Get usage by day for current month
    const dailyUsageResult = await manager.query(
      `SELECT 
         DATE(timestamp) as date,
         COUNT(*) as requests,
         SUM(tokens_used) as tokens,
         SUM(cost_usd) as cost
       FROM api_usage_logs 
       WHERE user_id = $1 
       AND DATE_TRUNC('month', timestamp) = DATE_TRUNC('month', CURRENT_DATE)
       GROUP BY DATE(timestamp)
       ORDER BY date`,
      [user.user_id]
    );

    // Get historical monthly costs
    const monthlyHistoryResult = await manager.query(
      `SELECT 
         DATE_TRUNC('month', timestamp) as month,
         COUNT(*) as requests,
         SUM(tokens_used) as tokens,
         SUM(cost_usd) as cost
       FROM api_usage_logs 
       WHERE user_id = $1 
       AND timestamp >= CURRENT_DATE - INTERVAL '12 months'
       GROUP BY DATE_TRUNC('month', timestamp)
       ORDER BY month`,
      [user.user_id]
    );

    // Calculate usage limits and tiers
    const currentTier = calculateUserTier(usage);
    const nextBillingDate = getNextBillingDate();

    return res.status(200).json({
      success: true,
      message: 'Billing information retrieved successfully',
      data: {
        user_info: {
          billing_email: userInfo.billing_email || userInfo.email,
          company: userInfo.company,
          preferences: userInfo.preferences
        },
        current_usage: {
          ...usage,
          current_month_requests: parseInt(usage.current_month_requests) || 0,
          current_month_tokens: parseInt(usage.current_month_tokens) || 0,
          current_month_cost: parseFloat(usage.current_month_cost) || 0,
          active_api_keys: parseInt(usage.active_api_keys) || 0
        },
        subscription: {
          tier: currentTier.name,
          status: 'active', // This would come from your payment processor
          next_billing_date: nextBillingDate,
          limits: currentTier.limits,
          features: currentTier.features
        },
        usage_history: {
          daily: dailyUsageResult.rows,
          monthly: monthlyHistoryResult.rows
        },
        pricing_tiers: getPricingTiers(),
        billing_alerts: generateBillingAlerts(usage, currentTier)
      }
    });
  } catch (error) {
    console.error('Get billing error:', error);
    return res.status(500).json({ error: 'Failed to retrieve billing information' });
  }
}

// Create or upgrade subscription
async function handleCreateSubscription(req: any, res: any, user: any) {
  const { tier, payment_method, billing_address } = req.body;

  if (!tier) {
    return res.status(400).json({ error: 'Subscription tier is required' });
  }

  const validTiers = ['free', 'starter', 'professional', 'enterprise'];
  if (!validTiers.includes(tier)) {
    return res.status(400).json({ error: 'Invalid subscription tier' });
  }

  try {
    const manager = await DatabaseUtils.getManager();

    // For demo purposes, we'll simulate subscription creation
    // In a real implementation, you'd integrate with Stripe, PayPal, etc.
    
    const subscriptionData = {
      user_id: user.user_id,
      tier: tier,
      status: 'active',
      started_at: new Date(),
      next_billing_date: getNextBillingDate(),
      payment_method: payment_method?.type || 'card',
      billing_address: billing_address
    };

    // Update user preferences with subscription info
    const currentPrefs = await manager.query(
      'SELECT preferences FROM users WHERE user_id = $1',
      [user.user_id]
    );

    const preferences = currentPrefs.rows[0]?.preferences || {};
    preferences.subscription = subscriptionData;

    await manager.query(
      'UPDATE users SET preferences = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [JSON.stringify(preferences), user.user_id]
    );

    // Log subscription creation
    await AuditService.logEvent({
      user_id: user.user_id,
      event_type: 'billing.subscription_created',
      event_description: `Subscription created for tier: ${tier}`,
      resource_type: 'subscription',
      resource_id: user.user_id,
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      user_agent: req.headers['user-agent'],
      metadata: { tier, payment_method: payment_method?.type }
    });

    return res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        subscription: subscriptionData,
        tier_info: getPricingTiers().find(t => t.id === tier)
      }
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    return res.status(500).json({ error: 'Failed to create subscription' });
  }
}

// Update billing information
async function handleUpdateBilling(req: any, res: any, user: any) {
  const { billing_email, payment_method, billing_address, preferences } = req.body;

  try {
    const manager = await DatabaseUtils.getManager();

    // Update billing email if provided
    if (billing_email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billing_email)) {
        return res.status(400).json({ error: 'Invalid billing email format' });
      }

      await manager.query(
        'UPDATE users SET billing_email = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [billing_email, user.user_id]
      );
    }

    // Update user preferences
    if (preferences) {
      const currentPrefs = await manager.query(
        'SELECT preferences FROM users WHERE user_id = $1',
        [user.user_id]
      );

      const updatedPrefs = { ...currentPrefs.rows[0]?.preferences, ...preferences };
      
      await manager.query(
        'UPDATE users SET preferences = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [JSON.stringify(updatedPrefs), user.user_id]
      );
    }

    // Log billing update
    await AuditService.logEvent({
      user_id: user.user_id,
      event_type: 'billing.info_updated',
      event_description: 'Billing information updated',
      resource_type: 'user',
      resource_id: user.user_id,
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      user_agent: req.headers['user-agent'],
      metadata: { 
        updated_billing_email: !!billing_email,
        updated_preferences: !!preferences
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Billing information updated successfully'
    });
  } catch (error) {
    console.error('Update billing error:', error);
    return res.status(500).json({ error: 'Failed to update billing information' });
  }
}

// Helper functions
function calculateUserTier(usage: any): any {
  const monthlyRequests = parseInt(usage.current_month_requests) || 0;
  const tiers = getPricingTiers();

  // Find appropriate tier based on usage
  for (const tier of tiers.reverse()) {
    if (monthlyRequests >= tier.limits.monthly_requests || tier.id === 'enterprise') {
      return tier;
    }
  }

  return tiers[0]; // Default to free tier
}

function getPricingTiers() {
  return [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      limits: {
        monthly_requests: 1000,
        monthly_tokens: 50000,
        api_keys: 2,
        rate_limit: 10
      },
      features: [
        'Basic API access',
        'Community support',
        'Usage analytics'
      ]
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 29,
      limits: {
        monthly_requests: 10000,
        monthly_tokens: 500000,
        api_keys: 5,
        rate_limit: 50
      },
      features: [
        'All Free features',
        'Email support',
        'Advanced analytics',
        'Custom rate limits'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 99,
      limits: {
        monthly_requests: 100000,
        monthly_tokens: 5000000,
        api_keys: 20,
        rate_limit: 200
      },
      features: [
        'All Starter features',
        'Priority support',
        'Webhook notifications',
        'Team management',
        'Custom integrations'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 499,
      limits: {
        monthly_requests: 1000000,
        monthly_tokens: 50000000,
        api_keys: 100,
        rate_limit: 1000
      },
      features: [
        'All Professional features',
        '24/7 dedicated support',
        'SLA guarantees',
        'Custom deployment',
        'Advanced security',
        'Compliance certifications'
      ]
    }
  ];
}

function getNextBillingDate(): string {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);
  return nextMonth.toISOString();
}

function generateBillingAlerts(usage: any, tier: any): any[] {
  const alerts = [];
  const monthlyRequests = parseInt(usage.current_month_requests) || 0;
  const monthlyTokens = parseInt(usage.current_month_tokens) || 0;

  // Request limit alerts
  const requestUsagePercent = (monthlyRequests / tier.limits.monthly_requests) * 100;
  if (requestUsagePercent >= 90) {
    alerts.push({
      type: 'warning',
      category: 'usage',
      message: `You've used ${requestUsagePercent.toFixed(1)}% of your monthly request limit`,
      action: 'Consider upgrading your plan'
    });
  } else if (requestUsagePercent >= 75) {
    alerts.push({
      type: 'info',
      category: 'usage',
      message: `You've used ${requestUsagePercent.toFixed(1)}% of your monthly request limit`,
      action: null
    });
  }

  // Token limit alerts
  const tokenUsagePercent = (monthlyTokens / tier.limits.monthly_tokens) * 100;
  if (tokenUsagePercent >= 90) {
    alerts.push({
      type: 'warning',
      category: 'tokens',
      message: `You've used ${tokenUsagePercent.toFixed(1)}% of your monthly token limit`,
      action: 'Consider upgrading your plan'
    });
  }

  return alerts;
}