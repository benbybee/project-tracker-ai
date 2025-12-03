# Migration: Fix Task Deletion - Activity Log Foreign Key Constraint

## Problem

Tasks cannot be deleted due to a foreign key constraint violation:

```
update or delete on table "tasks" violates foreign key constraint "activity_log_task_id_tasks_id_fk" on table "activity_log"
```

## Solution

Changed the foreign key constraint from `ON DELETE NO ACTION` to `ON DELETE SET NULL`, allowing tasks to be deleted while preserving activity history.

---

## ✅ Local Database (COMPLETED)

The migration has already been applied to your local database successfully.

---

## 🚀 Production Database (ACTION REQUIRED)

### Option 1: Run Migration Script (Recommended)

1. **Get your production DATABASE_URL from Vercel:**

   ```bash
   vercel env pull .env.production
   ```

2. **Run the migration against production:**

   ```bash
   # Temporarily set the production DATABASE_URL
   $env:DATABASE_URL="<your-production-database-url>"

   # Run the migration
   node scripts/run-activity-log-fix-migration.mjs
   ```

3. **Verify the fix:**
   - Try deleting a task in your production app
   - Should work without errors now

---

### Option 2: Direct SQL Execution

If you have direct access to your PostgreSQL database (via pgAdmin, psql, or Vercel's database dashboard):

1. **Connect to your production database**

2. **Execute this SQL:**

   ```sql
   -- Drop the existing constraint
   ALTER TABLE activity_log
   DROP CONSTRAINT IF EXISTS activity_log_task_id_tasks_id_fk;

   -- Add the constraint back with ON DELETE SET NULL
   ALTER TABLE activity_log
   ADD CONSTRAINT activity_log_task_id_tasks_id_fk
   FOREIGN KEY (task_id)
   REFERENCES tasks(id)
   ON DELETE SET NULL;
   ```

3. **Verify:**

   ```sql
   -- Check the constraint
   SELECT
     conname AS constraint_name,
     confdeltype AS delete_action
   FROM pg_constraint
   WHERE conname = 'activity_log_task_id_tasks_id_fk';

   -- 'a' = NO ACTION, 's' = SET NULL (we want 's')
   ```

---

### Option 3: Using Vercel Postgres (if using Vercel Postgres)

1. **Go to your Vercel dashboard**
2. **Navigate to your project → Storage → Your Database**
3. **Click on "Query" or "SQL Editor"**
4. **Paste and execute the SQL from Option 2**

---

## What This Migration Does

- **Before:** Deleting a task was blocked if it had activity log entries
- **After:** Deleting a task sets `activity_log.task_id` to NULL for related entries
- **Benefit:** Activity history is preserved, but tasks can be deleted without errors

---

## Files Changed

1. ✅ `src/server/db/schema/activity.ts` - Updated schema definition
2. ✅ `src/server/db/migrations/0020_fix_activity_log_cascade.sql` - New migration SQL
3. ✅ `scripts/run-activity-log-fix-migration.mjs` - Migration runner script

---

## Next Steps

After running the migration on production:

1. **Test task deletion** - Try deleting a task that has activity history
2. **Verify activity logs** - Check that historical activities are preserved with `task_id = NULL`
3. **Monitor for errors** - Check your Vercel logs for any issues

---

## Rollback (if needed)

If you need to revert this change:

```sql
ALTER TABLE activity_log
DROP CONSTRAINT IF EXISTS activity_log_task_id_tasks_id_fk;

ALTER TABLE activity_log
ADD CONSTRAINT activity_log_task_id_tasks_id_fk
FOREIGN KEY (task_id)
REFERENCES tasks(id)
ON DELETE NO ACTION;
```

Note: This will re-enable the blocking behavior.
