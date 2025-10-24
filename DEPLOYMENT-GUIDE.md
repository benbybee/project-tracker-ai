# 🚀 Vercel Deployment Guide - Sprint 2.6.1

## ✅ Pre-Deployment Checklist

- [x] Database migrations generated (`0001_overconfident_joystick.sql`)
- [x] Build tested locally (✅ successful)
- [x] Seed script created (`scripts/seed-user.mjs`)
- [x] All new features implemented and tested

## 1️⃣ Environment Variables Setup

### Required Environment Variables

Set these in **Vercel Dashboard → Project → Settings → Environment Variables**:

```bash
# Database (Required)
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require

# NextAuth (Required)
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=openssl rand -base64 32

# Realtime / Presence (Required for collaboration features)
REALTIME_URL=wss://your-realtime-endpoint
REALTIME_API_KEY=YOUR_KEY
WS_HEARTBEAT_INTERVAL=15000
PRESENCE_TTL=30000

# OpenAI (Optional - only if AI features enabled)
OPENAI_API_KEY=sk-...
```

### Generate NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

### Environment Setup Notes
- Add to **Production** environment
- Add to **Preview** environment (if using preview deployments)
- Ensure `DATABASE_URL` points to your production PostgreSQL database

## 2️⃣ Database Migration

### Apply Migrations to Production Database

```bash
# Generate migrations (already done)
npx drizzle-kit generate:pg

# Apply to production database
npx drizzle-kit push

# Verify migration status
npx drizzle-kit status
```

### New Tables Created
- `notifications` - User notifications system
- `activity_log` - Activity tracking
- `threads` - Chat threads
- `messages` - Chat messages
- `message_reactions` - Message reactions
- `thread_participants` - Thread participation

### Seed Initial Data (Optional)
```bash
# Create test user and default roles
node scripts/seed-user.mjs
```

## 3️⃣ Vercel Deployment

### Clean Deployment (Recommended)
```bash
# Force fresh build cache
VERCEL_FORCE_NO_BUILD_CACHE=1 vercel --prod
```

### Or via Vercel Dashboard
1. Go to **Deployments** tab
2. Click **Redeploy**
3. **Uncheck** "Use existing Build Cache"
4. Click **Redeploy**

## 4️⃣ Post-Deploy Smoke Test

### Core Functionality Tests (2-3 minutes)

1. **Task Management**
   - [ ] Create task → modal closes → task appears (no refresh)
   - [ ] Edit task from Kanban and Daily → saves instantly
   - [ ] Drag task across Kanban columns → persists on reload

2. **Project Management**
   - [ ] Pin/unpin projects → order updates
   - [ ] Role filter on Kanban updates list
   - [ ] Create new project → appears in dashboard

3. **Daily Planner**
   - [ ] Visit `/daily` → "Generate Plan" shows suggestions
   - [ ] Accept plan → tasks appear in daily view

4. **Completed Tasks**
   - [ ] Visit `/completed` → renders (even if empty)

5. **API Endpoints**
   - [ ] Test cron endpoint: `curl -sS https://<your-domain>/api/maintenance/archive-completed`
   - [ ] Should return 200 OK

### Advanced Features (if enabled)
- [ ] Real-time collaboration (presence indicators)
- [ ] Chat functionality
- [ ] Notifications system
- [ ] AI features (daily planning, summaries)

## 5️⃣ Rollback Safety

### Create Git Tag
```bash
git tag -a v2.6.1 -m "Sprint 2.6.1 — UX & Workflow Enhancements"
git push --tags
```

### Vercel Rollback
1. Go to **Deployments** tab
2. Find previous successful deployment
3. Click **Promote to Production**
4. Keep previous deployment alias handy for instant rollback

## 6️⃣ Monitoring & Health Checks

### Key Endpoints to Monitor
- `/api/trpc/health` - tRPC health check
- `/api/maintenance/archive-completed` - Cron job endpoint
- `/api/realtime/connect` - WebSocket connection

### Database Health
```sql
-- Check new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notifications', 'activity_log', 'threads', 'messages');
```

## 7️⃣ Sprint 2.6.1 Features Deployed

### ✅ UI/UX Enhancements
- Website project board with variant support
- Enhanced Kanban drag-and-drop with optimistic updates
- Improved task creation/editing modals
- Task card UI enhancements with status indicators
- Project auto-preselect functionality
- Full-width projects page
- Simplified top bar redesign

### ✅ Workflow Improvements
- Enhanced daily planner with AI integration
- Kanban role filtering
- Weekly auto-clear completed tasks with cron jobs
- Project pinning functionality
- Daily summary page with AI integration

### ✅ New Features
- Google Drive integration scaffold
- Plaud AI ingestion page
- Real-time collaboration system
- Chat functionality
- Notifications system
- Activity tracking

## 🚨 Troubleshooting

### Common Issues
1. **Build Failures**: Check TypeScript errors, missing dependencies
2. **Database Connection**: Verify `DATABASE_URL` format and credentials
3. **Environment Variables**: Ensure all required vars are set in Vercel
4. **Migration Issues**: Check database permissions and connection

### Support
- Check Vercel function logs for runtime errors
- Monitor database connection pool
- Verify all environment variables are properly set

---

## 🎯 Success Criteria

Deployment is successful when:
- [ ] All smoke tests pass
- [ ] No console errors in browser
- [ ] Database migrations applied successfully
- [ ] All new features accessible and functional
- [ ] Performance metrics within acceptable range

**Ready for production! 🚀**
