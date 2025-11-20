# Deploy Firebase Rules - Step by Step Guide

## 📋 Overview
This guide will help you deploy the updated Firebase Realtime Database rules to allow proper access to watched items, watchlist, and other user data.

## 🚀 Steps to Deploy Rules

### Method 1: Using Firebase Console (Recommended)

1. **Open Firebase Console**
   - Go to [https://console.firebase.google.com](https://console.firebase.google.com)
   - Select your project: `ourshow-9c506`

2. **Navigate to Realtime Database**
   - In the left sidebar, click on **"Realtime Database"**
   - If you see "Create Database", click it and choose your region
   - If database already exists, you'll see the data view

3. **Open Rules Tab**
   - Click on the **"Rules"** tab at the top of the page
   - You'll see the current rules in a code editor

4. **Copy the Updated Rules**
   - Open the file `database.rules.json` from this project
   - Copy **ALL** the contents (Ctrl+A, Ctrl+C)

5. **Paste and Deploy**
   - In Firebase Console, select all existing rules (Ctrl+A)
   - Paste the new rules (Ctrl+V)
   - Click **"Publish"** button at the top right
   - Confirm the deployment

6. **Verify**
   - You should see a success message
   - The rules are now active!

### Method 2: Using Firebase CLI (Advanced)

If you have Firebase CLI installed:

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy rules
firebase deploy --only database
```

## ✅ What the Updated Rules Do

The updated rules explicitly allow authenticated users to:
- ✅ Read/write their own `watched` items (for stats tracking)
- ✅ Read/write their own `watchlist` items
- ✅ Read/write their own `watchlater` items
- ✅ Read/write their own `seriesProgress` data
- ✅ Access all other existing features (posts, reviews, notifications, etc.)

## 🔍 Verify Rules Are Working

After deploying, test by:

1. **Open your app** and log in
2. **Mark an item as watched** (use the "Mark as Watched" button)
3. **Go to Stats page** (`stats.html`)
4. **Check if the watched item appears** in your stats

If you see the watched items in stats, the rules are working correctly!

## ⚠️ Troubleshooting

### Rules not updating?
- Wait 1-2 minutes after publishing (propagation delay)
- Clear browser cache and reload
- Check browser console for any permission errors

### Still seeing permission errors?
- Verify you're logged in (check `auth.currentUser`)
- Check that your user ID matches the `$uid` in the rules
- Look for specific error messages in browser console

### Need to rollback?
- Firebase Console keeps a history of rule changes
- Go to Rules tab → Click "..." menu → View history
- You can revert to a previous version

## 📝 Current Rules Structure

```
ourshow/
  users/
    $uid/
      .read: "$uid === auth.uid"
      .write: "$uid === auth.uid"
      watched/ (explicitly allowed)
      watchlist/ (explicitly allowed)
      watchlater/ (explicitly allowed)
      seriesProgress/ (explicitly allowed)
```

## 🎯 Next Steps

After deploying rules:
1. Test the stats page to see watched items
2. Test adding items to watchlist
3. Test marking items as watched
4. Verify all data syncs properly

---

**Need Help?** Check the Firebase Console for any error messages or contact support.

