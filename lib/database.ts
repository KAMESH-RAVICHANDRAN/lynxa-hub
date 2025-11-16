import { Pool, PoolClient } from 'pg';

// Database configuration interface
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

// NileDB Configuration
const nileConfig: DatabaseConfig = {
  host: 'eu-central-1.db.thenile.dev',
  port: 5432,
  database: 'nile_lime_jacket',
  username: process.env.NILEDB_USER || '019a8bff-2001-7653-a05a-6d046e1353fc',
  password: process.env.NILEDB_PASSWORD || '8eae9a63-8f9b-499c-b1f3-a3e4e7e13236',
  ssl: true
};

// Neon PostgreSQL Configuration
const neonConfig: DatabaseConfig = {
  host: process.env.PGHOST || 'ep-frosty-math-ah7srwi3-pooler.c-3.us-east-1.aws.neon.tech',
  port: 5432,
  database: process.env.PGDATABASE || 'neondb',
  username: process.env.PGUSER || 'neondb_owner',
  password: process.env.PGPASSWORD || 'npg_rzp3kWK5vhlq',
  ssl: true
};

// Connection pools
class DatabaseManager {
  private nilePool: Pool;
  private neonPool: Pool;
  private initialized = false;

  constructor() {
    this.nilePool = new Pool({
      host: nileConfig.host,
      port: nileConfig.port,
      database: nileConfig.database,
      user: nileConfig.username,
      password: nileConfig.password,
      ssl: nileConfig.ssl ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    this.neonPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // NileDB pool events
    this.nilePool.on('connect', (client) => {
      console.log('📦 Connected to NileDB');
    });

    this.nilePool.on('error', (err) => {
      console.error('❌ NileDB pool error:', err);
    });

    // Neon pool events
    this.neonPool.on('connect', (client) => {
      console.log('🔷 Connected to Neon PostgreSQL');
    });

    this.neonPool.on('error', (err) => {
      console.error('❌ Neon PostgreSQL pool error:', err);
    });
  }

  // Initialize database schema
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Test connections
      await this.testConnections();
      
      // Initialize schema on primary database (Neon)
      await this.initializeSchema();
      
      this.initialized = true;
      console.log('✅ Database manager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database manager:', error);
      throw error;
    }
  }

  // Test database connections
  private async testConnections(): Promise<void> {
    try {
      // Test Neon connection
      const neonClient = await this.neonPool.connect();
      await neonClient.query('SELECT NOW()');
      neonClient.release();
      console.log('✅ Neon PostgreSQL connection successful');

      // Test NileDB connection
      try {
        const nileClient = await this.nilePool.connect();
        await nileClient.query('SELECT NOW()');
        nileClient.release();
        console.log('✅ NileDB connection successful');
      } catch (nileError) {
        console.warn('⚠️ NileDB connection failed, using Neon only:', nileError.message);
      }
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      throw error;
    }
  }

  // Initialize database schema
  private async initializeSchema(): Promise<void> {
    const client = await this.neonPool.connect();
    try {
      // Read and execute schema
      const fs = require('fs');
      const path = require('path');
      const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
      
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schema);
        console.log('✅ Database schema initialized');
      } else {
        console.warn('⚠️ Schema file not found, skipping schema initialization');
      }
    } catch (error) {
      console.error('❌ Schema initialization failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get primary database client (Neon)
  async getPrimaryClient(): Promise<PoolClient> {
    return await this.neonPool.connect();
  }

  // Get NileDB client (for specific NileDB features)
  async getNileClient(): Promise<PoolClient> {
    return await this.nilePool.connect();
  }

  // Execute query on primary database
  async query(text: string, params?: any[]): Promise<any> {
    const client = await this.getPrimaryClient();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  // Execute transaction on primary database
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getPrimaryClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Health check
  async healthCheck(): Promise<{ neon: boolean; nile: boolean }> {
    const health = { neon: false, nile: false };

    // Check Neon
    try {
      const client = await this.neonPool.connect();
      await client.query('SELECT 1');
      client.release();
      health.neon = true;
    } catch (error) {
      console.error('Neon health check failed:', error);
    }

    // Check NileDB
    try {
      const client = await this.nilePool.connect();
      await client.query('SELECT 1');
      client.release();
      health.nile = true;
    } catch (error) {
      console.error('NileDB health check failed:', error);
    }

    return health;
  }

  // Cleanup expired sessions
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.query('SELECT cleanup_expired_sessions()');
    return result.rows[0].cleanup_expired_sessions;
  }

  // Close all connections
  async close(): Promise<void> {
    await Promise.all([
      this.neonPool.end(),
      this.nilePool.end()
    ]);
    console.log('🔌 Database connections closed');
  }
}

// Database utility functions
export class DatabaseUtils {
  private static manager: DatabaseManager;

  static async getManager(): Promise<DatabaseManager> {
    if (!this.manager) {
      this.manager = new DatabaseManager();
      await this.manager.initialize();
    }
    return this.manager;
  }

  // User operations
  static async createUser(userData: {
    email: string;
    password_hash: string;
    first_name?: string;
    last_name?: string;
    role?: string;
  }): Promise<any> {
    const manager = await this.getManager();
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING user_id, email, first_name, last_name, role, created_at
    `;
    const result = await manager.query(query, [
      userData.email,
      userData.password_hash,
      userData.first_name,
      userData.last_name,
      userData.role || 'user'
    ]);
    return result.rows[0];
  }

  static async getUserByEmail(email: string): Promise<any> {
    const manager = await this.getManager();
    const query = `
      SELECT user_id, email, password_hash, first_name, last_name, role, 
             is_active, email_verified, created_at, last_login
      FROM users 
      WHERE email = $1 AND is_active = true
    `;
    const result = await manager.query(query, [email]);
    return result.rows[0];
  }

  static async getUserById(userId: string): Promise<any> {
    const manager = await this.getManager();
    const query = `
      SELECT user_id, email, first_name, last_name, role, is_active, 
             email_verified, created_at, last_login, company, job_title
      FROM users 
      WHERE user_id = $1 AND is_active = true
    `;
    const result = await manager.query(query, [userId]);
    return result.rows[0];
  }

  static async updateLastLogin(userId: string): Promise<void> {
    const manager = await this.getManager();
    const query = `
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP, failed_login_attempts = 0 
      WHERE user_id = $1
    `;
    await manager.query(query, [userId]);
  }

  // API Key operations
  static async createApiKey(keyData: {
    user_id: string;
    name: string;
    key_hash: string;
    key_prefix: string;
    permissions?: string[];
    rate_limit?: number;
    expires_at?: Date;
  }): Promise<any> {
    const manager = await this.getManager();
    const query = `
      INSERT INTO api_keys (user_id, name, key_hash, key_prefix, permissions, rate_limit, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING key_id, name, key_prefix, permissions, rate_limit, created_at, expires_at
    `;
    const result = await manager.query(query, [
      keyData.user_id,
      keyData.name,
      keyData.key_hash,
      keyData.key_prefix,
      JSON.stringify(keyData.permissions || []),
      keyData.rate_limit || 1000,
      keyData.expires_at
    ]);
    return result.rows[0];
  }

  static async getApiKeyByHash(keyHash: string): Promise<any> {
    const manager = await this.getManager();
    const query = `
      SELECT ak.*, u.user_id, u.email, u.role
      FROM api_keys ak
      JOIN users u ON ak.user_id = u.user_id
      WHERE ak.key_hash = $1 AND ak.is_active = true AND u.is_active = true
    `;
    const result = await manager.query(query, [keyHash]);
    return result.rows[0];
  }

  static async getUserApiKeys(userId: string): Promise<any[]> {
    const manager = await this.getManager();
    const query = `
      SELECT key_id, name, key_prefix, permissions, rate_limit, is_active,
             created_at, expires_at, last_used_at, total_requests
      FROM api_keys 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await manager.query(query, [userId]);
    return result.rows;
  }

  static async updateApiKeyUsage(keyId: string): Promise<void> {
    const manager = await this.getManager();
    const query = `
      UPDATE api_keys 
      SET last_used_at = CURRENT_TIMESTAMP, 
          total_requests = total_requests + 1,
          current_month_requests = current_month_requests + 1
      WHERE key_id = $1
    `;
    await manager.query(query, [keyId]);
  }

  // Session operations
  static async createSession(sessionData: {
    user_id: string;
    refresh_token_hash: string;
    device_info?: object;
    ip_address?: string;
    user_agent?: string;
    expires_at: Date;
  }): Promise<any> {
    const manager = await this.getManager();
    const query = `
      INSERT INTO user_sessions (user_id, refresh_token_hash, device_info, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING session_id, created_at
    `;
    const result = await manager.query(query, [
      sessionData.user_id,
      sessionData.refresh_token_hash,
      JSON.stringify(sessionData.device_info || {}),
      sessionData.ip_address,
      sessionData.user_agent,
      sessionData.expires_at
    ]);
    return result.rows[0];
  }

  // Usage logging
  static async logApiUsage(logData: {
    user_id: string;
    api_key_id: string;
    endpoint: string;
    method: string;
    status_code: number;
    response_time_ms?: number;
    tokens_used?: number;
    model_used?: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<void> {
    const manager = await this.getManager();
    const query = `
      INSERT INTO api_usage_logs 
      (user_id, api_key_id, endpoint, method, status_code, response_time_ms, 
       tokens_used, model_used, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;
    await manager.query(query, [
      logData.user_id,
      logData.api_key_id,
      logData.endpoint,
      logData.method,
      logData.status_code,
      logData.response_time_ms,
      logData.tokens_used,
      logData.model_used,
      logData.ip_address,
      logData.user_agent
    ]);
  }
}

// Export singleton instance
export default DatabaseUtils;