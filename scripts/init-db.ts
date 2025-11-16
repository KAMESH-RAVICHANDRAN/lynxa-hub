import { DatabaseManager, DatabaseUtils } from '../lib/database';

async function initializeDatabase() {
  console.log('🚀 Starting database initialization...');

  try {
    const manager = await DatabaseUtils.getManager();
    
    console.log('📊 Creating database schema...');
    
    // Read and execute schema file
    const fs = require('fs');
    const path = require('path');
    
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          await manager.query(statement);
          console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
        } catch (error) {
          console.log(`⚠️  Statement ${i + 1} failed (might already exist):`, error.message);
        }
      }
    }
    
    console.log('👤 Creating initial admin user...');
    
    // Create initial admin user
    const bcrypt = require('bcryptjs');
    const crypto = require('crypto');
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@lynxa.pro';
    const adminPassword = process.env.ADMIN_PASSWORD || 'LynxaAdmin2024!';
    const adminUserId = crypto.randomUUID();
    
    // Check if admin user already exists
    const existingAdmin = await manager.query(
      'SELECT user_id FROM users WHERE email = $1',
      [adminEmail]
    );
    
    if (existingAdmin.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      await manager.query(`
        INSERT INTO users (
          user_id, email, password_hash, first_name, last_name, 
          role, is_active, email_verified, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        adminUserId,
        adminEmail,
        hashedPassword,
        'System',
        'Administrator',
        'super_admin',
        true,
        true
      ]);
      
      console.log('✅ Admin user created successfully');
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
      console.log('⚠️  Please change the admin password after first login!');
    } else {
      console.log('ℹ️  Admin user already exists, skipping creation');
    }
    
    console.log('🔧 Setting up initial configuration...');
    
    // Create sample API key for admin user
    const adminUser = await manager.query(
      'SELECT user_id FROM users WHERE email = $1',
      [adminEmail]
    );
    
    if (adminUser.rows.length > 0) {
      const userId = adminUser.rows[0].user_id;
      
      // Check if admin already has API keys
      const existingKeys = await manager.query(
        'SELECT api_key_id FROM api_keys WHERE user_id = $1',
        [userId]
      );
      
      if (existingKeys.rows.length === 0) {
        const apiKeyId = crypto.randomUUID();
        const keyHash = crypto.createHash('sha256').update(`lynxa_${crypto.randomBytes(32).toString('hex')}`).digest('hex');
        const keyPrefix = 'lynxa_' + crypto.randomBytes(16).toString('hex');
        
        await manager.query(`
          INSERT INTO api_keys (
            api_key_id, user_id, key_name, key_hash, key_prefix,
            is_active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          apiKeyId,
          userId,
          'Admin Default Key',
          keyHash,
          keyPrefix,
          true
        ]);
        
        console.log('🔑 Created default API key for admin user');
        console.log(`🏷️  Key Name: Admin Default Key`);
        console.log(`🆔 Key Prefix: ${keyPrefix}`);
      }
    }
    
    console.log('📋 Creating database indexes for optimization...');
    
    // Additional indexes for performance
    const indexes = [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_usage_logs_user_timestamp ON api_usage_logs(user_id, timestamp DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_usage_logs_key_timestamp ON api_usage_logs(api_key_id, timestamp DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_usage_logs_endpoint ON api_usage_logs(endpoint)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_usage_logs_status ON api_usage_logs(status_code)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_user_active ON user_sessions(user_id, is_active)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active ON users(email, is_active)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_user_active ON api_keys(user_id, is_active)'
    ];
    
    for (const indexSql of indexes) {
      try {
        await manager.query(indexSql);
        console.log(`✅ Index created successfully`);
      } catch (error) {
        console.log(`ℹ️  Index might already exist:`, error.message);
      }
    }
    
    console.log('🧹 Setting up database maintenance...');
    
    // Create cleanup functions
    const cleanupFunctions = `
      -- Function to cleanup old sessions
      CREATE OR REPLACE FUNCTION cleanup_old_sessions()
      RETURNS void AS $$
      BEGIN
        DELETE FROM user_sessions 
        WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
        
        UPDATE user_sessions 
        SET is_active = false 
        WHERE expires_at < CURRENT_TIMESTAMP AND is_active = true;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Function to cleanup old audit logs (keep 1 year)
      CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
      RETURNS void AS $$
      BEGIN
        DELETE FROM audit_logs 
        WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '1 year';
      END;
      $$ LANGUAGE plpgsql;
      
      -- Function to archive old usage logs (keep 6 months active, archive older)
      CREATE OR REPLACE FUNCTION archive_old_usage_logs()
      RETURNS void AS $$
      BEGIN
        -- In a real implementation, you might move to an archive table
        -- For now, we'll just delete very old logs (2+ years)
        DELETE FROM api_usage_logs 
        WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '2 years';
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await manager.query(cleanupFunctions);
    console.log('✅ Database maintenance functions created');
    
    console.log('📊 Database initialization completed successfully!');
    console.log('');
    console.log('🎉 Your Lynxa Hub database is ready to use!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start your application server');
    console.log('2. Login with the admin credentials');
    console.log('3. Create your first API keys');
    console.log('4. Test the AI API endpoints');
    console.log('');
    console.log('📚 API Documentation:');
    console.log('- Authentication: /api/auth/[action]');
    console.log('- API Keys: /api/keys');
    console.log('- AI API: /api/lynxa');
    console.log('- User Profile: /api/users/profile');
    console.log('- Analytics: /api/analytics/usage');
    console.log('- Billing: /api/billing');
    console.log('- Admin: /api/admin/[action]');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('');
    console.error('Troubleshooting tips:');
    console.error('1. Check your database connection credentials in .env');
    console.error('2. Ensure PostgreSQL server is running');
    console.error('3. Verify database exists and user has proper permissions');
    console.error('4. Check network connectivity to database server');
    
    process.exit(1);
  }
}

// Health check function
async function checkDatabaseHealth() {
  try {
    console.log('🏥 Checking database health...');
    
    const manager = await DatabaseUtils.getManager();
    
    // Basic connectivity test
    const connectTest = await manager.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Database connection: OK');
    console.log(`📅 Server time: ${connectTest.rows[0].current_time}`);
    
    // Check table existence
    const tables = [
      'users', 'api_keys', 'user_sessions', 'api_usage_logs', 
      'organizations', 'organization_members', 'audit_logs'
    ];
    
    for (const table of tables) {
      const tableCheck = await manager.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);
      
      const exists = tableCheck.rows[0].exists;
      console.log(`${exists ? '✅' : '❌'} Table '${table}': ${exists ? 'EXISTS' : 'MISSING'}`);
    }
    
    // Check data integrity
    const userCount = await manager.query('SELECT COUNT(*) as count FROM users');
    const keyCount = await manager.query('SELECT COUNT(*) as count FROM api_keys');
    const usageCount = await manager.query('SELECT COUNT(*) as count FROM api_usage_logs WHERE timestamp >= CURRENT_DATE - INTERVAL \'7 days\'');
    
    console.log('');
    console.log('📊 Database Statistics:');
    console.log(`👥 Total users: ${userCount.rows[0].count}`);
    console.log(`🔑 Total API keys: ${keyCount.rows[0].count}`);
    console.log(`📈 Usage logs (7 days): ${usageCount.rows[0].count}`);
    
    console.log('');
    console.log('✅ Database health check completed successfully!');
    
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    process.exit(1);
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'init':
    initializeDatabase();
    break;
  case 'health':
    checkDatabaseHealth();
    break;
  default:
    console.log('Lynxa Hub Database Manager');
    console.log('');
    console.log('Usage:');
    console.log('  npm run db:init    - Initialize database schema and create admin user');
    console.log('  npm run db:health  - Check database health and connectivity');
    console.log('');
    console.log('Environment variables required:');
    console.log('  DATABASE_URL or NILEDB_* credentials');
    console.log('  ADMIN_EMAIL (optional, default: admin@lynxa.pro)');
    console.log('  ADMIN_PASSWORD (optional, default: LynxaAdmin2024!)');
    break;
}