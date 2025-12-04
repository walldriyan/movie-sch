# 🔧 Environment Configuration Guide

## Local Development Setup

Create a `.env.local` file in the root directory:

```env
# ===========================================
# DATABASE CONFIGURATION
# ===========================================
# Local development uses SQLite
DATABASE_URL="file:./dev.db"

# ===========================================
# AUTHENTICATION
# ===========================================
AUTH_SECRET="your-super-secret-key-min-32-chars-here-generate-with-openssl"
AUTH_URL="http://localhost:9002"

# Super Admin Setup (first user with this email becomes super admin)
SUPER_ADMIN_EMAIL="admin@example.com"

# ===========================================
# REDIS (Upstash) - Rate Limiting & Caching
# ===========================================
# Get these from https://upstash.com/
UPSTASH_REDIS_REST_URL="https://your-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# ===========================================
# GOOGLE OAUTH (Optional - for Gmail login)
# ===========================================
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
```

---

## Production Setup (Vercel + Supabase)

### 1. Supabase Database Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings > Database**
3. Copy the connection strings

### 2. Vercel Environment Variables

Add these in your Vercel dashboard under **Settings > Environment Variables**:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Authentication
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="https://your-domain.vercel.app"

# Google OAuth
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="https://your-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# Feature Flags
ENABLE_RATE_LIMITING="true"
ENABLE_CACHING="true"
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:9002/api/auth/callback/google` (development)
   - `https://your-domain.vercel.app/api/auth/callback/google` (production)

---

## Generate AUTH_SECRET

```bash
openssl rand -base64 32
```

---

## Quick Reference

| Environment | Database | Redis | Rate Limiting |
|-------------|----------|-------|---------------|
| Development | SQLite   | Upstash | Disabled |
| Production  | Supabase PostgreSQL | Upstash | Enabled |
