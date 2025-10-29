# 🔄 Complete Database Reset Guide

## Overview

This guide will help you **completely reset your database** to start fresh with a clean slate.

---

## ⚠️ What Gets Deleted

**EVERYTHING:**
- ✗ All users (including your account)
- ✗ All roles
- ✗ All projects
- ✗ All tasks & subtasks
- ✗ All notes
- ✗ All support tickets
- ✗ All chat history & messages
- ✗ All analytics & AI learning data
- ✗ All notifications
- ✗ All activity logs
- ✗ All search embeddings

**This operation is IRREVERSIBLE!**

---

## 📋 Prerequisites

### 1. Environment Variables

You need a `.env` file in your project root with at minimum:

```env
DATABASE_URL=postgresql://username:password@host:port/database_name
```

**Where to find your DATABASE_URL:**

- **Supabase:** Project Settings → Database → Connection String → Connection pooling
- **Neon:** Dashboard → Connection String
- **Vercel Postgres:** Storage → Your Database → .env.local tab
- **Railway:** Your Database → Connect → Connection String

### 2. Verify Dependencies

The `postgres` package should already be installed (it's in your package.json).

---

## 🚀 How to Run the Reset

### Option 1: Using npm/pnpm script (Recommended)

```bash
# If using pnpm (recommended for this project)
pnpm db:reset

# Or with npm
npm run db:reset
```

### Option 2: Direct execution

```bash
node scripts/reset-database.mjs
```

### Option 3: PowerShell (Windows)

```powershell
cd "C:\Users\Ben Bybee\Desktop\Cursor\project-tracker-ai-main"
pnpm db:reset
```

---

## 📝 Step-by-Step Process

### Step 1: Create your .env file

Create a file named `.env` in your project root:

```env
# Database (REQUIRED)
DATABASE_URL=postgresql://your-connection-string-here

# NextAuth (REQUIRED for app to work)
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Optional: OpenAI (for AI features)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional: Supabase client features
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

**Generate NEXTAUTH_SECRET:**
```bash
# On Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# On Linux/Mac
openssl rand -base64 32
```

### Step 2: Run the reset script

```bash
pnpm db:reset
```

You'll see output like this:

```
🔗 Connecting to database...

⚠️  WARNING: This will DELETE ALL DATA from the database!
   All users, projects, tasks, notes, tickets, chat, analytics, etc.
   This operation is IRREVERSIBLE!

🗑️  Starting COMPLETE database reset...

📊 Deleting Analytics & AI Data...
  → Deleting AI suggestions...
    ✓ AI suggestions cleared
  → Deleting task analytics...
    ✓ Task analytics cleared
  ...

✨ SUCCESS! Database has been completely reset.
```

### Step 3: Start fresh

After the reset:

1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Navigate to http://localhost:3000

3. Create a new user account from the sign-up page

4. Start building your projects from scratch!

---

## 🔧 Troubleshooting

### Error: "DATABASE_URL environment variable is not set"

**Solution:** Make sure you have a `.env` file in your project root with `DATABASE_URL` configured.

### Error: "Cannot find module 'postgres'"

**Solution:** Install dependencies:
```bash
pnpm install
```

### Error: Connection timeout or "cannot connect to database"

**Solution:** 
- Verify your DATABASE_URL is correct
- Check if your database is running
- Check firewall/network settings
- For Supabase: Make sure you're using the "Connection pooling" string, not "Session pooling"

### Error: Permission denied

**Solution:** 
- Make sure your database user has DELETE permissions
- Check that you're using the correct credentials

---

## 🎯 Alternative: Partial Data Clear

If you want to keep users and roles but clear projects/tasks/tickets:

```bash
pnpm db:clear
```

This will delete:
- ✗ Projects
- ✗ Tasks & subtasks
- ✗ Tickets
- ✗ Notes
- ✗ Embeddings

But **keep**:
- ✓ Users
- ✓ Roles

---

## 📊 Scripts Summary

| Script | Command | What it does |
|--------|---------|--------------|
| **Complete Reset** | `pnpm db:reset` | Deletes EVERYTHING including users |
| **Partial Clear** | `pnpm db:clear` | Deletes projects/tasks but keeps users |
| **Seed Data** | `pnpm db:seed` | Adds sample data (after reset) |
| **Database Studio** | `pnpm db:studio` | Opens Drizzle Studio to view/edit data |

---

## 🆘 Need Help?

If you encounter any issues:

1. Check that `.env` file exists and has valid `DATABASE_URL`
2. Verify database connection with `pnpm db:studio`
3. Check the error message carefully
4. Ensure all dependencies are installed: `pnpm install`

---

## ✅ Success Checklist

Before running the reset:
- [ ] Backed up any important data (if needed)
- [ ] Created `.env` file with `DATABASE_URL`
- [ ] Verified database connection works
- [ ] Understand that ALL data will be deleted
- [ ] Ready to create a new user account after reset

After running the reset:
- [ ] Saw success message
- [ ] Can access the application (http://localhost:3000)
- [ ] Created new user account
- [ ] Application works correctly

---

**Ready to proceed?** Run `pnpm db:reset` when you're ready!

