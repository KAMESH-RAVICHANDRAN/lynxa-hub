import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { DatabaseUtils } from './database';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'lynxa-ai-super-secret-jwt-key-2024-production-ready';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

// Interfaces
export interface User {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  last_login?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
}

export interface ApiKey {
  key_id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  rate_limit: number;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
  last_used_at?: string;
  total_requests: number;
}

// Authentication class
export class AuthService {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  // Verify password
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  // Generate JWT tokens
  static generateTokens(user: User): AuthTokens {
    const payload = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      type: 'access'
    };

    const refreshPayload = {
      user_id: user.user_id,
      type: 'refresh'
    };

    const access_token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refresh_token = jwt.sign(refreshPayload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });

    return {
      access_token,
      refresh_token,
      expires_in: 7 * 24 * 60 * 60, // 7 days in seconds
      token_type: 'Bearer'
    };
  }

  // Verify JWT token
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Register new user
  static async register(userData: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Check if user already exists
      const existingUser = await DatabaseUtils.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Hash password
      const password_hash = await this.hashPassword(userData.password);

      // Create user
      const newUser = await DatabaseUtils.createUser({
        email: userData.email,
        password_hash,
        first_name: userData.first_name,
        last_name: userData.last_name
      });

      // Generate tokens
      const tokens = this.generateTokens(newUser);

      // Create session
      const refreshTokenHash = crypto.createHash('sha256').update(tokens.refresh_token).digest('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      await DatabaseUtils.createSession({
        user_id: newUser.user_id,
        refresh_token_hash: refreshTokenHash,
        expires_at: expiresAt
      });

      return { user: newUser, tokens };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Login user
  static async login(email: string, password: string, metadata?: {
    ip_address?: string;
    user_agent?: string;
    device_info?: object;
  }): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Get user by email
      const user = await DatabaseUtils.getUserByEmail(email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      // Update last login
      await DatabaseUtils.updateLastLogin(user.user_id);

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Create session
      const refreshTokenHash = crypto.createHash('sha256').update(tokens.refresh_token).digest('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      await DatabaseUtils.createSession({
        user_id: user.user_id,
        refresh_token_hash: refreshTokenHash,
        device_info: metadata?.device_info,
        ip_address: metadata?.ip_address,
        user_agent: metadata?.user_agent,
        expires_at: expiresAt
      });

      // Remove password hash from response
      delete user.password_hash;

      return { user, tokens };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Refresh tokens
  static async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = this.verifyToken(refreshToken);
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      // Get user
      const user = await DatabaseUtils.getUserById(decoded.user_id);
      if (!user || !user.is_active) {
        throw new Error('User not found or inactive');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);

      return tokens;
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  }

  // Get user from token
  static async getUserFromToken(token: string): Promise<User | null> {
    try {
      const decoded = this.verifyToken(token);
      if (decoded.type !== 'access') {
        return null;
      }

      const user = await DatabaseUtils.getUserById(decoded.user_id);
      return user;
    } catch (error) {
      return null;
    }
  }
}

// API Key Service
export class ApiKeyService {
  // Generate API key
  static generateApiKey(): { key: string; prefix: string; hash: string } {
    const prefix = process.env.API_KEY_PREFIX || 'lynxa_';
    const keyLength = parseInt(process.env.API_KEY_LENGTH || '32');
    
    const randomPart = crypto.randomBytes(keyLength).toString('hex');
    const key = `${prefix}${randomPart}`;
    const hash = crypto.createHash('sha256').update(key).digest('hex');

    return { key, prefix, hash };
  }

  // Create new API key
  static async createApiKey(
    userId: string,
    keyData: {
      name: string;
      permissions?: string[];
      rate_limit?: number;
      expires_days?: number;
    }
  ): Promise<{ key: string; keyInfo: ApiKey }> {
    try {
      const { key, prefix, hash } = this.generateApiKey();

      let expires_at: Date | undefined;
      if (keyData.expires_days) {
        expires_at = new Date();
        expires_at.setDate(expires_at.getDate() + keyData.expires_days);
      }

      const keyInfo = await DatabaseUtils.createApiKey({
        user_id: userId,
        name: keyData.name,
        key_hash: hash,
        key_prefix: prefix,
        permissions: keyData.permissions || ['lynxa:read', 'lynxa:write'],
        rate_limit: keyData.rate_limit || 1000,
        expires_at
      });

      return { key, keyInfo };
    } catch (error) {
      console.error('API key creation error:', error);
      throw error;
    }
  }

  // Verify API key
  static async verifyApiKey(key: string): Promise<{ 
    valid: boolean; 
    user?: User; 
    keyInfo?: ApiKey; 
  }> {
    try {
      const hash = crypto.createHash('sha256').update(key).digest('hex');
      const keyData = await DatabaseUtils.getApiKeyByHash(hash);

      if (!keyData) {
        return { valid: false };
      }

      // Check if key is active
      if (!keyData.is_active) {
        return { valid: false };
      }

      // Check if key has expired
      if (keyData.expires_at && new Date() > new Date(keyData.expires_at)) {
        return { valid: false };
      }

      // Update usage
      await DatabaseUtils.updateApiKeyUsage(keyData.key_id);

      return {
        valid: true,
        user: {
          user_id: keyData.user_id,
          email: keyData.email,
          role: keyData.role,
          is_active: true,
          email_verified: true,
          created_at: keyData.created_at
        },
        keyInfo: keyData
      };
    } catch (error) {
      console.error('API key verification error:', error);
      return { valid: false };
    }
  }

  // Get user's API keys
  static async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    try {
      return await DatabaseUtils.getUserApiKeys(userId);
    } catch (error) {
      console.error('Get user API keys error:', error);
      throw error;
    }
  }

  // Revoke API key
  static async revokeApiKey(userId: string, keyId: string): Promise<boolean> {
    try {
      const manager = await DatabaseUtils.getManager();
      const result = await manager.query(
        'UPDATE api_keys SET is_active = false WHERE key_id = $1 AND user_id = $2',
        [keyId, userId]
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('API key revocation error:', error);
      return false;
    }
  }
}

// Rate limiting service
export class RateLimitService {
  private static cache = new Map<string, { count: number; resetTime: number }>();

  static async checkRateLimit(
    key: string,
    limit: number,
    windowMs: number = 15 * 60 * 1000 // 15 minutes
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const entry = this.cache.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      const resetTime = now + windowMs;
      this.cache.set(key, { count: 1, resetTime });
      return { allowed: true, remaining: limit - 1, resetTime };
    }

    if (entry.count >= limit) {
      // Rate limit exceeded
      return { allowed: false, remaining: 0, resetTime: entry.resetTime };
    }

    // Increment counter
    entry.count++;
    this.cache.set(key, entry);

    return {
      allowed: true,
      remaining: limit - entry.count,
      resetTime: entry.resetTime
    };
  }

  // Clean up expired entries
  static cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.resetTime) {
        this.cache.delete(key);
      }
    }
  }
}

// Audit logging service
export class AuditService {
  static async logEvent(eventData: {
    user_id?: string;
    event_type: string;
    event_description: string;
    resource_type?: string;
    resource_id?: string;
    ip_address?: string;
    user_agent?: string;
    metadata?: object;
  }): Promise<void> {
    try {
      const manager = await DatabaseUtils.getManager();
      await manager.query(
        `INSERT INTO audit_logs (user_id, event_type, event_description, resource_type, 
         resource_id, ip_address, user_agent, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          eventData.user_id,
          eventData.event_type,
          eventData.event_description,
          eventData.resource_type,
          eventData.resource_id,
          eventData.ip_address,
          eventData.user_agent,
          JSON.stringify(eventData.metadata || {})
        ]
      );
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }
}

export default {
  AuthService,
  ApiKeyService,
  RateLimitService,
  AuditService
};