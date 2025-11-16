import { AuthService, ApiKeyService, AuditService } from '../../lib/auth';

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'register':
        return await handleRegister(req, res);
      case 'login':
        return await handleLogin(req, res);
      case 'refresh':
        return await handleRefresh(req, res);
      case 'verify':
        return await handleVerify(req, res);
      case 'logout':
        return await handleLogout(req, res);
      default:
        return res.status(404).json({ error: 'Endpoint not found' });
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Register new user
async function handleRegister(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, first_name, last_name } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const result = await AuthService.register({
      email: email.toLowerCase(),
      password,
      first_name,
      last_name
    });

    // Log registration event
    await AuditService.logEvent({
      user_id: result.user.user_id,
      event_type: 'user.registered',
      event_description: `User registered with email: ${email}`,
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      user_agent: req.headers['user-agent']
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: result.user,
        tokens: result.tokens
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    
    return res.status(500).json({ error: 'Registration failed' });
  }
}

// Login user
async function handleLogin(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await AuthService.login(
      email.toLowerCase(),
      password,
      {
        ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        user_agent: req.headers['user-agent'],
        device_info: {
          platform: req.headers['sec-ch-ua-platform'],
          mobile: req.headers['sec-ch-ua-mobile'] === '?1'
        }
      }
    );

    // Log login event
    await AuditService.logEvent({
      user_id: result.user.user_id,
      event_type: 'user.login',
      event_description: `User logged in successfully`,
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      user_agent: req.headers['user-agent']
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        tokens: result.tokens
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Log failed login attempt
    await AuditService.logEvent({
      event_type: 'user.login_failed',
      event_description: `Failed login attempt for email: ${email}`,
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      user_agent: req.headers['user-agent'],
      metadata: { email, error: error.message }
    });
    
    return res.status(401).json({ error: 'Invalid email or password' });
  }
}

// Refresh tokens
async function handleRefresh(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const tokens = await AuthService.refreshTokens(refresh_token);

    return res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: { tokens }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
}

// Verify token and get user
async function handleVerify(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '') || req.body?.token;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const user = await AuthService.getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    return res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: { user }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Logout user (invalidate session)
async function handleLogout(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');

  try {
    if (token) {
      const user = await AuthService.getUserFromToken(token);
      
      if (user) {
        // Log logout event
        await AuditService.logEvent({
          user_id: user.user_id,
          event_type: 'user.logout',
          event_description: 'User logged out',
          ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          user_agent: req.headers['user-agent']
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  }
}