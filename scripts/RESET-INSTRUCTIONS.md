# Database Reset Instructions

## ⚠️ WARNING

This script will **DELETE ALL DATA** from your database:

- All users
- All roles
- All projects
- All tasks
- All notes
- All tickets
- All chat history
- All analytics
- All notifications
- All activity logs

**This operation is IRREVERSIBLE!**

## Prerequisites

1. Make sure you have a `.env` file in your project root with `DATABASE_URL` configured:

   ```env
   DATABASE_URL=postgresql://username:password@host:port/database_name
   ```

2. Ensure you have `postgres` package installed:
   ```bash
   npm install postgres
   ```

## How to Run

From your project root directory:

```bash
node scripts/reset-database.mjs
```

Or using PowerShell:

```powershell
cd "C:\Users\Ben Bybee\Desktop\Cursor\project-tracker-ai-main"
node scripts/reset-database.mjs
```

## What Happens

The script will:

1. Connect to your database
2. Delete all data from all tables in the correct order (respecting foreign key constraints)
3. Display progress for each table
4. Confirm when complete

## After Reset

After the database is reset:

1. You can create a new user account from scratch
2. All authentication sessions will be invalid
3. You'll start with a completely clean database

## Need Help?

If you encounter any errors, check:

- ✅ `.env` file exists and has correct DATABASE_URL
- ✅ Database is accessible
- ✅ You have the necessary permissions
- ✅ `postgres` npm package is installed
