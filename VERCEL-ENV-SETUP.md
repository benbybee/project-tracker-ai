# 🔧 Vercel Environment Variables Setup

## ❌ Current Error

Your Vercel deployment is failing because required environment variables are not configured:

```
- Missing required environment variable: DATABASE_URL
- Missing required environment variable: NEXTAUTH_SECRET
- Missing required environment variable: NEXTAUTH_URL
```

## ✅ How to Fix

### Option 1: Configure via Vercel Dashboard (Recommended)

1. **Go to your Vercel project:**
   - Visit: https://vercel.com/dashboard
   - Select your `project-tracker-ai` project

2. **Navigate to Settings:**
   - Click "Settings" tab
   - Click "Environment Variables" in the sidebar

3. **Add Required Variables:**

   Click "Add New" for each variable:

   **Required Variables:**
   
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database
   NEXTAUTH_SECRET=your-super-secret-key-here
   NEXTAUTH_URL=https://your-app.vercel.app
   ```

   **Optional (but recommended for full functionality):**
   
   ```
   OPENAI_API_KEY=sk-your-openai-api-key
   GOOGLE_CLIENT_ID=your-google-oauth-id
   GOOGLE_CLIENT_SECRET=your-google-oauth-secret
   ```

4. **Set Environment:**
   - Check "Production", "Preview", and "Development"
   - This ensures variables are available in all environments

5. **Save and Redeploy:**
   - Click "Save"
   - Trigger a new deployment: `vercel --prod`

### Option 2: Configure via Vercel CLI

```bash
# Set production environment variables
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production

# Optional: Add OpenAI key
vercel env add OPENAI_API_KEY production

# Redeploy
vercel --prod
```

## 📝 How to Get Each Variable

### DATABASE_URL
You need a PostgreSQL database. Options:

**A. Vercel Postgres (Recommended):**
1. Go to your Vercel project
2. Click "Storage" tab
3. Click "Create Database" → "Postgres"
4. Copy the `POSTGRES_URL` and use it as `DATABASE_URL`

**B. Supabase:**
1. Go to https://supabase.com
2. Create a new project
3. Go to Settings → Database
4. Copy the "Connection string" (use the pooler connection)

**C. Neon (Serverless Postgres):**
1. Go to https://neon.tech
2. Create a new project
3. Copy the connection string

### NEXTAUTH_SECRET
Generate a secure random string:

```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online
# Visit: https://generate-secret.vercel.app/32
```

### NEXTAUTH_URL
This is your production URL:

```
https://your-app-name.vercel.app
```

Replace with your actual Vercel deployment URL.

### OPENAI_API_KEY (Optional)
Only needed for AI features:

1. Go to https://platform.openai.com
2. Create an account or sign in
3. Go to API Keys
4. Create a new API key
5. Copy the key (starts with `sk-`)

**Note:** AI features will be disabled without this key, but the app will still work.

## 🚀 Quick Start (Minimal Setup)

If you just want to get the app deployed quickly to test the PWA:

```bash
# 1. Create a Vercel Postgres database (via dashboard)
# 2. Copy the DATABASE_URL from Vercel
# 3. Generate a secret
export NEXTAUTH_SECRET=$(openssl rand -base64 32)

# 4. Set environment variables via CLI
vercel env add DATABASE_URL production
# (paste your DATABASE_URL when prompted)

vercel env add NEXTAUTH_SECRET production
# (paste your NEXTAUTH_SECRET when prompted)

vercel env add NEXTAUTH_URL production
# (enter: https://your-project.vercel.app)

# 5. Deploy
vercel --prod
```

## ✅ Verify Configuration

After setting environment variables:

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify all required variables are listed
3. Run: `vercel --prod`
4. Build should succeed this time

## 🐛 Still Having Issues?

### Check Your .env File Locally

Make sure your local `.env` file has all required variables for reference:

```bash
# Copy from example
cp env.example .env

# Edit .env with your values
# DO NOT commit this file to git!
```

### Verify Build Locally

Test the build locally before deploying:

```bash
# Set env vars temporarily
export DATABASE_URL="your-database-url"
export NEXTAUTH_SECRET="your-secret"
export NEXTAUTH_URL="http://localhost:3000"

# Build
npm run build

# If build succeeds locally, Vercel should work too
```

## 📱 After Successful Deployment

Once your app deploys successfully:

1. **Visit your production URL:** `https://your-app.vercel.app`
2. **Test on your phone** (must use HTTPS production URL)
3. **Follow the PWA installation steps** in `PWA-QUICK-START.md`

## 🔗 Useful Links

- Vercel Environment Variables Docs: https://vercel.com/docs/projects/environment-variables
- Vercel Postgres: https://vercel.com/docs/storage/vercel-postgres
- NextAuth.js Deployment: https://next-auth.js.org/deployment
- Supabase: https://supabase.com
- Neon: https://neon.tech

---

**TL;DR:** Go to Vercel Dashboard → Your Project → Settings → Environment Variables → Add `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` → Redeploy

