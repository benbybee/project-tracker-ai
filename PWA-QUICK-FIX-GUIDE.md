# iOS PWA Quick Fix Guide

## 🚨 URGENT: First-Time Fix Steps

### On Your iPhone (Before New Install):

1. **Delete Old App**
   - Long-press TaskTracker AI icon
   - "Remove App" → "Delete"

2. **Clear Safari**
   - Settings → Safari → "Clear History and Website Data"

3. **Force Close Safari**
   - Swipe up and dismiss Safari

### Deploy Changes:

```bash
npm run build
vercel --prod  # or git push
```

### Fresh Install on iPhone:

1. Open **Safari** (not any other browser)
2. Go to your **production URL** (not a bookmark)
3. Tap Share → "Add to Home Screen"
4. **Close Safari completely**
5. Tap the new icon

### ✅ Success Indicators:

- ✅ No Safari URL bar visible
- ✅ Purple status bar (#6D4AFF)
- ✅ Opens to dashboard instantly
- ✅ Navigation stays in-app

## 🔧 What Was Fixed

1. **Manifest** - Changed start URL from `/dashboard?source=pwa` to `/dashboard`
2. **Caching** - Manifest now revalidates instead of 1-year cache
3. **Service Worker** - Removed duplicates, using only next-pwa
4. **iOS Detection** - Added standalone mode detection and bounce prevention

## 🐛 If Still Opens in Browser:

1. **Wait 10 minutes** after deployment
2. **Try incognito first** (to verify manifest)
3. **Restart iPhone** (clears manifest cache)
4. **Check deployment** - Visit `/manifest.json` and verify `start_url: "/dashboard"`

## 📞 Quick Diagnostics

**Check in Chrome DevTools (desktop):**

```
Application → Manifest → start_url should be "/dashboard"
Application → Service Workers → should show "activated"
```

**Check on iPhone:**

```javascript
// In Safari console (if remote debugging)
console.log(window.matchMedia('(display-mode: standalone)').matches);
// Should be true when launched from Home Screen
```

## 🎯 Key Files Changed

- ✅ `public/manifest.json` - Fixed start_url
- ✅ `next.config.js` - Fixed caching
- ✅ `src/lib/pwa-utils.ts` - NEW: iOS utilities
- ✅ `src/components/system/PWAInit.tsx` - Added iOS handling
- ❌ Deleted: `pwa-provider.tsx`, `service-worker-simple.js`, `register-service-worker.ts`

## ⚠️ Critical Rules for iOS PWA

1. **Never redirect** from start_url
2. **Keep scope and start_url aligned**
3. **Clear cache** for manifest updates
4. **Always test** in production (not dev mode)
5. **Use Safari** for initial install

---

**Full details:** See `PWA-IOS-FIX.md`
