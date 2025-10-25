# Vercel Deployment Setup Guide

## Required Environment Variables

The following environment variables must be set in your Vercel project:

### 1. NEXTAUTH_SECRET
```bash
# Generate a secure secret
openssl rand -base64 32
```
Set this in Vercel Dashboard → Project → Settings → Environment Variables

### 2. NEXTAUTH_URL
```
https://your-app-name.vercel.app
```
Replace `your-app-name` with your actual Vercel app name.

### 3. DATABASE_URL
```
postgresql://username:password@host:port/database
```
Your PostgreSQL connection string (Supabase, Neon, or other provider).

## How to Set Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable:
   - **Name**: `NEXTAUTH_SECRET`
   - **Value**: (generated secret from step 1)
   - **Environment**: Production (and Preview if needed)
5. Repeat for `NEXTAUTH_URL` and `DATABASE_URL`
6. Click "Save"
7. Redeploy your project

## Verification

After setting the environment variables:

1. Redeploy your project
2. Visit `https://your-app.vercel.app/api/auth/signin`
3. You should see the sign-in page instead of a configuration error

## Troubleshooting

If you still see the configuration error:

1. Check that all environment variables are set for the correct environment (Production)
2. Ensure there are no typos in the variable names
3. Verify the NEXTAUTH_URL matches your actual Vercel app URL
4. Check the Vercel function logs for more detailed error messages

## Database Setup

If you don't have a database yet:

1. Sign up for [Supabase](https://supabase.com) (free tier available)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string
5. Use it as your DATABASE_URL

The app will automatically run database migrations on first deployment.