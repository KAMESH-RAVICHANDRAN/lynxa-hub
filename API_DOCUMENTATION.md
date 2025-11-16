# Lynxa Hub API Documentation

A comprehensive authentication and API management platform with advanced analytics, billing, and admin capabilities.

## 🚀 Quick Start

### Database Setup

1. **Configure Environment Variables**
   ```bash
   # Copy .env.example to .env and configure your database credentials
   cp .env.example .env
   ```

2. **Initialize Database**
   ```bash
   npm run db:init
   ```

3. **Check Database Health**
   ```bash
   npm run db:health
   ```

### Default Admin Credentials

After database initialization:
- **Email**: `admin@lynxa.pro` (or your ADMIN_EMAIL)
- **Password**: `LynxaAdmin2024!` (or your ADMIN_PASSWORD)

⚠️ **Important**: Change these credentials after first login!

---

## 📚 API Endpoints

### Authentication APIs (`/api/auth/[action]`)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "company": "Acme Corp"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "user_id": "uuid-here",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe"
    },
    "tokens": {
      "access_token": "jwt-token-here",
      "refresh_token": "refresh-token-here"
    }
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "your-refresh-token"
}
```

#### Verify Token
```http
GET /api/auth/verify
Authorization: Bearer your-jwt-token
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer your-jwt-token
Content-Type: application/json

{
  "refresh_token": "your-refresh-token"
}
```

---

### API Key Management (`/api/keys`)

#### List API Keys
```http
GET /api/keys
Authorization: Bearer your-jwt-token
```

#### Create API Key
```http
POST /api/keys
Authorization: Bearer your-jwt-token
Content-Type: application/json

{
  "key_name": "My Production Key",
  "description": "Key for production environment",
  "permissions": ["read", "write"],
  "rate_limit": 1000,
  "expires_at": "2024-12-31T23:59:59.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "API key created successfully",
  "data": {
    "api_key": "lynxa_abc123def456...",
    "key_info": {
      "api_key_id": "uuid-here",
      "key_name": "My Production Key",
      "key_prefix": "lynxa_abc123",
      "permissions": ["read", "write"],
      "rate_limit": 1000,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### Update API Key
```http
PUT /api/keys
Authorization: Bearer your-jwt-token
Content-Type: application/json

{
  "api_key_id": "uuid-here",
  "key_name": "Updated Key Name",
  "description": "Updated description",
  "permissions": ["read"],
  "rate_limit": 500,
  "is_active": false
}
```

#### Delete API Key
```http
DELETE /api/keys
Authorization: Bearer your-jwt-token
Content-Type: application/json

{
  "api_key_id": "uuid-here"
}
```

---

### AI API Endpoint (`/api/lynxa`)

#### Generate AI Response
```http
POST /api/lynxa
Authorization: Bearer your-api-key
Content-Type: application/json

{
  "prompt": "Explain quantum computing in simple terms",
  "model": "gpt-4",
  "max_tokens": 500,
  "temperature": 0.7,
  "stream": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Quantum computing is a revolutionary technology...",
    "model": "gpt-4",
    "tokens_used": 245,
    "cost_usd": 0.0049,
    "processing_time_ms": 1250,
    "request_id": "req_abc123"
  }
}
```

#### Streaming Response
```http
POST /api/lynxa
Authorization: Bearer your-api-key
Content-Type: application/json

{
  "prompt": "Write a story about AI",
  "stream": true
}
```

---

### User Profile Management (`/api/users/profile`)

#### Get Profile
```http
GET /api/users/profile
Authorization: Bearer your-jwt-token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "user_id": "uuid-here",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "company": "Acme Corp",
      "role": "user",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "statistics": {
      "api_keys": {
        "total_api_keys": "3",
        "active_api_keys": "2"
      },
      "usage": {
        "total_requests": "1500",
        "requests_last_30_days": "450",
        "avg_response_time": "1250.5"
      }
    }
  }
}
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer your-jwt-token
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Smith",
  "company": "New Corp",
  "phone": "+1-555-0123",
  "timezone": "America/New_York",
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}
```

#### Delete Account
```http
DELETE /api/users/profile
Authorization: Bearer your-jwt-token
Content-Type: application/json

{
  "confirmation": "DELETE_MY_ACCOUNT"
}
```

---

### Analytics (`/api/analytics/usage`)

#### Get Usage Analytics
```http
GET /api/analytics/usage?timeframe=30d&api_key_id=optional-uuid
Authorization: Bearer your-jwt-token
```

**Query Parameters:**
- `timeframe`: `1d`, `7d`, `30d`, `90d`, `1y`
- `api_key_id`: Filter by specific API key (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "timeframe": "30d",
    "overall_stats": {
      "total_requests": "1500",
      "successful_requests": "1485",
      "error_requests": "15",
      "avg_response_time": "1250.5",
      "total_tokens": "125000",
      "total_cost": "25.50"
    },
    "time_series": [
      {
        "period": "2024-01-01T00:00:00.000Z",
        "requests": "50",
        "avg_response_time": "1200",
        "successful_requests": "49",
        "error_requests": "1"
      }
    ],
    "endpoint_stats": [
      {
        "endpoint": "/api/lynxa",
        "requests": "1400",
        "avg_response_time": "1250",
        "successful_requests": "1390",
        "error_requests": "10"
      }
    ],
    "summary": {
      "success_rate": 99.0,
      "error_rate": 1.0,
      "avg_daily_requests": 48.39
    }
  }
}
```

---

### Billing (`/api/billing`)

#### Get Billing Information
```http
GET /api/billing
Authorization: Bearer your-jwt-token
```

#### Create Subscription
```http
POST /api/billing
Authorization: Bearer your-jwt-token
Content-Type: application/json

{
  "tier": "professional",
  "payment_method": {
    "type": "card"
  },
  "billing_address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "US"
  }
}
```

#### Update Billing Info
```http
PUT /api/billing
Authorization: Bearer your-jwt-token
Content-Type: application/json

{
  "billing_email": "billing@company.com",
  "preferences": {
    "currency": "USD",
    "invoice_frequency": "monthly"
  }
}
```

---

### Admin APIs (`/api/admin/[action]`)

*Requires admin role*

#### Admin Dashboard
```http
GET /api/admin/dashboard
Authorization: Bearer your-admin-jwt-token
```

#### User Management
```http
GET /api/admin/users?page=1&limit=50&search=john&role=user&status=active
Authorization: Bearer your-admin-jwt-token
```

#### Update User
```http
PUT /api/admin/users
Authorization: Bearer your-admin-jwt-token
Content-Type: application/json

{
  "user_id": "uuid-here",
  "updates": {
    "is_active": false,
    "role": "admin"
  }
}
```

#### System Statistics
```http
GET /api/admin/system
Authorization: Bearer your-admin-jwt-token
```

#### Audit Logs
```http
GET /api/admin/audit?page=1&limit=100&event_type=user.login&user_id=uuid
Authorization: Bearer your-admin-jwt-token
```

#### Health Check
```http
GET /api/admin/health
Authorization: Bearer your-admin-jwt-token
```

---

## 🔐 Authentication

### JWT Tokens
- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), used to obtain new access tokens

### API Key Authentication
- API keys are used for the AI endpoint (`/api/lynxa`)
- Format: `lynxa_[64-character-hex-string]`
- Include in `Authorization: Bearer` header

---

## 📊 Rate Limiting

Default rate limits per endpoint:

| Endpoint | Requests per Window | Window Size |
|----------|-------------------|-------------|
| Authentication | 10 | 15 minutes |
| API Keys | 50 | 15 minutes |
| User Profile | 50 | 15 minutes |
| Analytics | 100 | 15 minutes |
| AI API | Based on subscription tier | Per minute |
| Admin | 200 | 15 minutes |

---

## 💰 Subscription Tiers

### Free Tier
- 1,000 requests/month
- 50,000 tokens/month
- 2 API keys
- 10 requests/minute rate limit

### Starter ($29/month)
- 10,000 requests/month
- 500,000 tokens/month
- 5 API keys
- 50 requests/minute rate limit

### Professional ($99/month)
- 100,000 requests/month
- 5,000,000 tokens/month
- 20 API keys
- 200 requests/minute rate limit

### Enterprise ($499/month)
- 1,000,000 requests/month
- 50,000,000 tokens/month
- 100 API keys
- 1,000 requests/minute rate limit

---

## 🚨 Error Handling

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message",
  "code": "ERROR_CODE"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

---

## 🔧 Environment Variables

Required environment variables:

```bash
# Database Configuration (NileDB)
NILEDB_HOST=eu-central-1.api.thenile.dev
NILEDB_DATABASE=your-database-name
NILEDB_USER=your-username
NILEDB_PASSWORD=your-password
NILEDB_PORT=5432

# Alternative: PostgreSQL Connection String
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Configuration
JWT_SECRET=your-256-bit-secret
JWT_REFRESH_SECRET=your-256-bit-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# API Configuration
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:5173

# Admin Configuration
ADMIN_EMAIL=admin@lynxa.pro
ADMIN_PASSWORD=LynxaAdmin2024!

# External APIs (Optional)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

---

## 📋 Database Schema

Key tables:

- **users** - User accounts and profiles
- **api_keys** - API key management
- **user_sessions** - Active user sessions
- **api_usage_logs** - Detailed API usage tracking
- **audit_logs** - System audit trail
- **organizations** - Multi-tenant support
- **organization_members** - Team management

---

## 🔍 Monitoring & Analytics

The platform provides comprehensive monitoring:

### Usage Tracking
- Request count and timing
- Token usage and costs
- Error rates and types
- Geographic distribution

### Performance Metrics
- Response times (avg, p95, p99)
- Success/error rates
- Rate limit violations
- System health status

### Audit Trail
- User authentication events
- API key operations
- Administrative actions
- Security incidents

---

## 🛠️ Development

### Running Locally
```bash
# Install dependencies
npm install

# Initialize database
npm run db:setup

# Start development server
npm run dev
```

### API Testing
Use tools like Postman, cURL, or HTTPie:

```bash
# Register a new user
curl -X POST http://localhost:5173/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","first_name":"Test","last_name":"User"}'

# Create API key
curl -X POST http://localhost:5173/api/keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key_name":"Test Key","description":"For testing"}'

# Use AI API
curl -X POST http://localhost:5173/api/lynxa \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello, AI!","max_tokens":100}'
```

---

## 🚀 Deployment

### Production Checklist
- [ ] Configure production database credentials
- [ ] Set strong JWT secrets
- [ ] Enable SSL/TLS
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Set up backup procedures
- [ ] Review security settings

### Recommended Infrastructure
- **Database**: PostgreSQL 13+ or NileDB
- **Runtime**: Node.js 18+
- **Reverse Proxy**: Nginx or Cloudflare
- **Monitoring**: DataDog, New Relic, or similar
- **Logging**: Winston, Pino, or cloud logging

---

## 📞 Support

For technical support or questions:

1. Check the API documentation
2. Review error messages and logs
3. Consult the troubleshooting guide
4. Contact support with detailed error information

---

**Last Updated**: January 2024  
**API Version**: 1.0.0  
**Documentation Version**: 1.0.0