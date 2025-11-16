import { pgTable, uuid, varchar, text, timestamp, boolean, integer, decimal, jsonb, index } from 'drizzle-orm/pg-core';

// Users table - integrates with Stack Auth
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  stackAuthId: varchar('stack_auth_id', { length: 255 }).unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  displayName: varchar('display_name', { length: 200 }),
  profileImageUrl: text('profile_image_url'),
  company: varchar('company', { length: 255 }),
  jobTitle: varchar('job_title', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  timezone: varchar('timezone', { length: 100 }).default('UTC'),
  language: varchar('language', { length: 10 }).default('en'),
  role: varchar('role', { length: 50 }).default('user').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  billingEmail: varchar('billing_email', { length: 255 }),
  preferences: jsonb('preferences').default({}),
  signupSource: varchar('signup_source', { length: 100 }),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
  stackAuthIdIdx: index('idx_users_stack_auth_id').on(table.stackAuthId),
  activeIdx: index('idx_users_active').on(table.isActive),
}));

// API Keys table
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  keyName: varchar('key_name', { length: 255 }).notNull(),
  keyHash: varchar('key_hash', { length: 255 }).notNull().unique(),
  keyPrefix: varchar('key_prefix', { length: 50 }).notNull(),
  description: text('description'),
  permissions: jsonb('permissions').default(['read']),
  rateLimit: integer('rate_limit').default(1000),
  rateLimitWindow: integer('rate_limit_window').default(3600000), // 1 hour in ms
  isActive: boolean('is_active').default(true).notNull(),
  lastUsed: timestamp('last_used'),
  usageCount: integer('usage_count').default(0),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_api_keys_user_id').on(table.userId),
  keyHashIdx: index('idx_api_keys_hash').on(table.keyHash),
  activeIdx: index('idx_api_keys_active').on(table.isActive),
}));

// API Usage Logs table
export const apiUsageLogs = pgTable('api_usage_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  apiKeyId: uuid('api_key_id').references(() => apiKeys.id, { onDelete: 'set null' }),
  endpoint: varchar('endpoint', { length: 255 }).notNull(),
  method: varchar('method', { length: 10 }).notNull(),
  statusCode: integer('status_code').notNull(),
  responseTimeMs: integer('response_time_ms'),
  tokensUsed: integer('tokens_used').default(0),
  costUsd: decimal('cost_usd', { precision: 10, scale: 6 }).default('0'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  errorMessage: text('error_message'),
  requestMetadata: jsonb('request_metadata').default({}),
  responseMetadata: jsonb('response_metadata').default({}),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  userIdTimestampIdx: index('idx_usage_logs_user_timestamp').on(table.userId, table.timestamp),
  apiKeyTimestampIdx: index('idx_usage_logs_api_key_timestamp').on(table.apiKeyId, table.timestamp),
  endpointIdx: index('idx_usage_logs_endpoint').on(table.endpoint),
  timestampIdx: index('idx_usage_logs_timestamp').on(table.timestamp),
}));

// Organizations table (for team management)
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  website: varchar('website', { length: 255 }),
  logoUrl: text('logo_url'),
  billingEmail: varchar('billing_email', { length: 255 }),
  subscriptionTier: varchar('subscription_tier', { length: 50 }).default('free'),
  subscriptionStatus: varchar('subscription_status', { length: 50 }).default('active'),
  subscriptionEndsAt: timestamp('subscription_ends_at'),
  settings: jsonb('settings').default({}),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: index('idx_organizations_slug').on(table.slug),
  activeIdx: index('idx_organizations_active').on(table.isActive),
}));

// Organization Members table
export const organizationMembers = pgTable('organization_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).default('member').notNull(),
  permissions: jsonb('permissions').default([]),
  invitedBy: uuid('invited_by').references(() => users.id),
  invitedAt: timestamp('invited_at'),
  joinedAt: timestamp('joined_at').defaultNow(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgUserIdx: index('idx_org_members_org_user').on(table.organizationId, table.userId),
  userIdIdx: index('idx_org_members_user').on(table.userId),
}));

// User Sessions table (for Stack Auth integration)
export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  stackAuthSessionId: varchar('stack_auth_session_id', { length: 255 }),
  sessionToken: text('session_token'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  location: jsonb('location').default({}),
  isActive: boolean('is_active').default(true).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  lastActivity: timestamp('last_activity').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_sessions_user_id').on(table.userId),
  stackAuthSessionIdx: index('idx_sessions_stack_auth').on(table.stackAuthSessionId),
  activeIdx: index('idx_sessions_active').on(table.isActive),
  expiresIdx: index('idx_sessions_expires').on(table.expiresAt),
}));

// Audit Logs table
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'set null' }),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  eventDescription: text('event_description').notNull(),
  resourceType: varchar('resource_type', { length: 100 }),
  resourceId: varchar('resource_id', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata').default({}),
  severity: varchar('severity', { length: 20 }).default('info'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  userIdTimestampIdx: index('idx_audit_logs_user_timestamp').on(table.userId, table.timestamp),
  eventTypeIdx: index('idx_audit_logs_event_type').on(table.eventType),
  timestampIdx: index('idx_audit_logs_timestamp').on(table.timestamp),
}));

// Billing & Usage table
export const billingUsage = pgTable('billing_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  period: varchar('period', { length: 20 }).notNull(), // 'YYYY-MM' format
  requestCount: integer('request_count').default(0),
  tokenCount: integer('token_count').default(0),
  costUsd: decimal('cost_usd', { precision: 10, scale: 6 }).default('0'),
  subscriptionTier: varchar('subscription_tier', { length: 50 }),
  billingCycle: varchar('billing_cycle', { length: 20 }).default('monthly'),
  invoiceId: varchar('invoice_id', { length: 255 }),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userPeriodIdx: index('idx_billing_user_period').on(table.userId, table.period),
  orgPeriodIdx: index('idx_billing_org_period').on(table.organizationId, table.period),
}));

// Webhooks table
export const webhooks = pgTable('webhooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  events: jsonb('events').default([]),
  secret: varchar('secret', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
  lastTriggered: timestamp('last_triggered'),
  failureCount: integer('failure_count').default(0),
  maxRetries: integer('max_retries').default(3),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_webhooks_user_id').on(table.userId),
  activeIdx: index('idx_webhooks_active').on(table.isActive),
}));