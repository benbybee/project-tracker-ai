# 🔧 QUICK FIX: Task Deletion Error

## ⚡ TL;DR - Run This Now

**For Production (Vercel):**

```powershell
# 1. Get production database URL from Vercel
vercel env pull .env.production

# 2. Set it temporarily (or copy from .env.production file)
$env:DATABASE_URL="<paste-your-production-database-url-here>"

# 3. Run the fix
node scripts/run-activity-log-fix-migration.mjs

# 4. Done! Tasks can now be deleted.
```

---

## 📋 What Was Fixed

**Problem:** `TRPCClientError: update or delete on table "tasks" violates foreign key constraint`

**Root Cause:** The `activity_log` table had a foreign key constraint that blocked task deletion.

**Solution:** Changed the constraint to `ON DELETE SET NULL` so:

- ✅ Tasks can be deleted
- ✅ Activity history is preserved (with `task_id` set to NULL)
- ✅ No data loss

---

## ✅ Already Completed

- [x] Updated schema definition in `src/server/db/schema/activity.ts`
- [x] Created migration SQL: `0020_fix_activity_log_cascade.sql`
- [x] Created migration runner script
- [x] **Applied to local database** ✅

---

## ⏳ Your Next Step

**Apply to production database** using the commands above.

---

## 🧪 Testing

After running the migration:

1. Go to https://project-tracker-ai.vercel.app
2. Try deleting a task
3. Should work without errors! 🎉

---

See `MIGRATION-ACTIVITY-LOG-FIX.md` for detailed instructions and alternatives.
