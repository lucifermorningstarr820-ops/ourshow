# 👥 How to Follow Other Users

## Current Status

The follow functionality exists in `social.js`, but there's no UI button yet. Here's how to use it:

## Method 1: Using JavaScript Console (Temporary)

1. **Open Browser Console** (F12 or Right-click → Inspect → Console)
2. **Make sure you're logged in**
3. **Get the user ID** you want to follow (from posts, comments, or Firebase)
4. **Run this command:**
   ```javascript
   window.followUser('USER_ID_HERE')
   ```

## Method 2: From Posts/Comments (Need to Add UI)

Currently, posts show user info but no follow button. We need to add:
- Follow button next to usernames in posts
- Follow button in user profile views
- User search/discovery page

## Method 3: Programmatic Usage

If you're building a feature, you can use:

```javascript
// Follow a user
const result = await window.followUser(userId);
if (result.success) {
  console.log('Followed successfully!');
}

// Unfollow a user
const result = await window.unfollowUser(userId);

// Get user profile (includes follow status)
const profile = await window.getUserProfile(userId);
console.log(profile.isFollowing); // true/false
```

## What Happens When You Follow

1. ✅ User is added to your "following" list
2. ✅ You're added to their "followers" list
3. ✅ They get a notification
4. ✅ You see their activity in your feed

## Next Steps to Add UI

To make following easier, we should add:

1. **Follow button in posts** - Next to each username
2. **User profile page** - View any user's profile with follow button
3. **User search** - Find users to follow
4. **Following/Followers list** - See who you follow and who follows you

Would you like me to add these UI features?

