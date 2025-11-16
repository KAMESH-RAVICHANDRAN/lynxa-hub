import { ApiKeyService, RateLimitService } from '../../lib/auth';
import { DatabaseUtils } from '../../lib/database';

// Mock AI response function (replace with actual AI service)
async function generateAIResponse(prompt: string, options: {
  model?: string;
  temperature?: number;
  max_tokens?: number;
}) {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  const responses = [
    `Based on your query "${prompt.substring(0, 50)}...", here's a comprehensive response that addresses your question with detailed analysis and practical insights.`,
    `I understand you're asking about "${prompt.substring(0, 50)}...". Let me provide you with a thorough explanation that covers the key aspects of this topic.`,
    `Great question about "${prompt.substring(0, 50)}...". Here's what you need to know, including important considerations and actionable advice.`,
    `Regarding "${prompt.substring(0, 50)}...", I can help you understand this concept by breaking it down into clear, manageable parts with real-world examples.`,
    `Thank you for your question about "${prompt.substring(0, 50)}...". I'll provide you with a detailed response that includes both theoretical background and practical applications.`
  ];

  const baseResponse = responses[Math.floor(Math.random() * responses.length)];
  
  // Add more content based on model type
  let additionalContent = "";
  
  switch (options.model) {
    case 'lynxa-creative':
      additionalContent = "\n\nFrom a creative perspective, this opens up numerous possibilities for innovation and artistic expression. Consider exploring unconventional approaches that challenge traditional thinking.";
      break;
    case 'lynxa-code':
      additionalContent = "\n\n```python\n# Here's a code example to illustrate the concept:\ndef example_function():\n    return 'This demonstrates the implementation'\n```";
      break;
    case 'lynxa-fast':
      additionalContent = "\n\nQuick summary: The key points are efficiency, scalability, and practical implementation for immediate results.";
      break;
    default:
      additionalContent = "\n\nThis comprehensive analysis takes into account multiple factors including current trends, best practices, and future implications for optimal decision-making.";
  }

  return {
    response: baseResponse + additionalContent,
    model: options.model || 'lynxa-pro',
    tokens_used: Math.floor(50 + Math.random() * 200),
    prompt_tokens: Math.floor(prompt.length / 4),
    completion_tokens: Math.floor((baseResponse + additionalContent).length / 4)
  };
}

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  // Extract API key from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing or invalid authorization header',
      message: 'Please provide a valid API key in the Authorization header as: Bearer your_api_key'
    });
  }

  const apiKey = authHeader.replace('Bearer ', '');

  // Verify API key
  let keyVerification;
  try {
    keyVerification = await ApiKeyService.verifyApiKey(apiKey);
    
    if (!keyVerification.valid) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is invalid, expired, or has been revoked'
      });
    }
  } catch (error) {
    console.error('API key verification error:', error);
    return res.status(500).json({ error: 'Authentication service error' });
  }

  const { user, keyInfo } = keyVerification;

  // Rate limiting based on API key
  const rateLimitKey = `api_usage:${keyInfo.key_id}`;
  const rateLimit = await RateLimitService.checkRateLimit(
    rateLimitKey, 
    keyInfo.rate_limit || 1000,
    keyInfo.rate_limit_window || 3600000 // 1 hour default
  );

  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: `API key rate limit of ${keyInfo.rate_limit} requests exceeded`,
      reset_time: rateLimit.resetTime,
      remaining: rateLimit.remaining
    });
  }

  // Extract request body
  const { message, model, temperature, max_tokens } = req.body;

  // Validation
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'The "message" field is required and must be a non-empty string'
    });
  }

  if (message.length > 4000) {
    return res.status(400).json({
      error: 'Message too long',
      message: 'Message must be less than 4000 characters'
    });
  }

  // Validate model
  const allowedModels = ['lynxa-pro', 'lynxa-fast', 'lynxa-creative', 'lynxa-code'];
  const selectedModel = model && allowedModels.includes(model) ? model : 'lynxa-pro';

  // Validate temperature
  const validTemperature = temperature && 
    typeof temperature === 'number' && 
    temperature >= 0 && 
    temperature <= 2 ? temperature : 0.7;

  // Validate max_tokens
  const validMaxTokens = max_tokens && 
    typeof max_tokens === 'number' && 
    max_tokens > 0 && 
    max_tokens <= 4000 ? max_tokens : 1000;

  try {
    // Generate AI response
    const aiResult = await generateAIResponse(message.trim(), {
      model: selectedModel,
      temperature: validTemperature,
      max_tokens: validMaxTokens
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Generate request ID
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log API usage
    try {
      await DatabaseUtils.logApiUsage({
        user_id: user.user_id,
        api_key_id: keyInfo.key_id,
        endpoint: '/api/lynxa',
        method: 'POST',
        status_code: 200,
        response_time_ms: responseTime,
        tokens_used: aiResult.tokens_used,
        model_used: selectedModel,
        ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        user_agent: req.headers['user-agent']
      });
    } catch (logError) {
      console.error('Failed to log API usage:', logError);
      // Don't fail the request if logging fails
    }

    // Return successful response
    return res.status(200).json({
      success: true,
      request_id: requestId,
      response: aiResult.response,
      model: aiResult.model,
      usage: {
        prompt_tokens: aiResult.prompt_tokens,
        completion_tokens: aiResult.completion_tokens,
        total_tokens: aiResult.tokens_used
      },
      metadata: {
        response_time_ms: responseTime,
        rate_limit_remaining: rateLimit.remaining,
        rate_limit_reset: rateLimit.resetTime
      }
    });

  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.error('Lynxa AI API error:', error);

    // Log failed request
    try {
      await DatabaseUtils.logApiUsage({
        user_id: user.user_id,
        api_key_id: keyInfo.key_id,
        endpoint: '/api/lynxa',
        method: 'POST',
        status_code: 500,
        response_time_ms: responseTime,
        ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        user_agent: req.headers['user-agent']
      });
    } catch (logError) {
      console.error('Failed to log API usage:', logError);
    }

    return res.status(500).json({
      error: 'AI service error',
      message: 'An error occurred while processing your request',
      request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}