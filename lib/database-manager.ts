import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import * as schema from '../database/schema';

// Create Neon database connection with AJ prefix support
const connectionUrl = process.env.AJ_DATABASE_URL || process.env.DATABASE_URL!;
const sql = neon(connectionUrl);
export const db = drizzle(sql, { schema });

// Database manager class
export class DatabaseManager {
  private static instance: DatabaseManager;
  private connection: any;

  private constructor() {
    this.connection = db;
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public getConnection() {
    return this.connection;
  }

  // Run migrations
  public async runMigrations() {
    try {
      console.log('🔄 Running database migrations...');
      await migrate(db, { migrationsFolder: './database/migrations' });
      console.log('✅ Migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration error:', error);
      throw error;
    }
  }

  // Health check
  public async healthCheck() {
    try {
      const result = await sql`SELECT NOW() as current_time, version() as db_version`;
      return {
        status: 'healthy',
        timestamp: result[0].current_time,
        version: result[0].db_version,
      };
    } catch (error) {
      console.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get database statistics
  public async getStats() {
    try {
      const userCount = await sql`SELECT COUNT(*) as count FROM users`;
      const apiKeyCount = await sql`SELECT COUNT(*) as count FROM api_keys`;
      const usageLogsCount = await sql`
        SELECT COUNT(*) as count 
        FROM api_usage_logs 
        WHERE timestamp >= NOW() - INTERVAL '7 days'
      `;
      const activeSessionsCount = await sql`
        SELECT COUNT(*) as count 
        FROM user_sessions 
        WHERE is_active = true AND expires_at > NOW()
      `;

      return {
        users: parseInt(userCount[0].count),
        apiKeys: parseInt(apiKeyCount[0].count),
        recentUsage: parseInt(usageLogsCount[0].count),
        activeSessions: parseInt(activeSessionsCount[0].count),
      };
    } catch (error) {
      console.error('Database stats error:', error);
      throw error;
    }
  }

  // Cleanup old data
  public async cleanup() {
    try {
      console.log('🧹 Starting database cleanup...');

      // Clean up expired sessions
      const expiredSessions = await sql`
        UPDATE user_sessions 
        SET is_active = false 
        WHERE expires_at < NOW() AND is_active = true
      `;
      console.log(`🔄 Deactivated ${expiredSessions.length} expired sessions`);

      // Delete very old audit logs (keep 2 years)
      const oldAuditLogs = await sql`
        DELETE FROM audit_logs 
        WHERE timestamp < NOW() - INTERVAL '2 years'
      `;
      console.log(`🗑️  Deleted ${oldAuditLogs.length} old audit logs`);

      // Archive old usage logs (keep 1 year active)
      const oldUsageLogs = await sql`
        DELETE FROM api_usage_logs 
        WHERE timestamp < NOW() - INTERVAL '1 year'
      `;
      console.log(`📦 Archived ${oldUsageLogs.length} old usage logs`);

      console.log('✅ Database cleanup completed');
    } catch (error) {
      console.error('❌ Database cleanup error:', error);
      throw error;
    }
  }
}

// Utility functions
export class DatabaseUtils {
  static async getManager() {
    return DatabaseManager.getInstance();
  }

  static getConnection() {
    return db;
  }

  // Transaction helper
  static async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    return await db.transaction(callback);
  }

  // Batch operations helper
  static async batchInsert(table: any, data: any[], batchSize = 1000) {
    const results = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const result = await db.insert(table).values(batch).returning();
      if (Array.isArray(result)) {
        results.push(...result);
      } else {
        results.push(result);
      }
    }
    
    return results;
  }

  // Query builder helper
  static async paginate<T>(
    query: any,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: T[]; total: number; page: number; limit: number; pages: number }> {
    const offset = (page - 1) * limit;
    
    // Get total count
    const countQuery = query.clone();
    const totalResult = await countQuery.select({ count: sql`count(*)` });
    const total = parseInt(totalResult[0].count);
    
    // Get paginated data
    const data = await query.limit(limit).offset(offset);
    
    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }
}

// Database middleware for Express
export function databaseMiddleware(req: any, res: any, next: any) {
  req.db = db;
  req.dbManager = DatabaseManager.getInstance();
  next();
}

// Error handling for database operations
export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Connection pool monitoring
export class ConnectionMonitor {
  static async monitor() {
    try {
      const manager = DatabaseManager.getInstance();
      const health = await manager.healthCheck();
      
      if (health.status === 'unhealthy') {
        console.error('🔴 Database connection unhealthy:', health.error);
        return false;
      }
      
      console.log('🟢 Database connection healthy');
      return true;
    } catch (error) {
      console.error('🔴 Connection monitor error:', error);
      return false;
    }
  }

  static startMonitoring(intervalMs: number = 60000) {
    setInterval(async () => {
      await ConnectionMonitor.monitor();
    }, intervalMs);
  }
}

