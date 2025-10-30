# Environment Variables Setup Guide

## 📋 Complete Environment Variables Reference

Copy these environment variables to your Vercel project settings.

---

## 🔴 REQUIRED VARIABLES (Core Functionality)

### Database
```bash
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```
- **Required:** Yes
- **Where to get:** Your PostgreSQL provider (Vercel Postgres, Supabase, Railway, etc.)
- **Example:** `postgresql://postgres:pass@db.example.com:5432/mydb?sslmode=require`

### Authentication
```bash
NEXTAUTH_SECRET=your-super-secret-key-minimum-32-characters-long
NEXTAUTH_URL=https://your-domain.vercel.app
```
- **NEXTAUTH_SECRET Required:** Yes
- **Generate:** Run `openssl rand -base64 32` in terminal
- **NEXTAUTH_URL:** Auto-detected in Vercel, but recommended to set explicitly

### AI Features (Phase 5 - Analytics & Insights)
```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```
- **Required:** Yes (for AI analytics, predictions, chat interface)
- **Where to get:** https://platform.openai.com/api-keys
- **Cost:** Uses GPT-3.5-turbo (very low cost, ~$0.002 per 1K tokens)

### File Storage (Sprint 4.1 - Attachments)
```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_token_here
```
- **Required:** Yes (for file attachments feature)
- **Where to get:** Vercel Dashboard > Storage > Blob
- **Setup:** Create a Blob store in your Vercel project

---

## 🟡 OPTIONAL VARIABLES (Enhanced Features)

### Slack Integration (Sprint 4.3)
```bash
SLACK_CLIENT_ID=1234567890.1234567890
SLACK_CLIENT_SECRET=abc123def456ghi789jkl012mno345pq
SLACK_SIGNING_SECRET=abc123def456ghi789jkl012mno345pqrs
CRON_SECRET=your-random-cron-secret-for-authentication
```
- **Required:** Only if using Slack integration
- **Where to get:** https://api.slack.com/apps (create new app)
- **CRON_SECRET Generate:** Run `openssl rand -hex 32`

### Supabase (Alternative to standard Postgres)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
- **Required:** Only if using Supabase for database
- **Where to get:** Supabase Dashboard > Settings > API

---

## 🚀 Quick Setup Steps

### 1. Create Vercel Postgres Database (Recommended)
```bash
# In your Vercel project dashboard:
1. Go to Storage tab
2. Click "Create Database"
3. Choose "Postgres"
4. Copy the DATABASE_URL connection string
```

### 2. Generate Authentication Secret
```bash
# Run in terminal:
openssl rand -base64 32

# Copy output to NEXTAUTH_SECRET
```

### 3. Set Up OpenAI API Key
```bash
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy to OPENAI_API_KEY
```

### 4. Enable Blob Storage
```bash
# In your Vercel project dashboard:
1. Go to Storage tab
2. Click "Create Store"
3. Choose "Blob"
4. Copy BLOB_READ_WRITE_TOKEN
```

### 5. (Optional) Configure Slack
```bash
1. Go to https://api.slack.com/apps
2. Click "Create New App" > "From scratch"
3. Set app name: "Project Tracker AI"
4. Choose your workspace
5. Copy Client ID, Client Secret, Signing Secret
6. Generate CRON_SECRET: openssl rand -hex 32
```

---

## 📝 Environment Variables in Vercel

### Adding via Dashboard:
1. Go to your Vercel project
2. Settings > Environment Variables
3. Add each variable:
   - **Key:** Variable name (e.g., `DATABASE_URL`)
   - **Value:** Your actual value
   - **Environments:** Select Production, Preview, Development

### Adding via CLI:
```bash
# Install Vercel CLI
npm i -g vercel

# Add environment variable
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add OPENAI_API_KEY production
# ... continue for all variables
```

---

## 🔒 Security Best Practices

### ✅ DO:
- Use strong, random secrets (minimum 32 characters)
- Enable SSL for database connections (`?sslmode=require`)
- Rotate secrets periodically (every 90 days)
- Use Vercel's encrypted environment variables
- Keep service role keys server-side only

### ❌ DON'T:
- Commit `.env.local` to git (already in .gitignore)
- Share secrets via Slack/email
- Use weak or predictable secrets
- Expose API keys in client-side code
- Use production keys in development

---

## 🧪 Testing Your Setup

After deploying, verify each feature:

### Database Connection
```bash
# Should see tasks, projects, users tables
Visit: https://your-domain.vercel.app/dashboard
```

### Authentication
```bash
# Should be able to sign up/login
Visit: https://your-domain.vercel.app/auth/signin
```

### File Uploads (Blob Storage)
```bash
# Create task > Add attachment
Visit: https://your-domain.vercel.app/board
```

### AI Features
```bash
# View analytics and AI insights
Visit: https://your-domain.vercel.app/analytics
```

### Slack Integration (if configured)
```bash
# Connect Slack workspace
Visit: https://your-domain.vercel.app/settings
```

---

## 🆘 Troubleshooting

### "Database connection failed"
- Verify `DATABASE_URL` is correct
- Check SSL mode is enabled: `?sslmode=require`
- Ensure database accepts connections from Vercel IPs
- Run `pnpm db:push` after first deployment

### "NextAuth configuration error"
- Verify `NEXTAUTH_SECRET` is at least 32 characters
- Check `NEXTAUTH_URL` matches your deployment URL
- Clear browser cookies and try again

### "OpenAI API error"
- Verify API key starts with `sk-`
- Check you have API credits: https://platform.openai.com/usage
- Ensure API key has proper permissions

### "Blob storage error"
- Verify `BLOB_READ_WRITE_TOKEN` is set
- Check Blob store exists in Vercel dashboard
- Ensure store is in same region as deployment

---

## 📚 Additional Resources

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [NextAuth.js Documentation](https://next-auth.js.org/configuration/options)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Slack API Documentation](https://api.slack.com/start)

---

**Last Updated:** October 30, 2025
**Project:** Project Tracker AI
**Version:** 1.0.0

