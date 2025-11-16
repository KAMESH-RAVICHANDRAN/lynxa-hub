CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"key_name" varchar(255) NOT NULL,
	"key_hash" varchar(255) NOT NULL,
	"key_prefix" varchar(50) NOT NULL,
	"description" text,
	"permissions" jsonb DEFAULT '["read"]'::jsonb,
	"rate_limit" integer DEFAULT 1000,
	"rate_limit_window" integer DEFAULT 3600000,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used" timestamp,
	"usage_count" integer DEFAULT 0,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "api_usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"api_key_id" uuid,
	"endpoint" varchar(255) NOT NULL,
	"method" varchar(10) NOT NULL,
	"status_code" integer NOT NULL,
	"response_time_ms" integer,
	"tokens_used" integer DEFAULT 0,
	"cost_usd" numeric(10, 6) DEFAULT '0',
	"ip_address" varchar(45),
	"user_agent" text,
	"error_message" text,
	"request_metadata" jsonb DEFAULT '{}'::jsonb,
	"response_metadata" jsonb DEFAULT '{}'::jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"organization_id" uuid,
	"event_type" varchar(100) NOT NULL,
	"event_description" text NOT NULL,
	"resource_type" varchar(100),
	"resource_id" varchar(255),
	"ip_address" varchar(45),
	"user_agent" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"severity" varchar(20) DEFAULT 'info',
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"organization_id" uuid,
	"period" varchar(20) NOT NULL,
	"request_count" integer DEFAULT 0,
	"token_count" integer DEFAULT 0,
	"cost_usd" numeric(10, 6) DEFAULT '0',
	"subscription_tier" varchar(50),
	"billing_cycle" varchar(20) DEFAULT 'monthly',
	"invoice_id" varchar(255),
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb,
	"invited_by" uuid,
	"invited_at" timestamp,
	"joined_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"website" varchar(255),
	"logo_url" text,
	"billing_email" varchar(255),
	"subscription_tier" varchar(50) DEFAULT 'free',
	"subscription_status" varchar(50) DEFAULT 'active',
	"subscription_ends_at" timestamp,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stack_auth_session_id" varchar(255),
	"session_token" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"location" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp NOT NULL,
	"last_activity" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stack_auth_id" varchar(255),
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"display_name" varchar(200),
	"profile_image_url" text,
	"company" varchar(255),
	"job_title" varchar(255),
	"phone" varchar(50),
	"timezone" varchar(100) DEFAULT 'UTC',
	"language" varchar(10) DEFAULT 'en',
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"billing_email" varchar(255),
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"signup_source" varchar(100),
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_stack_auth_id_unique" UNIQUE("stack_auth_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"organization_id" uuid,
	"url" text NOT NULL,
	"events" jsonb DEFAULT '[]'::jsonb,
	"secret" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"last_triggered" timestamp,
	"failure_count" integer DEFAULT 0,
	"max_retries" integer DEFAULT 3,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_usage_logs" ADD CONSTRAINT "api_usage_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_usage_logs" ADD CONSTRAINT "api_usage_logs_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_usage" ADD CONSTRAINT "billing_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_usage" ADD CONSTRAINT "billing_usage_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_api_keys_user_id" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_api_keys_hash" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "idx_api_keys_active" ON "api_keys" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_usage_logs_user_timestamp" ON "api_usage_logs" USING btree ("user_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_usage_logs_api_key_timestamp" ON "api_usage_logs" USING btree ("api_key_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_usage_logs_endpoint" ON "api_usage_logs" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "idx_usage_logs_timestamp" ON "api_usage_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_user_timestamp" ON "audit_logs" USING btree ("user_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_event_type" ON "audit_logs" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_timestamp" ON "audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_billing_user_period" ON "billing_usage" USING btree ("user_id","period");--> statement-breakpoint
CREATE INDEX "idx_billing_org_period" ON "billing_usage" USING btree ("organization_id","period");--> statement-breakpoint
CREATE INDEX "idx_org_members_org_user" ON "organization_members" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_org_members_user" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_organizations_slug" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_organizations_active" ON "organizations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_id" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_stack_auth" ON "user_sessions" USING btree ("stack_auth_session_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_active" ON "user_sessions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_sessions_expires" ON "user_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_stack_auth_id" ON "users" USING btree ("stack_auth_id");--> statement-breakpoint
CREATE INDEX "idx_users_active" ON "users" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_webhooks_user_id" ON "webhooks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_webhooks_active" ON "webhooks" USING btree ("is_active");