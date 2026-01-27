# AI Chat Fix Guide

## 🎯 Problem
The AI chat is showing: **"I apologize, but I encountered an error. Please try again."**

## 🔍 Diagnosis

Based on the codebase analysis:
- ✅ Code implementation is correct
- ✅ Error handling is in place
- ⚠️ **Issue: OpenAI API key is likely invalid, expired, or not properly configured**

---

## 🛠️ Solution Steps

### Step 1: Test Your Local API Key

Run the diagnostic script:

```bash
node test-openai-connection.mjs
```

This will tell you exactly what's wrong with your API key.

**Expected Output (if working):**
```
✅ SUCCESS! OpenAI API is working correctly
   Model: gpt-3.5-turbo
   Response: "OK"
🎉 Your API key is valid and working!
```

**If it fails**, follow the instructions in the error message.

---

### Step 2: Get a New OpenAI API Key

If your key is invalid/expired:

1. **Go to OpenAI Platform**: https://platform.openai.com/api-keys
2. **Sign in** to your account
3. **Click "Create new secret key"**
4. **Copy the key** (starts with `sk-proj-...` or `sk-...`)
5. **IMPORTANT**: Save it immediately - you won't see it again!

---

### Step 3: Update Local Environment

1. **Rename `env.local` to `.env.local`** (add the dot prefix):
   ```bash
   mv env.local .env.local
   ```

2. **Edit `.env.local`** and update the OpenAI key:
   ```bash
   OPENAI_API_KEY=sk-proj-YOUR-NEW-KEY-HERE
   ```

3. **Restart your development server**:
   ```bash
   # Press Ctrl+C to stop the current server
   npm run dev
   ```

---

### Step 4: Update Vercel Environment Variables

Since you mentioned the key is in Vercel and it used to work, it likely expired:

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**
3. **Go to Settings → Environment Variables**
4. **Find `OPENAI_API_KEY`**
5. **Click the pencil icon to edit**
6. **Paste your new API key**
7. **Make sure it's enabled for**:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
8. **Click Save**

---

### Step 5: Redeploy on Vercel

After updating the environment variable:

1. **Go to Deployments tab**
2. **Click "Redeploy"** on your latest deployment
   - Or push a new commit to trigger redeployment

**OR** use the Vercel CLI:
```bash
vercel --prod
```

---

### Step 6: Verify the Fix

#### On Localhost:
1. Run: `node test-openai-connection.mjs`
2. Should show: ✅ SUCCESS!

#### On Vercel (Production):
1. Navigate to: `https://your-app.vercel.app/api/ai/diagnostics`
2. Log in if prompted
3. Check the JSON response:
   ```json
   {
     "overallStatus": "ok",
     "results": [
       {
         "service": "OpenAI API",
         "status": "ok",
         "message": "Successfully connected to OpenAI API"
       }
     ]
   }
   ```

#### Test the Chat:
1. Open your app
2. Click the AI chat button
3. Send a message like "Hello"
4. Should get a proper response (not an error)

---

## 🚨 Common Issues & Solutions

### Issue 1: "Insufficient Quota"
**Cause**: No OpenAI credits or exceeded free tier  
**Fix**: Add billing to your OpenAI account at https://platform.openai.com/account/billing

### Issue 2: "Invalid API Key" (401 Error)
**Cause**: Key is expired, revoked, or incorrect  
**Fix**: Generate a new key and update both `.env.local` and Vercel

### Issue 3: "Rate Limit Exceeded" (429 Error)
**Cause**: Too many requests or tier limit reached  
**Fix**: Wait a few minutes, or upgrade your OpenAI plan

### Issue 4: Changes Not Reflected on Vercel
**Cause**: Environment variables not reloaded  
**Fix**: Must redeploy after changing env vars (they're not hot-reloaded)

### Issue 5: Works Locally but Not on Vercel
**Cause**: Different API keys or Vercel env var not set  
**Fix**: Double-check Vercel environment variables exactly match your working local setup

---

## 📊 Testing Checklist

After following the steps above:

- [ ] Local test script passes: `node test-openai-connection.mjs`
- [ ] Development server restarted
- [ ] AI chat works on localhost
- [ ] Vercel environment variable updated
- [ ] Vercel app redeployed
- [ ] Diagnostics endpoint shows "ok" status
- [ ] AI chat works on production URL
- [ ] No errors in Vercel logs

---

## 🔐 Security Note

**NEVER commit your `.env.local` file to Git!**

The `.gitignore` file should already include:
```
.env.local
.env*.local
```

If you accidentally committed your API key:
1. **Revoke it immediately** on OpenAI platform
2. Generate a new one
3. Remove it from Git history

---

## 📞 Still Having Issues?

If the problem persists after following all steps:

1. **Check Vercel Logs**:
   - Go to your deployment on Vercel
   - Click "Functions" tab
   - Look for `/api/ai/chat` logs
   - Check for specific error messages

2. **Check Browser Console**:
   - Open DevTools (F12)
   - Go to Console tab
   - Send a chat message
   - Look for red error messages

3. **Common Error Messages**:
   - `OPENAI_API_KEY is not configured` → Key not set in environment
   - `401 Unauthorized` → Invalid/expired key
   - `429 Too Many Requests` → Rate limited or no credits
   - `Failed to fetch` → Network issue or CORS problem

---

## 🎓 Understanding the Error Flow

The generic error message you see comes from:

```typescript:src/components/ai/ai-chat-widget.tsx
catch (error: any) {
  console.error('Chat error:', error);
  const errorMessage: Message = {
    id: `error-${Date.now()}`,
    role: 'assistant',
    content: 'I apologize, but I encountered an error. Please try again.',
    createdAt: new Date(),
  };
  setMessages((prev) => [...prev, errorMessage]);
}
```

The **actual error details** are logged to:
- Browser console (F12 → Console tab)
- Vercel logs (for production)
- Terminal (for local development)

Always check these logs for the real error message!

---

## ✅ Prevention

To avoid this in the future:

1. **Monitor OpenAI Usage**: https://platform.openai.com/usage
2. **Set up billing alerts** in OpenAI dashboard
3. **Use API key rotation** (refresh keys every 90 days)
4. **Keep backup keys** in case primary fails
5. **Monitor Vercel logs** for API errors

---

## 📚 Related Documentation

- OpenAI API Keys: https://platform.openai.com/api-keys
- OpenAI Billing: https://platform.openai.com/account/billing
- Vercel Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables
- Next.js Environment Variables: https://nextjs.org/docs/basic-features/environment-variables

