-- Lynxa AI Platform Database Schema
-- Compatible with PostgreSQL (Neon & NileDB)

-- Users table for authentication and profiles
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  user_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  
  -- Additional profile fields
  company VARCHAR(255),
  job_title VARCHAR(255),
  phone VARCHAR(50),
  timezone VARCHAR(100) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'en',
  preferences JSONB DEFAULT '{}'::jsonb,
  
  -- Billing information
  billing_email VARCHAR(255),
  billing_address JSONB,
  tax_id VARCHAR(100),
  
  -- Metadata
  signup_source VARCHAR(100),
  referrer_id UUID REFERENCES users(user_id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- API Keys table for secure API access
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  key_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  key_prefix VARCHAR(20) NOT NULL,
  
  -- Permissions and limits
  permissions JSONB DEFAULT '[]'::jsonb,
  rate_limit INTEGER DEFAULT 1000,
  rate_limit_window INTEGER DEFAULT 3600,
  monthly_limit INTEGER,
  
  -- Status and lifecycle
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Usage tracking
  total_requests INTEGER DEFAULT 0,
  current_month_requests INTEGER DEFAULT 0,
  
  -- Security
  allowed_origins JSONB DEFAULT '[]'::jsonb,
  allowed_ips JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  description TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- API Usage Logs table for monitoring and analytics
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id SERIAL PRIMARY KEY,
  log_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(user_id),
  api_key_id UUID NOT NULL REFERENCES api_keys(key_id),
  
  -- Request details
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  request_size INTEGER,
  response_size INTEGER,
  response_time_ms INTEGER,
  status_code INTEGER NOT NULL,
  
  -- AI Model details
  model_used VARCHAR(100),
  tokens_used INTEGER,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  
  -- Request metadata
  user_agent TEXT,
  ip_address INET,
  referer TEXT,
  request_id VARCHAR(255),
  
  -- Timing
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Error tracking
  error_code VARCHAR(100),
  error_message TEXT,
  
  -- Billing
  cost_cents INTEGER DEFAULT 0,
  
  -- Additional data
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Sessions table for user authentication
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  session_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Session details
  refresh_token_hash VARCHAR(255) NOT NULL,
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  location_info JSONB,
  
  -- Status and timing
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Organizations table for team management (future feature)
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  org_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  website VARCHAR(255),
  logo_url TEXT,
  
  -- Billing and limits
  plan_type VARCHAR(50) DEFAULT 'free',
  billing_email VARCHAR(255),
  monthly_api_limit INTEGER,
  seats_limit INTEGER DEFAULT 5,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Settings
  settings JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Organization memberships table
CREATE TABLE IF NOT EXISTS organization_memberships (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  joined_at TIMESTAMP WITH TIME ZONE,
  
  -- Permissions
  permissions JSONB DEFAULT '[]'::jsonb,
  
  UNIQUE(user_id, org_id)
);

-- Webhooks table for event notifications
CREATE TABLE IF NOT EXISTS webhooks (
  id SERIAL PRIMARY KEY,
  webhook_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
  
  -- Webhook details
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  secret VARCHAR(255) NOT NULL,
  events JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Statistics
  total_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  last_delivery_at TIMESTAMP WITH TIME ZONE,
  last_failure_at TIMESTAMP WITH TIME ZONE
);

-- Audit logs for security and compliance
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  log_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  user_id UUID REFERENCES users(user_id),
  org_id UUID REFERENCES organizations(org_id),
  
  -- Event details
  event_type VARCHAR(100) NOT NULL,
  event_description TEXT,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  
  -- Request context
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(255),
  
  -- Timing
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Additional data
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_at ON api_keys(created_at);

CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_api_key_id ON api_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_status_code ON api_usage_logs(status_code);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to generate API key
CREATE OR REPLACE FUNCTION generate_api_key_hash(key_value TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(key_value, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified)
VALUES (
  'admin@lynxa.ai',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeeDN9CEL3cb4WfUW', -- admin123
  'Admin',
  'User',
  'admin',
  true
) ON CONFLICT (email) DO NOTHING;