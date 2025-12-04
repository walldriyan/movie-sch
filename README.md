# CineVerse - Movie & Subtitle Platform

A production-ready Next.js 15 application for movies, subtitles, and community features.

## 🎬 Features

- **Movie Database** - Add, manage, and browse movies and TV series
- **Subtitle Management** - Upload and download subtitles
- **User Authentication** - Email/password and Google OAuth
- **Groups & Communities** - Create and join movie groups
- **Exams & Quizzes** - Lock content behind quizzes
- **Admin Dashboard** - Manage users, posts, and settings
- **Rate Limiting** - Protection against abuse
- **Caching** - Redis-based caching for performance

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: SQLite (local) / PostgreSQL with Supabase (production)
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5
- **Caching**: Upstash Redis
- **Styling**: Tailwind CSS
- **State Management**: React Context + Server Actions
- **Deployment**: Vercel

---

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm or yarn

### Local Development

```bash
# Clone the repository
git clone <repository-url>
cd movie-sch

# Install dependencies
npm install

# Set up local database
npm run db:local

# Create .env.local file (see docs/ENVIRONMENT_SETUP.md)

# Start development server
npm run dev
```

Visit http://localhost:9002

---

## 🔧 Environment Setup

See [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md) for detailed environment configuration.

### Quick Start (Local Development)

Create `.env.local`:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secret-key-min-32-chars"
AUTH_URL="http://localhost:9002"
SUPER_ADMIN_EMAIL="admin@example.com"
```

---

## 🚀 Deployment

### Vercel + Supabase

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Copy the database connection strings

2. **Deploy to Vercel**
   - Connect your GitHub repository
   - Set environment variables (see docs/ENVIRONMENT_SETUP.md)
   - Deploy!

3. **Environment Variables for Vercel**
   ```env
   DATABASE_URL="postgresql://..."
   DIRECT_URL="postgresql://..."
   AUTH_SECRET="your-production-secret"
   AUTH_URL="https://your-domain.vercel.app"
   AUTH_GOOGLE_ID="your-google-client-id"
   AUTH_GOOGLE_SECRET="your-google-secret"
   UPSTASH_REDIS_REST_URL="https://..."
   UPSTASH_REDIS_REST_TOKEN="your-token"
   ```

---

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma          # Production schema (PostgreSQL)
│   └── schema.sqlite.prisma   # Development schema (SQLite)
├── src/
│   ├── app/                   # Next.js App Router pages
│   ├── auth.ts                # NextAuth configuration
│   ├── components/            # React components
│   ├── lib/
│   │   ├── actions/           # Server Actions
│   │   ├── prisma.ts          # Prisma client
│   │   ├── redis.ts           # Redis client
│   │   └── errors.ts          # Error handling
│   └── middleware.ts          # Rate limiting & auth
├── docs/                      # Documentation
├── scripts/                   # Utility scripts
└── vercel.json                # Vercel configuration
```

---

## 🔒 Security Features

- ✅ Rate limiting with Upstash Redis
- ✅ CSRF protection
- ✅ Security headers (HSTS, X-Frame-Options, etc.)
- ✅ Input validation with Zod
- ✅ SQL injection protection via Prisma
- ✅ XSS protection with DOMPurify

---

## 🛠️ Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
npm run db:local     # Set up local SQLite database
npm run db:prod      # Run production migrations
npm run health-check # Check system health
npm run analyze      # Analyze bundle size
```

---

## 📝 Notes

⚠️ **Important Rules:**
- Do not modify Prisma schema without permission
- Do not change UI/CSS/layout styles without permission
- Add new features to existing UI components
- Always get permission before editing Prisma schema

---

## 📄 License

MIT