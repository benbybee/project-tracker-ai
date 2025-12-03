# 🚀 Vercel Deployment Guide - Project Tracker AI

Complete step-by-step guide to deploy your project to Vercel.

---

## 📋 Pre-Deployment Checklist

- ✅ All code committed and pushed to GitHub
- ✅ Repository: `benbybee/project-tracker-ai`
- ✅ No linting errors
- ✅ All 13 sprints completed (92% of roadmap)
- ✅ Production-ready codebase

---

## 🎯 Quick Deploy (5 Minutes)

### Step 1: Import Project to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Sign in with GitHub
3. Click "Import Project"
4. Find your repository: `benbybee/project-tracker-ai`
5. Click "Import"

### Step 2: Configure Project Settings

**Framework Preset:** Next.js (auto-detected)
**Root Directory:** `.` (root)
**Build Command:** `pnpm build` (auto-configured in vercel.json)
**Install Command:** `pnpm install --frozen-lockfile` (auto-configured)
**Output Directory:** `.next` (auto-detected)

### Step 3: Add Environment Variables

Click "Add Environment Variables" and add the following:

#### Required Variables (Core Features)

```bash
# Database (Required)
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Authentication (Required)
NEXTAUTH_SECRET=[Generate with: openssl rand -base64 32]
NEXTAUTH_URL=https://your-project-name.vercel.app

# AI Features (Required for Analytics)
OPENAI_API_KEY=sk-your-openai-api-key

# File Storage (Required for Attachments)
BLOB_READ_WRITE_TOKEN=vercel_blob_token
```

#### Optional Variables (Enhanced Features)

```bash
# Slack Integration (Sprint 4.3)
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
SLACK_SIGNING_SECRET=your-slack-signing-secret
CRON_SECRET=[Generate with: openssl rand -hex 32]
```

**Select Environments:** Production, Preview, Development (all three)

### Step 4: Deploy!

Click **"Deploy"** and wait 2-3 minutes for the build to complete.

---

## 🗄️ Database Setup Options

Choose one of these database providers:

### Option A: Vercel Postgres (Recommended - Easiest)

1. In your Vercel project dashboard:
   - Go to **Storage** tab
   - Click **"Create Database"**
   - Choose **"Postgres"**
   - Select **"Hobby"** plan (free)
   - Click **"Create"**

2. Vercel automatically adds `DATABASE_URL` to your environment variables

3. After deployment, run migration:

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Link to your project
   vercel link

   # Pull environment variables
   vercel env pull .env.local

   # Run database migration
   pnpm db:push
   ```

### Option B: Supabase (Generous Free Tier)

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for database provisioning (2-3 minutes)
4. Go to **Settings > Database**
5. Copy **Connection String** (URI mode)
6. Add to Vercel as `DATABASE_URL`

**Format:** `postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres`

### Option C: Railway / Neon / Other Postgres

Any PostgreSQL database will work. Just need the connection string.

---

## 💾 Vercel Blob Storage Setup

Required for file attachments (Sprint 4.1).

1. In Vercel project dashboard:
   - Go to **Storage** tab
   - Click **"Create Store"**
   - Choose **"Blob"**
   - Name it: `project-tracker-files`
   - Click **"Create"**

2. Vercel automatically adds `BLOB_READ_WRITE_TOKEN`

**Storage Limits:**

- Hobby plan: 1GB free
- Pro plan: 100GB included

---

## 🤖 OpenAI API Setup

Required for AI features (Sprint 5.2).

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign in / Create account
3. Click **"Create new secret key"**
4. Name it: `Project Tracker AI - Production`
5. Copy the key (starts with `sk-`)
6. Add to Vercel as `OPENAI_API_KEY`

**Cost Estimate:**

- GPT-3.5-turbo: ~$0.002 per 1K tokens
- Average analytics query: ~500 tokens = $0.001
- Expected monthly cost: $5-20 (depending on usage)

**Free Credits:**

- New accounts get $5 free credits
- Valid for 3 months

---

## 💬 Slack Integration Setup (Optional)

Only if you want Slack integration (Sprint 4.3).

### Part 1: Create Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"**
3. Choose **"From scratch"**
4. App Name: `Project Tracker AI`
5. Choose your workspace
6. Click **"Create App"**

### Part 2: Configure OAuth & Permissions

1. In left sidebar, click **"OAuth & Permissions"**
2. Under **"Redirect URLs"**, add:
   ```
   https://your-project-name.vercel.app/api/slack/oauth/callback
   ```
3. Under **"Scopes"**, add these **Bot Token Scopes**:
   - `commands`
   - `chat:write`
   - `channels:read`
   - `reactions:read`
   - `users:read`

### Part 3: Enable Slash Commands

1. In left sidebar, click **"Slash Commands"**
2. Click **"Create New Command"**
3. Configure:
   - Command: `/task`
   - Request URL: `https://your-project-name.vercel.app/api/slack/commands`
   - Short Description: `Manage project tasks`
   - Usage Hint: `create [title] | list | today | help`
4. Click **"Save"**

### Part 4: Enable Event Subscriptions

1. In left sidebar, click **"Event Subscriptions"**
2. Toggle **"Enable Events"** to ON
3. Request URL: `https://your-project-name.vercel.app/api/slack/events`
4. Wait for verification (green checkmark)
5. Under **"Subscribe to bot events"**, add:
   - `reaction_added`
   - `message.channels`
6. Click **"Save Changes"**

### Part 5: Enable Interactive Components

1. In left sidebar, click **"Interactivity & Shortcuts"**
2. Toggle **"Interactivity"** to ON
3. Request URL: `https://your-project-name.vercel.app/api/slack/interactions`
4. Click **"Save Changes"**

### Part 6: Get Credentials

1. In left sidebar, click **"Basic Information"**
2. Under **"App Credentials"**, find:
   - **Client ID** → Copy to `SLACK_CLIENT_ID`
   - **Client Secret** → Copy to `SLACK_CLIENT_SECRET`
   - **Signing Secret** → Copy to `SLACK_SIGNING_SECRET`

### Part 7: Generate CRON Secret

```bash
# In terminal
openssl rand -hex 32

# Copy output to CRON_SECRET in Vercel
```

### Part 8: Add to Vercel Environment Variables

Go to Vercel project > Settings > Environment Variables:

```bash
SLACK_CLIENT_ID=1234567890.1234567890
SLACK_CLIENT_SECRET=abc123def456ghi789jkl012mno345pq
SLACK_SIGNING_SECRET=abc123def456ghi789jkl012mno345pqrs
CRON_SECRET=your-generated-cron-secret
```

Select all environments and click **"Save"**

### Part 9: Redeploy

After adding Slack variables, trigger a new deployment:

- Go to **Deployments** tab
- Click **"..."** on latest deployment
- Click **"Redeploy"**

---

## 🎯 Post-Deployment Steps

### 1. Verify Deployment

Visit your deployed URL: `https://your-project-name.vercel.app`

**Check:**

- ✅ Homepage loads
- ✅ Can sign up / sign in
- ✅ Dashboard displays
- ✅ Can create tasks
- ✅ Can upload files (attachments)
- ✅ Analytics page works
- ✅ AI insights load

### 2. Run Database Migration

```bash
# Pull environment variables locally
vercel env pull .env.local

# Run migration
pnpm db:push

# Verify tables created
pnpm db:studio
```

### 3. Test All Features

#### Core Features

- [ ] User authentication (sign up, login, logout)
- [ ] Create/edit/delete tasks
- [ ] Kanban board drag & drop
- [ ] Project management
- [ ] Mobile responsive design

#### Phase 1 Features

- [ ] Animations (shimmer loaders, button press)
- [ ] Keyboard shortcuts (Ctrl/⌘ + K)
- [ ] Mobile footer navigation
- [ ] Touch-friendly status picker

#### Phase 2 Features

- [ ] Recurring tasks
- [ ] Task templates
- [ ] Calendar view (month/week/day)

#### Phase 3 Features

- [ ] Notification settings
- [ ] Activity feed with undo
- [ ] Task comments
- [ ] Emoji reactions

#### Phase 4 Features

- [ ] File attachments (upload/preview/download)
- [ ] Advanced search with filters
- [ ] Saved views
- [ ] Slack integration (if configured)

#### Phase 5 Features

- [ ] Analytics dashboard
- [ ] AI insights panel
- [ ] Predictive analytics
- [ ] Natural language chat

### 4. Connect Slack (If Configured)

1. Go to `https://your-domain.vercel.app/settings`
2. Scroll to **"Integrations"**
3. Click **"Connect Slack"**
4. Authorize the app
5. Test with `/task help` in Slack

---

## 🔄 CRON Jobs

Your deployment includes 3 automated CRON jobs:

| Job                     | Schedule         | Purpose                              |
| ----------------------- | ---------------- | ------------------------------------ |
| Archive Completed Tasks | Sundays 11:59 PM | Archive old completed tasks          |
| AI Pattern Analysis     | Sundays 12:00 AM | Analyze user patterns weekly         |
| Slack Daily Standup     | Mon-Fri 9:00 AM  | Send daily standup to Slack channels |

**Note:** CRON jobs require Vercel Pro plan. On Hobby plan, they won't run but won't cause errors.

---

## 📊 Monitoring & Analytics

### Vercel Analytics (Built-in)

1. Go to your Vercel project
2. Click **"Analytics"** tab
3. View:
   - Page views
   - Unique visitors
   - Performance metrics
   - Core Web Vitals

### Error Tracking

1. Go to **"Logs"** tab in Vercel
2. Filter by:
   - **Errors** - Runtime errors
   - **Build** - Build-time errors
   - **Functions** - API route logs

### Performance Monitoring

1. Check **"Speed Insights"** tab
2. Monitor:
   - Largest Contentful Paint (LCP)
   - First Input Delay (FID)
   - Cumulative Layout Shift (CLS)

---

## 🔧 Troubleshooting

### Build Fails

**Error:** `Cannot find module`

```bash
# Solution: Clear build cache
vercel --force
```

**Error:** `TypeScript errors`

```bash
# Solution: Run lint locally first
pnpm lint
# Fix all errors before deploying
```

### Runtime Errors

**Error:** `Database connection failed`

1. Check `DATABASE_URL` is set correctly
2. Verify database accepts external connections
3. Check SSL mode: `?sslmode=require`
4. Run `pnpm db:push` to create tables

**Error:** `NextAuth configuration error`

1. Verify `NEXTAUTH_SECRET` is at least 32 characters
2. Check `NEXTAUTH_URL` matches deployment URL
3. Clear browser cookies

**Error:** `OpenAI API error`

1. Verify API key is valid (starts with `sk-`)
2. Check API credits: https://platform.openai.com/usage
3. Ensure billing is set up

**Error:** `Blob storage error`

1. Verify Blob store exists in Vercel
2. Check `BLOB_READ_WRITE_TOKEN` is set
3. Verify store is in same region

### Slack Integration Issues

**Error:** `Slack command not working`

1. Verify Request URL includes `https://`
2. Check URL verification passed (green checkmark)
3. Redeploy after adding Slack env vars

**Error:** `OAuth redirect fails`

1. Verify redirect URL in Slack app matches deployment URL
2. Check `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET` are correct
3. Ensure user has admin permissions in workspace

---

## 🚦 Performance Optimization

### Recommended Vercel Settings

1. **Edge Functions:** Not required (using Node.js runtime)
2. **Regions:** Keep default (`iad1` - Washington DC)
3. **Node Version:** 18.x or higher (set in package.json)
4. **Output:** Static + ISR (incremental static regeneration)

### Caching Strategy

Already configured in `vercel.json`:

- Service Worker: No cache (always fresh)
- Manifest: 1 year cache
- Icons: 1 year cache
- API routes: No cache (dynamic)

### Database Optimization

```sql
-- Create indexes for better performance
-- Run in Vercel Postgres SQL editor or pgAdmin

CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
```

---

## 📈 Scaling Considerations

### Vercel Hobby Plan (Free)

- ✅ Sufficient for: 100-1000 users
- ✅ Bandwidth: 100GB/month
- ✅ Serverless Function Execution: 100GB-hours/month
- ❌ No CRON jobs
- ❌ No team collaboration

### Vercel Pro Plan ($20/month)

- ✅ Unlimited users
- ✅ Bandwidth: 1TB/month
- ✅ CRON jobs enabled
- ✅ Team collaboration
- ✅ Preview deployments: 12 hours retention

### When to Upgrade

- User count > 1000
- Need CRON jobs (automated tasks)
- Team collaboration required
- Need advanced analytics

---

## 🔐 Security Hardening

### Production Checklist

- [ ] All secrets use strong random values (32+ chars)
- [ ] Database uses SSL: `?sslmode=require`
- [ ] `NEXTAUTH_SECRET` rotated every 90 days
- [ ] OpenAI API key restricted to specific IP (if possible)
- [ ] Vercel Blob storage set to private
- [ ] CORS configured correctly in API routes
- [ ] Rate limiting enabled (already configured)
- [ ] SQL injection prevention (using Drizzle ORM)
- [ ] XSS protection (React auto-escapes)

### Recommended: Enable Vercel Security Headers

Add to `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        }
      ]
    }
  ];
}
```

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [Vercel Blob Docs](https://vercel.com/docs/storage/vercel-blob)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Slack API Documentation](https://api.slack.com/start)

---

## 🆘 Support

If you encounter issues:

1. **Check Logs:** Vercel Dashboard > Logs tab
2. **Search Docs:** Vercel documentation is comprehensive
3. **GitHub Issues:** Check repository for known issues
4. **Vercel Support:** Pro plan includes email support

---

## ✅ Deployment Complete!

Once deployed, your app will be available at:

- **Production:** `https://your-project-name.vercel.app`
- **Custom Domain:** Configure in Vercel Settings > Domains

**Next Steps:**

1. ✅ Add custom domain (optional)
2. ✅ Invite team members
3. ✅ Set up monitoring alerts
4. ✅ Configure backup strategy
5. ✅ Plan marketing/launch

---

**Congratulations! 🎉**

You've deployed a production-ready project management system with:

- ✅ 13 sprints completed
- ✅ 5 phases of features
- ✅ AI-powered analytics
- ✅ Slack integration
- ✅ Mobile-optimized
- ✅ Enterprise-ready

**Total Development Time:** Same day completion! ⚡

---

**Last Updated:** October 30, 2025
**Author:** Project Tracker AI Team
**Version:** 1.0.0
