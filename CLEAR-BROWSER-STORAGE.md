# 🧹 Clear Browser Storage Guide

## ⚠️ UPDATE: Offline Storage Removed

**As of the latest version, this application NO LONGER uses IndexedDB/Dexie for offline storage.**

All data is now fetched directly from Supabase via tRPC with React Query caching. After a database reset, simply perform a hard refresh:

- **Hard Refresh:** `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

This guide is kept for historical reference only.

---

## Historical Information (No Longer Applicable)

~~After resetting the database with `pnpm db:reset`, you may still see old tasks, projects, or other data in the UI. This happens because the application uses **IndexedDB** for offline storage, which persists in your browser even after:
- Database reset
- Hard refresh (Ctrl + Shift + R)
- Clearing React Query cache~~

## Quick Fix (Recommended)

### Method 1: Browser Console Command

1. **Open your browser** at `http://localhost:3000`
2. **Press F12** to open Developer Tools
3. **Click on the Console tab**
4. **Run this command:**
   ```javascript
   window.clearAppStorage()
   ```
5. **Wait for confirmation** messages in the console
6. **Hard refresh** the page: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
7. **Done!** Your browser storage is now clean

### Method 2: Manual Browser Storage Clear

If the console command doesn't work, manually clear browser storage:

#### Chrome/Edge

1. Press **F12** to open Developer Tools
2. Go to **Application** tab
3. Find **Storage** in the left sidebar
4. Click **"Clear site data"**
5. Check all boxes:
   - ✅ Cookies and other site data
   - ✅ Cached images and files
   - ✅ Storage (includes IndexedDB)
6. Click **"Clear site data"** button
7. Hard refresh: `Ctrl + Shift + R`

#### Firefox

1. Press **F12** to open Developer Tools
2. Go to **Storage** tab
3. Find **IndexedDB** in the left sidebar
4. Right-click on **"tasktracker-v1"** → **Delete Database**
5. Find **Local Storage** → Right-click → **Delete All**
6. Find **Session Storage** → Right-click → **Delete All**
7. Hard refresh: `Ctrl + Shift + R`

## Understanding the Storage Layers

Your application has multiple caching layers:

1. **PostgreSQL Database** (Server)
   - Cleared by: `pnpm db:reset`
   - Status: ✅ Already cleared

2. **React Query Cache** (Browser Memory)
   - Cleared by: Hard refresh (Ctrl + Shift + R)
   - Status: ✅ Already cleared

3. **IndexedDB** (Browser Persistent Storage) ⚠️
   - Cleared by: `window.clearAppStorage()` or manual clear
   - Status: ❌ **NOT cleared** (this is your problem!)

4. **Service Worker Cache** (Browser)
   - Cleared by: Hard refresh or manual clear
   - Usually not an issue for data

## After Database Reset - Complete Checklist

- [x] Run `pnpm db:reset` ✅
- [x] See success message ✅
- [ ] **Clear browser storage** ⚠️ **← YOU ARE HERE**
- [ ] Hard refresh page (Ctrl + Shift + R)
- [ ] Create new user account
- [ ] Verify empty dashboard (no old data)

## Technical Details

The application uses **Dexie.js** (IndexedDB wrapper) for offline-first functionality. This means:

- Tasks are cached locally for offline access
- Projects and roles are stored in the browser
- Data persists across page refreshes
- **Manual clearing is required after database reset**

### What Gets Cleared

When you run `window.clearAppStorage()`:
- ✅ IndexedDB database (`tasktracker-v1`)
- ✅ localStorage
- ✅ sessionStorage

### Database Name

The IndexedDB database name is: `tasktracker-v1`

You can verify it's deleted by:
1. F12 → Application tab (Chrome)
2. Look under IndexedDB in left sidebar
3. Should see **no databases** listed

## Troubleshooting

### "window.clearAppStorage is not a function"

**Solution:** The page hasn't fully loaded the utility yet.
1. Wait 2-3 seconds after page load
2. Try the command again
3. If still not working, use Manual Method 2 above

### Still Seeing Old Data After Clearing

**Solution:**
1. Close **ALL tabs** with the application
2. Reopen browser
3. Clear storage again using Manual Method 2
4. Open application in **incognito/private window** to test

### IndexedDB Deletion Blocked

**Solution:**
1. Close all tabs running the application
2. Wait 5 seconds
3. Try clearing again
4. Restart browser if needed

## Prevention

To avoid this issue in the future:

1. **Always clear browser storage** after database reset
2. **Add to your reset workflow:**
   ```bash
   pnpm db:reset
   # Then open browser console and run:
   # window.clearAppStorage()
   ```

3. **Consider creating an alias** in your terminal:
   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   alias reset-app="pnpm db:reset && echo '\n⚠️  Remember to clear browser storage: window.clearAppStorage()'"
   ```

## Additional Resources

- **Database Reset Guide:** See `DATABASE-RESET-GUIDE.md`
- **System Architecture:** See `SYSTEM-ARCHITECTURE.md` (Caching section)
- **Offline Setup:** See `OFFLINE-SETUP.md`

---

**Need Help?**

If you're still seeing old data after following this guide:
1. Check browser console for errors
2. Try incognito/private browsing mode
3. Verify database was actually reset (check with `pnpm db:studio`)
4. Clear browser storage using **both** methods above

