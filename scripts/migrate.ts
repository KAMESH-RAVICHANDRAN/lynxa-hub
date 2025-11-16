#!/usr/bin/env tsx

import 'dotenv/config';
import { DatabaseManager } from '../lib/database-manager';
import { StackAuthService } from '../lib/stack-auth';
import { db } from '../lib/database-manager';
import { users, organizations } from '../database/schema';
import { eq } from 'drizzle-orm';

async function runMigrations() {
  console.log('🚀 Starting Lynxa Hub database migration...');

  try {
    // Initialize database manager
    const dbManager = DatabaseManager.getInstance();
    
    // Run Drizzle migrations
    console.log('📦 Running schema migrations...');
    await dbManager.runMigrations();
    
    // Health check
    console.log('🏥 Performing health check...');
    const health = await dbManager.healthCheck();
    
    if (health.status !== 'healthy') {
      throw new Error(`Database health check failed: ${health.error}`);
    }
    
    console.log('✅ Database is healthy:', health.version);
    
    // Create default admin user if not exists
    await createDefaultAdmin();
    
    // Create default organization
    await createDefaultOrganization();
    
    // Setup database maintenance
    await setupMaintenance();
    
    // Get and display statistics
    const stats = await dbManager.getStats();
    console.log('📊 Database Statistics:');
    console.log(`   Users: ${stats.users}`);
    console.log(`   API Keys: ${stats.apiKeys}`);
    console.log(`   Recent Usage: ${stats.recentUsage}`);
    console.log(`   Active Sessions: ${stats.activeSessions}`);
    
    console.log('');
    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update your frontend to use Stack Auth');
    console.log('2. Test authentication flow');
    console.log('3. Configure email server in Neon dashboard');
    console.log('4. Deploy to production');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function createDefaultAdmin() {
  try {
    console.log('👤 Creating default admin user...');
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@lynxa.pro';
    
    // Check if admin exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);
    
    if (existingAdmin.length === 0) {
      const admin = await db
        .insert(users)
        .values({
          email: adminEmail,
          firstName: 'System',
          lastName: 'Administrator',
          displayName: 'System Administrator',
          role: 'super_admin',
          isActive: true,
          emailVerified: true,
          signupSource: 'migration',
        })
        .returning();
      
      console.log('✅ Admin user created:', admin[0].email);
      console.log('⚠️  Please set up Stack Auth to manage this user');
    } else {
      console.log('ℹ️  Admin user already exists, skipping creation');
    }
  } catch (error) {
    console.error('❌ Admin user creation failed:', error);
  }
}

async function createDefaultOrganization() {
  try {
    console.log('🏢 Creating default organization...');
    
    // Check if default organization exists
    const existingOrg = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, 'lynxa-hub'))
      .limit(1);
    
    if (existingOrg.length === 0) {
      const org = await db
        .insert(organizations)
        .values({
          name: 'Lynxa Hub',
          slug: 'lynxa-hub',
          description: 'Default Lynxa Hub organization',
          subscriptionTier: 'enterprise',
          subscriptionStatus: 'active',
          settings: {
            allowPublicSignup: true,
            defaultUserRole: 'user',
            maxApiKeys: 100,
            maxMembers: 1000,
          },
        })
        .returning();
      
      console.log('✅ Default organization created:', org[0].name);
    } else {
      console.log('ℹ️  Default organization already exists');
    }
  } catch (error) {
    console.error('❌ Organization creation failed:', error);
  }
}

async function setupMaintenance() {
  try {
    console.log('🔧 Setting up database maintenance...');
    
    // Create cleanup functions using raw SQL
    const maintenanceFunctions = `
      -- Function to cleanup expired sessions
      CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
      RETURNS INTEGER AS $$
      DECLARE
        affected_rows INTEGER;
      BEGIN
        UPDATE user_sessions 
        SET is_active = false 
        WHERE expires_at < NOW() AND is_active = true;
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RETURN affected_rows;
      END;
      $$ LANGUAGE plpgsql;

      -- Function to cleanup old audit logs
      CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
      RETURNS INTEGER AS $$
      DECLARE
        affected_rows INTEGER;
      BEGIN
        DELETE FROM audit_logs 
        WHERE timestamp < NOW() - INTERVAL '2 years';
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RETURN affected_rows;
      END;
      $$ LANGUAGE plpgsql;

      -- Function to archive old usage logs
      CREATE OR REPLACE FUNCTION archive_old_usage_logs()
      RETURNS INTEGER AS $$
      DECLARE
        affected_rows INTEGER;
      BEGIN
        DELETE FROM api_usage_logs 
        WHERE timestamp < NOW() - INTERVAL '1 year';
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RETURN affected_rows;
      END;
      $$ LANGUAGE plpgsql;

      -- Function for complete maintenance
      CREATE OR REPLACE FUNCTION run_maintenance()
      RETURNS JSON AS $$
      DECLARE
        sessions_cleaned INTEGER;
        logs_cleaned INTEGER;
        usage_archived INTEGER;
        result JSON;
      BEGIN
        sessions_cleaned := cleanup_expired_sessions();
        logs_cleaned := cleanup_old_audit_logs();
        usage_archived := archive_old_usage_logs();
        
        result := json_build_object(
          'sessions_cleaned', sessions_cleaned,
          'logs_cleaned', logs_cleaned,
          'usage_archived', usage_archived,
          'timestamp', NOW()
        );
        
        RETURN result;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    // Execute maintenance functions
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    await sql(maintenanceFunctions);
    
    console.log('✅ Database maintenance functions created');
  } catch (error) {
    console.error('❌ Maintenance setup failed:', error);
  }
}

async function rollback() {
  console.log('🔄 Rolling back migrations...');
  // Add rollback logic here if needed
  console.log('⚠️  Manual rollback required - check database state');
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'up':
  case 'migrate':
    runMigrations();
    break;
  case 'rollback':
    rollback();
    break;
  case 'status':
    (async () => {
      const manager = DatabaseManager.getInstance();
      const health = await manager.healthCheck();
      const stats = await manager.getStats();
      console.log('Database Status:', health);
      console.log('Statistics:', stats);
    })();
    break;
  default:
    console.log('Lynxa Hub Database Migration Tool');
    console.log('');
    console.log('Usage:');
    console.log('  npm run migrate        - Run all pending migrations');
    console.log('  npm run migrate:status - Check database status');
    console.log('  npm run migrate:rollback - Rollback last migration');
    console.log('');
    break;
}