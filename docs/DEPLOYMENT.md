# 🚀 Cineverse Deployment Guide

## Vercel + Supabase Production Deployment

මෙම guide එක Cineverse එක production-ready deployment එකක් සඳහා අවශ්‍ය සියලුම පියවර ආවරණය කරයි.

---

## 📋 Pre-Deployment Checklist

```bash
# Run pre-deployment validation
npm run pre-deploy

# Run health check
npm run health

# Or run both
npm run deploy:check
```

---

## 🗄️ Step 1: Supabase Setup

### 1.1 Create Supabase Project
1. [Supabase](https://supabase.com/) වෙත ගොස් account එකක් create කරන්න
2. "New Project" click කරන්න
3. Project name, database password එක enter කරන්න
4. Region select කරන්න (Singapore - `sin1` recommend කරනවා)

### 1.2 Get Database Connection Strings
Supabase Dashboard → Settings → Database:

```env
# pooler connection (use for main DATABASE_URL)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# direct connection (use for migrations)
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

### 1.3 Get API Keys
Supabase Dashboard → Settings → API:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1.4 Create Storage Bucket
1. Supabase Dashboard → Storage → Create Bucket
2. Name: `uploads`
3. Public bucket: ✅ Yes
4. Allowed MIME types: `image/*`

---

## 🔐 Step 2: Generate Auth Secret

```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ⚡ Step 3: Vercel Deployment

### 3.1 Connect Repository
1. [Vercel](https://vercel.com) වෙත login වන්න
2. "New Project" → GitHub repository select කරන්න
3. Framework: `Next.js` (auto-detected)

### 3.2 Environment Variables
Vercel Dashboard → Settings → Environment Variables:

#### Required Variables:
```env
DATABASE_URL=postgresql://...?pgbouncer=true
DIRECT_URL=postgresql://...
AUTH_SECRET=<your-generated-secret>
AUTH_URL=https://your-app.vercel.app
AUTH_TRUST_HOST=true

SUPERUSER_EMAIL=youremail@domain.com
SUPERUSER_PASSWORD=secure-password-here

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

STORAGE_PROVIDER=supabase
NEXT_PUBLIC_STORAGE_URL_PREFIX=https://xxx.supabase.com/storage/v1/object/public/uploads
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=uploads
```

#### Optional but Recommended:
```env
# Redis caching (Upstash)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...

# Error monitoring (Sentry)
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Google OAuth
AUTH_GOOGLE_ID=xxx.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-xxx
```

### 3.3 Build Settings
```
Build Command: npm run vercel-build
Output Directory: .next
Install Command: npm install
```

---

## 🗃️ Step 4: Database Migration

### Switch to PostgreSQL Schema
```bash
# Windows
npm run db:postgres

# Linux/Mac
cp prisma/schema.postgres.prisma prisma/schema.prisma && npx prisma generate
```

### Run Migrations
```bash
# Generate migration files
npx prisma migrate dev --name init

# Deploy to production (runs in vercel-build)
npx prisma migrate deploy
```

---

## ✅ Step 5: Post-Deployment Verification

### Health Check Endpoint
```bash
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-05T12:00:00.000Z",
  "services": {
    "database": { "status": "up", "latency": 50 },
    "cache": { "status": "up", "latency": 10 }
  }
}
```

### Test Login
1. Go to `https://your-app.vercel.app/login`
2. Login with superuser credentials
3. Verify admin panel access

---

## 📊 Monitoring Setup

### Uptime Monitoring
Configure uptime check for: `https://your-app.vercel.app/api/health`

### Error Tracking (Sentry)
Add to environment:
```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### Performance Monitoring
- Vercel Analytics: Auto-enabled
- Core Web Vitals: Monitored in Vercel dashboard

---

## 🔧 Common Issues & Solutions

### Issue: Database Connection Timeout
**Solution:** Use pooler connection with `?pgbouncer=true`

### Issue: Prisma Client Not Found
**Solution:** Ensure `postinstall` script has `prisma generate`

### Issue: Image Upload Fails
**Solution:** Check Supabase bucket is public and CORS is configured

### Issue: Authentication Fails
**Solution:** Verify `AUTH_URL` matches your deployment URL exactly

---

## 📁 Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection (pooler) |
| `DIRECT_URL` | ✅ | Direct PostgreSQL connection |
| `AUTH_SECRET` | ✅ | NextAuth secret (32+ chars) |
| `AUTH_URL` | ✅ | Full deployment URL |
| `AUTH_TRUST_HOST` | ✅ | Set to `true` for Vercel |
| `SUPERUSER_EMAIL` | ✅ | Admin email |
| `SUPERUSER_PASSWORD` | ✅ | Admin password |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase public key |
| `STORAGE_PROVIDER` | ✅ | Set to `supabase` |
| `UPSTASH_REDIS_REST_URL` | ⭐ | Redis for caching |
| `UPSTASH_REDIS_REST_TOKEN` | ⭐ | Redis auth token |
| `SENTRY_DSN` | 💡 | Error monitoring |
| `AUTH_GOOGLE_ID` | 💡 | Google OAuth |
| `AUTH_GOOGLE_SECRET` | 💡 | Google OAuth secret |

Legend: ✅ Required | ⭐ Recommended | 💡 Optional

---

## 🎉 Deployment Complete!

ඔබේ Cineverse app එක දැන් production-ready!

**Support:**
- GitHub Issues: Report bugs
- Documentation: `/docs` folder
- Health Status: `/api/health`
