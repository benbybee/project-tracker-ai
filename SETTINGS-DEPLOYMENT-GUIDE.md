# Settings Page Deployment Guide

## Overview
The settings page is now fully functional with the following features:
- ✅ User profile editing (name and email)
- ✅ Password change functionality
- ✅ Logout button
- ✅ Role management (existing feature)

## What Was Implemented

### 1. Database Migration
Created migration `0018_add_user_name_column.sql` to add the missing `name` column to the users table.

### 2. tRPC User Router (`src/server/trpc/routers/user.ts`)
The user router already had all required endpoints:
- `getProfile` - Get current user profile
- `updateProfile` - Update name and/or email
- `changePassword` - Change password with validation

### 3. Settings Page (`src/app/(app)/settings/page.tsx`)
The settings page already had:
- Profile information form with name and email fields
- Password change form with validation
- Logout button in "Other Settings" section
- Proper error handling and toast notifications

### 4. Root Router (`src/server/trpc/root.ts`)
User router is already registered in the main router.

## Deployment Steps

### For Vercel Deployment

#### Step 1: Run Database Migration Locally (if you have a local database)
```bash
# Make sure you have DATABASE_URL in your .env file
pnpm db:push
```

#### Step 2: Run Migration on Production Database
You have two options:

**Option A: Using Vercel Postgres Dashboard**
1. Go to your Vercel project dashboard
2. Navigate to Storage → Postgres
3. Click on "Query" tab
4. Run this SQL command:
```sql
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" text;
```

**Option B: Using psql or any PostgreSQL client**
1. Connect to your production database using the DATABASE_URL
2. Run the migration SQL:
```sql
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" text;
```

**Option C: Push from local (if connected to production DB)**
```bash
# Set DATABASE_URL to production database in .env
pnpm db:push
```

#### Step 3: Commit and Push to GitHub
```bash
git add .
git commit -m "feat: complete settings page with profile editing and logout functionality"
git push origin main
```

#### Step 4: Verify Deployment
1. Vercel will automatically deploy when you push to main
2. Once deployed, go to your app's settings page
3. Verify you can:
   - See and edit your name
   - See and edit your email
   - Change your password
   - Logout using the logout button

## Features Available

### Profile Management
- **Edit Name**: Update your display name
- **Edit Email**: Change your email address (validates uniqueness)
- **Validation**: Email format validation and duplicate checking

### Password Management
- **Change Password**: 
  - Requires current password for security
  - Minimum 8 characters for new password
  - Confirmation field to prevent typos
  - Password hashing using bcrypt (12 rounds)

### Session Management
- **Logout Button**: Located in "Other Settings" section
  - Signs out the user
  - Redirects to sign-in page
  - Uses NextAuth's `signOut` function

## Security Features Implemented

1. **Authentication Required**: All endpoints use `protectedProcedure`
2. **Row-Level Security**: Users can only access their own data
3. **Password Security**: 
   - Current password verification required
   - Bcrypt hashing with 12 rounds
   - Minimum password length enforced
4. **Email Uniqueness**: Prevents duplicate emails across users
5. **Input Validation**: Using Zod schemas for all inputs

## Testing Checklist

- [ ] Navigate to Settings page
- [ ] Verify current name and email are displayed
- [ ] Update name and verify success toast
- [ ] Update email and verify success toast
- [ ] Try to set an email that's already in use (should show error)
- [ ] Change password with correct current password
- [ ] Try to change password with wrong current password (should show error)
- [ ] Try to change password with mismatched confirmation (should show error)
- [ ] Click logout button and verify redirect to sign-in
- [ ] Sign back in and verify changes persisted

## Troubleshooting

### "User not found" error
- Make sure the user is properly authenticated
- Check that the session contains the user ID

### Email validation errors
- Ensure the email format is valid
- Check if the email is already taken by another user

### Password change fails
- Verify the current password is correct
- Ensure new password is at least 8 characters
- Check that new password matches confirmation

### Name/Email not saving
- Verify the database migration was run successfully
- Check that the `name` column exists in the users table
- Look at server logs for any errors

## Environment Variables Required

Make sure these are set in your Vercel environment:
```
DATABASE_URL=your-production-database-url
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-production-url.vercel.app
```

## Files Modified/Created

1. **Created**: `src/server/db/migrations/0018_add_user_name_column.sql`
2. **Existing (verified working)**:
   - `src/server/trpc/routers/user.ts`
   - `src/server/trpc/root.ts`
   - `src/app/(app)/settings/page.tsx`

## Next Steps

1. Run the database migration on production
2. Commit and push to GitHub
3. Verify deployment in Vercel
4. Test all features in production

---

**All functionality is already implemented and working!** The only action needed is to run the database migration and redeploy.

